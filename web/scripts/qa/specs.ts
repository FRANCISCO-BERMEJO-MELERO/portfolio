// pnpm qa:specs — compara estilos calculados con las medidas de las maquetas (reference-specs.ts),
// en escritorio y móvil, en papel y sumi: tamaños ±1 px, colores exactos.
import { open, run, THEMES, type ViewportName } from './lib.ts';
import { SPECS, TOKENS, type Expected } from './reference-specs.ts';

const hexToRgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

await run('qa:specs', async ({ url, browser, fail }) => {
  let checked = 0;
  const viewports = [...new Set(SPECS.map((s) => s.viewport))] as ViewportName[];
  for (const viewport of viewports) {
    for (const theme of THEMES) {
      for (const path of new Set(SPECS.filter((s) => s.viewport === viewport).map((s) => s.path))) {
        const page = await open(browser, url + path, { viewport, theme });
        for (const spec of SPECS.filter((s) => s.viewport === viewport && s.path === path && (!s.theme || s.theme === theme))) {
          const where = `${spec.ref} ${viewport} ${theme} [data-qa=${spec.qa}]`;
          const props = Object.keys(spec.css ?? {});
          const got = await page.evaluate<{ css: Record<string, string>; width: number; height: number } | null>(`(() => {
            const el = document.querySelector('[data-qa="${spec.qa}"]');
            if (!el) return null;
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            const isHtml = el instanceof HTMLElement;
            return {
              css: Object.fromEntries(${JSON.stringify(props)}.map((p) => [p, cs.getPropertyValue(p)])),
              width: isHtml ? el.offsetWidth : r.width,
              height: isHtml ? el.offsetHeight : r.height,
            };
          })()`);
          if (!got) {
            fail(`${where}: no existe`);
            continue;
          }
          const check = (name: string, actual: string | number, expected: Expected) => {
            checked++;
            let ok: boolean;
            let want: string;
            if (typeof expected === 'number') {
              ok = Math.abs(Number.parseFloat(String(actual)) - expected) <= 1;
              want = `${expected}px ±1`;
            } else if (expected instanceof RegExp) {
              ok = expected.test(String(actual));
              want = String(expected);
            } else if (typeof expected === 'object') {
              want = hexToRgb(TOKENS[theme][expected.token]);
              ok = actual === want;
              want += ` (--${expected.token})`;
            } else {
              ok = actual === expected;
              want = expected;
            }
            if (!ok) fail(`${where} ${name}: ${actual} ≠ ${want}`);
          };
          if (spec.box?.width !== undefined) check('ancho', got.width, spec.box.width);
          if (spec.box?.height !== undefined) check('alto', got.height, spec.box.height);
          for (const [prop, expected] of Object.entries(spec.css ?? {})) check(prop, got.css[prop]!, expected);
        }
        await page.close();
      }
    }
  }
  console.log(`  ${checked} medidas comprobadas contra las maquetas`);
});
