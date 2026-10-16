// Grosor de la máscara de cada trazo, en unidades de la caja de 109 × 109.
// Orden = orden de escritura de KanjiVG. Ajustable en vivo con ?debug, que copia
// este mismo bloque listo para pegar.
// Cada máscara va recortada por la zona de su trazo, así que un grosor de más no
// destapa a los vecinos. Un grosor por debajo del mínimo que calcula el build
// (minWidth en src/generated/kanji-geometry.ts) deja huecos: el build avisa.
import type { KanjiChar } from '../generated/kanji-geometry.ts';

export const kanjiMasks: Record<KanjiChar, readonly number[]> = {
  改: [11.5, 12, 18, 11.5, 11.5, 22.5, 15.5],
  善: [7.5, 13.5, 15, 12, 23, 22.5, 21, 13, 12, 10, 17.5, 13],
};
