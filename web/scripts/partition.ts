// Partición del glifo en una zona por trazo (build).
//
// Técnica: rasterizar → etiquetar → vectorizar.
// 1. Se rasteriza el glifo (regla nonzero) en una rejilla de RES px por unidad, y se
//    calcula su campo de distancia con signo (+ dentro de la tinta, − fuera).
// 2. Centrado: cada línea de KanjiVG se desplaza (≤ SNAP u) hasta quedar centrada en su
//    tinta (máxima distancia media al borde).
// 3. Banda: el semigrosor de cada trazo es la mediana de esa distancia a lo largo de su
//    línea (la mediana ignora los cruces, donde la tinta parece más ancha).
// 4. Extremos: cada línea se prolonga mientras siga en tinta y no entre en otra banda.
// 5. Distancia geodésica desde cada línea: por tinta cuesta 1 y por fondo OUTSIDE_COST,
//    así un trazo no «salta» a un vecino que no toca.
// 6. Etiqueta de cada píxel: si cae en la banda de varios trazos (un cruce), gana el que
//    se escribe primero; si cae en una, esa; si en ninguna (remates, puntas, uniones),
//    el trazo con la banda más cercana. Cada píxel tiene una sola etiqueta: la unión es
//    el glifo entero, sin huecos ni solapes.
// 7. Para el recorte de cada trazo, su zona se extiende EPS sobre zonas de trazos
//    ANTERIORES (ya pintados: no es fuga) para que la costura no deje antialiasing.
// 8. Cada recorte se vectoriza siguiendo los bordes de píxel y se simplifica.
// El borde exterior visible lo sigue dando el path del glifo, no estas zonas.
import { parsePath, sample, type Pt } from './svg-path.ts';

export const RES = 8; // px por unidad (≈ 2× la resolución en pantalla a 440 px)
const OUTSIDE_COST = 3;
export const SNAP = 3; // u: desplazamiento máximo al centrar una línea
export const SNAP_ANGLE = 15; // grados: giro máximo al centrar una línea
const SNAP_COST = 0.3; // u de centrado que hay que ganar por cada u (o cada 10°) de ajuste

/** Colocación de una línea: giro `angle` (rad) alrededor de (cx, cy) y luego (dx, dy). */
export type Placement = { dx: number; dy: number; angle: number; cx: number; cy: number };

export function place(p: Pt, m: Placement): Pt {
  const cos = Math.cos(m.angle);
  const sin = Math.sin(m.angle);
  const x = p.x - m.cx;
  const y = p.y - m.cy;
  return { x: m.cx + x * cos - y * sin + m.dx, y: m.cy + x * sin + y * cos + m.dy };
}
export const BAND_TOL = 0.25; // u: holgura de la banda (≈ 1 px a 440 px)
const EXTEND_MAX = 8; // u
const TANGENT_SPAN = 3; // u de recorrido para medir la dirección de un extremo
const LOCAL_WINDOW = 6; // u: ventana (±) para el semigrosor local
const LOCAL_PERCENTILE = 0.3;
const RIDGE_RANGE = 4; // u: búsqueda en la normal
const RIDGE_COST = 0.15; // por u de desplazamiento
const RIDGE_SMOOTH = 6; // u: mediana móvil (±) de los desplazamientos
export const EPS = 0.5; // u (≥ 1 px en pantalla también a 260 px)
const SIMPLIFY = 0.6; // px de la rejilla

export type Partition = {
  /** Etiqueta (índice de trazo) de cada píxel; -1 fuera de la caja útil. */
  labels: Int16Array;
  ink: Uint8Array;
  size: number;
  /** Path de recorte (clip-rule evenodd) de cada trazo. */
  clips: string[];
  /** Grosor mínimo de máscara para cubrir toda la zona de cada trazo. */
  minWidths: number[];
  /** Giro + desplazamiento aplicado a cada línea para centrarla en su tinta. */
  offsets: Placement[];
  /** Líneas finales (centradas y ajustadas a su tinta), en orden de escritura. */
  lines: Pt[][];
  /** Semigrosor medido de cada trazo (u). */
  halfWidths: number[];
  /** Comprobaciones de la partición. */
  stats: { inkPx: number; unlabeledInkPx: number; perStrokeInkPx: number[] };
};

