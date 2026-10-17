// pnpm qa:about — Sobre mí (fase 3), con el escenario del kaizen pegado bajo la nav:
// - Posiciones de d-04 y m-03 (p = 0) ±1 px: encabezado, párrafo, kanji, filas, equivalencia, texto, datos.
// - Estados de la columna de significado (criterio 2, con F17: color en vez de la opacidad de las
//   maquetas): cada fila en --text-2 hasta que empieza su kanji y en --text desde entonces; la
//   equivalencia (texto y filete) en --text solo con p = 1; el texto de abajo, siempre --text-2.
//   Se mide dentro de cada tramo (el scroll va por píxeles enteros: en p = 0,5 exacto se cae a un
//   lado o al otro).
// - Encaje (criterio 3): a 1440 × 900, 1280 × 720, 390 × 844 y 375 × 667 nada del escenario queda
//   fuera (en vertical, del escenario; en horizontal, de la ventana: en móvil los kanji entran 8 px
//   en el margen, como en m-03).
// - Accesibilidad (criterio 4): «改善» una sola vez en el árbol accesible, los SVG fuera de él, y la
//   columna leída como texto (改 kai cambiar · 善 zen bueno).
// - Reduced motion y sin JS: sin sticky, p = 1 y todo encendido.
// Control negativo: `--control shift` desplaza las posiciones esperadas 3 px (debe fallar).
import { arg, open, run, sleep, type Theme, type ViewportName } from './lib.ts';

type Box = [x: number, y: number, w: number, h: number];
const SHIFT = arg('control') === 'shift' ? 3 : 0;

// Medidas de las maquetas en Chrome (las WOFF2 de la web dan las mismas cifras).
const EXPECTED: Record<ViewportName, Record<string, Box>> = {
  desktop: {
    '#sobre-mi h2': [96, 137, 880, 44],
    '[data-qa=about-text]': [1024, 149, 320, 64],
    '[data-qa=kaizen-kanji]': [96, 249, 440, 440],
    '[data-qa=kaizen-row]': [1024, 312.5, 320, 87],
    '[data-qa=kaizen-result]': [1024, 486.5, 320, 65.5],
    '[data-qa=about-facts]': [96, 778, 1248, 82],
  },
  mobile: {
    '#sobre-mi h2': [24, 89, 342, 37],
    '[data-qa=kaizen-kanji]': [16, 138, 260, 260],
    '[data-qa=kaizen-row]': [276, 138, 90, 260],
    '[data-qa=kaizen-result]': [24, 660, 342, 54.5],
  },
};

// Colores esperados: [fila 改, fila 善, equivalencia, filete de la equivalencia, texto]; 1 = --text, 2 = --text-2.
const LIT = ['text', 'text', 'text', 'text', 'text-2'];
// -0,02 y 1,02 dejan el scroll antes y después del escenario (p = 0 y p = 1).
const STATES: [number, string[]][] = [
  [-0.02, ['text-2', 'text-2', 'text-2', 'text-2', 'text-2']],
  [0.25, ['text', 'text-2', 'text-2', 'text-2', 'text-2']],
  [0.45, ['text', 'text-2', 'text-2', 'text-2', 'text-2']],
  [0.55, ['text', 'text', 'text-2', 'text-2', 'text-2']],
  [0.75, ['text', 'text', 'text-2', 'text-2', 'text-2']],
  [1.02, LIT],
];

const SIZES: { viewport: ViewportName; width: number; height: number }[] = [
  { viewport: 'desktop', width: 1440, height: 900 },
  { viewport: 'desktop', width: 1280, height: 720 },
  { viewport: 'mobile', width: 390, height: 844 },
  { viewport: 'mobile', width: 375, height: 667 },
];

/** Lleva el scroll a la fracción f del recorrido del escenario pegado. */
const pin = (f: number) => `(async () => {
  const s = document.querySelector('[data-kaizen-scene]');
  const st = s.querySelector('[data-stage]');
  scrollTo({ top: s.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(st).top) + ${f} * (s.offsetHeight - st.offsetHeight), behavior: 'instant' });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
})()`;

