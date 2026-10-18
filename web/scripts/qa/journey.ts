// pnpm qa:journey — Trayectoria (fase 5):
// - Posiciones de d-09 (escenario pegado) y m-08 (sección bajo la nav) ±1 px. d-09 tiene 5 columnas y
//   la web 4 (C1): en escritorio se comparan el encabezado, el ancho, las columnas (W / n) y las
//   distancias verticales entre banda de años, trazo y lista; la altura del bloque depende del texto
//   (está centrado en el escenario, como en la maqueta).
// - Criterio 1: cada hito se enciende en el píxel de scroll en que la punta del trazo alcanza su
//   círculo: en ese píxel, |punta − centro del círculo| ≤ 4 px en el eje del trazo, y un píxel antes
//   sigue apagado. La punta se calcula aparte, desde --p y la línea central de la máscara.
// - Criterio 4: <ol> con un <li> por hito, en orden, con año, título, detalle y frase; trazo fuera del
//   árbol accesible.
// - Encaje: en el escenario, el bloque cabe entre el encabezado y el pie (1440 × 900, 1280 × 720,
//   1024 × 768, 1920 × 1080, 960 × 700) y nada sale por los lados.
// - Reduced motion y sin JS: sin sticky, trazo entero y todo encendido.
// Control negativo: `--control shift` desplaza 6 px el centro de los círculos (debe fallar).
import { arg, run, sleep, type Browser, type Theme } from './lib.ts';

type Box = [x: number, y: number, w: number, h: number];
const SHIFT = arg('control') === 'shift' ? 6 : 0;
const frames = 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))';

// Medidas de las maquetas en Chrome (scratch: d-09 y m-08 abiertas con sus fuentes).
const MOBILE: Record<string, Box> = {
  '#trayectoria h2': [24, 93, 342, 37],
  '[data-qa=journey-list]': [24, 158, 342, NaN],
  '[data-qa=journey-item]': [24, 158, 342, 200],
  '[data-qa=journey-year]': [72, 158, 294, 29],
  '[data-qa=journey-title]': [72, 191, 294, 29.89],
  '[data-qa=journey-detail]': [72, 226.89, 294, 23.19],
  '[data-qa=journey-line]': [72, 260.08, 294, 24],
  '[data-qa=journey-dot]': [31, 164, 14, 14],
  '[data-qa=journey-stroke-v]': [24, 158, 28, NaN],
};

async function sized(browser: Browser, url: string, width: number, height: number, opts: { theme?: Theme; reduced?: boolean; nojs?: boolean } = {}) {
  const page = await browser.newPage();
  const mobile = width < 960;
  await page.viewport(mobile ? 'mobile' : 'desktop');
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await page.media({ theme: opts.theme ?? 'papel', reduced: opts.reduced ?? false });
  if (opts.nojs) await page.send('Emulation.setScriptExecutionDisabled', { value: true });
  await page.goto(url, { settle: !opts.nojs });
  await sleep(opts.nojs ? 500 : 1800);
  return page;
}

/** Escenario pegado en la fracción f de su recorrido (escritorio) o sección bajo la nav (móvil). */
const place = (f: number | 'top') => `(async () => {
  const s = document.querySelector('[data-journey-scene]');
  const st = s.querySelector('[data-stage]');
  const nav = document.querySelector('[data-nav-header]').offsetHeight;
  const top = ${f === 'top'}
    ? document.querySelector('#trayectoria').getBoundingClientRect().top + scrollY - nav
    : s.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(st).top) + ${f === 'top' ? 0 : f} * (s.offsetHeight - st.offsetHeight);
  scrollTo({ top: Math.round(top), behavior: 'instant' });
  await ${frames};
})()`;

const boxes = (sels: string[]) => `(() => {
  const out = {};
  for (const sel of ${JSON.stringify(sels)}) {
    const b = document.querySelector(sel).getBoundingClientRect();
    out[sel] = [b.x, b.y, b.width, b.height];
  }
  return out;
})()`;

