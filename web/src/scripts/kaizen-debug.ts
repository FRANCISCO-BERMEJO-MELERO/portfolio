// Modo depuración (?debug): trazos de KanjiVG numerados, zonas de la partición,
// slider de --p, grosor por trazo en vivo, copia de la configuración y auditoría.
import type { Scene } from './scroll.ts';
import { kanjiGeometry } from '../generated/kanji-geometry.ts';
import { brush } from '../lib/brush.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const AUDIT_PX = 545; // 5 px por unidad (más que los 4 px/u de 440 px en pantalla)
const ALPHA_TOL = 32; // diferencia de alfa (0–255) que se considera visible
const STEPS = 20; // muestras por trazo dentro de su tramo

type Stroke = { n: number; brush: SVGPathElement; preview: SVGPathElement; from: number; to: number };
type Kanji = { char: string; svg: SVGSVGElement; strokes: Stroke[] };

export type StrokeReport = { n: number; leakPx: number; leakAt: number | null; gapPx: number; gapAt: number | null };
export type KanjiReport = {
  char: string;
  states: number;
  /** Con --p = 1: píxeles que difieren del glifo limpio y máxima diferencia de alfa. */
  finalDiffPx: number;
  finalMaxDiff: number;
  strokes: StrokeReport[];
};

/** Capa de depuración de un kanji: zonas, máscaras, líneas y números de trazo. */
function buildLayer(svg: SVGSVGElement) {
  const geo = kanjiGeometry.find((g) => g.char === svg.dataset['char'])!;
  const id = svg.querySelector('mask')!.id.replace(/-mask$/, '');
  const glyph = svg.querySelector('.ink')!.getAttribute('d')!;
  const hue = (j: number) => (j * 360) / geo.strokes.length;
  const brushes = [...svg.querySelectorAll<SVGPathElement>('mask .brush')];
  const layer = document.createElementNS(SVG_NS, 'g');
  layer.setAttribute('class', 'debug-layer');
  layer.setAttribute('data-debug-layer', '');
  layer.innerHTML =
    `<clipPath id="${id}-glyph"><path d="${glyph}"/></clipPath>` +
    `<g class="debug-zones" clip-path="url(#${id}-glyph)">` +
    geo.strokes.map((s, j) => `<path class="debug-zone" d="${s.zone}" style="--hue: ${hue(j)}"/>`).join('') +
    `</g>` +
    geo.strokes
      .map(
        (s, j) => `<g style="--hue: ${hue(j)}" data-n="${s.n}">
          <path class="debug-mask" d="${brushes[j]!.getAttribute('d')}" stroke-width="${brushes[j]!.getAttribute('stroke-width')}"/>
          <path class="debug-line" d="${s.d}"/>
          <circle class="debug-dot" cx="${s.start.x}" cy="${s.start.y}" r="2.6"/>
          <text class="debug-num" x="${s.start.x}" y="${s.start.y}">${s.n}</text>
        </g>`,
      )
      .join('');
  svg.append(layer);
}

const LAYER_CSS = `
  .scene:not([data-debug]) .debug-layer { display: none }
  /* Misma regla que el recorte: lo que se ve aquí es lo que recorta. */
  .debug-zone { fill: hsl(var(--hue) 80% 55% / 0.55); fill-rule: evenodd }
  .debug-mask { fill: none; stroke: hsl(var(--hue) 85% 50% / 0.16); stroke-linecap: butt; stroke-linejoin: round }
  .debug-line { fill: none; stroke: hsl(var(--hue) 85% 32%); stroke-width: 0.7; stroke-linecap: round }
  .debug-dot { fill: hsl(var(--hue) 85% 32%) }
  .debug-num { fill: #fff; font: 600 3.4px/1 system-ui, sans-serif; text-anchor: middle; dominant-baseline: central }
  .scene[data-hide-masks] .debug-mask, .scene[data-hide-zones] .debug-zones { display: none }
`;

