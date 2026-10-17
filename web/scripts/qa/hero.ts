// pnpm qa:hero — carga y forma del hero (criterios 1, 5, 6 y 7 de la fase 2):
// - 1 · Las animaciones de carga (ensō, caída del sello, mancha) terminan ≤ 1,6 s y el sello cae
//       cuando el ensō ya está dibujado. En móvil con CPU ×4: 0 fotogramas > 33 ms entre el primer
//       fotograma animado y el final (3 cargas, tras una de calentamiento que no cuenta, como qa:perf).
// - 5 · Reduced motion y sin JS: ensō entero y sin animar, sello del hero visible y quieto, sello de
//       la nav visible en su hueco.
// - 6 · Título: 152 px a 1440, clamp(44px, 17vw, 64px) en móvil; de 960 a 1440 ninguna línea se sale
//       de su columna ni toca el ensō.
// - 7 · Botón principal: contraste ≥ 4,5:1 (F9) y letra ≥ 18,66 px, de 360 a 1440 px y en los dos modos.
import { arg, open, run, sleep, THEMES, VIEWPORTS, type Page } from './lib.ts';

const BUDGET_MS = 1600;
const PASSES = 3;
const WARMUP = Number(arg('warmup') ?? 1);

const resize = (page: Page, width: number, height = 900) =>
  page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 960 });

