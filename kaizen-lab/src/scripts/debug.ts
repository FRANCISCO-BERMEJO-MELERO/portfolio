// Modo depuración (?debug): superposición de KanjiVG numerada, slider de --p,
// grosor por trazo en vivo, copia de la configuración y auditoría de los criterios.
import type { ScrollProgress } from './scroll-progress.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const GRID = 0.25; // paso de la auditoría, en unidades de la caja (≈ 1 px a 440 px)
const LEAK_TOLERANCE = 2; // unidades: margen para no contar los cruces como fugas

type Stroke = { n: number; brush: SVGPathElement; preview: SVGPathElement };
type Kanji = { char: string; svg: SVGSVGElement; ink: SVGPathElement; strokes: Stroke[] };

export type StrokeReport = { n: number; leaks: number; leaksInto: number[]; late: number };
export type KanjiReport = { char: string; glyphPoints: number; gaps: number; strokes: StrokeReport[] };

export function startDebug(scene: HTMLElement, progress: ScrollProgress) {
  const kanji: Kanji[] = [...scene.querySelectorAll<SVGSVGElement>('svg[data-char]')].map((svg) => ({
    char: svg.dataset['char']!,
    svg,
    ink: svg.querySelector<SVGPathElement>('.ink')!,
    strokes: [...svg.querySelectorAll<SVGPathElement>('mask .brush')].map((brush) => ({
      n: Number(brush.dataset['n']),
      brush,
      preview: svg.querySelector<SVGPathElement>(`[data-debug-layer] [data-n="${brush.dataset['n']}"] .debug-mask`)!,
    })),
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
      .kaizen-debug .row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px }
      .kaizen-debug button { font: inherit; padding: 4px 8px; border: 1px solid #b9b4a9; background: #f3efe6; border-radius: 4px; cursor: pointer }
      .kaizen-debug .n { width: 1.6em; text-align: right; color: #6b665c }
      .kaizen-debug .bad { color: #c0391d; font-weight: 600 }
      .kaizen-debug textarea { width: 100%; height: 9em; font: 11px ui-monospace, monospace }
      .kaizen-debug details > summary { cursor: pointer; font-weight: 600 }
    </style>
    <details open>
      <summary>Kaizen · debug</summary>
      <h2>Progreso</h2>
      <label>--p <input type="range" min="0" max="1" step="0.001" data-p><output data-p-out>0</output></label>
      <div class="row">
        <button type="button" data-scroll>Volver al scroll</button>
        <label><input type="checkbox" data-overlay checked> Trazos</label>
        <label><input type="checkbox" data-masks checked> Máscaras</label>
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
  const setP = (p: number | null) => {
    progress.override(p);
    slider.value = String(progress.value);
    out.value = progress.value.toFixed(3);
  };
  slider.addEventListener('input', () => setP(Number(slider.value)));
  $('[data-scroll]').addEventListener('click', () => setP(null));
  addEventListener('scroll', () => requestAnimationFrame(() => {
    slider.value = String(progress.value);
    out.value = progress.value.toFixed(3);
  }), { passive: true });

  // --- Capas ---
  $<HTMLInputElement>('[data-overlay]').addEventListener('change', (e) => {
    const on = (e.target as HTMLInputElement).checked;
    scene.toggleAttribute('data-debug', on);
  });
  $<HTMLInputElement>('[data-masks]').addEventListener('change', (e) => {
    scene.toggleAttribute('data-hide-masks', !(e.target as HTMLInputElement).checked);
  });

  // --- Grosor por trazo ---
  const widths = $('[data-widths]');
  const setWidth = (s: Stroke, w: number) => {
    s.brush.setAttribute('stroke-width', String(w));
    s.preview.setAttribute('stroke-width', String(w));
  };
  for (const k of kanji) {
    const h = document.createElement('h2');
    h.textContent = `${k.char} · grosor de máscara`;
    widths.append(h);
    for (const s of k.strokes) {
      const label = document.createElement('label');
      const w0 = s.brush.getAttribute('stroke-width')!;
      label.innerHTML = `<span class="n">${s.n}</span><input type="range" min="1" max="30" step="0.5" value="${w0}"><span class="w">${w0}</span>`;
      const input = label.querySelector('input')!;
      const value = label.querySelector('.w')!;
      input.addEventListener('input', () => {
        setWidth(s, Number(input.value));
        value.textContent = input.value;
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
  const runAudit = () => {
    const reports = kanji.map(audit);
    report.innerHTML = reports
      .map(
        (r) => `<h2>${r.char} · auditoría</h2>
        <div class="${r.gaps ? 'bad' : ''}">Huecos con --p = 1: ${r.gaps} puntos</div>
        ${r.strokes
          .map(
            (s) => `<div>Trazo ${s.n}: <span class="${s.leaks ? 'bad' : ''}">${s.leaks} fugas${
              s.leaks ? ` (hacia ${s.leaksInto.join(', ')})` : ''
            }</span> · ${s.late} tardíos</div>`,
          )
          .join('')}`,
      )
      .join('');
    return reports;
  };
  $('[data-audit]').addEventListener('click', runAudit);

  // Parámetros para pruebas con navegadores headless:
  // ?debug&p=0.5 fija --p · &audit vuelca la auditoría en <pre id="kaizen-audit"> · &clean oculta panel y capas.
  const params = new URLSearchParams(location.search);
  const pParam = params.get('p');
  if (pParam !== null) setP(Number(pParam));
  if (params.has('clean') || params.has('nopanel')) panel.hidden = true;
  if (params.has('clean')) scene.toggleAttribute('data-debug', false);
  if (params.has('nomasks')) scene.toggleAttribute('data-hide-masks', true);
  if (params.has('audit')) {
    const pre = document.createElement('pre');
    pre.id = 'kaizen-audit';
    pre.textContent = JSON.stringify(runAudit());
    document.body.append(pre);
  }

  // API para pruebas automáticas.
  Object.assign(window, {
    __kaizen: {
      setP,
      audit: runAudit,
      config,
      setWidths(char: string, ws: number[]) {
        const k = kanji.find((x) => x.char === char);
        k?.strokes.forEach((s, i) => ws[i] !== undefined && setWidth(s, ws[i]!));
      },
    },
  });
}

/**
 * Muestrea el glifo en una rejilla. Para cada punto de tinta:
 * - «revela» = primer trazo (en orden) cuya máscara lo cubre; si ninguno → hueco (criterio 2).
 * - «dueño»  = trazo cuya línea central de KanjiVG está más cerca.
 * - fuga (criterio 1): lo revela un trazo anterior a su dueño y está claramente más lejos
 *   de él (más de LEAK_TOLERANCE), es decir, no es un cruce.
 * - tardío: lo revela un trazo posterior a su dueño (el trazo se ve «cortado» un rato).
 */
function audit(k: Kanji): KanjiReport {
  const probe = document.createElementNS(SVG_NS, 'svg');
  probe.setAttribute('viewBox', k.svg.getAttribute('viewBox')!);
  probe.setAttribute('style', 'position:fixed;left:-10000px;top:0;width:109px;height:109px');
  document.body.append(probe);
  const brushes = k.strokes.map((s) => {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', s.brush.getAttribute('d')!);
    p.setAttribute('style', `fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:${s.brush.getAttribute('stroke-width')}`);
    probe.append(p);
    const len = p.getTotalLength();
    const pts: DOMPoint[] = [];
    for (let l = 0; l <= len; l += 0.25) pts.push(p.getPointAtLength(l));
    return { el: p, pts };
  });

  const layer = k.svg.querySelector('[data-debug-layer]')!;
  layer.querySelector('.audit')?.remove();
  const marks = document.createElementNS(SVG_NS, 'g');
  marks.setAttribute('class', 'audit');
  const markD = { gap: '', leak: '' };

  const strokes: StrokeReport[] = k.strokes.map((s) => ({ n: s.n, leaks: 0, leaksInto: [], late: 0 }));
  let gaps = 0;
  let glyphPoints = 0;
  const box = k.ink.getBBox();
  const pt = new DOMPoint();
  for (let y = box.y + GRID / 2; y < box.y + box.height; y += GRID) {
    for (let x = box.x + GRID / 2; x < box.x + box.width; x += GRID) {
      pt.x = x;
      pt.y = y;
      if (!k.ink.isPointInFill(pt)) continue;
      glyphPoints++;
      const reveal = brushes.findIndex((b) => b.el.isPointInStroke(pt));
      const sq = `M${x - GRID / 2} ${y - GRID / 2}h${GRID}v${GRID}h${-GRID}z`;
      if (reveal < 0) {
        gaps++;
        markD.gap += sq;
        continue;
      }
      const dist = brushes.map((b) => {
        let m = Infinity;
        for (const q of b.pts) m = Math.min(m, (q.x - x) ** 2 + (q.y - y) ** 2);
        return Math.sqrt(m);
      });
      const owner = dist.indexOf(Math.min(...dist));
      if (reveal < owner && dist[reveal]! - dist[owner]! > LEAK_TOLERANCE) {
        const r = strokes[reveal]!;
        r.leaks++;
        if (!r.leaksInto.includes(owner + 1)) r.leaksInto.push(owner + 1);
        markD.leak += sq;
      } else if (reveal > owner) {
        strokes[owner]!.late++;
      }
    }
  }
  for (const [cls, d] of Object.entries(markD)) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', cls === 'gap' ? '#e00' : '#d0f');
    marks.append(p);
  }
  layer.append(marks);
  probe.remove();
  return { char: k.char, glyphPoints, gaps, strokes };
}
