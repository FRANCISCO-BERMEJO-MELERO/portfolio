// Ensō del hero (d-01, m-01): línea central y grosor de cada tramo, copiados de la maqueta, en un
// lienzo de 400 × 400. InkStroke.astro lo pinta igual que la maqueta (un tramo redondeado por par
// de puntos) y lo revela a lo largo de la línea central.
export const enso = {
  viewBox: '0 0 400 400',
  points: [
    [129.8, 332.0], [110.9, 318.3], [94.5, 301.9], [80.8, 283.5], [69.8, 263.5], [61.3, 242.4], [55.5, 220.3],
    [52.4, 197.4], [52.5, 174.0], [56.1, 150.4], [63.6, 127.5], [75.3, 106.0], [91.0, 87.1], [110.1, 71.7],
    [131.9, 60.3], [155.2, 53.3], [179.0, 50.6], [202.6, 51.7], [225.4, 56.1], [247.1, 63.3], [267.6, 72.9],
    [286.8, 84.8], [304.5, 99.1], [320.4, 115.7], [333.7, 134.8], [344.0, 156.0], [350.4, 178.9], [352.7, 202.7],
    [350.6, 226.6], [344.4, 249.7], [334.4, 271.4], [321.0, 291.2], [304.9, 308.7], [286.5, 323.6], [266.1, 335.6],
    [244.2, 344.5], [221.1, 349.9], [197.4, 351.4], [173.7, 348.9],
  ],
  widths: [
    26.2, 24.6, 23.0, 22.7, 22.5, 22.3, 22.1, 21.9, 21.7, 21.5, 21.2, 21.0, 20.8, 20.6, 20.4, 20.2, 20.0, 19.8, 19.5,
    19.3, 19.1, 18.9, 18.7, 18.5, 18.3, 18.0, 17.8, 17.6, 17.4, 17.2, 16.5, 13.9, 11.8, 9.9, 8.1, 6.5, 4.8, 3.3,
  ],
} as const;

// Mancha de la estampación (criterio 1 de la fase 2): forma fija calculada aquí, en el build, en un
// lienzo de 100 × 100 con el sello en el centro. Un borde ondulado y tres gotas; en la animación solo
// cambian su escala y su opacidad (plan, riesgos de la fase 2).
function splashPath(): string {
  const n = 28;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    const r = 40 * (1 + 0.07 * Math.sin(3 * a + 0.4) + 0.05 * Math.sin(5 * a + 1.3) + 0.04 * Math.sin(8 * a + 2.1));
    pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]);
  }
  const f = (v: number) => v.toFixed(1);
  const mid = (i: number) => {
    const [ax, ay] = pts[i % n]!;
    const [bx, by] = pts[(i + 1) % n]!;
    return `${f((ax + bx) / 2)},${f((ay + by) / 2)}`;
  };
  let d = `M${mid(0)}`;
  for (let i = 1; i <= n; i++) d += ` Q${f(pts[i % n]![0])},${f(pts[i % n]![1])} ${mid(i)}`;
  d += 'Z';
  const drops: [number, number, number][] = [
    [93, 31, 3.2],
    [9, 78, 2.4],
    [70, 96, 1.8],
  ];
  for (const [cx, cy, r] of drops) d += ` M${f(cx - r)},${cy} a${r},${r} 0 1 0 ${f(2 * r)},0 a${r},${r} 0 1 0 ${f(-2 * r)},0Z`;
  return d;
}

export const splash = { viewBox: '0 0 100 100', d: splashPath() } as const;
