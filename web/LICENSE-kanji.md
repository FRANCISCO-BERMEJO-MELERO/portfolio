# Licencia de los trazos de 改善

Los trazos de 改 y 善 (orden, dirección y línea central de cada trazo) salen de
[KanjiVG](https://kanjivg.tagaini.net/), Copyright (C) 2009/2010/2011 Ulrich Apel, distribuido bajo
[Creative Commons Attribution-Share Alike 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

## Qué es obra derivada
- `assets/kanjivg/06539.svg` y `assets/kanjivg/05584.svg`: los SVG originales de KanjiVG, sin cambios.
- `src/generated/kanji-geometry.ts`: generado por `scripts/build-glyphs.ts` a partir de esos SVG.
  Contiene las líneas de KanjiVG ajustadas a la tinta del glifo y las zonas de cada trazo.
- `src/data/kanji-masks.ts`: grosores de las máscaras de cada trazo.

Estos ficheros, y la escena que los dibuja en la web, se publican bajo la **misma licencia**
(CC BY-SA 3.0), con atribución a KanjiVG. La atribución irá también en el pie de la web (fase 6).

## Qué no lo es
- La forma de los kanji es el glifo de Shippori Mincho (SIL Open Font License 1.1, `assets/fonts/OFL.txt`).
- El resto del código del portfolio no es obra derivada de KanjiVG.
