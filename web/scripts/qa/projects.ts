// pnpm qa:projects — Proyectos (fase 4):
// - Posiciones de d-07 (escenario pegado, p = 0) y m-06 (sección bajo la nav) ±1 px.
// - Criterio 1: en el centro de cada tramo, el panel que se ve (el de encima en el mazo, entero) y el
//   aria-current del índice coinciden (5/5, papel y sumi).
// - Criterio 2: pulsar cada enlace del índice y abrir cada #hash deja su panel entero a la vista
//   (escritorio: quieto en su tramo; móvil: alineado en el carrusel y dentro de la ventana).
// - Criterio 3: Tab recorre los enlaces de los cinco paneles en orden y cada uno queda visible.
// - Criterio 4: en móvil, deslizar sincroniza aria-current y el scroll-snap alinea el panel ±1 px.
// - Encaje: en el escenario, el contenido de cada panel cabe en el panel (1440 × 900, 1280 × 720,
//   1024 × 768, 1920 × 1080, 960 × 700).
// - Apilado: reduced motion, sin JS y escritorio de menos de 700 px de alto: sin sticky, paneles en
//   flujo y sin bordes shoji.
// Control negativo: `--control shift` desplaza las posiciones esperadas 3 px (debe fallar).
import { arg, open, run, sleep, type Browser, type Page, type Theme, type ViewportName } from './lib.ts';

type Box = [x: number, y: number, w: number, h: number];
const SHIFT = arg('control') === 'shift' ? 3 : 0;
const IDS = ['chainview', 'docchain', 'la-previa', 'fintrack', 'web3-blog'];

// Medidas de las maquetas en Chrome (scratch: d-07 y m-06 abiertas con sus fuentes).
const EXPECTED: Record<ViewportName, Record<string, Box>> = {
  desktop: {
    '#proyectos h2': [96, 137, 1248, 44],
    '[data-qa=projects-index]': [96, 213, 200, 639],
    '[data-qa=projects-link]': [96, 214, 200, 64],
    '[data-qa=projects-deck]': [344, 213, 1000, 639],
    '#chainview': [344, 235, 888, 595],
    '#chainview [data-qa=tui]': [381, 272, 452.33, 521],
    '#chainview [data-qa=project-name]': [873.33, 332, 321.67, 63],
    '#chainview [data-qa=project-stack]': [873.33, 572, 321.67, 74],
    '#chainview [data-qa=project-fact]': [873.33, 670, 321.67, 33.8],
    '#chainview [data-qa=project-links]': [873.33, 749, 321.67, 44],
    '#docchain [data-qa=shoji-edge]': [1248, 235, 96, 595],
  },
  mobile: {
    '#proyectos h2': [24, 93, 342, 37],
    '[data-qa=projects-index]': [24, 150, 342, 53],
    '[data-qa=projects-link]': [24, 150, 52, 52],
    '[data-qa=projects-deck]': [24, 227, 342, 628.97],
    '#chainview': [24, 243, 316, 596.97],
    '#chainview [data-qa=tui]': [45, 376.38, 274, 182],
    '#chainview [data-qa=project-links]': [45, 774.97, 274, 44],
    '[data-qa=shoji-edge-m]': [348, 243, 18, 596.97],
    '[data-qa=projects-swipe]': [24, 869.97, 342, 17],
  },
};

const frames = 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))';

/** Escenario pegado en la fracción f de su recorrido. */
const pin = (f: number) => `(async () => {
  const s = document.querySelector('[data-projects-scene]');
  const st = s.querySelector('[data-stage]');
  scrollTo({ top: Math.round(s.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(st).top) + ${f} * (s.offsetHeight - st.offsetHeight)), behavior: 'instant' });
  await ${frames};
})()`;