export function partition(glyphD: string, rawLines: Pt[][], box: number): Partition {
  const N = Math.round(box * RES);
  const ink = rasterize(glyphD, N);
  const inside = chamfer(Uint8Array.from(ink, (v) => 1 - v), N); // px hasta el fondo
  const outside = chamfer(ink, N); // px hasta la tinta
  const signed = (p: Pt) => {
    const x = Math.floor(p.x * RES);
    const y = Math.floor(p.y * RES);
    if (x < 0 || y < 0 || x >= N || y >= N) return -SNAP;
    const i = y * N + x;
    return (ink[i] ? inside[i]! : -outside[i]!) / RES;
  };

  // 2. Centrado de cada línea en su tinta: giro pequeño respecto a su centro + desplazamiento.
  const offsets = rawLines.map((line) => {
    const c = line.reduce((a, p) => ({ x: a.x + p.x / line.length, y: a.y + p.y / line.length }), { x: 0, y: 0 });
    let best: Placement = { dx: 0, dy: 0, angle: 0, cx: c.x, cy: c.y };
    let bestScore = -Infinity;
    for (let deg = -SNAP_ANGLE; deg <= SNAP_ANGLE; deg += 0.5) {
      const rot = { ...best, dx: 0, dy: 0, angle: (deg * Math.PI) / 180 };
      const turned = line.map((p) => place(p, rot));
      for (let dy = -SNAP; dy <= SNAP; dy += 0.25)
        for (let dx = -SNAP; dx <= SNAP; dx += 0.25) {
          let score = 0;
          for (const p of turned) score += Math.min(signed({ x: p.x + dx, y: p.y + dy }), 3);
          // Moverse cuesta: un trazo corto no debe irse a la tinta de un vecino.
          score = score / line.length - SNAP_COST * (Math.hypot(dx, dy) + Math.abs(deg) / 10);
          if (score > bestScore) {
            bestScore = score;
            best = { ...rot, dx, dy };
          }
        }
    }
    return best;
  });
  // 2b. Ajuste flexible: cada punto se acerca en perpendicular al centro de su tinta, con
  //     el desplazamiento suavizado a lo largo del trazo (no salta a un vecino en un cruce).
  const lines = rawLines.map((line, k) => ridgeFit(line.map((p) => place(p, offsets[k]!)), signed));

  // 3. Semigrosor de cada trazo: la mediana (para informar y como referencia) y el perfil
  //    local a lo largo de la línea (los trazos Mincho se afinan y ensanchan).
  const halfWidths = lines.map((line) => {
    const v = line.map(signed).filter((d) => d > 0).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)]! : 1;
  });
  const bandOf = (line: Pt[]) => ({ line, h: localHalfWidths(line, signed) });
  let bands = lines.map(bandOf);
  const inBand = (x: number, y: number, j: number) => bandExcess(x, y, bands[j]!) <= BAND_TOL;
  // 4. Prolongación de los extremos mientras siga en tinta y no entre en la banda de un
  //    trazo POSTERIOR (en ese solape ganaría este trazo y le robaría tinta). Atravesar
  //    la de uno anterior no roba nada: allí gana el anterior.
  const extended = lines.map((line, k) => {
    // Avanza en la dirección del extremo y, en cada paso, se recentra en perpendicular
    // hacia el centro de la tinta (sigue la cresta aunque el trazo se curve un poco).
    const grow = (from: Pt, towards: Pt) => {
      const l = Math.hypot(from.x - towards.x, from.y - towards.y) || 1;
      let u = { x: (from.x - towards.x) / l, y: (from.y - towards.y) / l };
      let prev = from;
      const pts: Pt[] = [];
      for (let s = 0.25; s <= EXTEND_MAX; s += 0.25) {
        const ahead = { x: prev.x + u.x * 0.25, y: prev.y + u.y * 0.25 };
        let p = ahead;
        for (let o = -0.5; o <= 0.5; o += 0.125) {
          const q = { x: ahead.x - u.y * o, y: ahead.y + u.x * o };
          if (signed(q) > signed(p)) p = q;
        }
        if (signed(p) <= 0) break;
        if (lines.some((_, j) => j > k && inBand(p.x, p.y, j))) break;
        pts.push(p);
        const m = Math.hypot(p.x - prev.x, p.y - prev.y) || 1;
        u = { x: (u.x + (p.x - prev.x) / m) / 2, y: (u.y + (p.y - prev.y) / m) / 2 };
        const n = Math.hypot(u.x, u.y) || 1;
        u = { x: u.x / n, y: u.y / n };
        prev = p;
      }
      return pts;
    };
    // Dirección medida sobre los primeros/últimos TANGENT_SPAN u: KanjiVG suele empezar
    // con un pequeño quiebro que daría una dirección engañosa.
    const head = grow(line[0]!, alongFrom(line, TANGENT_SPAN)).reverse();
    const tail = grow(line[line.length - 1]!, alongFrom([...line].reverse(), TANGENT_SPAN));
    return [...head, ...line, ...tail];
  });

  // 5. Distancias geodésicas por trazo (algoritmo de Dial: pesos enteros pequeños).
  bands = extended.map(bandOf);
  const dist = extended.map((line) => geodesic(seeds(line, N), ink, N));
  const band = halfWidths.map((h) => (h + BAND_TOL) * 5 * RES);
  const reach = bands.map((b) => (Math.max(...b.h) + BAND_TOL) * 5 * RES);

  // 6. Etiquetas. Banda = a menos de su semigrosor LOCAL de la línea y «de lado» (punta
  //    recta): más allá de un extremo no hay banda, así la punta de un trazo no se come
  //    al vecino que toca.
  const labels = new Int16Array(N * N).fill(-1);
  for (let i = 0; i < N * N; i++) {
    const x = ((i % N) + 0.5) / RES;
    const y = (Math.floor(i / N) + 0.5) / RES;
    let label = -1;
    for (let k = 0; k < dist.length; k++)
      if (dist[k]![i]! <= reach[k]! && inBand(x, y, k)) {
        label = k; // el primero en orden de escritura
        break;
      }
    if (label < 0) {
      let min = Infinity;
      for (let k = 0; k < dist.length; k++) {
        const beyond = dist[k]![i]! - band[k]!;
        if (beyond < min) {
          min = beyond;
          label = k;
        }
      }
    }
    labels[i] = label;
  }

  const stats = { inkPx: 0, unlabeledInkPx: 0, perStrokeInkPx: lines.map(() => 0) };
  for (let i = 0; i < N * N; i++) {
    if (!ink[i]) continue;
    stats.inkPx++;
    if (labels[i]! < 0) stats.unlabeledInkPx++;
    else stats.perStrokeInkPx[labels[i]!]!++;
  }

  const eps = EPS * RES;
  const clips: string[] = [];
  const minWidths: number[] = [];
  for (let k = 0; k < lines.length; k++) {
    const own = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) own[i] = labels[i] === k ? 1 : 0;
    const near = chamfer(own, N);
    const clip = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) clip[i] = own[i] || (labels[i]! >= 0 && labels[i]! < k && near[i]! <= eps) ? 1 : 0;
    // Solapes: el recorte de un trazo nunca puede entrar en la zona de uno posterior.
    for (let i = 0; i < N * N; i++)
      if (clip[i] && labels[i]! > k) throw new Error(`Trazo ${k + 1}: su recorte invade la zona del trazo ${labels[i]! + 1}`);
    clips.push(vectorize(clip, N));

    // Grosor mínimo: el doble de la distancia máxima de su tinta (más el borde extendido)
    // a su línea central, con un píxel de margen.
    let max = 0;
    const line = lines[k]!;
    for (let i = 0; i < N * N; i++) {
      if (!clip[i] || !inkNear(ink, i, N)) continue;
      const x = ((i % N) + 0.5) / RES;
      const y = (Math.floor(i / N) + 0.5) / RES;
      max = Math.max(max, segDist(x, y, line));
    }
    minWidths.push(Math.ceil((2 * (max + 1 / RES)) * 2) / 2);
  }
  return { labels, ink, size: N, clips, minWidths, offsets, lines, halfWidths, stats };
}

