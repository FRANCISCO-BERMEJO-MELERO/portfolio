// Motor de scroll: progreso 0 → 1 de la escena expuesto como --p.
// Solo lee scrollY en cada frame (las medidas se cachean al redimensionar),
// así que no fuerza layouts mientras se hace scroll.

export type ScrollProgress = {
  /** Fija --p a mano (modo debug). `null` devuelve el control al scroll. */
  override(p: number | null): void;
  readonly value: number;
};

export function startScrollProgress(scene: HTMLElement, stage: HTMLElement): ScrollProgress {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let top = 0;
  let range = 1;
  let value = -1;
  let manual: number | null = null;
  let queued = false;

  const measure = () => {
    top = scene.getBoundingClientRect().top + scrollY;
    range = Math.max(1, scene.offsetHeight - stage.offsetHeight);
  };

  const write = (p: number) => {
    if (p === value) return;
    value = p;
    scene.style.setProperty('--p', p.toFixed(4));
  };

  const update = () => {
    queued = false;
    if (manual !== null) return write(manual);
    if (reduced.matches) return write(1);
    write(Math.min(1, Math.max(0, (scrollY - top) / range)));
  };

  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };

  new ResizeObserver(() => {
    measure();
    queue();
  }).observe(scene);
  addEventListener('scroll', queue, { passive: true });
  reduced.addEventListener('change', queue);
  measure();
  update();

  return {
    override(p) {
      manual = p;
      update();
    },
    get value() {
      return value;
    },
  };
}