const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const parse = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(parse(a)), luminance(parse(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

await run('qa:hero', async ({ url, browser, fail }) => {
  // 1 · Duración de la carga (escritorio y móvil).
  for (const viewport of ['desktop', 'mobile'] as const) {
    const page = await open(browser, url + '/', { viewport, theme: 'papel' });
    const anims = await page.evaluate<{ name: string; delay: number; end: number }[]>(`document.getAnimations().map((a) => {
      const t = a.effect.getTiming();
      return { name: a.animationName, delay: t.delay, end: t.delay + t.duration };
    })`);
    const end = Math.max(...anims.map((a) => a.end));
    const ink = anims.find((a) => a.name === 'ink-draw');
    const stamp = anims.find((a) => a.name === 'hanko-stamp');
    const splash = anims.find((a) => a.name === 'hanko-splash');
    console.log(`  ${viewport} · carga: ${anims.map((a) => `${a.name} ${a.delay}–${a.end} ms`).join(' · ')}`);
    if (!ink || !stamp || !splash) fail(`${viewport}: faltan animaciones de carga (${anims.map((a) => a.name).join(', ')})`);
    if (end > BUDGET_MS) fail(`${viewport}: la carga acaba a ${end} ms > ${BUDGET_MS}`);
    if (ink && stamp && stamp.delay < ink.end) fail(`${viewport}: el sello cae (${stamp.delay} ms) antes de que acabe el ensō (${ink.end} ms)`);
    await page.close();
  }

  // 1 · Fotogramas durante la animación, móvil con CPU ×4.
  for (let pass = 1 - WARMUP; pass <= PASSES; pass++) {
    const page = await browser.newPage();
    await page.viewport('mobile');
    await page.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.__frames = []; const loop = (t) => { window.__frames.push(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop);`,
    });
    await page.goto(url + '/', { settle: false });
    await sleep(2500);
    const r = await page.evaluate<{ first: number; frames: number; max: number; over: number; last: number; at: number[] }>(`(() => {
      const f = window.__frames;
      // Ventana: la animación visible, desde que empieza a moverse el ensō (su retardo) hasta 1,6 s.
      // Antes de eso solo está el primer pintado de la página, con o sin animación (FTD fase 2, criterio 1).
      const all = document.getAnimations();
      const created = Math.min(...all.map((a) => a.startTime ?? 0));
      const ink = all.find((a) => a.animationName === 'ink-draw');
      const first = created + (ink ? ink.effect.getTiming().delay : 0);
      const end = created + ${BUDGET_MS};
      const d = [];
      for (let i = 1; i < f.length; i++) if (f[i - 1] >= first && f[i] <= end + 34) d.push(f[i] - f[i - 1]);
      return { first, frames: d.length, max: Math.max(0, ...d), over: d.filter((x) => x > 33.4).length, at: f.flatMap((t, i) => (i && f[i - 1] >= first && t <= end + 34 && t - f[i - 1] > 33.4 ? [Math.round(f[i - 1] - first)] : [])), last: f[f.length - 1] };
    })()`);
    const label = pass < 1 ? 'calentamiento (no cuenta)' : `carga ${pass}`;
    console.log(`  móvil CPU ×4 · ${label}: animación desde ${r.first.toFixed(0)} ms · ${r.frames} fotogramas · máx ${r.max.toFixed(1)} ms · > 33 ms: ${r.over}${r.at.length ? ` (a ${r.at.join(", ")} ms del inicio)` : ""}`);
    if (pass >= 1 && r.over) fail(`móvil CPU ×4 carga ${pass}: ${r.over} fotogramas > 33 ms durante la animación`);
    if (pass >= 1 && r.frames < 30) fail(`móvil CPU ×4 carga ${pass}: solo ${r.frames} fotogramas medidos`);
    await page.close();
  }

  // 5 · Reduced motion y sin JS.
  for (const variant of ['reduced', 'nojs'] as const) {
    for (const viewport of ['desktop', 'mobile'] as const) {
      const page = await browser.newPage();
      await page.viewport(viewport);
      await page.media({ theme: 'papel', reduced: variant === 'reduced' });
      if (variant === 'nojs') await page.send('Emulation.setScriptExecutionDisabled', { value: true });
      await page.goto(url + '/', { settle: variant !== 'nojs' });
      await sleep(400);
      const s = await page.evaluate<{ anims: number; ink: string; hero: string; heroOpacity: string; nav: string; navOpacity: string; flight: string; slot: number }>(`(() => {
        const nav = document.querySelector('[data-qa=nav-hanko]');
        const flight = document.querySelector('[data-hanko-flight]');
        const a = flight.getBoundingClientRect(), b = flight.parentElement.getBoundingClientRect();
        return {
          anims: document.getAnimations().length,
          ink: getComputedStyle(document.querySelector('.ink .reveal')).strokeDashoffset,
          hero: getComputedStyle(document.querySelector('[data-hanko-origin]')).visibility,
          heroOpacity: getComputedStyle(document.querySelector('[data-hanko-origin]')).opacity,
          nav: getComputedStyle(nav).visibility,
          navOpacity: getComputedStyle(nav.parentElement).opacity,
          flight: getComputedStyle(flight).transform,
          slot: Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.width - b.width)),
        };
      })()`);
      const where = `${variant} ${viewport}`;
      console.log(`  ${where}: ${s.anims} animaciones · máscara del ensō ${s.ink} · sello del hero ${s.hero} · sello de la nav ${s.nav}, transform ${s.flight}, Δ hueco ${s.slot.toFixed(2)} px`);
      if (s.anims) fail(`${where}: ${s.anims} animaciones en marcha`);
      if (Number.parseFloat(s.ink) !== 0) fail(`${where}: el ensō no está entero (dashoffset de la máscara ${s.ink})`);
      if (s.hero !== 'visible' || s.heroOpacity !== '1') fail(`${where}: el sello del hero no se ve`);
      if (s.nav !== 'visible' || s.navOpacity !== '1') fail(`${where}: el sello de la nav no se ve`);
      if (s.flight !== 'none' || s.slot > 0.5) fail(`${where}: el sello de la nav no está en su hueco (${s.flight})`);
      await page.close();
    }
  }

  // 6 · Título.
  const page = await open(browser, url + '/', { viewport: 'desktop', theme: 'papel' });
  const title = () =>
    page.evaluate<{ size: number; lines: number; overflow: number; enso: number }>(`(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const h = document.querySelector('[data-qa=hero-title]');
      const range = document.createRange();
      range.selectNodeContents(h);
      const lines = [...range.getClientRects()];
      const col = h.getBoundingClientRect();
      const right = Math.max(...lines.map((r) => r.right));
      const enso = innerWidth >= 960 ? document.querySelector('[data-qa=hero-enso]').getBoundingClientRect().left : Infinity;
      return { size: parseFloat(getComputedStyle(h).fontSize), lines: new Set(lines.map((r) => Math.round(r.top))).size, overflow: right - col.right, enso: enso - right };
    })()`);
  for (const w of [1440, 1366, 1280, 1024, 960]) {
    await resize(page, w);
    const t = await title();
    const expected = Math.min(152, Math.max(88, (w * 10.5556) / 100));
    console.log(`  título a ${w} px: ${t.size.toFixed(1)} px · ${t.lines} líneas · margen con la columna ${(-t.overflow).toFixed(1)} px · con el ensō ${t.enso.toFixed(1)} px`);
    if (Math.abs(t.size - expected) > 0.5) fail(`título a ${w}: ${t.size} px ≠ ${expected.toFixed(1)}`);
    if (w === 1440 && t.size !== 152) fail(`título a 1440: ${t.size} px ≠ 152`);
    if (t.lines !== 2) fail(`título a ${w}: ${t.lines} líneas (deben ser 2)`);
    if (t.overflow > 0.5) fail(`título a ${w}: se sale ${t.overflow.toFixed(1)} px de su columna`);
    if (t.enso < 32) fail(`título a ${w}: a ${t.enso.toFixed(1)} px del ensō (< 32)`);
  }
  for (const w of [320, 360, 390, 430, 768]) {
    await resize(page, w, 844);
    const t = await title();
    const expected = Math.min(64, Math.max(44, (w * 17) / 100));
    console.log(`  título a ${w} px: ${t.size.toFixed(1)} px (clamp(44px, 17vw, 64px) = ${expected.toFixed(1)}) · ${t.lines} líneas`);
    if (Math.abs(t.size - expected) > 0.5) fail(`título a ${w}: ${t.size} px ≠ ${expected.toFixed(1)}`);
    if (t.overflow > 0.5) fail(`título a ${w}: se sale ${t.overflow.toFixed(1)} px`);
  }
  await page.close();

  // 7 · Contraste y tamaño del botón principal.
  for (const theme of THEMES) {
    const p = await open(browser, url + '/', { viewport: 'desktop', theme });
    for (const w of [360, 390, 768, 959, 960, 1024, 1280, 1440]) {
      await resize(p, w, w < 960 ? VIEWPORTS.mobile.height : VIEWPORTS.desktop.height);
      const s = await p.evaluate<{ fg: string; bg: string; size: number; weight: string }>(`(() => {
        const cs = getComputedStyle(document.querySelector('[data-qa=hero-cta]'));
        return { fg: cs.color, bg: cs.backgroundColor, size: parseFloat(cs.fontSize), weight: cs.fontWeight };
      })()`);
      const c = contrast(s.fg, s.bg);
      if (c < 4.5) fail(`botón ${theme} a ${w}: contraste ${c.toFixed(2)} < 4,5`);
      if (s.size < 18.66) fail(`botón ${theme} a ${w}: ${s.size} px < 18,66`);
      if (w === 1440 || w === 390) console.log(`  botón ${theme} a ${w}: ${c.toFixed(2)}:1 · ${s.size} px · peso ${s.weight}`);
    }
    await p.close();
  }
});
