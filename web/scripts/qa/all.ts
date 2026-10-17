// pnpm qa — todas las pruebas, una tras otra, con un resumen al final. Sale con 1 si alguna falla.
// Requiere pnpm build antes. Las capturas (qa:shots) no se incluyen: se piden por fase.
import { spawnSync } from 'node:child_process';

const SUITES = ['weight', 'specs', 'axe', 'keys', 'overflow', 'nav', 'theme', 'perf', 'kaizen'];
const results: [string, boolean, number][] = [];
for (const suite of SUITES) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [`scripts/qa/${suite}.ts`], { stdio: 'inherit' });
  results.push([suite, r.status === 0, Date.now() - t0]);
}
console.log('\nResumen');
for (const [suite, ok, ms] of results) console.log(`  ${ok ? '✓' : '✗'} qa:${suite.padEnd(9)} ${(ms / 1000).toFixed(1)} s`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
