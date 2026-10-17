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
    'on-accent': '#f3efe6',
    'accent-text': '#c0391d',
  },
  sumi: {
    bg: '#15130f',
    surface: '#1e1b16',
    text: '#ece6d8',
    'text-2': '#8c8577',
    line: '#2e2a23',
    accent: '#f0573a',
    'on-accent': '#15130f',
    'accent-text': '#f0573a',
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
  css?: Record<string, Expected>;
  /** Solo en este modo (por defecto, en los dos). */
  theme?: Theme;
};

const t = (token: Token) => ({ token });
const ROTATE_3 = 'matrix(0.99863, -0.052336, 0.052336, 0.99863, 0, 0)';
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
];