/** Estado visible: panel de encima en el centro del mazo, si está entero y alineado, y el aria-current. */
const STATE = `(() => {
  const deck = document.querySelector('[data-deck]').getBoundingClientRect();
  const track = document.querySelector('[data-track]');
  const t = track.getBoundingClientRect();
  const hit = document.elementFromPoint(t.left + Math.min(t.width / 2, 150), deck.top + deck.height / 2)?.closest('[data-project-panel]');
  const current = document.querySelector('[data-project-link][aria-current]')?.hash.slice(1) ?? null;
  const panel = hit ? hit.getBoundingClientRect() : null;
  return {
    top: hit?.id ?? null,
    current,
    dx: panel ? panel.left - t.left : NaN,
    inView: panel ? panel.top >= (document.querySelector('[data-nav-header]')?.offsetHeight ?? 0) - 1 && panel.bottom <= innerHeight + 1 && panel.right <= innerWidth + 1 : false,
    pinned: getComputedStyle(document.querySelector('[data-projects-scene] [data-stage]')).position === 'sticky'
      ? Math.abs(document.querySelector('[data-projects-scene] [data-stage]').getBoundingClientRect().top - parseFloat(getComputedStyle(document.querySelector('[data-projects-scene] [data-stage]')).top)) < 1
      : null,
  };
})()`;
type State = { top: string | null; current: string | null; dx: number; inView: boolean; pinned: boolean | null };

/** Espera a que el scroll de la página y del carrusel se detengan (300 ms sin cambios, máx. 5 s). */
async function still(page: Page) {
  let last = '';
  let same = 0;
  for (let i = 0; i < 100 && same < 6; i++) {
    await sleep(50);
    const now = await page.evaluate<string>(`scrollY + ':' + document.querySelector('[data-track]').scrollLeft`);
    same = now === last ? same + 1 : 0;
    last = now;
  }
  await page.evaluate(frames);
}

