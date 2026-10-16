// Alineación de KanjiVG con el glifo de Shippori (unidades de la caja de 109).
// 1. La caja de las líneas centrales de KanjiVG se encaja en la caja del glifo menos `inset`.
// 2. `adjust` corrige ese encaje: escala respecto al centro de la caja (54,5; 54,5) y
//    desplaza. Valores obtenidos minimizando la distancia de la tinta a su línea central.
// La usa el build (scripts/build-glyphs.ts).
type Inset = { top: number; right: number; bottom: number; left: number };
type Adjust = { sx: number; sy: number; tx: number; ty: number };

export const kanjiFit: Record<'改' | '善', { inset: Inset; adjust: Adjust }> = {
  改: { inset: { top: 3, right: 3, bottom: 3, left: 3 }, adjust: { sx: 1.045, sy: 1.097, tx: 1.5, ty: -1.1 } },
  善: { inset: { top: 3, right: 3, bottom: 3, left: 3 }, adjust: { sx: 1.207, sy: 1.04, tx: 0.4, ty: -1.65 } },
};
