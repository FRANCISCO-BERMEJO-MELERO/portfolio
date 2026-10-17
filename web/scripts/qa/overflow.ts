// pnpm qa:overflow — sin scroll horizontal a 360, 390, 768, 1024, 1280 y 1440 px de ancho.
import { arg, run } from './lib.ts';

const WIDTHS = [360, 390, 768, 1024, 1280, 1440];
const PATHS = (arg('paths') ?? '/').split(',');

await run('qa:overflow', async ({ url, browser, fail }) => {
  const page = await browser.newPage();
  for (const path of PATHS) {
    for (const width of WIDTHS) {
      const mobile = width < 960;
      await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile });
      await page.goto(url + path);
      const r = await page.evaluate<{ scroll: number; client: number; culprits: string[] }>(`(() => {
        const client = document.documentElement.clientWidth;
        const culprits = [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > client + 0.5)
          .slice(0, 5)
          .map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''));
        return { scroll: document.documentElement.scrollWidth, client, culprits };
      })()`);
      const ok = r.scroll <= r.client;
      console.log(`  ${path} ${width}px: scrollWidth ${r.scroll} / ${r.client} ${ok ? 'ok' : 'DESBORDA'}`);
      if (!ok) fail(`${path} ${width}px: ${r.scroll - r.client}px de scroll horizontal (${r.culprits.join(', ')})`);
    }
  }
});