/** Token de cada color medido (text, text-2 o el color tal cual si no es ninguno de los dos). */
const COLORS = `(() => {
  const rgb = (c) => {
    const m = c.match(/^color\\(srgb ([\\d.]+) ([\\d.]+) ([\\d.]+)\\)$/);
    if (m) return 'rgb(' + m.slice(1, 4).map((v) => Math.round(Number(v) * 255)).join(', ') + ')';
    return c;
  };
  const probe = document.createElement('span');
  document.body.append(probe);
  const token = {};
  for (const t of ['text', 'text-2']) { probe.style.color = 'var(--' + t + ')'; token[rgb(getComputedStyle(probe).color)] = t; }
  probe.remove();
  const q = (sel) => document.querySelector(sel);
  const rows = [...document.querySelectorAll('[data-qa=kaizen-row]')].map((e) => getComputedStyle(e).color);
  const result = getComputedStyle(q('[data-qa=kaizen-result]'));
  return [...rows, result.color, result.borderTopColor, getComputedStyle(q('[data-qa=kaizen-text]')).color].map((c) => token[rgb(c)] ?? c);
})()`;

await run('qa:about', async ({ url, browser, fail }) => {
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    for (const theme of ['papel', 'sumi'] as Theme[]) {
      const where = `${viewport} ${theme}`;
      const page = await open(browser, `${url}/`, { viewport, theme });
      await sleep(1800);
      await page.evaluate(pin(0));
      await sleep(300);

      // Posiciones.
      const boxes = await page.evaluate<Record<string, Box>>(`(() => {
        const out = {};
        for (const sel of ${JSON.stringify(Object.keys(EXPECTED[viewport]))}) {
          const b = document.querySelector(sel).getBoundingClientRect();
          out[sel] = [b.x, b.y, b.width, b.height];
        }
        return out;
      })()`);
      let worst = 0;
      for (const [sel, want] of Object.entries(EXPECTED[viewport])) {
        const got = boxes[sel]!;
        const d = Math.max(...got.map((v, i) => Math.abs(v - want[i]! - (i < 2 ? SHIFT : 0))));
        worst = Math.max(worst, d);
        if (d > 1) fail(`${where} ${sel}: [${got.map((v) => v.toFixed(1)).join(', ')}] ≠ [${want.join(', ')}] (Δ ${d.toFixed(2)})`);
      }
      console.log(`  ${where} · posiciones (${viewport === 'desktop' ? 'd-04' : 'm-03'}): Δ máx ${worst.toFixed(2)} px`);

      // Opacidades por estado.
      for (const [p, want] of STATES) {
        await page.evaluate(pin(p));
        await sleep(350); // la transición de color dura 0,2 s
        const got = await page.evaluate<string[]>(COLORS);
        const ok = got.join() === want.join();
        console.log(`  ${where} · p ≈ ${Math.min(1, Math.max(0, p))}: ${got.join(' / ')} ${ok ? 'ok' : `MAL (esperado ${want.join(' / ')})`}`);
        if (!ok) fail(`${where} p ≈ ${p}: ${got.join(' / ')} ≠ ${want.join(' / ')}`);
      }
      await page.close();
    }
  }

  // Encaje del escenario.
  for (const s of SIZES) {
    const page = await browser.newPage();
    await page.viewport(s.viewport);
    await page.send('Emulation.setDeviceMetricsOverride', { width: s.width, height: s.height, deviceScaleFactor: 1, mobile: s.viewport === 'mobile' });
    await page.media({ theme: 'papel' });
    await page.goto(`${url}/`);
    await sleep(1800);
    await page.evaluate(pin(1));
    await sleep(300);
    const r = await page.evaluate<{ kanji: number; out: string[] }>(`(() => {
      const stage = document.querySelector('[data-kaizen-scene] [data-stage]');
      const sb = stage.getBoundingClientRect();
      const out = [...stage.querySelectorAll('*')]
        .filter((e) => !e.closest('.visually-hidden') && !e.closest('svg') && getComputedStyle(e).display !== 'none')
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && (b.top < sb.top - 0.5 || b.bottom > sb.bottom + 0.5 || b.left < -0.5 || b.right > innerWidth + 0.5); })
        .map((e) => (e.dataset.qa || e.tagName.toLowerCase()) + ' ' + Math.round(e.getBoundingClientRect().bottom - sb.bottom) + ' px');
      // Nada se pisa: lo del cuerpo (kanji y columna) cabe en el cuerpo, y encabezado, cuerpo y pie no se solapan.
      const body = stage.querySelector('[data-qa=kaizen-body]').getBoundingClientRect();
      for (const e of stage.querySelectorAll('[data-qa=kaizen-pair], [data-qa=kaizen-meaning] > *, [data-qa=kaizen-body] > .meaning')) {
        const b = e.getBoundingClientRect();
        if (b.height && b.bottom > body.bottom + 0.5) out.push((e.dataset.qa || e.className) + ' sale del cuerpo ' + Math.round(b.bottom - body.bottom) + ' px');
      }
      const parts = [...stage.children].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.getBoundingClientRect());
      for (let i = 1; i < parts.length; i++) if (parts[i].top < parts[i - 1].bottom - 0.5) out.push('solape ' + Math.round(parts[i - 1].bottom - parts[i].top) + ' px');
      const k = stage.querySelectorAll('svg.kanji');
      for (const svg of k) { const b = svg.getBoundingClientRect(); if (b.bottom > sb.bottom + 0.5 || b.top < sb.top - 0.5) out.push('kanji'); }
      return { kanji: k[0].getBoundingClientRect().width, out };
    })()`);
    console.log(`  ${s.width} × ${s.height}: kanji de ${r.kanji.toFixed(1)} px · ${r.out.length ? `FUERA: ${r.out.join(', ')}` : 'todo dentro'}`);
    if (r.out.length) fail(`${s.width} × ${s.height}: fuera del escenario: ${r.out.join(', ')}`);
    await page.close();
  }

  // Accesibilidad: árbol accesible de la sección.
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    const page = await open(browser, `${url}/`, { viewport, theme: 'papel' });
    await sleep(500);
    const { nodes } = (await page.send('Accessibility.getFullAXTree')) as { nodes: { ignored: boolean; role?: { value: string }; name?: { value: string } }[] };
    const texts = nodes.filter((n) => !n.ignored && n.role?.value === 'StaticText').map((n) => n.name?.value ?? '');
    const kaizen = texts.filter((t) => t.includes('改善')).length;
    const terms = nodes.filter((n) => !n.ignored && /^(term|DescriptionListTerm)$/.test(n.role?.value ?? '')).length;
    const svgs = nodes.filter((n) => !n.ignored && /svg|graphics/i.test(n.role?.value ?? '')).length;
    // Chrome aplica text-transform al nombre («KAI»).
    const reading = ['kai', 'cambiar', 'zen', 'bueno'].every((w) => texts.some((t) => t.trim().toLowerCase() === w));
    console.log(`  accesibilidad ${viewport}: «改善» ${kaizen} vez · términos ${terms} · SVG en el árbol ${svgs} · significado leído ${reading ? 'sí' : 'no'}`);
    if (kaizen !== 1) fail(`${viewport}: «改善» aparece ${kaizen} veces en el árbol accesible`);
    if (svgs) fail(`${viewport}: ${svgs} SVG en el árbol accesible`);
    if (!reading) fail(`${viewport}: la columna de significado no se lee como texto`);
    if (terms < 2) fail(`${viewport}: ${terms} términos en la lista de significado (se esperan 改 y 善)`);
    await page.close();
  }

  // Reduced motion y sin JS.
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    for (const variant of ['reduced', 'nojs'] as const) {
      const page = await browser.newPage();
      await page.viewport(viewport);
      await page.media({ theme: 'papel', reduced: variant === 'reduced' });
      if (variant === 'nojs') await page.send('Emulation.setScriptExecutionDisabled', { value: true });
      await page.goto(`${url}/`, { settle: variant !== 'nojs' });
      await sleep(600);
      const r = await page.evaluate<{ p: string; position: string; ratio: number; colors: string[] }>(`(() => {
        const s = document.querySelector('[data-kaizen-scene]');
        const st = s.querySelector('[data-stage]');
        return {
          p: getComputedStyle(s).getPropertyValue('--p').trim(),
          position: getComputedStyle(st).position,
          ratio: s.offsetHeight / innerHeight,
          colors: ${COLORS},
        };
      })()`);
      const ok = Number(r.p) === 1 && r.position !== 'sticky' && r.ratio < 1.5 && r.colors.join() === LIT.join();
      console.log(`  ${viewport} ${variant}: --p ${r.p} · ${r.position} · escena ${r.ratio.toFixed(2)} pantallas · ${r.colors.join(' / ')} ${ok ? 'ok' : 'MAL'}`);
      if (!ok) fail(`${viewport} ${variant}: --p ${r.p}, ${r.position}, ${r.ratio.toFixed(2)} pantallas, ${r.colors.join(' / ')}`);
      await page.close();
    }
  }
});
