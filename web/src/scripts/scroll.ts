// Motor de scroll compartido (plan §1.3). Cada [data-scene] recibe su progreso 0 → 1 como --p.
//
// - Modo sticky (por defecto): la escena es un contenedor alto con un [data-stage] sticky dentro;
//   p = (scrollY − top) / (alto escena − alto escenario).
// - Modo pass (data-scene="pass"): progreso mientras el elemento atraviesa la ventana, entre
//   data-scene-start (por defecto "top 100%") y data-scene-end (por defecto "bottom 0%"):
//   «<borde del elemento> <altura de la ventana>%», con borde top | center | bottom.
// - data-steps="n" escribe además data-step="k" (0 … n−1) en la escena.
// - Un solo listener de scroll y un requestAnimationFrame para todas; solo se recalculan las
//   escenas cerca de la ventana (IntersectionObserver). Las medidas se cachean (carga, cambios de
//   tamaño de la escena o de body, ventana y fuentes): en el scroll solo se lee scrollY.
// - El valor guardado es exactamente el escrito en --p (6 decimales) y solo se escribe si cambia.
// - Con prefers-reduced-motion, p = 1.

export type Scene = {
  readonly el: HTMLElement;
  /** Fija --p a mano (modo debug). `null` devuelve el control al scroll. */
  override(p: number | null): void;
  readonly value: number;
};

type Edge = { at: number; view: number };

type Entry = Scene & {
  update(): void;
  measure(): void;
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const entries = new Map<HTMLElement, Entry>();
const near = new Set<Entry>();
let viewH = innerHeight;
let queued = false;

/** «top 80%» → borde del elemento (0 arriba, 0,5 centro, 1 abajo) y punto de la ventana (0–1). */
function parseEdge(value: string | undefined, fallback: Edge): Edge {
  const m = value?.trim().match(/^(top|center|bottom)\s+(-?\d+(?:\.\d+)?)%$/);
  if (!m) return fallback;
  return { at: { top: 0, center: 0.5, bottom: 1 }[m[1] as 'top' | 'center' | 'bottom'], view: Number(m[2]) / 100 };
}

function createScene(el: HTMLElement): Entry {
  const pass = el.dataset['scene'] === 'pass';
  const stage = el.querySelector<HTMLElement>('[data-stage]');
  const steps = Number(el.dataset['steps'] ?? 0);
  const start = parseEdge(el.dataset['sceneStart'], { at: 0, view: 1 });
  const end = parseEdge(el.dataset['sceneEnd'], { at: 1, view: 0 });
  // Progreso = (scrollY − from) / span, con from y span cacheados.
  let from = 0;
  let span = 1;
  let value = -1;
  let step = -1;
  let manual: number | null = null;

  const write = (p: number) => {
    // El valor guardado es exactamente el que ve el CSS.
    const v = Math.round(p * 1e6) / 1e6;
    if (v !== value) {
      value = v;
      el.style.setProperty('--p', String(v));
    }
    if (steps > 0) {
      const k = Math.min(steps - 1, Math.floor(v * steps));
      if (k !== step) {
        step = k;
        el.dataset['step'] = String(k);
      }
    }
  };

  return {
    el,
    measure() {
      const rect = el.getBoundingClientRect();
      const top = rect.top + scrollY;
      if (pass) {
        from = top + rect.height * start.at - viewH * start.view;
        span = Math.max(1, top + rect.height * end.at - viewH * end.view - from);
      } else {
        from = top;
        span = Math.max(1, el.offsetHeight - (stage?.offsetHeight ?? 0));
      }
    },
    update() {
      if (manual !== null) return write(manual);
      if (reduced.matches) return write(1);
      write(Math.min(1, Math.max(0, (scrollY - from) / span)));
    },
    override(p) {
      manual = p;
      this.update();
    },
    get value() {
      return value;
    },
  };
}

function frame() {
  queued = false;
  for (const entry of near) entry.update();
}

function queue() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(frame);
  }
}

function measureAll() {
  viewH = innerHeight;
  // Primero todas las lecturas y después todas las escrituras: un solo layout.
  for (const entry of entries.values()) entry.measure();
  // Las lejanas también se escriben: así quedan en su extremo (0 o 1) aunque no se vean.
  for (const entry of entries.values()) entry.update();
}

// Cerca = a menos de una pantalla. Al salir se recalcula una última vez, ya en su extremo.
const io = new IntersectionObserver(
  (records) => {
    for (const r of records) {
      const entry = entries.get(r.target as HTMLElement);
      if (!entry) continue;
      if (r.isIntersecting) near.add(entry);
      else near.delete(entry);
      entry.update();
    }
  },
  { rootMargin: '100% 0px' },
);

const resize = new ResizeObserver(() => {
  measureAll();
  queue();
});

function start() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-scene]')) {
    if (entries.has(el)) continue;
    entries.set(el, createScene(el));
    io.observe(el);
    resize.observe(el);
  }
  // body cubre los cambios de layout por encima de las escenas.
  resize.observe(document.body);
  measureAll();
}

start();
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => {
  measureAll();
  queue();
});
reduced.addEventListener('change', () => {
  for (const entry of entries.values()) entry.update();
});
void document.fonts.ready.then(() => {
  measureAll();
  queue();
});

/** Escena registrada para un elemento [data-scene] (para depurar y para otros scripts). */
export function getScene(el: HTMLElement): Scene | undefined {
  return entries.get(el);
}
