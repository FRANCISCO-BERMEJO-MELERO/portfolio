// pnpm qa:perf — fluidez en móvil: 390 × 844 @3x, táctil, CPU ×4. Un gesto de scroll de arriba
// abajo a 1 200 px/s, tres pasadas por página: 0 fotogramas > 33 ms (D9).
// Además, CLS al cargar con CPU ×4 (criterio 7 de la fase 1: ≤ 0,02).
// Antes de las pasadas medidas se hace una de calentamiento que no cuenta (--warmup 0 la quita):
// la primera de un Chrome recién lanzado paga el arranque en frío (JIT, sombreadores, cachés) y
// daba 1–6 fotogramas > 33 ms en cualquier página (fase 1, FTD · D9). Se imprime igualmente.
import { arg, run, sleep } from './lib.ts';

const PATHS = (arg('paths') ?? '/').split(',');
const PASSES = 3;
const WARMUP = Number(arg('warmup') ?? 1);
const CPU = Number(arg('cpu') ?? 4);

await run('qa:perf', async ({ url, browser, fail }) => {
  for (const path of PATHS) {
    for (let pass = 1 - WARMUP; pass <= PASSES; pass++) {
      const warm = pass < 1;
      const page = await browser.newPage();
      await page.viewport('mobile');
      await page.send('Emulation.setCPUThrottlingRate', { rate: CPU });
      // CLS desde el primer momento (buffered) hasta 2 s después de cargar.
      await page.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });`,
      });
      await page.goto(url + path);
      await sleep(2000);
      const cls = await page.evaluate<number>('window.__cls');
      const distance = await page.evaluate<number>('document.documentElement.scrollHeight - innerHeight');
      await page.evaluate(`(() => {
        window.__frames = [];
        const loop = (t) => { window.__frames.push(t); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      })()`);
      await page.send('Input.synthesizeScrollGesture', {
        x: 195,
        y: 600,
        yDistance: -distance,
        speed: 1200,
        // 'default' con la emulación táctil activa; 'touch' explícito no llega a desplazar en headless.
        gestureSourceType: 'default',
      });
      const r = await page.evaluate<{ frames: number; p50: number; p95: number; max: number; over33: number; scrollY: number }>(`(() => {
        const f = window.__frames; const d = [];
        for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
        const s = [...d].sort((a, b) => a - b);
        const q = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0;
        return { frames: f.length, p50: q(0.5), p95: q(0.95), max: s[s.length - 1] ?? 0, over33: d.filter((x) => x > 33.4).length, scrollY };
      })()`);
      const f = (n: number) => n.toFixed(1);
      const label = warm ? 'calentamiento (no cuenta)' : `pasada ${pass}`;
      console.log(
        `  ${path} ${label}: ${distance}px · ${r.frames} fotogramas · p50 ${f(r.p50)} · p95 ${f(r.p95)} · máx ${f(r.max)} ms · > 33 ms: ${r.over33} · CLS ${cls.toFixed(4)}`,
      );
      if (warm) {
        await page.close();
        continue;
      }
      if (r.over33) fail(`${path} pasada ${pass}: ${r.over33} fotogramas > 33 ms`);
      if (cls > 0.02) fail(`${path} pasada ${pass}: CLS ${cls.toFixed(4)} > 0,02`);
      if (Math.abs(r.scrollY - distance) > 2) fail(`${path} pasada ${pass}: el gesto no llegó al final (${r.scrollY} de ${distance})`);
      await page.close();
    }
  }
});