/** Punta del trazo (desde --p) y centros de los círculos, en la ventana; eje del trazo. */
const PROBE = `(() => {
  const svg = [...document.querySelectorAll('[data-journey-stroke] svg')].find((s) => s.getBoundingClientRect().width > 0);
  const path = svg.querySelector('mask path');
  const p = parseFloat(getComputedStyle(document.querySelector('[data-journey-scene]')).getPropertyValue('--p'));
  const pt = path.getPointAtLength(p * path.getTotalLength());
  const m = svg.getScreenCTM();
  const horizontal = svg.viewBox.baseVal.width > svg.viewBox.baseVal.height;
  const tip = [m.a * pt.x + m.c * pt.y + m.e, m.b * pt.x + m.d * pt.y + m.f];
  const dots = [...document.querySelectorAll('[data-journey-dot]')].map((d) => {
    const b = d.getBoundingClientRect();
    return [b.left + b.width / 2 + ${SHIFT}, b.top + b.height / 2 + ${SHIFT}];
  });
  const lit = [...document.querySelectorAll('[data-milestone]')].map((li) => li.hasAttribute('data-lit'));
  return { p, horizontal, tip, dots, lit };
})()`;
type Probe = { p: number; horizontal: boolean; tip: [number, number]; dots: [number, number][]; lit: boolean[] };

