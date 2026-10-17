// Modo papel / sumi (plan §1.6). El script en línea del <head> ya ha puesto data-theme antes del
// primer pintado; aquí se sincroniza el botón, se recuerda la elección y, sin elección guardada,
// se sigue al sistema en vivo.
type Theme = 'papel' | 'sumi';

const KEY = 'theme';
const root = document.documentElement;
const system = matchMedia('(prefers-color-scheme: dark)');
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'papel' || t === 'sumi' ? t : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  root.dataset['theme'] = theme;
  // La barra del navegador toma el fondo del modo.
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  for (const meta of document.querySelectorAll('meta[data-theme-color]')) meta.setAttribute('content', bg);
  for (const b of buttons) b.setAttribute('aria-label', b.dataset[theme === 'papel' ? 'labelPapel' : 'labelSumi'] ?? '');
}

const current = (): Theme => (root.dataset['theme'] === 'sumi' ? 'sumi' : 'papel');

for (const b of buttons) {
  b.addEventListener('click', () => {
    const next: Theme = current() === 'sumi' ? 'papel' : 'sumi';
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    apply(next);
  });
}

system.addEventListener('change', () => {
  if (!stored()) apply(system.matches ? 'sumi' : 'papel');
});

apply(current());
