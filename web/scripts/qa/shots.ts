// pnpm qa:shots — capturas de la ventana en 1440 × 900 y 390 × 844 @3x: papel, sumi,
// reduced motion y sin JS, en los estados de scroll pedidos.
//   --path /            página
//   --at 0,#proyectos   estados: fracción del scroll total (0–1) o un #ancla
//   --out dir           carpeta de salida (por defecto qa-output/shots)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { arg, run, sleep, type Theme, type ViewportName } from './lib.ts';

const PATH = arg('path') ?? '/';
const AT = (arg('at') ?? '0').split(',');
const OUT = arg('out') ?? 'qa-output/shots';

type Variant = { viewport: ViewportName; theme: Theme; reduced?: boolean; nojs?: boolean };
const VARIANTS: Variant[] = [
  { viewport: 'desktop', theme: 'papel' },
  { viewport: 'desktop', theme: 'sumi' },
  { viewport: 'mobile', theme: 'papel' },
  { viewport: 'mobile', theme: 'sumi' },
  { viewport: 'desktop', theme: 'papel', reduced: true },
  { viewport: 'mobile', theme: 'sumi', reduced: true },
  { viewport: 'desktop', theme: 'papel', nojs: true },
  { viewport: 'mobile', theme: 'papel', nojs: true },
];

const slug = (s: string) => s.replace(/^#/, '').replace(/[^\w.-]+/g, '-') || 'top';

await run('qa:shots', async ({ url, browser }) => {
  mkdirSync(OUT, { recursive: true });
  for (const v of VARIANTS) {
    const page = await browser.newPage();
    await page.viewport(v.viewport);
    await page.media({ theme: v.theme, reduced: v.reduced ?? false });
    if (v.nojs) await page.send('Emulation.setScriptExecutionDisabled', { value: true });
    await page.goto(url + PATH);
    for (const at of AT) {
      // Con JS desactivado, Runtime.evaluate sigue funcionando (solo se bloquean los scripts de la página).
      await page.evaluate(
        at.startsWith('#')
          ? `document.querySelector(${JSON.stringify(at)})?.scrollIntoView({ behavior: 'instant' })`
          : `scrollTo({ top: Math.round(${Number(at)} * (document.documentElement.scrollHeight - innerHeight)), behavior: 'instant' })`,
      );
      await sleep(300);
      const name = `${slug(PATH)}-${v.viewport}-${v.theme}${v.reduced ? '-reduced' : ''}${v.nojs ? '-nojs' : ''}-${slug(at)}.png`;
      writeFileSync(join(OUT, name), await page.screenshot());
      console.log(`  ${join(OUT, name)}`);
    }
    await page.close();
  }
});
