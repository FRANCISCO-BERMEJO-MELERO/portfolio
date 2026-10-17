// pnpm qa:shots — capturas de la ventana en 1440 × 900 y 390 × 844 @3x: papel, sumi,
// reduced motion y sin JS, en los estados de scroll pedidos.
//   --path /            página
//   --at 0,200px,#x     estados: fracción del scroll total (0–1), píxeles de scroll (200px), un #ancla
//                       o escena:0.5 (fracción del recorrido del escenario de [data-<escena>-scene],
//                       ya pegado: kaizen:0.5, projects:0.3)
//   --out dir           carpeta de salida (por defecto qa-output/shots)
//   --wait ms           espera tras cargar, antes del primer estado (por defecto 1800: la carga
//                       del hero, ensō + sello, dura 1,6 s)
//   --widths 768,1024   anchos extra (papel; < 960 con el diseño móvil) para validar la escala intermedia;
//                       también ancho × alto (1280x720, 375x667)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { arg, run, sleep, type Theme, type ViewportName } from './lib.ts';

const PATH = arg('path') ?? '/';
const AT = (arg('at') ?? '0').split(',');
const OUT = arg('out') ?? 'qa-output/shots';
const WAIT = Number(arg('wait') ?? 1800);
const WIDTHS = (arg('widths') ?? '')
  .split(',')
  .filter(Boolean)
  .map((w) => w.split('x').map(Number) as [number, number?]);

type Variant = { viewport: ViewportName; theme: Theme; reduced?: boolean; nojs?: boolean; width?: number; height?: number };
const VARIANTS: Variant[] = [
  { viewport: 'desktop', theme: 'papel' },
  { viewport: 'desktop', theme: 'sumi' },
  { viewport: 'mobile', theme: 'papel' },
  { viewport: 'mobile', theme: 'sumi' },
  { viewport: 'desktop', theme: 'papel', reduced: true },
  { viewport: 'mobile', theme: 'sumi', reduced: true },
  { viewport: 'desktop', theme: 'papel', nojs: true },
  { viewport: 'mobile', theme: 'papel', nojs: true },
  // Tamaños sin maqueta: en vertical (768 × 1024) y en horizontal (1024 × 768).
  ...WIDTHS.map(([width, height]): Variant => ({ viewport: width < 960 ? 'mobile' : 'desktop', theme: 'papel', width, ...(height ? { height } : {}) })),
];

const slug = (s: string) => s.replace(/^[#/]+|\/+$/g, '').replace(/[^\w.-]+/g, '-') || 'inicio';

await run('qa:shots', async ({ url, browser }) => {
  mkdirSync(OUT, { recursive: true });
  for (const v of VARIANTS) {
    const page = await browser.newPage();
    await page.viewport(v.viewport);
    if (v.width) {
      const height = v.height ?? (v.width < 960 ? Math.round((v.width * 4) / 3) : Math.round((v.width * 3) / 4));
      await page.send('Emulation.setDeviceMetricsOverride', { width: v.width, height, deviceScaleFactor: 1, mobile: v.width < 960 });
    }
    await page.media({ theme: v.theme, reduced: v.reduced ?? false });
    if (v.nojs) await page.send('Emulation.setScriptExecutionDisabled', { value: true });
    // Sin JS no corren requestAnimationFrame ni las promesas de la página: solo se espera a la carga.
    await page.goto(url + PATH, { settle: !v.nojs });
    await sleep(v.nojs ? 500 : WAIT);
    for (const at of AT) {
      // Con JS desactivado, Runtime.evaluate sigue funcionando (solo se bloquean los scripts de la página).
      await page.evaluate(
        /^[a-z]+:/.test(at)
          ? `(() => { const s = document.querySelector('[data-${at.split(':')[0]}-scene]'); const st = s.querySelector('[data-stage]'); scrollTo({ top: Math.floor(s.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(st).top) || 0) + ${Number(at.split(':')[1])} * (s.offsetHeight - st.offsetHeight)), behavior: 'instant' }); })()`
          : at.startsWith('#')
          ? `document.querySelector(${JSON.stringify(at)})?.scrollIntoView({ behavior: 'instant' })`
          : at.endsWith('px')
            ? `scrollTo({ top: ${Number.parseFloat(at)}, behavior: 'instant' })`
            : `scrollTo({ top: Math.round(${Number(at)} * (document.documentElement.scrollHeight - innerHeight)), behavior: 'instant' })`,
      );
      await sleep(300);
      const name = `${slug(PATH)}-${v.width ? `${v.width}${v.height ? `x${v.height}` : ''}` : v.viewport}-${v.theme}${v.reduced ? '-reduced' : ''}${v.nojs ? '-nojs' : ''}-${slug(at)}.png`;
      writeFileSync(join(OUT, name), await page.screenshot());
      console.log(`  ${join(OUT, name)}`);
    }
    await page.close();
  }
});
