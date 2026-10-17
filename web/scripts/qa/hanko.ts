// pnpm qa:hanko — tránsito del sello hero → nav (criterios 2–4 de la fase 2), en escritorio y móvil,
// en papel y sumi:
// - 2 · En 0, 25, 50, 75 y 100 % del paso del hero, el centro y el tamaño del sello coinciden con la
//       curva de F10 (dos tramos lineales en p con d-02 en medio) ±2 px; en escritorio, a 200 px de
//       scroll, el sello está donde lo pone d-02: (822, 104), 72 px, ±2 px.
// - 3 · Relevo: en p = 1 (y más abajo), el sello coincide con su hueco de la nav ≤ 1 px, y su anillo,
//       radio, giro y letra son los del sello quieto de la nav (el de reduced motion). En p = 0, con
//       el del hero ≤ 1 px.
// - 4 · Volver arriba: las mismas 5 medidas al subir, y un barrido cada 25 px en los dos sentidos
//       sin salirse de la curva (sin saltos).
// La curva se calcula aquí con lo medido en la página (sitio del hero, hueco de la nav, alto del
// hero) y las fracciones de d-02; la posición absoluta de d-02 se comprueba aparte.
// Control negativo: --control shift desplaza 3 px el primer tramo en la página (debe fallar).
import { arg, open, run, sleep, THEMES, type ViewportName } from './lib.ts';

const CONTROL = arg('control');

const KNOT = { scroll: 200, x: 0.3592, y: 0.8376 };
const SIZES: Record<ViewportName, { hero: number; knot: number; nav: number }> = {
  desktop: { hero: 104, knot: 72, nav: 44 },
  mobile: { hero: 50, knot: 42.53, nav: 36 },
};
const D02 = { left: 822, top: 104, size: 72 };

type Box = { x: number; y: number; w: number };
type Probe = { flight: Box; slot: Box; origin: Box; scrollY: number };

const PROBE = `(async () => {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const c = (el, w) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: w ?? r.width }; };
  const flight = document.querySelector('[data-hanko-flight]');
  const origin = document.querySelector('[data-hanko-origin]');
  return { flight: c(flight), slot: c(flight.parentElement), origin: c(origin, origin.offsetWidth), scrollY };
})()`;

const STYLE = `(() => {
  const h = document.querySelector('[data-qa=nav-hanko]');
  const cs = getComputedStyle(h);
  const t = getComputedStyle(h.firstElementChild).transform;
  return { ring: cs.outlineWidth, inset: cs.outlineOffset, radius: cs.borderTopLeftRadius, rot: cs.transform, text: t };
})()`;