/** Tinta o a un píxel de ella (el antialiasing del borde también debe quedar cubierto). */
function inkNear(ink: Uint8Array, i: number, N: number) {
  if (ink[i]) return true;
  const x = i % N;
  const y = Math.floor(i / N);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < N && yy < N && ink[yy * N + xx]) return true;
    }
  return false;
}

function rasterize(d: string, N: number): Uint8Array {
  const polys = d
    .split(/(?=M)/)
    .filter(Boolean)
    .map((c) => sample(parsePath(c), 16).map((p: Pt) => ({ x: p.x * RES, y: p.y * RES })));
  const out = new Uint8Array(N * N);
  for (let row = 0; row < N; row++) {
    const y = row + 0.5;
    const xs: { x: number; w: number }[] = [];
    for (const poly of polys)
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[j]!;
        const b = poly[i]!;
        if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
          xs.push({ x: a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x), w: b.y > a.y ? 1 : -1 });
        }
      }
    xs.sort((p, q) => p.x - q.x);
    let wind = 0;
    for (let i = 0; i < xs.length - 1; i++) {
      wind += xs[i]!.w;
      if (wind === 0) continue;
      const from = Math.max(0, Math.ceil(xs[i]!.x - 0.5));
      const to = Math.min(N - 1, Math.floor(xs[i + 1]!.x - 0.5));
      for (let col = from; col <= to; col++) out[row * N + col] = 1;
    }
  }
  return out;
}