export function startDebug(scene: HTMLElement, progress: Scene) {
  const css = document.createElement('style');
  css.textContent = LAYER_CSS;
  document.head.append(css);
  scene.querySelectorAll<SVGSVGElement>('svg[data-char]').forEach(buildLayer);
  const kanji: Kanji[] = [...scene.querySelectorAll<SVGSVGElement>('svg[data-char]')].map((svg) => ({
    char: svg.dataset['char']!,
    svg,
    strokes: [...svg.querySelectorAll<SVGPathElement>('mask .brush')].map((b) => {
      const style = getComputedStyle(b);
      return {
        n: Number(b.dataset['n']),
        brush: b,
        preview: svg.querySelector<SVGPathElement>(`[data-debug-layer] [data-n="${b.dataset['n']}"] .debug-mask`)!,
        from: Number(style.getPropertyValue('--s')),
        to: Number(style.getPropertyValue('--e')),
      };
    }),
  }));
  scene.toggleAttribute('data-debug', true);

  const panel = document.createElement('aside');
  panel.className = 'kaizen-debug';
  panel.innerHTML = `
    <style>
      .kaizen-debug { position: fixed; right: 12px; bottom: 12px; z-index: 10; width: min(340px, calc(100vw - 24px));
        max-height: calc(100svh - 24px); overflow: auto; box-sizing: border-box; padding: 12px 14px;
        background: rgb(255 255 255 / .94); color: #1b1a17; border: 1px solid #d6cfbf; border-radius: 8px;
        font: 12px/1.4 system-ui, sans-serif; box-shadow: 0 6px 24px rgb(0 0 0 / .08) }
      .kaizen-debug h2 { font-size: 12px; margin: 10px 0 4px; letter-spacing: .08em; text-transform: uppercase; color: #6b665c }
      .kaizen-debug label { display: flex; align-items: center; gap: 8px }
      .kaizen-debug input[type=range] { flex: 1; min-width: 0 }
      .kaizen-debug output, .kaizen-debug .w { font-variant-numeric: tabular-nums; min-width: 3.2em; text-align: right }
      .kaizen-debug .row { display: flex; gap: 6px 10px; flex-wrap: wrap; margin-top: 6px }
      .kaizen-debug button { font: inherit; padding: 4px 8px; border: 1px solid #b9b4a9; background: #f3efe6; border-radius: 4px; cursor: pointer }
      .kaizen-debug .n { width: 1.6em; text-align: right; color: #6b665c }
      .kaizen-debug .bad { color: #c0391d; font-weight: 600 }
      .kaizen-debug .ok { color: #2d7a3a; font-weight: 600 }
      .kaizen-debug textarea { width: 100%; height: 9em; font: 11px ui-monospace, monospace }
      .kaizen-debug details > summary { cursor: pointer; font-weight: 600 }
    </style>
    <details open>
      <summary>Kaizen · debug</summary>
      <h2>Progreso</h2>
      <label>--p <input type="range" min="0" max="1" step="0.001" data-p><output data-p-out>0</output></label>
      <div class="row">
        <button type="button" data-scroll>Volver al scroll</button>
      </div>
      <div class="row">
        <label><input type="checkbox" data-overlay checked> Trazos</label>
        <label><input type="checkbox" data-masks checked> Máscaras</label>
        <label><input type="checkbox" data-zones checked> Zonas</label>
      </div>
      <div data-widths></div>
      <div class="row">
        <button type="button" data-copy>Copiar configuración</button>
        <button type="button" data-audit>Auditar</button>
      </div>
      <div data-status></div>
      <textarea data-fallback hidden readonly></textarea>
      <div data-report></div>
    </details>`;
  document.body.append(panel);
  const $ = <T extends Element>(sel: string) => panel.querySelector<T>(sel)!;

  // --- Slider de --p ---
  const slider = $<HTMLInputElement>('[data-p]');
  const out = $<HTMLOutputElement>('[data-p-out]');
  const sync = () => {
    slider.value = String(progress.value);
    out.value = progress.value.toFixed(3);
  };
  const setP = (p: number | null) => {
    progress.override(p);
    sync();
  };
  slider.addEventListener('input', () => setP(Number(slider.value)));
  $('[data-scroll]').addEventListener('click', () => setP(null));
  addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });

  // --- Capas ---
  const toggle = (sel: string, attr: string, invert = false) =>
    $<HTMLInputElement>(sel).addEventListener('change', (e) => {
      const on = (e.target as HTMLInputElement).checked;
      scene.toggleAttribute(attr, invert ? !on : on);
    });
  toggle('[data-overlay]', 'data-debug');
  toggle('[data-masks]', 'data-hide-masks', true);
  toggle('[data-zones]', 'data-hide-zones', true);

  // --- Grosor por trazo ---
  const widths = $('[data-widths]');
  const setWidth = (k: Kanji, s: Stroke, w: number) => {
    const geo = kanjiGeometry.find((g) => g.char === k.char)!.strokes[s.n - 1]!;
    const b = brush(geo, w);
    s.brush.setAttribute('d', b.d);
    s.brush.setAttribute('stroke-width', String(w));
    s.brush.setAttribute('stroke-dasharray', `${b.total} ${b.total}`);
    s.brush.style.setProperty('--ext', String(b.ext));
    s.brush.style.setProperty('--total', String(b.total));
    s.preview.setAttribute('d', b.d);
    s.preview.setAttribute('stroke-width', String(w));
  };
  for (const k of kanji) {
    const geo = kanjiGeometry.find((g) => g.char === k.char)!;
    const h = document.createElement('h2');
    h.textContent = `${k.char} · grosor de máscara (mín.)`;
    widths.append(h);
    for (const s of k.strokes) {
      const label = document.createElement('label');
      const w0 = s.brush.getAttribute('stroke-width')!;
      const min = geo.strokes[s.n - 1]!.minWidth;
      label.innerHTML = `<span class="n">${s.n}</span><input type="range" min="1" max="40" step="0.5" value="${w0}"><span class="w">${w0}</span><span class="n">${min}</span>`;
      const input = label.querySelector('input')!;
      const value = label.querySelector('.w')!;
      input.addEventListener('input', () => {
        setWidth(k, s, Number(input.value));
        value.textContent = input.value;
        value.classList.toggle('bad', Number(input.value) < min);
      });
      widths.append(label);
    }
  }

  const config = () =>
    `export const kanjiMasks: Record<KanjiChar, readonly number[]> = {\n${kanji
      .map((k) => `  ${k.char}: [${k.strokes.map((s) => s.brush.getAttribute('stroke-width')).join(', ')}],`)
      .join('\n')}\n};\n`;

  const status = $('[data-status]');
  $('[data-copy]').addEventListener('click', async () => {
    const text = config();
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copiado. Pégalo en src/data/kanji-masks.ts.';
    } catch {
      const area = $<HTMLTextAreaElement>('[data-fallback]');
      area.hidden = false;
      area.value = text;
      area.select();
      status.textContent = 'No se pudo copiar solo: copia el texto de abajo.';
    }
  });

  // --- Auditoría ---
  const report = $('[data-report]');
  const runAudit = async () => {
    status.textContent = 'Auditando…';
    const manual = progress.value;
    const reports: KanjiReport[] = [];
    // La auditoría razona con el valor que ve el CSS, no con el pedido.
    const apply = (p: number) => {
      progress.override(p);
      return progress.value;
    };
    try {
      for (const k of kanji) reports.push(await audit(k, apply));
    } catch (error) {
      // Algunos navegadores (versiones de Safari) no dejan leer un canvas con SVG pintado.
      setP(manual);
      status.innerHTML = `<span class="bad">La auditoría no puede leer píxeles en este navegador: ${String(error)}</span>`;
      throw error;
    }
    setP(manual);
    status.textContent = '';
    report.innerHTML = reports
      .map((r) => {
        const leaks = r.strokes.reduce((a, s) => a + s.leakPx, 0);
        const gaps = r.strokes.reduce((a, s) => a + s.gapPx, 0);
        return `<h2>${r.char} · auditoría (${r.states} estados de --p)</h2>
        <div class="${leaks ? 'bad' : 'ok'}">Fugas: ${leaks} px</div>
        <div class="${gaps ? 'bad' : 'ok'}">Huecos al acabar cada trazo: ${gaps} px</div>
        <div class="${r.finalDiffPx ? 'bad' : 'ok'}">--p = 1 frente al glifo: ${r.finalDiffPx} px distintos (máx. Δα ${r.finalMaxDiff})</div>
        ${r.strokes
          .filter((s) => s.leakPx || s.gapPx)
          .map(
            (s) =>
              `<div>Trazo ${s.n}: ${s.leakPx} px de fuga${s.leakAt !== null ? ` (peor en p=${s.leakAt.toFixed(3)})` : ''} · ${s.gapPx} px de hueco</div>`,
          )
          .join('')}`;
      })
      .join('');
    return reports;
  };
  $('[data-audit]').addEventListener('click', () => void runAudit());

  // Parámetros para pruebas con navegadores headless:
  // ?debug&p=0.5 fija --p · &audit vuelca la auditoría en <pre id="kaizen-audit">
  // &clean oculta panel y capas · &nopanel · &nomasks · &nozones.
  const params = new URLSearchParams(location.search);
  const pParam = params.get('p');
  if (pParam !== null) setP(Number(pParam));
  if (params.has('clean') || params.has('nopanel')) panel.hidden = true;
  if (params.has('clean')) scene.toggleAttribute('data-debug', false);
  if (params.has('nomasks')) scene.toggleAttribute('data-hide-masks', true);
  if (params.has('nozones')) scene.toggleAttribute('data-hide-zones', true);
  // Controles negativos de la auditoría (deben dar rojo):
  // &control=noclip quita los recortes de zona (→ fugas) · &control=thin grosor 2 (→ huecos).
  const control = params.get('control');
  if (control === 'noclip') scene.querySelectorAll('mask g[clip-path]').forEach((g) => g.removeAttribute('clip-path'));
  if (control === 'thin') kanji.forEach((k) => k.strokes.forEach((s) => setWidth(k, s, 2)));
  if (params.has('audit')) {
    void runAudit().then((r) => {
      const pre = document.createElement('pre');
      pre.id = 'kaizen-audit';
      pre.textContent = JSON.stringify(r);
      document.body.append(pre);
    });
  }

  // &leakimg=<índice kanji>,<p>: imagen de diagnóstico de un estado (gris = permitido,
  // negro = revelado y permitido, rojo = fuga, azul = hueco de un trazo terminado).
  const leakParam = params.get('leakimg');
  if (leakParam) {
    const [ki, pv] = leakParam.split(',').map(Number);
    void leakImage(kanji[ki!]!, pv!, (p) => {
      progress.override(p);
      return progress.value;
    }).then((url) => {
      const pre = document.createElement('pre');
      pre.id = 'kaizen-leakimg';
      pre.textContent = url;
      document.body.append(pre);
    });
  }

  Object.assign(window, {
    __kaizen: {
      setP,
      audit: runAudit,
      config,
      setWidths(char: string, ws: number[]) {
        const k = kanji.find((x) => x.char === char);
        k?.strokes.forEach((s, i) => ws[i] !== undefined && setWidth(k, s, ws[i]!));
      },
    },
  });
}

