// Desplegables «usado en» del stack (TechItem.astro, C5). Clic, toque, Enter y Espacio llegan como
// clic al botón: cada uno fija o suelta su lista. El hover (solo con ratón) es CSS y no cambia el estado.
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tech-toggle]')) {
  button.addEventListener('click', () => {
    button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'));
  });
}