function seeds(line: Pt[], N: number): number[] {
  const set = new Set<number>();
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]!;
    const b = line[i]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * RES * 2));
    for (let s = 0; s <= steps; s++) {
      const x = Math.floor((a.x + ((b.x - a.x) * s) / steps) * RES);
      const y = Math.floor((a.y + ((b.y - a.y) * s) / steps) * RES);
      if (x >= 0 && y >= 0 && x < N && y < N) set.add(y * N + x);
    }
  }
  return [...set];
}

const NEIGH = [
  [1, 0, 5],
  [-1, 0, 5],
  [0, 1, 5],
  [0, -1, 5],
  [1, 1, 7],
  [1, -1, 7],
  [-1, 1, 7],
  [-1, -1, 7],
] as const;

function geodesic(src: number[], ink: Uint8Array, N: number): Float64Array {
  const dist = new Float64Array(N * N).fill(Infinity);
  const maxW = 7 * OUTSIDE_COST;
  const buckets: number[][] = Array.from({ length: maxW + 1 }, () => []);
  for (const s of src) {
    dist[s] = 0;
    buckets[0]!.push(s);
  }
  let pending = src.length;
  for (let d = 0; pending > 0; d++) {
    const bucket = buckets[d % (maxW + 1)]!;
    while (bucket.length) {
      const i = bucket.pop()!;
      pending--;
      if (dist[i] !== d) continue;
      const x = i % N;
      const y = (i - x) / N;
      for (const [dx, dy, w] of NEIGH) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
        const j = yy * N + xx;
        const nd = d + w * (ink[j] ? 1 : OUTSIDE_COST);
        if (nd < dist[j]!) {
          dist[j] = nd;
          buckets[nd % (maxW + 1)]!.push(j);
          pending++;
        }
      }
    }
  }
  return dist;
}