/**
 * Recorre --p dentro del tramo del kanji y, en cada estado, pide al navegador que pinte:
 * - lo revelado: la tinta con su máscara, con los estilos calculados de verdad;
 * - lo permitido: la tinta recortada por las zonas de los trazos ya empezados;
 * - lo exigido: la tinta recortada por las zonas de los trazos ya terminados.
 * Fuga = revelado sin permiso. Hueco = exigido y no revelado. Con --p = 1 se compara
 * además con el glifo limpio.
 */
async function audit(k: Kanji, setP: (p: number) => number): Promise<KanjiReport> {
  const strokes: StrokeReport[] = k.strokes.map((s) => ({ n: s.n, leakPx: 0, leakAt: null, gapPx: 0, gapAt: null }));
  const ps = new Set<number>();
  for (const s of k.strokes) {
    for (let i = 0; i <= STEPS; i++) ps.add(s.from + ((s.to - s.from) * i) / STEPS);
    ps.add(s.from + 1e-4);
  }
  const sorted = [...ps].sort((a, b) => a - b);
  const zoneCache = new Map<string, Uint8ClampedArray>();
  const zones = async (idx: number[]) => {
    const key = idx.join(',');
    if (!zoneCache.has(key)) zoneCache.set(key, await alpha(zonesSvg(k, idx)));
    return zoneCache.get(key)!;
  };

  for (const wanted of sorted) {
    const p = setP(wanted);
    const revealed = await alpha(snapshot(k));
    const started = k.strokes.flatMap((s, i) => (p > s.from ? [i] : []));
    const done = k.strokes.flatMap((s, i) => (p >= s.to ? [i] : []));
    const allowed = await zones(started);
    const required = await zones(done);
    // A quién se atribuye: al trazo en curso (o al último empezado).
    const current = Math.max(0, started.length ? started[started.length - 1]! : 0);
    let leak = 0;
    let gap = 0;
    for (let i = 0; i < revealed.length; i++) {
      if (revealed[i]! - allowed[i]! > ALPHA_TOL) leak++;
      if (required[i]! - revealed[i]! > ALPHA_TOL) gap++;
    }
    const r = strokes[current]!;
    if (leak > r.leakPx) {
      r.leakPx = leak;
      r.leakAt = p;
    }
    if (gap > r.gapPx) {
      r.gapPx = gap;
      r.gapAt = p;
    }
  }

  // --p = 1 frente al glifo limpio.
  setP(1);
  const final = await alpha(snapshot(k));
  const plain = await alpha(zonesSvg(k, null));
  let finalDiffPx = 0;
  let finalMaxDiff = 0;
  for (let i = 0; i < final.length; i++) {
    const d = Math.abs(final[i]! - plain[i]!);
    if (d > 2) finalDiffPx++;
    finalMaxDiff = Math.max(finalMaxDiff, d);
  }
  return { char: k.char, states: sorted.length, finalDiffPx, finalMaxDiff, strokes };
}

