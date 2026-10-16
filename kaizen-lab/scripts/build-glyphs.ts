// Build: convierte 改 y 善 de Shippori Mincho a paths SVG y alinea con ellos los
// trazos de KanjiVG, todo en el mismo sistema de coordenadas (caja de 109 × 109,
// la de KanjiVG). Escribe src/generated/kanji-geometry.ts.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import opentype from 'opentype.js';
import { parsePath, transform, toD, length, sample, bbox, type Affine } from './svg-path.ts';
import { kanjiFit } from '../src/data/kanji-fit.ts';

const BOX = 109;
const FONT_SIZE = 92; // como en las referencias: font-size 92 dentro de viewBox 109
const KANJI = [
  { char: '改', file: '06539' },
  { char: '善', file: '05584' },
] as const;

const font = opentype.parse(await readFile('assets/fonts/ShipporiMincho-Regular.ttf'));
const scale = FONT_SIZE / font.unitsPerEm;
const { ascender, descender } = font.tables.hhea;
// Misma posición que las referencias (<text dominant-baseline="central">): Chrome
// centra entre ascender y descender de hhea, no en el em-box ideográfico.
const emCenter = (ascender + descender) / 2;

const out = [];
for (const { char, file } of KANJI) {
  const glyph = font.charToGlyph(char);
  const x = BOX / 2 - (glyph.advanceWidth * scale) / 2;
  const y = BOX / 2 + emCenter * scale; // línea base
  // Serializamos los comandos nosotros: toPathData de opentype.js 2 voltea el glifo
  // por defecto (flipY) y a veces escribe NaN al redondear.
  const glyphD = commandsToD(glyph.getPath(x, y, FONT_SIZE).commands);
  if (/NaN|Infinity/.test(glyphD)) throw new Error(`${char}: path del glifo con valores no numéricos`);
  const gb = glyph.getBoundingBox();
  const glyphBox = { x1: x + gb.x1 * scale, y1: y - gb.y2 * scale, x2: x + gb.x2 * scale, y2: y - gb.y1 * scale };

  const svg = await readFile(`assets/kanjivg/${file}.svg`, 'utf8');
  const strokes = [...svg.matchAll(/<path id="kvg:\d+-s(\d+)"[^>]*\sd="([^"]+)"/g)]
    .map((m) => ({ n: Number(m[1]), d: m[2]! }))
    .sort((a, b) => a.n - b.n);
  strokes.forEach((s, k) => {
    if (s.n !== k + 1) throw new Error(`${char}: falta el trazo ${k + 1} en KanjiVG`);
  });
  const segs = strokes.map((s) => parsePath(s.d));

  // Ajuste: la caja de las líneas centrales de KanjiVG se lleva a la caja del glifo,
  // menos un margen (las líneas centrales no llegan al borde de la tinta).
  const fit = kanjiFit[char];
  const kb = bbox(segs.flatMap((s) => sample(s, 32)));
  const tgt = {
    x1: glyphBox.x1 + fit.inset.left,
    x2: glyphBox.x2 - fit.inset.right,
    y1: glyphBox.y1 + fit.inset.top,
    y2: glyphBox.y2 - fit.inset.bottom,
  };
  const sx = (tgt.x2 - tgt.x1) / (kb.x2 - kb.x1);
  const sy = (tgt.y2 - tgt.y1) / (kb.y2 - kb.y1);
  const c = BOX / 2;
  const { adjust: a } = fit;
  // Encaje de cajas y, encima, la corrección `adjust` respecto al centro de la caja.
  const m: Affine = {
    sx: sx * a.sx,
    sy: sy * a.sy,
    tx: c + (tgt.x1 - kb.x1 * sx - c) * a.sx + a.tx,
    ty: c + (tgt.y1 - kb.y1 * sy - c) * a.sy + a.ty,
  };

  out.push({
    char,
    codepoint: `U+${char.codePointAt(0)!.toString(16).toUpperCase()}`,
    glyphD,
    glyphBox: Object.fromEntries(Object.entries(glyphBox).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    strokes: segs.map((s, k) => {
      const t = transform(s, m);
      const start = t[0]![0];
      return {
        n: k + 1,
        d: toD(t),
        length: Math.round(length(t) * 100) / 100,
        start: { x: Math.round(start.x * 100) / 100, y: Math.round(start.y * 100) / 100 },
      };
    }),
  });
}

function commandsToD(commands: opentype.PathCommand[]): string {
  const r = (n: number) => String(Math.round(n * 100) / 100);
  return commands
    .map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${r(c.x)} ${r(c.y)}`;
        case 'Q':
          return `Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`;
        case 'C':
          return `C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`;
        case 'Z':
          return 'Z';
      }
    })
    .join('');
}

await mkdir('src/generated', { recursive: true });
await writeFile(
  'src/generated/kanji-geometry.ts',
  `// GENERADO por scripts/build-glyphs.ts — no editar a mano.
// Glifos de Shippori Mincho Regular (OFL) y trazos de KanjiVG (CC BY-SA 3.0, Ulrich Apel).
export const BOX = ${BOX};
export const kanjiGeometry = ${JSON.stringify(out, null, 2)} as const;
export type KanjiChar = (typeof kanjiGeometry)[number]['char'];
`,
);
console.log(out.map((k) => `✓ ${k.char} ${k.codepoint}: ${k.strokes.length} trazos`).join('\n'));
