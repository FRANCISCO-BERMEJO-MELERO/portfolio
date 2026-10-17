// Descarga las fuentes de datos externas que falten. Las fuentes originales (Shippori pesa 8 MB por
// peso) no se versionan: se bajan la primera vez que se ejecuta dev o build. Lo que se sirve son los
// WOFF2 subconjuntados de src/assets/fonts/ (scripts/subset-fonts.ts). Los SVG de KanjiVG sí van en git.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

const SOURCES: Record<string, string> = {
  'assets/fonts/ShipporiMincho-Regular.ttf': `${GF}/shipporimincho/ShipporiMincho-Regular.ttf`,
  'assets/fonts/ShipporiMincho-SemiBold.ttf': `${GF}/shipporimincho/ShipporiMincho-SemiBold.ttf`,
  'assets/fonts/OFL.txt': `${GF}/shipporimincho/OFL.txt`,
  // Inter es variable (opsz, wght): subset-fonts.ts fija cada peso.
  'assets/fonts/Inter-Variable.ttf': `${GF}/inter/Inter%5Bopsz,wght%5D.ttf`,
  'assets/fonts/OFL-Inter.txt': `${GF}/inter/OFL.txt`,
  'assets/fonts/IBMPlexMono-Regular.ttf': `${GF}/ibmplexmono/IBMPlexMono-Regular.ttf`,
  'assets/fonts/OFL-IBMPlexMono.txt': `${GF}/ibmplexmono/OFL.txt`,
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
