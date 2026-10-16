// Máscara de un trazo: la línea central de KanjiVG prolongada medio grosor por cada
// extremo, para dibujarla con punta recta (stroke-linecap: butt). El frente de la
// «pluma» es así una línea limpia, y la prolongación cubre remates y puntas.
type Pt = { readonly x: number; readonly y: number };
export type StrokeGeometry = {
  readonly d: string;
  readonly length: number;
  readonly start: Pt;
  readonly end: Pt;
  readonly startDir: Pt;
  readonly endDir: Pt;
};

export type Brush = {
  /** Path prolongado. */
  d: string;
  /** Prolongación en cada extremo (= medio grosor). */
  ext: number;
  /** Longitud total del path prolongado. */
  total: number;
};

const r = (n: number) => Math.round(n * 100) / 100;

export function brush(s: StrokeGeometry, width: number): Brush {
  const ext = width / 2;
  const a = { x: s.start.x - s.startDir.x * ext, y: s.start.y - s.startDir.y * ext };
  const b = { x: s.end.x + s.endDir.x * ext, y: s.end.y + s.endDir.y * ext };
  // El path original empieza con «M x y»: lo sustituimos por la prolongación inicial.
  const body = s.d.replace(/^M\s*[-\d.]+[\s,]+[-\d.]+/, '');
  return {
    d: `M${r(a.x)} ${r(a.y)}L${s.start.x} ${s.start.y}${body}L${r(b.x)} ${r(b.y)}`,
    ext: r(ext),
    total: r(s.length + 2 * ext),
  };
}
