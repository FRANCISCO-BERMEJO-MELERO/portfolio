// Separador sumi-e (C13): una pincelada horizontal corta. No hay maqueta: se calcula aquí, en el
// build, como el resto de trazos de InkStroke (línea central + grosor de cada tramo). El pincel entra
// cargado (más grueso y un poco más bajo), sube apenas en el centro y sale seco hacia la derecha.
const N = 24;
const W = 320;
const H = 24;

const points = Array.from({ length: N + 1 }, (_, k) => {
  const t = k / N;
  const x = 8 + t * (W - 16);
  // Arco leve: 2,5 px de subida en el centro, y la entrada 1 px más baja.
  const y = H / 2 + 1 - 2.5 * Math.sin(Math.PI * t) - t;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
});

// Entra a 9 px, se mantiene y se afina hasta 1,2 px en el último tercio.
const widths = Array.from({ length: N }, (_, k) => {
  const t = (k + 0.5) / N;
  const w = t < 0.6 ? 9 - 2 * t : 7.8 - (6.6 * (t - 0.6)) / 0.4;
  return Math.round(w * 10) / 10;
});

export const divider = { viewBox: `0 0 ${W} ${H}`, points, widths };
