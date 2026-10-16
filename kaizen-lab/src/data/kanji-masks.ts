// Grosor de la máscara de cada trazo, en unidades de la caja de 109 × 109.
// Orden = orden de escritura de KanjiVG. Ajustable en vivo con ?debug, que copia
// este mismo bloque listo para pegar.
// Estado actual: prioriza el criterio 2 (0 huecos con --p = 1) a costa de fugas.
// Ver 02-DOCS/wiki/ftd/kaizen-escena.md.
import type { KanjiChar } from '../generated/kanji-geometry.ts';

export const kanjiMasks: Record<KanjiChar, readonly number[]> = {
  改: [11, 12, 18.5, 14, 4.5, 29.5, 14],
  善: [6.5, 10, 14.5, 10.5, 22.5, 2, 2, 2, 10, 18, 19, 10],
};