/** Distancia chamfer (en px) a la región marcada. */
function chamfer(region: Uint8Array, N: number): Float64Array {
  const d = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) d[i] = region[i] ? 0 : Infinity;
  const r2 = Math.SQRT2;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (x > 0) d[i] = Math.min(d[i]!, d[i - 1]! + 1);
      if (y > 0) {
        d[i] = Math.min(d[i]!, d[i - N]! + 1);
        if (x > 0) d[i] = Math.min(d[i]!, d[i - N - 1]! + r2);
        if (x < N - 1) d[i] = Math.min(d[i]!, d[i - N + 1]! + r2);
      }
    }
  for (let y = N - 1; y >= 0; y--)
    for (let x = N - 1; x >= 0; x--) {
      const i = y * N + x;
      if (x < N - 1) d[i] = Math.min(d[i]!, d[i + 1]! + 1);
      if (y < N - 1) {
        d[i] = Math.min(d[i]!, d[i + N]! + 1);
        if (x < N - 1) d[i] = Math.min(d[i]!, d[i + N + 1]! + r2);
        if (x > 0) d[i] = Math.min(d[i]!, d[i + N - 1]! + r2);
      }
    }
  return d;
}

/** Bordes de píxel → lazos cerrados → simplificados → path (para clip-rule evenodd). */
function vectorize(mask: Uint8Array, N: number): string {
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < N && y < N ? mask[y * N + x]! : 0);
  // Aristas orientadas entre esquinas de píxel (dentro a la derecha).
  const next = new Map<number, number[]>();
  const key = (x: number, y: number) => y * (N + 1) + x;
  const add = (x1: number, y1: number, x2: number, y2: number) => {
    const k = key(x1, y1);
    const list = next.get(k);
    if (list) list.push(key(x2, y2));
    else next.set(k, [key(x2, y2)]);
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y);
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) add(x, y + 1, x, y);
    }
  let d = '';
  for (const [start, list] of next) {
    while (list.length) {
      const loop: Pt[] = [];
      let cur = start;
      do {
        loop.push({ x: cur % (N + 1), y: Math.floor(cur / (N + 1)) });
        const outs = next.get(cur)!;
        cur = outs.pop()!;
      } while (cur !== start);
      const simple = simplifyClosed(loop, SIMPLIFY);
      if (simple.length < 3) continue;
      d += 'M' + simple.map((p) => `${r(p.x / RES)} ${r(p.y / RES)}`).join('L') + 'Z';
    }
  }
  return d;
}

const r = (n: number) => String(Math.round(n * 100) / 100);

function simplifyClosed(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 4) return pts;
  // Partir el lazo por el punto más lejano al primero y simplificar cada mitad.
  let far = 0;
  let best = -1;
  pts.forEach((p, i) => {
    const d = (p.x - pts[0]!.x) ** 2 + (p.y - pts[0]!.y) ** 2;
    if (d > best) {
      best = d;
      far = i;
    }
  });
  const a = dp(pts.slice(0, far + 1), tol);
  const b = dp([...pts.slice(far), pts[0]!], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

function dp(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts;
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1e-9;
  let max = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const dd = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
    if (dd > max) {
      max = dd;
      idx = i;
    }
  }
  if (max <= tol) return [a, b];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}

/** Remuestrea la polilínea a pasos de `step` u. */
function resample(line: Pt[], step: number): Pt[] {
  const out: Pt[] = [line[0]!];
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]!;
    const b = line[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let s = step - carry;
    while (s <= len) {
      out.push({ x: a.x + ((b.x - a.x) * s) / len, y: a.y + ((b.y - a.y) * s) / len });
      s += step;
    }
    carry = len - (s - step);
  }
  const last = line[line.length - 1]!;
  if (Math.hypot(last.x - out[out.length - 1]!.x, last.y - out[out.length - 1]!.y) > step / 4) out.push(last);
  return out;
}

