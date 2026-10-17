// pnpm qa:axe — axe-core inyectado en la página: 0 incidencias serious o critical,
// en escritorio y móvil, en papel y sumi. Las moderate / minor se listan sin fallar.
// Excepción: el contraste de los elementos [data-logo] (el sello es el logotipo de la web; WCAG 1.4.3
// exime a los logotipos). Se cuentan aparte para que se vea que existen.
import { readFileSync } from 'node:fs';
import { arg, open, run, sleep, THEMES, type ViewportName } from './lib.ts';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const PATHS = (arg('paths') ?? '/').split(',');

type Violation = { id: string; impact: string; help: string; nodes: { target: string[] }[] };

await run('qa:axe', async ({ url, browser, fail }) => {
  for (const path of PATHS) {
    for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
      for (const theme of THEMES) {
        const page = await open(browser, url + path, { viewport, theme });
        await sleep(1700); // con la carga del hero terminada (el sello ya ha caído)
        await page.evaluate(AXE);
        const { violations, logos } = await page.evaluate<{ violations: Violation[]; logos: number }>(`axe.run(document, { resultTypes: ['violations'], elementRef: true }).then((r) => {
          let logos = 0;
          const violations = r.violations
            .map(({ id, impact, help, nodes }) => {
              const kept = nodes.filter((n) => !(id === 'color-contrast' && n.element.closest('[data-logo]')));
              logos += nodes.length - kept.length;
              return { id, impact, help, nodes: kept.map((n) => ({ target: n.target })) };
            })
            .filter((v) => v.nodes.length);
          return { violations, logos };
        })`);
        const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        const other = violations.filter((v) => !serious.includes(v));
        console.log(`  ${path} ${viewport} ${theme}: ${serious.length} serious/critical · ${other.length} moderate/minor · ${logos} contraste de logotipo (exento)`);
        for (const v of other) console.log(`    · ${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
        for (const v of serious) fail(`${path} ${viewport} ${theme} · ${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
        await page.close();
      }
    }
  }
});
