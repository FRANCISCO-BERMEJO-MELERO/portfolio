// pnpm content:pending — lista el contenido pendiente de Fran: cada pending() y provisional() de
// src/data y src/i18n, con su fichero y línea. Sale con 0 aunque haya pendientes (es un listado);
// el que falla es `STRICT_CONTENT=1 pnpm build`.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIRS = ['src/data', 'src/i18n'];
const CALL = /\b(pending|provisional)\(\s*(?:'([^']*)'|"([^"]*)")(?:\s*,\s*(?:'([^']*)'|"([^"]*)"))?\s*\)/g;

let total = 0;
for (const dir of DIRS) {
  for (const name of (await readdir(dir)).filter((n) => n.endsWith('.ts')).sort()) {
    const file = join(dir, name).replaceAll('\\', '/');
    const lines = (await readFile(file, 'utf8')).split('\n');
    lines.forEach((text, i) => {
      for (const m of text.matchAll(CALL)) {
        const [, kind, a, b, c, d] = m;
        const label = kind === 'pending' ? (a ?? b) : (c ?? d);
        const shown = kind === 'provisional' ? `  (provisional: «${a ?? b}»)` : '';
        console.log(`${file}:${i + 1}  ${label}${shown}`);
        total++;
      }
    });
  }
}
console.log(`\n${total} marcadores pendientes. STRICT_CONTENT=1 pnpm build falla mientras quede alguno.`);
