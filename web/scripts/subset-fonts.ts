// Genera los WOFF2 que sirve la web (src/assets/fonts/) a partir de los TTF de assets/fonts/.
// - Latin básico + Latin-1 + la puntuación tipográfica que usa el contenido, en todas.
// - Shippori Mincho añade los caracteres CJK de src/data y src/i18n (se extraen solos): con kanji
//   la fuente entera pesa 8 MB; subconjuntada, unas decenas de KB.
// - Falla si un carácter del contenido no tiene glifo en la fuente que lo pinta, o si se pasa
//   del presupuesto de peso (criterio 7 de la fase 1).
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import subsetFont from 'subset-font';
import opentype from 'opentype.js';

const OUT = 'src/assets/fonts';
const SCAN = ['src/data', 'src/i18n'];
const BUDGET = { perShippori: 60 * 1024, total: 220 * 1024 };

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i));
const LATIN = [...range(0x20, 0x7e), ...range(0xa0, 0xff)].join('');
// Puntuación tipográfica y flechas de la interfaz (↓ ↑ ↗ → ←).
const EXTRA = '–—‘’‚“”„…•‹›€−←↑→↓↗';
const NO_SERIF = 'āēīōūĀĒĪŌŪ';
// CJK: ideogramas, puntuación CJK y formas de ancho completo.
const isCjk = (c: string) => /[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/u.test(c);

type Face = { file: string; out: string; weight: number; axes?: Record<string, number>; cjk: boolean };
const FACES: Face[] = [
  { file: 'ShipporiMincho-Regular.ttf', out: 'shippori-mincho-400.woff2', weight: 400, cjk: true },
  { file: 'ShipporiMincho-SemiBold.ttf', out: 'shippori-mincho-600.woff2', weight: 600, cjk: true },
  // Inter variable fijada a cada peso; opsz 14 es la instancia por defecto (la de Google Fonts estática).
  { file: 'Inter-Variable.ttf', out: 'inter-400.woff2', weight: 400, axes: { wght: 400, opsz: 14 }, cjk: false },
  { file: 'Inter-Variable.ttf', out: 'inter-500.woff2', weight: 500, axes: { wght: 500, opsz: 14 }, cjk: false },
  { file: 'Inter-Variable.ttf', out: 'inter-600.woff2', weight: 600, axes: { wght: 600, opsz: 14 }, cjk: false },
  { file: 'IBMPlexMono-Regular.ttf', out: 'ibm-plex-mono-400.woff2', weight: 400, cjk: false },
];

async function files(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else if (['.ts', '.astro', '.md', '.css'].includes(extname(entry.name))) out.push(path);
  }
  return out;
}

// Caracteres del contenido: todo lo que no es ASCII en los datos y los textos de interfaz.
const content = new Set<string>();
for (const dir of SCAN) {
  for (const file of await files(dir)) {
    for (const c of await readFile(file, 'utf8')) if (c.codePointAt(0)! > 0x7e) content.add(c);
  }
}
const cjk = [...content].filter(isCjk).sort();
const latinNeeded = [...content].filter((c) => !isCjk(c) && !/\s/u.test(c));

await mkdir(OUT, { recursive: true });
const errors: string[] = [];
let total = 0;
for (const face of FACES) {
  const source = await readFile(join('assets/fonts', face.file));
  // Lo latino del contenido fuera de Latin-1 (p. ej. «ō» de ensō) entra también en el subconjunto.
  const text = LATIN + EXTRA + latinNeeded.join('') + (face.cjk ? cjk.join('') : '');
  const options = face.axes ? { variationAxes: face.axes } : {};
  // Se subconjunta a TTF para comprobar la cobertura y después a WOFF2 para servir.
  const ttf = await subsetFont(source, text, { ...options, targetFormat: 'truetype' });
  const font = opentype.parse(new Uint8Array(ttf).buffer);
  // Shippori (títulos) e Inter (texto) deben cubrir todo el contenido latino; Shippori, además, lo CJK.
  // Plex Mono solo pinta datos técnicos en ASCII, que ya van enteros en LATIN.
  // Shippori no tiene vocales con macrón (ō, ā, ū): solo pueden ir en texto de Inter o en nombres
  // accesibles (el ensō, «Ensō, círculo zen…»), nunca en un título.
  const serif = latinNeeded.filter((c) => !NO_SERIF.includes(c));
  const must = face.cjk ? [...serif, ...cjk] : face.file.startsWith('Inter') ? latinNeeded : [];
  const missing = must.filter((c) => !font.hasChar(c));
  if (missing.length) errors.push(`${face.out}: sin glifo para ${missing.join(' ')}`);
  const woff2 = await subsetFont(source, text, { ...options, targetFormat: 'woff2' });
  await writeFile(join(OUT, face.out), woff2);
  const size = (await stat(join(OUT, face.out))).size;
  total += size;
  if (face.cjk && size > BUDGET.perShippori) errors.push(`${face.out}: ${size} B > ${BUDGET.perShippori} B`);
  console.log(`✓ ${face.out.padEnd(26)} ${(size / 1024).toFixed(1).padStart(5)} KB`);
}
console.log(`  CJK del contenido (${cjk.length}): ${cjk.join('')}`);
console.log(`  Total fuentes: ${(total / 1024).toFixed(1)} KB (máx. ${BUDGET.total / 1024} KB)`);
if (total > BUDGET.total) errors.push(`total ${total} B > ${BUDGET.total} B`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