async function leakImage(k: Kanji, wanted: number, setP: (p: number) => number): Promise<string> {
  const p = setP(wanted);
  const revealed = await alpha(snapshot(k));
  const started = k.strokes.flatMap((s, i) => (p > s.from ? [i] : []));
  const done = k.strokes.flatMap((s, i) => (p >= s.to ? [i] : []));
  const allowed = await alpha(zonesSvg(k, started));
  const required = await alpha(zonesSvg(k, done));
  const out = ctx.createImageData(AUDIT_PX, AUDIT_PX);
  for (let i = 0; i < revealed.length; i++) {
    const [r, g, b] =
      revealed[i]! - allowed[i]! > ALPHA_TOL
        ? [230, 0, 0]
        : required[i]! - revealed[i]! > ALPHA_TOL
          ? [0, 90, 255]
          : revealed[i]! > 128
            ? [0, 0, 0]
            : allowed[i]! > 128
              ? [200, 200, 200]
              : [255, 255, 255];
    out.data.set([r, g, b, 255], i * 4);
  }
  ctx.putImageData(out, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Copia del SVG del kanji solo con la tinta enmascarada y los estilos calculados en línea. */
function snapshot(k: Kanji): string {
  const clone = k.svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('.guide, [data-debug-layer]').forEach((e) => e.remove());
  const live = k.svg.querySelectorAll<SVGPathElement>('mask .brush');
  clone.querySelectorAll<SVGPathElement>('mask .brush').forEach((b, i) => {
    const cs = getComputedStyle(live[i]!);
    b.removeAttribute('class');
    b.setAttribute(
      'style',
      `fill:none;stroke:#fff;stroke-linecap:${cs.strokeLinecap};stroke-linejoin:${cs.strokeLinejoin};` +
        `stroke-dashoffset:${cs.strokeDashoffset};stroke-opacity:${cs.strokeOpacity}`,
    );
  });
  const ink = clone.querySelector('.ink')!;
  ink.removeAttribute('class');
  ink.setAttribute('fill', '#000');
  return serialize(clone);
}

/** Tinta recortada por la unión de las zonas `idx` (o el glifo entero si es null). */
function zonesSvg(k: Kanji, idx: number[] | null): string {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', k.svg.getAttribute('viewBox')!);
  const glyph = k.svg.querySelector('.ink')!.getAttribute('d')!;
  if (idx === null) {
    svg.innerHTML = `<path d="${glyph}" fill="#000"/>`;
  } else {
    const geo = kanjiGeometry.find((g) => g.char === k.char)!;
    // Un único recorte con todas las zonas (unión) y la tinta pintada una sola vez: pintarla
    // una vez por zona acumularía antialiasing en las costuras.
    svg.innerHTML =
      `<clipPath id="z">${idx.map((i) => `<path d="${geo.strokes[i]!.zone}" clip-rule="evenodd"/>`).join('')}</clipPath>` +
      (idx.length ? `<path d="${glyph}" fill="#000" clip-path="url(#z)"/>` : '');
  }
  return serialize(svg);
}

function serialize(svg: SVGSVGElement): string {
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', String(AUDIT_PX));
  svg.setAttribute('height', String(AUDIT_PX));
  svg.removeAttribute('style');
  svg.removeAttribute('class');
  return new XMLSerializer().serializeToString(svg);
}

const canvas = document.createElement('canvas');
canvas.width = canvas.height = AUDIT_PX;
const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

/** Pinta el SVG con el motor del navegador y devuelve el canal alfa. */
async function alpha(svg: string): Promise<Uint8ClampedArray> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  ctx.clearRect(0, 0, AUDIT_PX, AUDIT_PX);
  ctx.drawImage(img, 0, 0);
  const rgba = ctx.getImageData(0, 0, AUDIT_PX, AUDIT_PX).data;
  const a = new Uint8ClampedArray(AUDIT_PX * AUDIT_PX);
  for (let i = 0; i < a.length; i++) a[i] = rgba[i * 4 + 3]!;
  return a;
}