await run('qa:journey', async ({ url, browser, fail }) => {
  // --- Posiciones ---
  for (const theme of ['papel', 'sumi'] as Theme[]) {
    // Móvil (m-08).
    {
      const page = await sized(browser, `${url}/`, 390, 844, { theme });
      await page.evaluate(place('top'));
      await sleep(200);
      const got = await page.evaluate<Record<string, Box>>(boxes(Object.keys(MOBILE)));
      // El cuarto círculo: 6 px bajo el inicio de su hito (m-08: 764 = 758 + 6).
      const fourth = await page.evaluate<[Box, Box]>(`(() => { const li = document.querySelectorAll('[data-qa=journey-item]')[3]; const r = (e) => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; }; return [r(li), r(li.querySelector('[data-qa=journey-dot]'))]; })()`);
      let worst = 0;
      const check = (name: string, have: Box, want: Box) => {
        const d = Math.max(...have.map((v, i) => (Number.isNaN(want[i]!) ? 0 : Math.abs(v - want[i]!))));
        worst = Math.max(worst, d);
        if (d > 1) fail(`móvil ${theme} ${name}: [${have.map((v) => v.toFixed(1)).join(', ')}] ≠ [${want.join(', ')}] (Δ ${d.toFixed(2)})`);
      };
      for (const [sel, want] of Object.entries(MOBILE)) check(sel, got[sel]!, want);
      check('4.º hito', fourth[0], [24, 758, 342, NaN]);
      check('4.º círculo', fourth[1], [31, 764, 14, 14]);
      const h = got['[data-qa=journey-list]']![3];
      const sh = got['[data-qa=journey-stroke-v]']![3];
      if (Math.abs(h - sh) > 0.5) fail(`móvil ${theme}: el trazo mide ${sh} px y la lista ${h} px`);
      console.log(`  móvil ${theme} · posiciones (m-08): Δ máx ${worst.toFixed(2)} px`);
      await page.close();
    }
    // Escritorio (d-09), escenario pegado en p = 0.
    {
      const page = await sized(browser, `${url}/`, 1440, 900, { theme });
      await page.evaluate(place(0));
      await sleep(200);
      const d = await page.evaluate<{ h2: Box; stroke: Box; list: Box; items: Box[]; years: Box[]; titles: Box[]; dots: Box[] }>(`(() => {
        const r = (e) => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; };
        const all = (q) => [...document.querySelectorAll(q)].map(r);
        return {
          h2: r(document.querySelector('#trayectoria h2')),
          stroke: r(document.querySelector('[data-qa=journey-stroke-h]')),
          list: r(document.querySelector('[data-qa=journey-list]')),
          items: all('[data-qa=journey-item]'),
          years: all('[data-qa=journey-year]'),
          titles: all('[data-qa=journey-title]'),
          dots: all('[data-qa=journey-dot]'),
        };
      })()`);
      const n = d.items.length;
      const errs: [string, number, number][] = [
        ['encabezado x', d.h2[0], 96],
        ['encabezado y', d.h2[1], 137],
        ['encabezado alto', d.h2[3], 44],
        ['trazo x', d.stroke[0], 96],
        ['trazo ancho', d.stroke[2], 1248],
        ['trazo alto', d.stroke[3], 60],
        // d-09: la banda de los años (200 px, con su pie 20 px antes del trazo), el trazo (60 px) y,
        // 28 px por debajo, los títulos.
        ['banda − trazo', d.list[1] - d.stroke[1], -200],
        ...d.items.flatMap((b, k): [string, number, number][] => [
          [`hito ${k + 1} x`, b[0], 96 + (k * 1248) / n],
          [`hito ${k + 1} ancho`, b[2], 1248 / n],
          [`año ${k + 1} x`, d.years[k]![0], 96 + (k * 1248) / n],
          [`año ${k + 1} pie`, d.years[k]![1] + d.years[k]![3], d.stroke[1] - 20],
          [`año ${k + 1} ancho`, d.years[k]![2], 34],
          [`título ${k + 1} − trazo`, d.titles[k]![1] - d.stroke[1], 88],
          // Círculo: 8 unidades tras el inicio de la columna (d-09: 846 = 844,8 + 8,2 − 7).
          [`círculo ${k + 1} x`, d.dots[k]![0], 96 + (k * 1248) / n + 1],
        ]),
      ];
      let worst = 0;
      for (const [name, have, want] of errs) {
        worst = Math.max(worst, Math.abs(have - want));
        if (Math.abs(have - want) > 1) fail(`escritorio ${theme} ${name}: ${have.toFixed(2)} ≠ ${want.toFixed(2)}`);
      }
      // Centrado vertical en el escenario (d-09: margin auto bajo el encabezado, 56 px abajo).
      const block = [d.years[0]![1] - (200 - 20 - d.years[0]![3]), Math.max(...d.items.map((b) => b[1] + b[3]))];
      const gapTop = block[0]! - (d.h2[1] + d.h2[3]);
      const gapBottom = 900 - 56 - block[1]!;
      if (Math.abs(gapTop - gapBottom) > 1) fail(`escritorio ${theme}: bloque descentrado (arriba ${gapTop.toFixed(1)}, abajo ${gapBottom.toFixed(1)})`);
      console.log(`  escritorio ${theme} · posiciones (d-09, ${n} columnas): Δ máx ${worst.toFixed(2)} px; centrado ${gapTop.toFixed(1)} / ${gapBottom.toFixed(1)}`);
      await page.close();
    }
  }

  // --- Criterio 1: la punta y el círculo, en el píxel en que se enciende cada hito ---
  for (const [width, height] of [[1440, 900], [1024, 768], [390, 844], [360, 740]] as const) {
    const where = `${width} × ${height}`;
    const page = await sized(browser, `${url}/`, width, height);
    const range = await page.evaluate<[number, number]>(`(() => { const s = document.querySelector('[data-journey-scene]').getBoundingClientRect(); return [Math.max(0, Math.floor(s.top + scrollY - innerHeight)), Math.ceil(s.bottom + scrollY)]; })()`);
    const at = async (y: number) => {
      await page.evaluate(`(async () => { scrollTo({ top: ${y}, behavior: 'instant' }); await ${frames}; })()`);
      return page.evaluate<Probe>(PROBE);
    };
    const start = await at(range[0]);
    if (start.lit.some(Boolean)) fail(`${where}: hay hitos encendidos antes de la sección (${start.lit})`);
    const n = start.lit.length;
    const report: string[] = [];
    for (let k = 0; k < n; k++) {
      // Primer píxel de scroll con el hito k encendido (búsqueda binaria: el encendido es monótono).
      let lo = range[0];
      let hi = range[1];
      if (!(await at(hi)).lit[k]) {
        fail(`${where}: el hito ${k + 1} no se enciende nunca`);
        continue;
      }
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if ((await at(mid)).lit[k]) hi = mid;
        else lo = mid;
      }
      const on = await at(hi);
      const before = await at(hi - 1);
      const [axis, cross] = on.horizontal ? ([0, 1] as const) : ([1, 0] as const);
      const dist = on.tip[axis] - on.dots[k]![axis];
      const across = on.tip[cross] - on.dots[k]![cross];
      const count = on.lit.filter(Boolean).length;
      if (Math.abs(dist) > 4) fail(`${where}: hito ${k + 1} encendido con la punta a ${dist.toFixed(2)} px del círculo`);
      if (before.lit[k]) fail(`${where}: hito ${k + 1} ya encendido un píxel antes`);
      if (count !== k + 1) fail(`${where}: al encender el hito ${k + 1} hay ${count} encendidos`);
      report.push(`${dist >= 0 ? '+' : ''}${dist.toFixed(2)}${Math.abs(across) > 0.05 ? ` (⊥ ${across.toFixed(1)})` : ''}`);
    }
    const end = await at(range[1]);
    if (!end.lit.every(Boolean) || end.p !== 1) fail(`${where}: al final p = ${end.p} y encendidos ${end.lit}`);
    console.log(`  ${where} · punta − círculo al encenderse (px): ${report.join(' · ')}`);
    await page.close();
  }

  // --- Criterio 4 y accesibilidad del trazo ---
  {
    const page = await sized(browser, `${url}/`, 1440, 900);
    const a = await page.evaluate<{ ol: boolean; items: string[]; hidden: boolean; inTree: number }>(`(() => {
      const list = document.querySelector('[data-qa=journey-list]');
      return {
        ol: list.tagName === 'OL' && [...list.children].every((c) => c.tagName === 'LI'),
        items: [...list.children].map((li) => [...li.querySelectorAll('p, h3')].map((e) => e.textContent.trim()).join(' | ')),
        hidden: [...document.querySelectorAll('[data-journey-stroke] svg')].every((s) => s.getAttribute('aria-hidden') === 'true') && [...document.querySelectorAll('[data-journey-dot]')].every((d) => d.getAttribute('aria-hidden') === 'true'),
        inTree: list.querySelectorAll('h3').length,
      };
    })()`);
    if (!a.ol) fail('la lista no es un <ol> de <li>');
    if (!a.hidden) fail('el trazo o los círculos están en el árbol accesible');
    if (a.inTree !== a.items.length) fail('cada hito necesita su <h3>');
    console.log(`  lista: ${a.items.length} hitos en orden\n    ${a.items.join('\n    ')}`);
    await page.close();
  }

  // --- Encaje en el escenario ---
  for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [1920, 1080], [960, 700]] as const) {
    const page = await sized(browser, `${url}/`, width, height);
    const out: string[] = [];
    for (const f of [0, 1]) {
      await page.evaluate(place(f));
      await sleep(100);
      const e = await page.evaluate<{ sticky: boolean; top: number; bottom: number; stage: Box; right: number }>(`(() => {
        const st = document.querySelector('[data-journey-scene] [data-stage]');
        const r = st.getBoundingClientRect();
        const kids = [...document.querySelectorAll('[data-qa=journey-item] > *, [data-qa=journey-stroke-h]')].map((e) => e.getBoundingClientRect());
        return {
          sticky: getComputedStyle(st).position === 'sticky',
          top: Math.min(...kids.map((b) => b.top)) - document.querySelector('#trayectoria h2').getBoundingClientRect().bottom,
          bottom: r.bottom - Math.max(...kids.map((b) => b.bottom)),
          stage: [r.x, r.y, r.width, r.height],
          right: Math.max(...kids.map((b) => b.right)) - innerWidth,
        };
      })()`);
      if (!e.sticky) fail(`${width} × ${height}: el escenario no es sticky`);
      if (e.top < 0 || e.bottom < 0) fail(`${width} × ${height} p = ${f}: el bloque no cabe (arriba ${e.top.toFixed(1)}, abajo ${e.bottom.toFixed(1)})`);
      if (e.right > 0) fail(`${width} × ${height}: sale ${e.right.toFixed(1)} px por la derecha`);
      out.push(`p = ${f}: aire ${e.top.toFixed(0)} / ${e.bottom.toFixed(0)} px`);
    }
    console.log(`  ${width} × ${height} · encaje: ${out.join(' · ')}`);
    await page.close();
  }

  // --- Reduced motion, sin JS y escritorio bajo ---
  for (const [name, width, height, opts] of [
    ['escritorio reduced', 1440, 900, { reduced: true }],
    ['móvil reduced', 390, 844, { reduced: true, theme: 'sumi' as Theme }],
    ['escritorio sin JS', 1440, 900, { nojs: true }],
    ['móvil sin JS', 390, 844, { nojs: true }],
  ] as const) {
    const page = await sized(browser, `${url}/`, width, height, opts);
    const s = await page.evaluate<{ sticky: string; ink: string; titles: string[]; text: string; dots: string[] }>(`(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--text)';
      document.body.append(probe);
      const text = getComputedStyle(probe).color;
      probe.remove();
      return {
        sticky: getComputedStyle(document.querySelector('[data-journey-scene] [data-stage]')).position,
        ink: getComputedStyle(document.querySelector('[data-journey-stroke] .reveal')).strokeDashoffset,
        titles: [...document.querySelectorAll('[data-qa=journey-title], [data-qa=journey-line]')].map((e) => getComputedStyle(e).color),
        text,
        dots: [...document.querySelectorAll('[data-journey-dot]')].map((e) => getComputedStyle(e).backgroundColor),
      };
    })()`);
    if (s.sticky === 'sticky') fail(`${name}: el escenario es sticky`);
    if (Number.parseFloat(s.ink) !== 0) fail(`${name}: el trazo no está entero (dashoffset ${s.ink})`);
    if (!s.titles.every((c) => c === s.text) || !s.dots.every((c) => c === s.text)) fail(`${name}: hay hitos apagados`);
    console.log(`  ${name}: sin sticky, trazo entero y ${s.titles.length / 2} hitos encendidos`);
    await page.close();
  }
});
