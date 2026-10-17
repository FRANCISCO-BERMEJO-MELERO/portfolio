// Proyectos (fase 4): índice ↔ panel visible, anclas (#chainview…) y foco del teclado, en los tres
// modos de Projects.astro:
// - Escenario: el índice sigue el tramo (evento «scenestep» del motor). Un enlace o un #hash lleva
//   al centro del tramo de su panel, donde está quieto y entero.
// - Carrusel: el índice sigue al panel que ocupa el carrusel (IntersectionObserver, no scrollend);
//   un enlace desliza el carrusel hasta su panel, sin mover la página.
// - Apilado: el índice sigue al panel que cruza una franja de la ventana; los enlaces, nativos.
// Si el foco del teclado entra en un panel que no se ve, se lleva ese panel a la vista.
import { getScene } from './scroll.ts';

type Mode = 'sticky' | 'carousel' | 'stack';

// Medio tramo de entrada de cada panel (--h en Projects.astro): fuera de [k/n + H, (k+1)/n − H]
// el panel k se está moviendo o no se ve.
const H = 0.06;

const scene = document.querySelector<HTMLElement>('[data-projects-scene]');
if (scene) start(scene);

function start(scene: HTMLElement) {
  const stage = scene.querySelector<HTMLElement>('[data-stage]')!;
  const deck = scene.querySelector<HTMLElement>('[data-deck]')!;
  const track = scene.querySelector<HTMLElement>('[data-track]')!;
  const panels = [...scene.querySelectorAll<HTMLElement>('[data-project-panel]')];
  const links = [...scene.querySelectorAll<HTMLAnchorElement>('[data-project-link]')];
  const ids = panels.map((p) => p.id);
  const n = panels.length;

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const sticky = matchMedia('(min-width: 960px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
  const carousel = matchMedia('(max-width: 959px) and (prefers-reduced-motion: no-preference)');
  const mode = (): Mode => (sticky.matches ? 'sticky' : carousel.matches ? 'carousel' : 'stack');

  function setCurrent(k: number) {
    links.forEach((a, i) => (i === k ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    deck.toggleAttribute('data-last', k === n - 1);
  }

  /** Desplazamiento del carrusel con el panel k en el borde izquierdo. */
  const slideTo = (k: number) => panels[k]!.offsetLeft - panels[0]!.offsetLeft;

  /** Lleva el panel k a la vista. `reveal`: en el carrusel, trae también la sección (para los #hash). */
  function go(k: number, behavior: ScrollBehavior, reveal = false) {
    switch (mode()) {
      case 'sticky': {
        const top = scene.getBoundingClientRect().top + scrollY - (Number.parseFloat(getComputedStyle(stage).top) || 0);
        const span = scene.offsetHeight - stage.offsetHeight;
        scrollTo({ top: Math.round(top + ((k + 0.5) / n) * span), behavior });
        break;
      }
      case 'carousel':
        if (reveal) scene.closest('section')?.scrollIntoView({ behavior, block: 'start' });
        track.scrollTo({ left: slideTo(k), behavior });
        break;
      case 'stack':
        panels[k]!.scrollIntoView({ behavior, block: 'start' });
    }
  }

  /** ¿Está el panel k quieto y entero en el escenario? */
  function settled(k: number) {
    const p = getScene(scene)?.value ?? 0;
    return (k === 0 || p >= k / n + H) && (k === n - 1 || p <= (k + 1) / n - H);
  }

  const smooth = (): ScrollBehavior => (motion.matches ? 'smooth' : 'instant');

  // Escenario: el paso del motor.
  scene.addEventListener('scenestep', (e) => {
    if (mode() === 'sticky') setCurrent((e as CustomEvent<number>).detail);
  });

  // Carrusel: el panel que ocupa al menos el 60 % del carrusel.
  const inCarousel = new IntersectionObserver(
    (records) => {
      if (mode() !== 'carousel') return;
      for (const r of records) if (r.isIntersecting) setCurrent(panels.indexOf(r.target as HTMLElement));
    },
    { root: track, threshold: 0.6 },
  );

  // Apilado: el panel que cruza la franja entre el 35 % y el 40 % de la ventana.
  const inPage = new IntersectionObserver(
    (records) => {
      if (mode() !== 'stack') return;
      for (const r of records) if (r.isIntersecting) setCurrent(panels.indexOf(r.target as HTMLElement));
    },
    { rootMargin: '-35% 0px -60% 0px' },
  );

  for (const p of panels) {
    inCarousel.observe(p);
    inPage.observe(p);
  }

  // Al cambiar de modo (girar el móvil, redimensionar), el índice se recalcula en el nuevo.
  function sync() {
    if (mode() === 'sticky') setCurrent(Number(scene.dataset['step'] ?? 0));
    else if (mode() === 'carousel') setCurrent(Math.min(n - 1, Math.round(track.scrollLeft / Math.max(1, slideTo(1)))));
  }
  sticky.addEventListener('change', sync);
  carousel.addEventListener('change', sync);
  sync();

  // Enlaces a un panel (índice, y los enlaces pendientes de cada panel): al tramo o al carrusel.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const k = a ? ids.indexOf(a.hash.slice(1)) : -1;
    if (k < 0) return;
    e.preventDefault();
    if (location.hash !== a!.hash) history.pushState(null, '', a!.hash);
    go(k, smooth());
  });

  // #hash al cargar y al navegar por el historial: corrige el salto nativo del navegador, que lleva
  // al panel donde está en ese momento (en el escenario, quizá fuera de la vista).
  const fromHash = () => ids.indexOf(decodeURIComponent(location.hash.slice(1)));
  addEventListener('hashchange', () => {
    const k = fromHash();
    if (k >= 0) go(k, 'instant', true);
  });
  if (fromHash() >= 0) {
    const ready = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }));
    void Promise.all([ready, document.fonts.ready]).then(() =>
      requestAnimationFrame(() => {
        const k = fromHash();
        if (k >= 0) go(k, 'instant', true);
      }),
    );
  }

  // Foco del teclado en un panel que no se ve: a su tramo (escenario) o a su sitio (carrusel).
  track.addEventListener('focusin', (e) => {
    const k = panels.findIndex((p) => p.contains(e.target as Node));
    if (k < 0) return;
    const m = mode();
    if (m === 'sticky' && !settled(k)) go(k, 'instant');
    if (m === 'carousel' && track.scrollLeft !== slideTo(k)) track.scrollTo({ left: slideTo(k), behavior: 'instant' });
  });
}
