// pnpm qa:nav — sección activa (criterio 3 de la fase 1): al recorrer las seis secciones, el enlace
// correcto lleva aria-current, y solo él. Dos posiciones por sección (su comienzo bajo la nav y su
// mitad), en escritorio y móvil, y el estado tras pulsar cada enlace de la nav (escritorio).
import { open, run, sleep, type ViewportName } from './lib.ts';

await run('qa:nav', async ({ url, browser, fail }) => {
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    const page = await open(browser, `${url}/`, { viewport, theme: 'papel' });
    const ids = await page.evaluate<string[]>("[...document.querySelectorAll('main > section[id]')].map((s) => s.id)");
    if (ids.length !== 6) fail(`${viewport}: hay ${ids.length} secciones, no 6`);
    let ok = 0;
    let total = 0;
    for (const id of ids) {
      for (const where of ['comienzo', 'mitad'] as const) {
        const current = await page.evaluate<string[]>(`(async () => {
          const s = document.getElementById(${JSON.stringify(id)});
          const navH = document.querySelector('[data-qa=nav-header]').offsetHeight;
          const top = s.getBoundingClientRect().top + scrollY - navH;
          const y = ${where === 'mitad'} ? top + s.offsetHeight / 2 : top;
          scrollTo({ top: Math.round(y), behavior: 'instant' });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          // En móvil la lista está oculta hasta que llegue el menú (fase 8), pero se marca igual.
          return [...document.querySelectorAll('[data-nav-link][aria-current]')].map((a) => a.getAttribute('href'));
        })()`);
        total++;
        const unique = [...new Set(current)];
        const good = unique.length === 1 && unique[0] === `#${id}`;
        if (good) ok++;
        else fail(`${viewport} · ${id} (${where}): activo ${JSON.stringify(current)}`);
      }
    }
    console.log(`  ${viewport}: ${ok}/${total} posiciones con la sección correcta`);

    if (viewport === 'desktop') {
      let clicks = 0;
      for (const id of ids) {
        await page.evaluate(`document.querySelector('[data-nav-link][href="#${id}"]').click()`);
        await sleep(150);
        const cur = await page.evaluate<string | null>("document.querySelector('[data-nav-link][aria-current]')?.getAttribute('href') ?? null");
        if (cur === `#${id}`) clicks++;
        else fail(`clic en #${id}: activo ${cur}`);
      }
      console.log(`  desktop: ${clicks}/${ids.length} enlaces marcan su sección al pulsarlos`);
    }
    await page.close();
  }
});
