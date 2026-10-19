// Aparición al entrar en vista (fase 6): cada [data-reveal] recibe data-revealed la primera vez que
// entra en la ventana y deja de observarse (el sello del cierre se estampa una sola vez). El CSS de
// cada componente decide qué se anima; solo lo hace con html.js y sin reduced motion, así que sin JS
// todo se ve desde el principio. data-reveal="<0–1>" es la fracción visible que lo dispara (0,2 por
// defecto); el elemento también se revela si ya está por encima de la ventana (al cargar con #ancla
// más abajo).
const io = new IntersectionObserver(
  (records) => {
    for (const r of records) {
      const el = r.target as HTMLElement;
      const at = Number(el.dataset['reveal']) || 0.2;
      if (r.intersectionRatio >= at || r.boundingClientRect.bottom < 0) {
        el.dataset['revealed'] = '';
        io.unobserve(el);
      }
    }
  },
  { threshold: [0, 0.1, 0.2, 0.3, 0.5, 1] },
);

for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) io.observe(el);
