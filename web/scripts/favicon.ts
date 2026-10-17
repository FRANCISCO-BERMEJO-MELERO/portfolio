// Genera public/favicon.svg: el sello (fase 2). Relleno --accent, anillo --on-accent y las iniciales
// de src/data/site.ts dibujadas con los glifos de Shippori Mincho 600 convertidos en trazados (un
// favicon no puede contar con la fuente). Colores de papel y, con el sistema en oscuro, de sumi.
// Sin giro: a 16–32 px el giro solo emborrona los bordes. Se regenera en predev / prebuild, así que
// cambiar las iniciales (pendientes de Fran) basta para actualizarlo.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import opentype from 'opentype.js';
import { site } from '../src/data/site.ts';

const SIZE = 64;
const FONT = 'assets/fonts/ShipporiMincho-SemiBold.ttf';
const COLORS = {
  papel: { accent: '#e2482a', on: '#f3efe6' },
  sumi: { accent: '#f0573a', on: '#15130f' },
};

const font = opentype.parse(new Uint8Array(await readFile(FONT)).buffer);
const text = site.hanko.text;
// Tamaño de letra proporcional al del sello de la nav (19 px en 44): 27,6 px en 64.
const fontSize = (SIZE * 19) / 44;
const box = font.getPath(text, 0, 0, fontSize, { letterSpacing: -0.02 }).getBoundingBox();
const x = (SIZE - (box.x2 - box.x1)) / 2 - box.x1;
const y = (SIZE - (box.y2 - box.y1)) / 2 - box.y1;
const d = font.getPath(text, x, y, fontSize, { letterSpacing: -0.02 }).toPathData(2);

// Radio 3, anillo 1,5 y separación 5 del sello de 44 px (d-07), escalados a 64.
const k = SIZE / 44;
const ring = 1.5 * k;
const inset = 5 * k;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
<style>.a{fill:${COLORS.papel.accent}}.o{fill:none;stroke:${COLORS.papel.on}}.t{fill:${COLORS.papel.on}}@media (prefers-color-scheme:dark){.a{fill:${COLORS.sumi.accent}}.o{stroke:${COLORS.sumi.on}}.t{fill:${COLORS.sumi.on}}}</style>
<rect class="a" width="${SIZE}" height="${SIZE}" rx="${(3 * k).toFixed(2)}"/>
<rect class="o" x="${(inset - ring / 2).toFixed(2)}" y="${(inset - ring / 2).toFixed(2)}" width="${(SIZE - 2 * inset + ring).toFixed(2)}" height="${(SIZE - 2 * inset + ring).toFixed(2)}" stroke-width="${ring.toFixed(2)}"/>
<path class="t" d="${d}"/>
</svg>
`;

await mkdir('public', { recursive: true });
await writeFile('public/favicon.svg', svg);
console.log(`✓ public/favicon.svg («${text}», ${svg.length} B)`);
