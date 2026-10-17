// pnpm qa:weight — peso servido (D11 y criterio 7 de la fase 1), medido sobre dist/:
// - JS propio ≤ 30 KB gzip: módulos de _astro/ + scripts en línea del HTML, sin el chunk de ?debug.
// - Fuentes: cada Shippori ≤ 60 KB, total ≤ 220 KB.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const JS_BUDGET = 30 * 1024;
const fail: string[] = [];
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(DIST);
const gz = (buf: Buffer | string) => gzipSync(buf, { level: 9 }).length;

// El chunk de depuración solo se descarga con ?debug: se reconoce por su contenido.
const js = files.filter((f) => f.endsWith('.js'));
let jsTotal = 0;
for (const f of js) {
  const src = readFileSync(f);
  const debug = src.includes('Kaizen · debug');
  const size = gz(src);
  console.log(`  ${f.replaceAll('\\', '/').padEnd(48)} ${kb(size).padStart(9)} gzip${debug ? '  (?debug, no cuenta)' : ''}`);
  if (!debug) jsTotal += size;
}
// Scripts en línea de cada página (tema, etc.): se cuenta el de la página que más lleva.
let inline = 0;
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]!).join('');
  inline = Math.max(inline, scripts ? gz(scripts) : 0);
}
jsTotal += inline;
console.log(`  scripts en línea (máx. por página)               ${kb(inline).padStart(9)} gzip`);
console.log(`  JS propio: ${kb(jsTotal)} gzip (máx. ${kb(JS_BUDGET)})`);
if (jsTotal > JS_BUDGET) fail.push(`JS propio ${kb(jsTotal)} > ${kb(JS_BUDGET)}`);

const fonts = files.filter((f) => f.endsWith('.woff2'));
const fontTotal = fonts.reduce((a, f) => a + statSync(f).size, 0);
for (const f of fonts) {
  const size = statSync(f).size;
  if (/shippori/i.test(f) && size > 60 * 1024) fail.push(`${f}: ${kb(size)} > 60 KB`);
}
console.log(`  Fuentes: ${fonts.length} WOFF2, ${kb(fontTotal)} (máx. 220 KB)`);
if (fontTotal > 220 * 1024) fail.push(`fuentes ${kb(fontTotal)} > 220 KB`);

if (fail.length) {
  console.error(`✗ qa:weight\n${fail.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
console.log('✓ qa:weight');
