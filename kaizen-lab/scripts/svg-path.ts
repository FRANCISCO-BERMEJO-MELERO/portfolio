// Utilidades mínimas de paths SVG para el build: parseo a cúbicas absolutas,
// transformación afín, muestreo y caja.

export type Pt = { x: number; y: number };
export type Cubic = [Pt, Pt, Pt, Pt];
export type Affine = { sx: number; sy: number; tx: number; ty: number };

const TOKEN = /[MmLlHhVvCcSsQqTtZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g;

export function parsePath(d: string): Cubic[] {
  const tokens = d.match(TOKEN) ?? [];
  const out: Cubic[] = [];
  let i = 0;
  let cmd = '';
  let cur: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };
  let lastCtrl: Pt | null = null;
  const num = () => Number(tokens[i++]);
  const isCmd = (t: string | undefined) => t !== undefined && /[A-Za-z]/.test(t);

  const line = (to: Pt) => {
    out.push([cur, lerp(cur, to, 1 / 3), lerp(cur, to, 2 / 3), to]);
    cur = to;
    lastCtrl = null;
  };

  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++]!;
    const rel = cmd === cmd.toLowerCase();
    const base = rel ? cur : { x: 0, y: 0 };
    const p = (): Pt => {
      const x = num();
      const y = num();
      return { x: base.x + x, y: base.y + y };
    };
    switch (cmd.toUpperCase()) {
      case 'M': {
        cur = p();
        start = cur;
        lastCtrl = null;
        cmd = rel ? 'l' : 'L'; // pares extra tras M son líneas
        break;
      }
      case 'L':
        line(p());
        break;
      case 'H':
        line({ x: (rel ? cur.x : 0) + num(), y: cur.y });
        break;
      case 'V':
        line({ x: cur.x, y: (rel ? cur.y : 0) + num() });
        break;
      case 'C': {
        const c1 = p();
        const c2 = p();
        const to = p();
        out.push([cur, c1, c2, to]);
        cur = to;
        lastCtrl = c2;
        break;
      }
      case 'S': {
        const c1: Pt = lastCtrl ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur;
        const c2 = p();
        const to = p();
        out.push([cur, c1, c2, to]);
        cur = to;
        lastCtrl = c2;
        break;
      }
      case 'Q': {
        const q = p();
        const to = p();
        out.push([cur, lerp(cur, q, 2 / 3), lerp(to, q, 2 / 3), to]);
        cur = to;
        lastCtrl = null;
        break;
      }
      case 'Z':
        if (cur.x !== start.x || cur.y !== start.y) line(start);
        cur = start;
        break;
      default:
        throw new Error(`Comando de path no soportado: ${cmd}`);
    }
  }
  return out;
}

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function cubicAt([p0, p1, p2, p3]: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

export function sample(segs: Cubic[], perSeg = 64): Pt[] {
  const pts: Pt[] = [];
  for (const s of segs) for (let k = 0; k <= perSeg; k++) pts.push(cubicAt(s, k / perSeg));
  return pts;
}

export function bbox(pts: Pt[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

export function transform(segs: Cubic[], m: Affine): Cubic[] {
  const f = (p: Pt): Pt => ({ x: p.x * m.sx + m.tx, y: p.y * m.sy + m.ty });
  return segs.map((s) => s.map(f) as Cubic);
}
