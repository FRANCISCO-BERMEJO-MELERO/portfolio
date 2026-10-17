// pnpm qa:axe — axe-core inyectado en la página: 0 incidencias serious o critical,
// en escritorio y móvil, en papel y sumi. Las moderate / minor se listan sin fallar.
import { readFileSync } from 'node:fs';
import { arg, open, run, THEMES, type ViewportName } from './lib.ts';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const PATHS = (arg('paths') ?? '/').split(',');

type Violation = { id: string; impact: string; help: string; nodes: { target: string[] }[] };

await run('qa:axe', async ({ url, browser, fail }) => {
  for (const path of PATHS) {
    for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
      for (const theme of THEMES) {
        const page = await open(browser, url + path, { viewport, theme });
        await page.evaluate(AXE);
        const violations = await page.evaluate<Violation[]>(
          "axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.map((n) => ({ target: n.target })) })))",
        );
        const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        const other = violations.filter((v) => !serious.includes(v));
        console.log(`  ${path} ${viewport} ${theme}: ${serious.length} serious/critical · ${other.length} moderate/minor`);
        for (const v of other) console.log(`    · ${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
        for (const v of serious) fail(`${path} ${viewport} ${theme} · ${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
        await page.close();
      }
    }
  }
});
