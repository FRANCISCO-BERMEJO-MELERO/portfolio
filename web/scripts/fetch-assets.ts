// Descarga las fuentes de datos externas que falten. La fuente (8 MB) no se versiona:
// se baja la primera vez que se ejecuta dev o build. Los SVG de KanjiVG sí van en git.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const SOURCES: Record<string, string> = {
  'assets/fonts/ShipporiMincho-Regular.ttf':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/shipporimincho/ShipporiMincho-Regular.ttf',
  'assets/fonts/OFL.txt': 'https://raw.githubusercontent.com/google/fonts/main/ofl/shipporimincho/OFL.txt',
  'assets/kanjivg/06539.svg': 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/06539.svg',
  'assets/kanjivg/05584.svg': 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/05584.svg',
};

await mkdir('assets/fonts', { recursive: true });
await mkdir('assets/kanjivg', { recursive: true });
for (const [dest, url] of Object.entries(SOURCES)) {
  if (existsSync(dest)) continue;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${dest}`);
}
