// Tránsito del sello hero → nav (C3, F10). Mide el sitio del sello en el hero, su hueco en la nav y
// el paso del hero, y publica en el sello que viaja las variables con las que Nav.astro calcula su
// posición, escala y letra para cada p. En el scroll no hace nada: el motor escribe --p y el CSS
// interpola. Mide al cargar, al cambiar el layout o la ventana y cuando cargan las fuentes.
//
// Recorrido: dos tramos lineales en p que pasan por d-02 (decisión F10). En d-02 (1440 × 900, hero
// subido 200 px) el centro del sello está en (858, 140): el 35,92 % del camino en x y el 83,76 % en y
// desde su sitio en d-01, (1272,8, 635,1), hasta el hueco de la nav, (118, 44). En cualquier tamaño se
// usan esas fracciones, a 200 px de scroll. El tamaño en d-02 está en los tokens (--hanko-knot-*).
import './scroll.ts';

export const KNOT = { scroll: 200, x: 0.3592, y: 0.8376 } as const;

const root = document.documentElement;
const flight = document.querySelector<HTMLElement>('[data-hanko-flight]');
const origin = document.querySelector<HTMLElement>('[data-hanko-origin]');
const hero = flight?.dataset['sceneTrack'] ? document.querySelector<HTMLElement>(flight.dataset['sceneTrack']) : null;
const header = document.querySelector<HTMLElement>('[data-nav-header]');

const token = (name: string) => Number.parseFloat(getComputedStyle(root).getPropertyValue(name));
const round = (n: number) => Math.round(n * 1e4) / 1e4;

function measure() {
  if (!flight || !origin || !hero || !header) return;
  // El hueco: la caja del enlace, que no se transforma. El sello del hero gira sobre su centro, así
  // que el centro de su rectángulo es el suyo.
  const slot = flight.parentElement!.getBoundingClientRect();
  const o = origin.getBoundingClientRect();
  const h = hero.getBoundingClientRect();
  // Mismos bordes que la escena (data-scene-start="top nav", end="bottom nav"): p = 0 con el hero
  // pegado bajo la nav y p = 1 cuando su borde inferior pasa bajo ella.
  const from = h.top + scrollY - header.offsetHeight;
  const span = Math.max(1, h.height);
  const nx = slot.left + slot.width / 2;
  const ny = slot.top + slot.height / 2;
  const x0 = o.left + o.width / 2;
  const y0 = o.top + o.height / 2 + scrollY - from;
  const kx = x0 + KNOT.x * (nx - x0);
  const ky = y0 + KNOT.y * (ny - y0);
  const size = { hero: token('--hanko-hero-size'), knot: token('--hanko-knot-size'), nav: token('--hanko-nav-size') };
  const font = { hero: token('--hanko-hero-font'), knot: token('--hanko-knot-font'), nav: token('--hanko-nav-font') };
  const vars: Record<string, string> = {
    '--hk-k': String(round(Math.min(0.5, KNOT.scroll / span))),
    '--hk-x0': `${round(x0 - nx)}px`,
    '--hk-x1': `${round(kx - x0)}px`,
    '--hk-x2': `${round(nx - kx)}px`,
    '--hk-y0': `${round(y0 - ny)}px`,
    '--hk-y1': `${round(ky - y0)}px`,
    '--hk-y2': `${round(ny - ky)}px`,
    '--hk-s0': String(round(size.hero / size.nav)),
    '--hk-s1': String(round((size.knot - size.hero) / size.nav)),
    '--hk-s2': String(round((size.nav - size.knot) / size.nav)),
    '--hk-f0': String(round(font.hero / font.nav)),
    '--hk-fk': String(round(font.knot / font.nav)),
    '--hk-f1': '1',
  };
  for (const [name, value] of Object.entries(vars)) flight.style.setProperty(name, value);
  flight.dataset['ready'] = '';
}

measure();
new ResizeObserver(measure).observe(document.body);
addEventListener('resize', measure);
void document.fonts.ready.then(measure);
