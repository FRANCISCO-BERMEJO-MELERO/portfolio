// Medidas de las maquetas (reference/) que debe reproducir la web. pnpm qa:specs las compara con
// los estilos calculados de los elementos marcados con data-qa: números en px con ±1 px de margen,
// cadenas exactas (los colores, exactos) y RegExp para lo que admite variantes (familias).
// Los colores se escriben como token y se resuelven en cada modo (plan §1.5).
import type { Theme, ViewportName } from './lib.ts';

export const TOKENS = {
  papel: {
    bg: '#f3efe6',
    surface: '#ebe5d8',
    text: '#1b1a17',
    'text-2': '#6b665c',
    line: '#d6cfbf',
    accent: '#e2482a',
    'accent-solid': '#c0391d',
    'on-accent': '#f3efe6',
    'accent-text': '#c0391d',
    'accent-text-surface': '#b4351b',
    'term-bg': '#1b1a17',
  },
  sumi: {
    bg: '#15130f',
    surface: '#1e1b16',
    text: '#ece6d8',
    'text-2': '#8c8577',
    line: '#2e2a23',
    accent: '#f0573a',
    'accent-solid': '#f0573a',
    'on-accent': '#15130f',
    'accent-text': '#f0573a',
    'accent-text-surface': '#f0573a',
    'term-bg': '#0c0b08',
  },
} as const;
export type Token = keyof (typeof TOKENS)['papel'];

/** Valor esperado: número (px, ±1), cadena exacta, RegExp o un token de color. */
export type Expected = number | string | RegExp | { token: Token };

export type Spec = {
  /** Maqueta de la que sale la medida. */
  ref: string;
  viewport: ViewportName;
  path: string;
  /** Selector del elemento (siempre un data-qa). Si hay varios, se mide el primero. */
  qa: string;
  /** Filtro añadido al selector, p. ej. ':not([aria-current])'. */
  state?: string;
  /** Tamaño de la caja sin transformar (offsetWidth / offsetHeight, o el rect en SVG). */
  box?: { width?: number; height?: number };
  /** Posición en la ventana al cargar, sin scroll (getBoundingClientRect: incluye el giro). */
  rect?: { x?: number; y?: number };
  /** Medir con prefers-reduced-motion (el sello de la nav, que sin ello está en tránsito sobre el hero). */
  reduced?: boolean;
  css?: Record<string, Expected>;
  /** Solo en este modo (por defecto, en los dos). */
  theme?: Theme;
};

const t = (token: Token) => ({ token });
const ROTATE_3 = 'matrix(0.99863, -0.052336, 0.052336, 0.99863, 0, 0)';
const ROTATE_4 = 'matrix(0.997564, -0.0697565, 0.0697565, 0.997564, 0, 0)';
const SERIF = /^"?Shippori Mincho"?/;
const SANS = /^"?Inter"?/;