await run('qa:hanko', async ({ url, browser, fail }) => {
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    for (const theme of THEMES) {
      const where = `${viewport} ${theme}`;
      const size = SIZES[viewport];
      // Estilo del sello quieto de la nav (reduced motion): la referencia del relevo.
      const still = await open(browser, url + '/', { viewport, theme, reduced: true });
      const stillStyle = await still.evaluate<Record<string, string>>(STYLE);
      await still.close();

      const page = await open(browser, url + '/', { viewport, theme });
      await sleep(1700);
      if (CONTROL === 'shift') {
        await page.evaluate(`(() => { const f = document.querySelector('[data-hanko-flight]'); f.style.setProperty('--hk-x1', parseFloat(f.style.getPropertyValue('--hk-x1')) + 3 + 'px'); })()`);
      }
      const base = await page.evaluate<Probe>(PROBE);
      const span = await page.evaluate<number>(`document.querySelector('#inicio').getBoundingClientRect().height`);
      const H0 = base.origin;
      const N = base.slot;
      const k = Math.min(0.5, KNOT.scroll / span);
      const K = { x: H0.x + KNOT.x * (N.x - H0.x), y: H0.y + KNOT.y * (N.y - H0.y) };
      const curve = (p: number) => {
        const a = Math.min(1, Math.max(0, p / k));
        const b = Math.min(1, Math.max(0, (p - k) / (1 - k)));
        const lerp = (v0: number, vk: number, v1: number) => v0 + (vk - v0) * a + (v1 - vk) * b;
        return { x: lerp(H0.x, K.x, N.x), y: lerp(H0.y, K.y, N.y), w: lerp(size.hero, size.knot, size.nav) };
      };
      const at = async (y: number) => {
        await page.evaluate(`scrollTo({ top: ${y}, behavior: 'instant' })`);
        return page.evaluate<Probe>(PROBE);
      };
      const compare = (label: string, got: Box, want: Box, tol: number) => {
        const d = Math.max(Math.abs(got.x - want.x), Math.abs(got.y - want.y), Math.abs(got.w - want.w));
        if (d > tol) fail(`${where} ${label}: (${got.x.toFixed(1)}, ${got.y.toFixed(1)}) ${got.w.toFixed(1)} px ≠ (${want.x.toFixed(1)}, ${want.y.toFixed(1)}) ${want.w.toFixed(1)} px (Δ ${d.toFixed(2)} > ${tol})`);
        return d;
      };

      // 2 y 4 · Los cinco estados, bajando y subiendo.
      let worst = 0;
      const states = [0, 0.25, 0.5, 0.75, 1];
      for (const [dir, list] of [['bajando', states], ['subiendo', [...states].reverse()]] as const) {
        for (const q of list) {
          const r = await at(Math.round(q * span));
          worst = Math.max(worst, compare(`${dir} ${q * 100} %`, r.flight, curve(r.scrollY / span), 2));
        }
      }
      // 4 · Barrido cada 25 px en los dos sentidos.
      let sweep = 0;
      let samples = 0;
      const ys = Array.from({ length: Math.ceil(span / 25) + 1 }, (_, i) => Math.min(span, i * 25));
      for (const y of [...ys, ...[...ys].reverse()]) {
        const r = await at(y);
        sweep = Math.max(sweep, compare(`barrido ${r.scrollY} px`, r.flight, curve(r.scrollY / span), 2));
        samples++;
      }
      // 2 · d-02, en su posición absoluta (solo hay maqueta en escritorio).
      if (viewport === 'desktop') {
        const r = await at(KNOT.scroll);
        const box = { x: r.flight.x - r.flight.w / 2, y: r.flight.y - r.flight.w / 2, w: r.flight.w };
        const d = compare('d-02', { x: box.x, y: box.y, w: box.w }, { x: D02.left, y: D02.top, w: D02.size }, 2);
        console.log(`  ${where} · d-02: (${box.x.toFixed(1)}, ${box.y.toFixed(1)}) ${box.w.toFixed(1)} px · Δ ${d.toFixed(2)} px`);
      }
      // 3 · Relevo en p = 1 y por debajo; y en p = 0 con el sello del hero.
      let relay = 0;
      for (const y of [span, span * 1.5, span * 3]) {
        const r = await at(Math.round(y));
        relay = Math.max(relay, compare(`relevo a ${r.scrollY} px`, r.flight, { x: N.x, y: N.y, w: size.nav }, 1));
      }
      const style = await page.evaluate<Record<string, string>>(STYLE);
      for (const key of Object.keys(stillStyle)) {
        const nums = (s: string) => (s.match(/-?[\d.]+(e-?\d+)?/g) ?? []).map(Number);
        const a = nums(style[key]!);
        const b = nums(stillStyle[key]!);
        const diff = a.length === b.length ? Math.max(0, ...a.map((v, i) => Math.abs(v - b[i]!))) : Infinity;
        if (diff > 0.01) fail(`${where} relevo · ${key}: ${style[key]} ≠ ${stillStyle[key]} (sello quieto)`);
      }
      const r0 = await at(0);
      const start = compare('salida desde el hero', r0.flight, { x: H0.x, y: H0.y, w: H0.w }, 1);
      console.log(
        `  ${where}: 5 estados × 2 sentidos Δ máx ${worst.toFixed(2)} px · barrido ${samples} muestras Δ máx ${sweep.toFixed(2)} px · relevo nav Δ ${relay.toFixed(2)} px · salida hero Δ ${start.toFixed(2)} px`,
      );
      await page.close();
    }
  }
});