/**
 * Ajuste flexible de una línea a la cresta de su tinta. En cada iteración, cada punto
 * busca en su normal (±RIDGE_RANGE u) la posición más interior, con un coste por
 * alejarse; los desplazamientos se suavizan con una mediana móvil de ±RIDGE_SMOOTH u.
 */
function ridgeFit(line: Pt[], signed: (p: Pt) => number): Pt[] {
  let pts = resample(line, 0.5);
  const half = Math.round(RIDGE_SMOOTH / 0.5);
  for (let iter = 0; iter < 4; iter++) {
    const normals = pts.map((_, i) => {
      const a = pts[Math.max(0, i - 2)]!;
      const b = pts[Math.min(pts.length - 1, i + 2)]!;
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
    });
    const raw = pts.map((p, i) => {
      const n = normals[i]!;
      let best = 0;
      let bestScore = Math.min(signed(p), 3);
      for (let o = -RIDGE_RANGE; o <= RIDGE_RANGE; o += 0.125) {
        const score = Math.min(signed({ x: p.x + n.x * o, y: p.y + n.y * o }), 3) - RIDGE_COST * Math.abs(o);
        if (score > bestScore) {
          bestScore = score;
          best = o;
        }
      }
      return best;
    });
    // Mediana móvil: ignora tirones cortos (una unión con un trazo más grueso atrae la
    // cresta) y conserva las desviaciones largas (un trazo más curvo que en KanjiVG).
    const smooth = raw.map((_, i) => {
      const w = raw.slice(Math.max(0, i - half), Math.min(raw.length, i + half + 1)).sort((a, b) => a - b);
      return w[Math.floor(w.length / 2)]!;
    });
    pts = pts.map((p, i) => ({ x: p.x + normals[i]!.x * smooth[i]!, y: p.y + normals[i]!.y * smooth[i]! }));
  }
  return pts;
}

/**
 * Semigrosor local en cada punto de la línea: percentil bajo de la distancia al borde en
 * una ventana de ±LOCAL_WINDOW u de recorrido. El percentil bajo descarta los cruces,
 * donde la tinta de otro trazo hace parecer este más ancho.
 */
function localHalfWidths(line: Pt[], signed: (p: Pt) => number): number[] {
  const acc = [0];
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1]! + Math.hypot(line[i]!.x - line[i - 1]!.x, line[i]!.y - line[i - 1]!.y));
  const d = line.map((p) => Math.max(0, signed(p)));
  return line.map((_, i) => {
    const w: number[] = [];
    for (let j = 0; j < line.length; j++) if (Math.abs(acc[j]! - acc[i]!) <= LOCAL_WINDOW) w.push(d[j]!);
    w.sort((a, b) => a - b);
    return w[Math.floor(w.length * LOCAL_PERCENTILE)] ?? 0;
  });
}

/** Cuánto sobresale (x, y) de la banda local: ≤ 0 dentro. Solo cuenta «de lado». */
function bandExcess(px: number, py: number, b: { line: Pt[]; h: number[] }): number {
  const pts = b.line;
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const c = pts[i]!;
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const t = ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1e-9);
    if ((i === 1 && t < 0) || (i === pts.length - 1 && t > 1)) continue;
    const tc = Math.max(0, Math.min(1, t));
    const dist = Math.hypot(a.x + tc * dx - px, a.y + tc * dy - py);
    const h = b.h[i - 1]! + (b.h[i]! - b.h[i - 1]!) * tc;
    best = Math.min(best, dist - h);
  }
  return best;
}

/** Punto a `span` u de recorrido desde el inicio de la polilínea (o el último). */
function alongFrom(pts: Pt[], span: number): Pt {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    if (acc >= span) return pts[i]!;
  }
  return pts[pts.length - 1]!;
}

export function segDist(px: number, py: number, pts: Pt[]) {
  let m = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let t = ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1e-9);
    t = Math.max(0, Math.min(1, t));
    m = Math.min(m, (a.x + t * dx - px) ** 2 + (a.y + t * dy - py) ** 2);
  }
  return Math.sqrt(m);
}
