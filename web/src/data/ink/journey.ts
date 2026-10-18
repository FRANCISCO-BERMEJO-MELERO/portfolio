// Trazo de la trayectoria (d-09, m-08): línea central y grosor de cada tramo. La parte dibujada de
// las maquetas da los puntos y grosores del principio; su guía (la línea fina que aún falta por
// pintar) da los puntos del resto. La punta seca de la maqueta (el pincel en movimiento) se cambia
// por grosores que siguen bajando y un final afinado: aquí el trazo se pinta entero y se revela.
//
// Los dos lienzos se estiran solo en su eje largo (preserveAspectRatio="none"):
// - horizontal: 1248 × 60, ancho = el de la sección (1248 px a 1440) y alto fijo de 60 px;
// - vertical: 28 × 750, ancho fijo de 28 px y alto = el de la lista.
// En el eje corto la escala es 1, así que el grosor no se deforma (plan, riesgos de la fase 5).

type Point = readonly [number, number];

export const journeyHorizontal = {
  viewBox: '0 0 1248 60',
  points: [
    [8, 32.1], [36, 33.3], [64, 33.8], [92, 33.7], [120, 33.1], [148, 32.5], [176, 32.0], [204, 32.1],
    [232, 32.7], [260, 33.7], [288, 35.0], [316, 36.1], [344, 36.8], [372, 36.7], [400, 35.9], [428, 34.3],
    [456, 32.4], [484, 30.4], [512, 28.7], [540, 27.6], [568, 27.1], [608, 27.5], [648, 28.3], [688, 28.6],
    [728, 27.8], [768, 26.0], [808, 24.1], [848, 22.9], [888, 23.2], [928, 25.0], [968, 27.7], [1008, 30.2],
    [1048, 31.6], [1088, 31.8], [1128, 31.2], [1168, 30.6], [1208, 31.0], [1246, 32.6],
  ],
  widths: [
    14.0, 12.9, 12.7, 12.5, 12.3, 12.2, 12.0, 11.8, 11.6, 11.4, 11.2, 11.0, 10.8, 10.7, 10.5, 10.3, 10.1, 9.9,
    9.7, 9.6, 9.4, 9.2, 9.0, 8.8, 8.6, 8.4, 8.2, 8.0, 7.8, 7.6, 7.4, 7.2, 7.0, 6.2, 5.0, 3.8, 2.6,
  ],
} as const;

export const journeyVertical = {
  viewBox: '0 0 28 750',
  points: [
    [15.3, 6], [16.5, 31], [16.2, 56], [15.5, 81], [15.8, 106], [16.8, 131], [17.2, 156], [15.8, 181],
    [13.0, 206], [10.8, 231], [10.5, 256], [11.6, 281], [12.6, 306], [12.5, 331], [12.0, 356], [12.7, 386],
    [15.5, 416], [18.0, 446], [17.8, 476], [15.6, 506], [14.3, 536], [14.6, 566], [14.3, 596], [12.1, 626],
    [9.8, 656], [10.0, 686], [12.6, 716], [14.8, 746],
  ],
  widths: [
    10.2, 9.6, 9.4, 9.2, 9.0, 8.8, 8.6, 8.4, 8.2, 8.0, 7.8, 7.6, 7.4, 7.3, 7.1, 6.9, 6.7, 6.5, 6.3, 6.1, 5.9, 5.7,
    5.5, 4.9, 4.1, 3.3, 2.5,
  ],
} as const;

/** Altura de la línea central en x (lienzo horizontal), interpolada entre sus puntos. */
export function yAt(points: readonly Point[], x: number): number {
  const i = Math.max(1, points.findIndex((p) => p[0] >= x));
  const [x0, y0] = points[i - 1]!;
  const [x1, y1] = points[Math.min(i, points.length - 1)]!;
  const t = x1 === x0 ? 0 : Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
  return Math.round((y0 + t * (y1 - y0)) * 100) / 100;
}

/** En el lienzo horizontal, el círculo del hito k está 8 unidades después del inicio de su columna (d-09). */
export const DOT_OFFSET = 8;