async function click(page: Page, selector: string) {
  const c = await page.evaluate<[number, number]>(`(() => { const r = document.querySelector('${selector}').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await page.send('Input.dispatchMouseEvent', { type, x: c[0], y: c[1], button: 'left', clickCount: 1 });
  }
}

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

await run('qa:projects', async ({ url, browser, fail }) => {
  // Posiciones y criterio 1.
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    for (const theme of ['papel', 'sumi'] as Theme[]) {
      const where = `${viewport} ${theme}`;
      const page = await open(browser, `${url}/`, { viewport, theme });
      await sleep(1800);
      // Escritorio: escenario pegado en p = 0; móvil: la sección justo bajo la nav (como m-06).
      await page.evaluate(
        viewport === 'desktop'
          ? pin(0)
          : `(async () => { scrollTo({ top: document.querySelector('#proyectos').getBoundingClientRect().top + scrollY - document.querySelector('[data-nav-header]').offsetHeight, behavior: 'instant' }); await ${frames}; })()`,
      );
      await sleep(200);
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
      console.log(`  ${where} · posiciones (${viewport === 'desktop' ? 'd-07' : 'm-06'}): Δ máx ${worst.toFixed(2)} px`);

      if (viewport === 'desktop') {
        let ok = 0;
        for (let k = 0; k < IDS.length; k++) {
          await page.evaluate(pin((k + 0.5) / IDS.length));
          await sleep(100);
          const s = await page.evaluate<State>(STATE);
          if (s.top === IDS[k] && s.current === IDS[k] && Math.abs(s.dx) <= 1) ok++;
          else fail(`${where} tramo ${k}: se ve ${s.top} (dx ${s.dx.toFixed(1)}), aria-current ${s.current}`);
        }
        console.log(`  ${where} · criterio 1: panel visible = aria-current en ${ok}/${IDS.length} tramos`);
      }
      await page.close();
    }
  }

  // Criterio 2: enlaces del índice y #hash.
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    const page = await open(browser, `${url}/`, { viewport, theme: 'papel' });
    await sleep(1800);
    await page.evaluate(
      viewport === 'desktop' ? pin(0) : `(async () => { document.querySelector('#proyectos').scrollIntoView({ behavior: 'instant' }); await ${frames}; })()`,
    );
    let ok = 0;
    for (const k of [4, 1, 3, 0, 2]) {
      await click(page, `[data-project-link][href="#${IDS[k]}"]`);
      await sleep(100);
      await still(page);
      const s = await page.evaluate<State>(STATE);
      const hash = await page.evaluate<string>('location.hash');
      const good = s.top === IDS[k] && s.current === IDS[k] && Math.abs(s.dx) <= 1 && s.inView && s.pinned !== false && hash === `#${IDS[k]}`;
      if (good) ok++;
      else fail(`${viewport} índice ${IDS[k]}: se ve ${s.top} (dx ${s.dx.toFixed(1)}, a la vista ${s.inView}, pegado ${s.pinned}), aria-current ${s.current}, ${hash}`);
    }
    console.log(`  ${viewport} · criterio 2: índice ${ok}/5`);
    await page.close();

    ok = 0;
    for (let k = 0; k < IDS.length; k++) {
      const p = await open(browser, `${url}/#${IDS[k]}`, { viewport, theme: 'papel' });
      await sleep(600);
      await still(p);
      const s = await p.evaluate<State>(STATE);
      if (s.top === IDS[k] && s.current === IDS[k] && Math.abs(s.dx) <= 1 && s.inView && s.pinned !== false) ok++;
      else fail(`${viewport} #${IDS[k]}: se ve ${s.top} (dx ${s.dx.toFixed(1)}, a la vista ${s.inView}, pegado ${s.pinned}), aria-current ${s.current}`);
      await p.close();
    }
    console.log(`  ${viewport} · criterio 2: #hash ${ok}/5`);
  }

  // Criterio 3: Tab por los enlaces de los paneles.
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    const page = await open(browser, `${url}/`, { viewport, theme: 'papel' });
    await sleep(1800);
    await page.evaluate(`document.querySelectorAll('[data-project-link]')[4].focus()`);
    const order: string[] = [];
    let bad = 0;
    for (let i = 0; i < IDS.length * 2; i++) {
      await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await page.evaluate(frames);
      await sleep(50);
      const r = await page.evaluate<{ panel: string | null; visible: boolean }>(`(() => {
        const el = document.activeElement;
        const b = el.getBoundingClientRect();
        const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return { panel: el.closest('[data-project-panel]')?.id ?? null, visible: !!t && (t === el || el.contains(t)) && b.top >= 0 && b.bottom <= innerHeight };
      })()`);
      order.push(r.panel ?? '—');
      if (r.panel !== IDS[Math.floor(i / 2)] || !r.visible) {
        bad++;
        fail(`${viewport} Tab ${i + 1}: foco en ${r.panel} (esperado ${IDS[Math.floor(i / 2)]}), visible ${r.visible}`);
      }
    }
    console.log(`  ${viewport} · criterio 3: ${IDS.length * 2 - bad}/${IDS.length * 2} enlaces en orden y visibles`);
    await page.close();
  }

  // Criterio 4: deslizar el carrusel en móvil.
  {
    const page = await open(browser, `${url}/`, { viewport: 'mobile', theme: 'papel' });
    await sleep(1800);
    await page.evaluate(`(async () => { document.querySelector('#proyectos').scrollIntoView({ behavior: 'instant' }); await ${frames}; })()`);
    let ok = 0;
    const seq = [1, 2, 3, 4, 3, 2, 1, 0];
    let prev = 0;
    for (const k of seq) {
      const y = await page.evaluate<number>(`(() => { const r = document.querySelector('[data-deck]').getBoundingClientRect(); return r.top + Math.min(r.height, innerHeight - r.top) / 2; })()`);
      // 'default' con la emulación táctil activa ('touch' explícito no desplaza en headless, como en qa:perf).
      await page.send('Input.synthesizeScrollGesture', { x: 200, y: Math.round(y), xDistance: k > prev ? -220 : 220, yDistance: 0, speed: 1200, gestureSourceType: 'default' });
      prev = k;
      await sleep(100);
      await still(page);
      const s = await page.evaluate<State>(STATE);
      if (s.top === IDS[k] && s.current === IDS[k] && Math.abs(s.dx) <= 1) ok++;
      else fail(`móvil deslizar a ${IDS[k]}: se ve ${s.top} (dx ${s.dx.toFixed(2)}), aria-current ${s.current}`);
    }
    const last = await page.evaluate<boolean>(`document.querySelector('[data-deck]').hasAttribute('data-last')`);
    console.log(`  mobile · criterio 4: deslizar ${ok}/${seq.length} (alineado ±1 px y aria-current)${last ? ' · MAL: franja oculta' : ''}`);
    if (last) fail('móvil: la franja shoji sigue oculta al volver al primer panel');
    await page.close();
  }

  // Encaje en el escenario.
  for (const [w, h] of [
    [1440, 900],
    [1280, 720],
    [1024, 768],
    [1920, 1080],
    [960, 700],
  ] as const) {
    const page = await sized(browser, `${url}/`, w, h);
    const out: string[] = [];
    let sticky = true;
    for (let k = 0; k < IDS.length; k++) {
      await page.evaluate(pin((k + 0.5) / IDS.length));
      await sleep(80);
      const r = await page.evaluate<{ sticky: boolean; out: string[] }>(`(() => {
        const st = document.querySelector('[data-projects-scene] [data-stage]');
        const panel = document.getElementById(${JSON.stringify(IDS[k])});
        const cs = getComputedStyle(panel);
        const b = panel.getBoundingClientRect();
        const bottom = b.bottom - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth);
        const right = b.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
        const out = [];
        for (const e of panel.querySelectorAll(':scope > :not(.edge), :scope > :not(.edge) *')) {
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height || e.closest('.visually-hidden')) continue;
          if (r.bottom > bottom + 0.5 || r.right > right + 0.5) out.push(panel.id + ' ' + (e.dataset.qa || e.tagName.toLowerCase()) + ' +' + Math.round(Math.max(r.bottom - bottom, r.right - right)) + ' px');
        }
        return { sticky: getComputedStyle(st).position === 'sticky', out };
      })()`);
      sticky &&= r.sticky;
      out.push(...r.out);
    }
    const uniq = [...new Set(out)];
    console.log(`  ${w} × ${h}: ${sticky ? 'escenario' : 'MAL: sin escenario'} · ${uniq.length ? `FUERA: ${uniq.join(', ')}` : 'todo dentro'}`);
    if (!sticky) fail(`${w} × ${h}: sin escenario sticky`);
    if (uniq.length) fail(`${w} × ${h}: contenido fuera del panel: ${uniq.join(', ')}`);
    await page.close();
  }

  // Apilado.
  const STACK = `(() => {
    const st = document.querySelector('[data-projects-scene] [data-stage]');
    const panels = [...document.querySelectorAll('[data-project-panel]')];
    const edges = [...document.querySelectorAll('[data-projects-scene] .edge')].filter((e) => getComputedStyle(e).display !== 'none').length;
    const boxes = panels.map((p) => p.getBoundingClientRect());
    const ordered = boxes.every((b, i) => i === 0 || b.top >= boxes[i - 1].bottom);
    const moved = panels.filter((p) => getComputedStyle(p).position !== 'relative' || !['none', '0px', '0px 0px'].includes(getComputedStyle(p).translate)).length;
    return { position: getComputedStyle(st).position, ordered, moved, edges, swipe: getComputedStyle(document.querySelector('[data-qa=projects-swipe]')).display };
  })()`;
  type Stack = { position: string; ordered: boolean; moved: number; edges: number; swipe: string };
  const variants: [string, number, number, { reduced?: boolean; nojs?: boolean }][] = [
    ['escritorio reduced', 1440, 900, { reduced: true }],
    ['escritorio sin JS', 1440, 900, { nojs: true }],
    ['escritorio 1280 × 650', 1280, 650, {}],
    ['móvil reduced', 390, 844, { reduced: true }],
    ['móvil sin JS', 390, 844, { nojs: true }],
  ];
  for (const [name, w, h, opts] of variants) {
    const page = await sized(browser, `${url}/`, w, h, opts);
    const s = await page.evaluate<Stack>(STACK);
    const ok = s.position !== 'sticky' && s.ordered && !s.moved && !s.edges && s.swipe === 'none';
    console.log(`  ${name}: ${s.position} · apilados ${s.ordered ? 'sí' : 'no'} · movidos ${s.moved} · bordes ${s.edges} · aviso ${s.swipe} ${ok ? 'ok' : 'MAL'}`);
    if (!ok) fail(`${name}: ${JSON.stringify(s)}`);
    await page.close();
  }
});
