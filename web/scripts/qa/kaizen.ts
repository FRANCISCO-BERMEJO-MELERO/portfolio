// pnpm qa:kaizen — auditoría de la escena kaizen (la del modo ?debug) en Chrome, en papel y sumi:
// 0 px de fuga, 0 px de hueco y p = 1 idéntico al glifo, en cada estado de --p.
// Además comprueba que el motor de scroll da el --p esperado en cinco posiciones reales
// (escritorio y móvil: el escenario se pega bajo la nav, así que p = 0 cuando se pega).
// Control negativo: `--control noclip` (sin recortes → fugas) o `--control thin` (→ huecos) debe fallar.
import { arg, open, run, sleep, THEMES, type ViewportName } from './lib.ts';

const PATH = process.env['KAIZEN_PATH'] ?? '/';

type Report = {
  char: string;
  states: number;
  finalDiffPx: number;
  finalMaxDiff: number;
  strokes: { n: number; leakPx: number; gapPx: number }[];
};

await run('qa:kaizen', async ({ url, browser, fail }) => {
  const control = arg('control');
  for (const theme of THEMES) {
    console.log(`  ${theme}`);
    const page = await open(browser, `${url}${PATH}?debug&audit&nopanel${control ? `&control=${control}` : ''}`, {
      viewport: 'desktop',
      theme,
    });
    let raw: string | null = null;
    for (let i = 0; i < 600 && raw === null; i++) {
      await sleep(500);
      raw = await page.evaluate<string | null>("document.getElementById('kaizen-audit')?.textContent ?? null");
    }
    if (raw === null) return fail('la auditoría no terminó en 5 min');
    for (const k of JSON.parse(raw) as Report[]) {
      const leak = k.strokes.reduce((a, s) => a + s.leakPx, 0);
      const gap = k.strokes.reduce((a, s) => a + s.gapPx, 0);
      console.log(`  ${k.char}: ${k.states} estados · fuga ${leak} px · hueco ${gap} px · p=1 frente al glifo ${k.finalDiffPx} px (Δα máx. ${k.finalMaxDiff})`);
      if (leak) fail(`${k.char}: ${leak} px de fuga (trazos ${k.strokes.filter((s) => s.leakPx).map((s) => s.n).join(', ')})`);
      if (gap) fail(`${k.char}: ${gap} px de hueco (trazos ${k.strokes.filter((s) => s.gapPx).map((s) => s.n).join(', ')})`);
      if (k.finalDiffPx) fail(`${k.char}: p = 1 difiere del glifo en ${k.finalDiffPx} px`);
    }
    await page.close();
  }

  // El motor: --p = (scrollY − (top − sticky)) / (alto escena − alto escenario) en cinco posiciones.
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    console.log(`  motor · ${viewport}`);
    const scroll = await open(browser, `${url}${PATH}`, { viewport, theme: 'papel' });
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const r = await scroll.evaluate<{ p: number; expected: number }>(`(async () => {
        const scene = document.querySelector('[data-kaizen-scene]');
        const stage = scene.querySelector('[data-stage]');
        const top = scene.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(stage).top);
        const range = scene.offsetHeight - stage.offsetHeight;
        scrollTo({ top: Math.round(top + ${f} * range), behavior: 'instant' });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const expected = Math.min(1, Math.max(0, (scrollY - top) / range));
        return { p: Number(getComputedStyle(scene).getPropertyValue('--p')), expected };
      })()`);
      const ok = Math.abs(r.p - r.expected) <= 1e-6;
      console.log(`  scroll ${f * 100} %: --p ${r.p} (esperado ${r.expected.toFixed(6)}) ${ok ? 'ok' : 'MAL'}`);
      if (!ok) fail(`${viewport} · scroll ${f * 100} %: --p ${r.p} ≠ ${r.expected}`);
    }
    await scroll.close();
  }
});