export const SPECS: Spec[] = [
  // --- Navegación · escritorio (d-01; el sello, de d-07, decisión F4) ---
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'nav-header',
    css: {
      position: 'sticky',
      top: 0,
      'background-color': t('bg'),
      'border-bottom-width': 1,
      'border-bottom-style': 'solid',
      'border-bottom-color': t('line'),
    },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'nav',
    box: { width: 1440, height: 88 },
    css: { 'padding-left': 96, 'padding-right': 96, 'column-gap': 48, 'align-items': 'center' },
  },
  { ref: 'd-01', viewport: 'desktop', path: '/', qa: 'nav-home', box: { width: 44, height: 44 } },
  {
    ref: 'd-07',
    viewport: 'desktop',
    path: '/',
    qa: 'nav-hanko',
    reduced: true,
    box: { width: 44, height: 44 },
    css: {
      'background-color': t('accent'),
      color: t('on-accent'),
      'font-family': SERIF,
      'font-size': 19,
      'font-weight': '600',
      'border-radius': 3,
      'outline-width': 1.5,
      'outline-style': 'solid',
      'outline-color': t('on-accent'),
      'outline-offset': -5,
      transform: ROTATE_3,
    },
  },
  { ref: 'd-01', viewport: 'desktop', path: '/', qa: 'nav-list', css: { 'column-gap': 28, 'font-size': 16 } },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'nav-link',
    state: ':not([aria-current])',
    css: {
      color: t('text-2'),
      'font-family': SANS,
      'font-size': 16,
      'padding-top': 12,
      'padding-bottom': 12,
      'text-decoration-line': 'none',
    },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'nav-link',
    state: '[aria-current]',
    css: { color: t('text'), 'border-bottom-width': 1, 'border-bottom-style': 'solid', 'border-bottom-color': t('text') },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'nav-tools',
    css: { 'padding-left': 32, 'border-left-width': 1, 'border-left-style': 'solid', 'border-left-color': t('line'), 'column-gap': 8 },
  },
  { ref: 'd-01', viewport: 'desktop', path: '/', qa: 'theme-toggle', box: { width: 44, height: 44 }, css: { color: t('text') } },
  { ref: 'd-01', viewport: 'desktop', path: '/', qa: 'theme-icon', box: { width: 22, height: 22 } },

  // --- Encabezado de sección · escritorio (d-04, d-07, d-09, d-11; 一 Inicio en d-01) ---
  {
    ref: 'd-07',
    viewport: 'desktop',
    path: '/',
    qa: 'heading',
    css: {
      'font-family': SANS,
      'font-size': 15,
      'font-weight': '500',
      'letter-spacing': 2.1,
      'text-transform': 'uppercase',
      color: t('text-2'),
      'column-gap': 14,
      'align-items': 'baseline',
    },
  },
  {
    ref: 'd-07',
    viewport: 'desktop',
    path: '/',
    qa: 'heading-kanji',
    css: { 'font-family': SERIF, 'font-size': 30, 'font-weight': '400', color: t('accent-text') },
  },

  // --- Navegación · móvil (m-01; el sello, de m-06, decisiones F2 y F4) ---
  {
    ref: 'm-01',
    viewport: 'mobile',
    path: '/',
    qa: 'nav-header',
    css: { position: 'sticky', top: 0, 'background-color': t('bg'), 'border-bottom-width': 1, 'border-bottom-color': t('line') },
  },
  {
    ref: 'm-01',
    viewport: 'mobile',
    path: '/',
    qa: 'nav',
    box: { width: 390, height: 64 },
    css: { 'padding-left': 24, 'padding-right': 12, 'column-gap': 4 },
  },
  {
    ref: 'm-06',
    viewport: 'mobile',
    path: '/',
    qa: 'nav-hanko',
    reduced: true,
    box: { width: 36, height: 36 },
    css: {
      'background-color': t('accent'),
      color: t('on-accent'),
      'font-size': 16,
      'border-radius': 3,
      'outline-width': 1.5,
      'outline-color': t('on-accent'),
      'outline-offset': -4,
      transform: ROTATE_3,
    },
  },
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'theme-toggle', box: { width: 44, height: 44 }, css: { color: t('text') } },
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'theme-icon', box: { width: 22, height: 22 } },

  // --- Encabezado de sección · móvil (m-03, m-06, m-08, m-10) ---
  {
    ref: 'm-06',
    viewport: 'mobile',
    path: '/',
    qa: 'heading',
    css: {
      'font-size': 14,
      'font-weight': '500',
      'letter-spacing': 1.96,
      'text-transform': 'uppercase',
      color: t('text-2'),
      'column-gap': 12,
    },
  },
  {
    ref: 'm-06',
    viewport: 'mobile',
    path: '/',
    qa: 'heading-kanji',
    css: { 'font-family': SERIF, 'font-size': 26, 'font-weight': '400', color: t('accent-text') },
  },

  // --- Inicio · escritorio (d-01; colores de d-03 en sumi). Posiciones medidas en Chrome sobre la
  //     maqueta con las WOFF2 de la web (FTD fase 2). Botón principal: --accent-solid en vez del
  //     #e2482a de la maqueta (F9). ---
  { ref: 'd-01', viewport: 'desktop', path: '/', qa: 'heading', box: { height: 44 }, rect: { x: 96, y: 153 } },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero',
    box: { width: 1440, height: 815 },
    rect: { x: 0, y: 89 },
    css: { 'padding-top': 64, 'padding-bottom': 40, 'padding-left': 96, 'padding-right': 96 },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero-title',
    box: { width: 704, height: 298 },
    rect: { x: 96, y: 221 },
    css: { 'font-family': SERIF, 'font-size': 152, 'font-weight': '600', 'line-height': 148.96, 'letter-spacing': -3.8, color: t('text') },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero-role',
    rect: { x: 96, y: 546.9 },
    css: { 'font-family': SANS, 'font-size': 26, 'line-height': 37.7, color: t('text-2') },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero-phrase',
    box: { width: 680 },
    rect: { x: 96, y: 602.6 },
    css: { 'font-family': SERIF, 'font-size': 40, 'line-height': 54, 'max-width': 680, color: t('text') },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero-cta',
    box: { width: 199, height: 60 },
    rect: { x: 96, y: 696.6 },
    css: {
      'padding-left': 32,
      'padding-right': 32,
      'font-size': 20,
      'font-weight': '600',
      'background-color': t('accent-solid'),
      color: t('on-accent'),
      'border-top-left-radius': 2,
      'text-decoration-line': 'none',
    },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero-cta-alt',
    box: { width: 153, height: 60 },
    rect: { x: 310.9, y: 696.6 },
    css: { 'font-size': 20, 'font-weight': '500', color: t('text'), 'border-top-width': 1, 'border-top-color': t('text'), 'border-top-left-radius': 2 },
  },
  { ref: 'd-01', viewport: 'desktop', path: '/', qa: 'hero-enso', box: { width: 480, height: 484 }, rect: { x: 864, y: 212.8 }, css: { color: t('text') } },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero-hanko',
    box: { width: 104, height: 104 },
    rect: { x: 1217.3, y: 579.6 },
    css: {
      'background-color': t('accent'),
      color: t('on-accent'),
      'font-family': SERIF,
      'font-size': 46,
      'font-weight': '600',
      'border-top-left-radius': 5,
      'outline-width': 2,
      'outline-color': t('on-accent'),
      'outline-offset': -10,
      transform: ROTATE_4,
    },
  },
  {
    ref: 'd-01',
    viewport: 'desktop',
    path: '/',
    qa: 'hero-foot',
    box: { width: 1248, height: 67 },
    rect: { x: 96, y: 796.6 },
    css: { 'padding-top': 22, 'border-top-width': 1, 'border-top-color': t('line'), 'font-size': 17, color: t('text-2') },
  },
  { ref: 'd-01', viewport: 'desktop', path: '/', qa: 'hero-next', box: { height: 44 }, rect: { x: 1192.2 }, css: { color: t('accent-text') } },

  // --- Inicio · móvil (m-01; colores de m-02 en sumi) ---
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'heading', box: { height: 37 }, rect: { x: 24, y: 101 } },
  {
    ref: 'm-01',
    viewport: 'mobile',
    path: '/',
    qa: 'hero',
    box: { width: 390, height: 779 },
    rect: { x: 0, y: 65 },
    css: { 'padding-top': 28, 'padding-bottom': 20, 'padding-left': 24, 'padding-right': 24 },
  },
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'hero-enso', box: { width: 168, height: 168 }, rect: { x: 198, y: 93 } },
  {
    ref: 'm-01',
    viewport: 'mobile',
    path: '/',
    qa: 'hero-hanko',
    box: { width: 50, height: 50 },
    rect: { x: 314.3, y: 209.3 },
    css: {
      'background-color': t('accent'),
      color: t('on-accent'),
      'font-size': 22,
      'border-top-left-radius': 3,
      'outline-width': 1.5,
      'outline-offset': -5,
      transform: ROTATE_4,
    },
  },
  {
    ref: 'm-01',
    viewport: 'mobile',
    path: '/',
    qa: 'hero-title',
    box: { width: 342, height: 128 },
    rect: { x: 24, y: 281 },
    css: { 'font-family': SERIF, 'font-size': 64, 'font-weight': '600', 'line-height': 64, 'letter-spacing': -1.6 },
  },
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'hero-role', rect: { y: 429 }, css: { 'font-size': 19, 'line-height': 27.55, color: t('text-2') } },
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'hero-phrase', rect: { y: 468.5 }, css: { 'font-family': SERIF, 'font-size': 28, 'line-height': 37.8 } },
  {
    ref: 'm-01',
    viewport: 'mobile',
    path: '/',
    qa: 'hero-cta',
    box: { width: 342, height: 56 },
    rect: { x: 24, y: 534.3 },
    css: { 'font-size': 19, 'font-weight': '600', 'background-color': t('accent-solid'), color: t('on-accent') },
  },
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'hero-cta-alt', box: { width: 342, height: 56 }, rect: { y: 602.3 }, css: { 'font-size': 19, 'font-weight': '500' } },
  {
    ref: 'm-01',
    viewport: 'mobile',
    path: '/',
    qa: 'hero-foot',
    box: { height: 53 },
    rect: { y: 771 },
    css: { 'padding-top': 8, 'border-top-width': 1, 'border-top-color': t('line'), 'font-size': 15, color: t('text-2') },
  },
  { ref: 'm-01', viewport: 'mobile', path: '/', qa: 'hero-next', box: { height: 44 }, rect: { x: 286.3 } },

  // --- Sobre mí · escritorio (d-04…06). Las posiciones con el escenario pegado las mide qa:about. ---
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'kaizen-kanji', box: { width: 440, height: 440 } },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'about-head', box: { width: 1248, height: 76 } },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'about-text', box: { width: 320, height: 64 }, css: { 'font-size': 20, 'line-height': 32, color: t('text') } },
  {
    ref: 'd-04',
    viewport: 'desktop',
    path: '/',
    qa: 'kaizen-row',
    box: { width: 320, height: 87 },
    css: { 'padding-top': 18, 'padding-bottom': 18, 'border-top-width': 1, 'border-top-color': t('line') },
  },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'kaizen-char', css: { 'font-family': SERIF, 'font-size': 44, 'line-height': 44 } },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'kaizen-reading', css: { 'font-size': 14, 'font-weight': '500', 'letter-spacing': 1.96, color: t('text-2') } },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'kaizen-gloss', css: { 'font-family': SERIF, 'font-size': 32 } },
  {
    ref: 'd-04',
    viewport: 'desktop',
    path: '/',
    qa: 'kaizen-result',
    box: { height: 65.5 },
    // El color (texto y filete) depende del avance del kaizen (F17): lo comprueba qa:about.
    css: { 'font-family': SERIF, 'font-size': 34, 'line-height': 42.5, 'padding-top': 22, 'border-top-width': 1 },
  },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'kaizen-text', css: { 'font-size': 18, 'line-height': 28.8, 'margin-top': 16, color: t('text-2') } },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'about-facts', box: { width: 1248, height: 82 }, css: { 'column-gap': 24 } },
  { ref: 'd-04', viewport: 'desktop', path: '/', qa: 'about-fact', css: { 'font-family': SERIF, 'font-size': 28, 'margin-top': 8 } },

  // --- Sobre mí · móvil (m-03…05) ---
  { ref: 'm-03', viewport: 'mobile', path: '/', qa: 'kaizen-kanji', box: { width: 260, height: 260 } },
  { ref: 'm-03', viewport: 'mobile', path: '/', qa: 'kaizen-row', box: { height: 260 } },
  { ref: 'm-03', viewport: 'mobile', path: '/', qa: 'kaizen-reading', css: { 'font-size': 13, 'font-weight': '500', 'letter-spacing': 1.82, color: t('text-2') } },
  { ref: 'm-03', viewport: 'mobile', path: '/', qa: 'kaizen-gloss', css: { 'font-family': SERIF, 'font-size': 22 } },
  {
    ref: 'm-03',
    viewport: 'mobile',
    path: '/',
    qa: 'kaizen-result',
    box: { width: 342, height: 54.5 },
    css: { 'font-family': SERIF, 'font-size': 30, 'line-height': 37.5, 'margin-top': 8, 'padding-top': 16, 'border-top-width': 1 },
  },
  { ref: 'm-03', viewport: 'mobile', path: '/', qa: 'kaizen-text', css: { 'font-size': 17, 'line-height': 26.35, 'margin-top': 12, color: t('text-2') } },

  // --- Proyectos · escritorio (d-07, d-08). Las posiciones con el escenario pegado las mide qa:projects. ---
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'projects-index', box: { width: 200 } },
  {
    ref: 'd-07',
    viewport: 'desktop',
    path: '/',
    qa: 'projects-link',
    state: '[aria-current]',
    box: { height: 64 },
    css: { 'font-size': 18, 'font-weight': '500', 'padding-top': 16, 'column-gap': 14, color: t('text') },
  },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'projects-link', state: ':not([aria-current])', css: { 'font-weight': '400', color: t('text-2') } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'projects-link-kanji', css: { 'font-family': SERIF, 'font-size': 22, color: t('accent-text') } },
  {
    ref: 'd-07',
    viewport: 'desktop',
    path: '/',
    qa: 'projects-deck',
    css: { 'padding-top': 20, 'border-top-width': 2, 'border-bottom-width': 2, 'border-top-color': t('text') },
  },
  {
    ref: 'd-07',
    viewport: 'desktop',
    path: '/',
    qa: 'project-panel',
    box: { width: 888, height: 595 },
    css: { 'padding-left': 36, 'padding-top': 36, 'column-gap': 40, 'background-color': t('surface'), 'border-top-color': t('line') },
  },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'tui', box: { width: 452.33 }, css: { 'background-color': t('term-bg'), 'border-top-color': t('line'), 'font-size': 15 } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'tui-bar', box: { height: 44 } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'tui-caption', box: { height: 42 }, css: { 'font-size': 14, 'font-family': SANS } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-number', box: { height: 44 }, css: { 'font-family': SERIF, 'font-size': 44, color: t('accent-text-surface') } },
  {
    ref: 'd-07',
    viewport: 'desktop',
    path: '/',
    qa: 'project-name',
    box: { width: 321.67, height: 63 },
    css: { 'font-family': SERIF, 'font-size': 60, 'font-weight': '600', 'line-height': 63, 'margin-top': 16, 'letter-spacing': -1.2 },
  },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-summary', box: { height: 57 }, css: { 'font-size': 19, 'line-height': 28.5, 'margin-top': 10, color: t('text-2') } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-problem', box: { height: 62 }, css: { 'font-size': 20, 'line-height': 31, 'margin-top': 24, color: t('text') } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-stack', box: { height: 74 }, css: { 'margin-top': 24, 'column-gap': 8, 'font-size': 15 } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-tech', box: { height: 33 }, css: { 'padding-left': 12, 'border-top-color': t('text') } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-tech-todo', css: { 'border-top-color': t('line'), color: t('text-2') } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-fact', box: { height: 33.8 }, css: { 'font-family': SERIF, 'font-size': 26, 'margin-top': 24 } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-links', css: { 'column-gap': 28, 'font-size': 18, 'font-weight': '500' } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'project-link', box: { height: 44 }, css: { color: t('accent-text-surface') } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'shoji-edge', box: { width: 96, height: 595 }, css: { 'background-color': t('surface'), 'border-top-color': t('text') } },
  { ref: 'd-07', viewport: 'desktop', path: '/', qa: 'shoji-index', box: { height: 52 }, css: { 'font-size': 28, color: t('accent-text-surface') } },

  // --- Proyectos · móvil (m-06, m-07). La pestaña inactiva va en --text-2 (F24), no con opacidad. ---
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'projects-index', box: { width: 342, height: 53 } },
  {
    ref: 'm-06',
    viewport: 'mobile',
    path: '/',
    qa: 'projects-link',
    state: '[aria-current]',
    box: { width: 52, height: 52 },
    css: { 'font-family': SERIF, 'font-size': 26, color: t('accent-text'), 'border-bottom-width': 2, 'border-bottom-color': t('text') },
  },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'projects-link', state: ':not([aria-current])', css: { color: t('text-2'), opacity: '1' } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'projects-deck', box: { width: 342 }, css: { 'margin-top': 24, 'padding-top': 14, 'border-top-width': 2, 'border-top-color': t('text') } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'project-panel', box: { width: 316, height: 597 }, css: { 'padding-top': 20, 'background-color': t('surface'), 'border-top-color': t('line') } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'project-name', box: { width: 274, height: 42 }, css: { 'font-family': SERIF, 'font-size': 40, 'line-height': 42 } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'project-summary', box: { height: 46.4 }, css: { 'font-size': 16, 'margin-top': 6, color: t('text-2') } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'tui', box: { width: 274, height: 182 }, css: { 'margin-top': 18, 'font-size': 13, 'background-color': t('term-bg') } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'tui-bar', box: { height: 34 } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'project-problem', box: { height: 54 }, css: { 'font-size': 18, 'line-height': 27, 'margin-top': 18 } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'project-tech', box: { height: 32 }, css: { 'padding-left': 10, 'font-size': 14 } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'project-fact', box: { height: 28.6 }, css: { 'font-size': 22, 'margin-top': 16 } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'project-links', css: { 'margin-top': 12, 'column-gap': 24, 'font-size': 17 } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'shoji-edge-m', box: { width: 18, height: 597 }, css: { 'border-top-color': t('text') } },
  { ref: 'm-06', viewport: 'mobile', path: '/', qa: 'projects-swipe', css: { 'margin-top': 14, 'font-size': 14, color: t('text-2') } },

  // --- Trayectoria · escritorio (d-09). Las posiciones con el escenario pegado y el encendido los mide
  // qa:journey. Al cargar la sección está en p = 0 (hitos apagados, F32); con reduced motion, encendidos. ---
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-stroke-h', box: { width: 1248, height: 60 } },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-item', box: { width: 312 }, css: { 'padding-right': 32 } },
  {
    ref: 'd-09',
    viewport: 'desktop',
    path: '/',
    qa: 'journey-year',
    box: { width: 34 },
    css: { 'font-family': SERIF, 'font-size': 34, 'line-height': 34, 'letter-spacing': 1.36, 'writing-mode': 'vertical-rl', 'text-orientation': 'upright', 'margin-bottom': 20, color: t('text-2') },
  },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-year', reduced: true, css: { color: t('text') } },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-title', css: { 'font-family': SERIF, 'font-weight': '600', 'font-size': 28, 'line-height': 32.2, color: t('text-2') } },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-title', reduced: true, css: { color: t('text') } },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-detail', css: { 'font-family': SANS, 'font-size': 17, 'line-height': 24.65, 'margin-top': 8, color: t('text-2') } },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-line', css: { 'font-size': 17, 'line-height': 26.35, 'margin-top': 16, color: t('text-2') } },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-line', reduced: true, css: { color: t('text') } },
  {
    ref: 'd-09',
    viewport: 'desktop',
    path: '/',
    qa: 'journey-dot',
    box: { width: 14, height: 14 },
    css: { 'border-top-width': 1.5, 'border-top-color': t('line'), 'background-color': t('bg') },
  },
  { ref: 'd-09', viewport: 'desktop', path: '/', qa: 'journey-dot', reduced: true, css: { 'border-top-color': t('text'), 'background-color': t('text') } },

  // --- Trayectoria · móvil (m-08) ---
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-timeline', css: { 'margin-top': 28 } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-stroke-v', box: { width: 28 } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-item', box: { width: 342, height: 200 }, css: { 'padding-left': 48 } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-year', box: { height: 29 }, css: { 'font-family': SERIF, 'font-size': 20, color: t('text-2') } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-title', css: { 'font-family': SERIF, 'font-weight': '600', 'font-size': 26, 'line-height': 29.9, 'margin-top': 4, color: t('text-2') } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-title', reduced: true, css: { color: t('text') } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-detail', css: { 'font-size': 16, 'line-height': 23.2, 'margin-top': 6, color: t('text-2') } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-line', css: { 'font-size': 16, 'line-height': 24, 'margin-top': 10, color: t('text-2') } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-line', reduced: true, css: { color: t('text') } },
  { ref: 'm-08', viewport: 'mobile', path: '/', qa: 'journey-dot', box: { width: 14, height: 14 }, css: { 'border-top-color': t('line'), 'background-color': t('bg') } },
];
