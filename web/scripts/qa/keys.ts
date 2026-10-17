// pnpm qa:keys — teclado (D5): recorre la página con Tab en escritorio y móvil y comprueba que
// cada elemento que recibe el foco tiene foco visible y un área pulsable ≥ 44 × 44 px
// (el punto central y las cuatro esquinas de un cuadrado de 44 px, a 1 px del borde, lo «tocan» a él).
import { arg, open, run, THEMES, type ViewportName } from './lib.ts';

const PATHS = (arg('paths') ?? '/').split(',');
const MAX_TABS = 200;

type Stop = { label: string; seen: boolean; outline: string; hits: boolean[]; inView: boolean } | null;

await run('qa:keys', async ({ url, browser, fail }) => {
  for (const path of PATHS) {
    for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
      for (const theme of THEMES) {
        const page = await open(browser, url + path, { viewport, theme });
        const stops: string[] = [];
        for (let i = 0; i < MAX_TABS; i++) {
          await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
          await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
          const s = await page.evaluate<Stop>(`(async () => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            // La vuelta se detecta por elemento (dos enlaces pueden llamarse igual: «Contacto»).
            const seen = el.hasAttribute('data-qa-tab');
            el.setAttribute('data-qa-tab', '');
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            // 1 px dentro del cuadrado de 44: en el borde exacto, el redondeo subpíxel de Chrome decide al azar.
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2, h = 21;
            const points = [[cx, cy], [cx - h, cy - h], [cx + h, cy - h], [cx - h, cy + h], [cx + h, cy + h]];
            const hits = points.map(([x, y]) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); });
            const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\\s+/g, ' ').slice(0, 40);
            return { label: el.tagName.toLowerCase() + ' «' + label + '»', seen, outline: cs.outlineStyle + ' ' + cs.outlineWidth, hits, inView: r.bottom > 0 && r.top < innerHeight };
          })()`);
          if (!s) break;
          if (s.seen) break;
          stops.push(s.label);
          const where = `${path} ${viewport} ${theme} · ${s.label}`;
          const [style, width] = s.outline.split(' ');
          if (style === 'none' || Number.parseFloat(width!) < 2) fail(`${where}: sin foco visible (${s.outline})`);
          if (!s.inView) fail(`${where}: recibe el foco fuera de la ventana`);
          if (s.hits.some((h) => !h)) fail(`${where}: área pulsable < 44 × 44 (${s.hits.map((h) => (h ? '✓' : '✗')).join('')})`);
        }
        console.log(`  ${path} ${viewport} ${theme}: ${stops.length} paradas de Tab — ${stops.join(' → ')}`);
        if (!stops.length) fail(`${path} ${viewport} ${theme}: nada recibe el foco`);
        await page.close();
      }
    }
  }
});
