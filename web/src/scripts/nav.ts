// Sección activa: el enlace de la sección que está bajo la navegación lleva aria-current="true".
// Como el motor de scroll, mide al cargar y al cambiar el layout, y en el scroll solo lee scrollY.
const links = new Map<string, HTMLAnchorElement>();
for (const a of document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')) links.set(a.hash.slice(1), a);
const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')].filter((s) => links.has(s.id));
const header = document.querySelector<HTMLElement>('[data-qa=nav-header]');

let tops: number[] = [];
let navH = 0;
let bottom = 0;
let active: string | null = null;
let queued = false;

function measure() {
  navH = header?.offsetHeight ?? 0;
  tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
  bottom = document.documentElement.scrollHeight - innerHeight;
}

function update() {
  queued = false;
  // La activa es la última que ya ha llegado bajo la navegación (2 px de margen por redondeos);
  // al final de la página, la última (puede no llegar arriba del todo).
  const y = scrollY + navH + 2;
  let i = 0;
  while (i + 1 < tops.length && tops[i + 1]! <= y) i++;
  if (scrollY >= bottom - 2) i = sections.length - 1;
  const id = sections[i]?.id ?? null;
  if (id === active) return;
  links.get(active ?? '')?.removeAttribute('aria-current');
  if (id) links.get(id)?.setAttribute('aria-current', 'true');
  active = id;
}

function queue() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(update);
  }
}

new ResizeObserver(() => {
  measure();
  queue();
}).observe(document.body);
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => {
  measure();
  queue();
});
measure();
update();
