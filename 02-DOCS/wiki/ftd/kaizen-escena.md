---
author: Francisco Bermejo
branch: develop
status: done-pending-safari
---

# Escena kaizen · fase 1 (prueba técnica aislada)

## Intent
Probar, en un proyecto mínimo (`kaizen-lab/`), que 改善 se dibuja trazo a trazo con el scroll,
en orden de escritura real, y que la forma final es exactamente el glifo de Shippori Mincho.

## Scope
- Dentro: Astro + pnpm + TS estricto; glifos de Shippori → paths SVG con opentype.js en build;
  trazos de KanjiVG como máscara recortada por zonas; motor de scroll con `--p`; grosores en
  `src/data/kanji-masks.ts`; `prefers-reduced-motion`; modo `?debug`.
- Fuera: el resto del portfolio, navegación, textos de la sección «Sobre mí».

## Decisiones
- Referencias: los ficheros se llaman al revés en el prompt; manda su título (escritorio = 1440 px, móvil = 390 px).
- Peso Regular (400), glifo a 92 u en caja de 109, centrado como `dominant-baseline: central` en
  Chrome (ascender/descender de `hhea`), igual que las referencias. Path generado ≡ `<text>` de la fuente.
- Guía `#d6cfbf`; desaparece al completar cada kanji. Corte móvil/escritorio: 960 px.
- Tramo de cada trazo proporcional a su longitud (confirmado por el usuario).
- Sin Playwright (decisión del usuario): Chrome y Firefox ya instalados, controlados por CDP / WebDriver BiDi.
- La fuente (8 MB) no se versiona: `pnpm assets` la descarga si falta (lo hacen `dev` y `build`).

## Intento 1 — máscaras de grosor uniforme (commit 3cb3177): criterio 1 no se cumplía
Con 0 huecos, fugas de 2 392 px (改) y 4 374 px (善). Causa: una máscara uniforme no reproduce un
trazo Mincho; tapar un remate exige engordarla y eso destapa al vecino.

## Intento 2 — híbrido (actual): máscara de dibujo recortada por la zona de su trazo
Partición en build (`scripts/partition.ts`), técnica **rasterizar → etiquetar → vectorizar**:
1. Glifo rasterizado a 8 px/u (2× la pantalla a 440 px) + campo de distancias con signo.
2. Cada línea de KanjiVG se centra en su tinta (giro ≤ 15° + desplazamiento ≤ 3 u, con coste) y
   después se ajusta de forma flexible a la cresta de la tinta (mediana móvil de ±6 u: ignora
   uniones con trazos gruesos y conserva curvas reales, p. ej. 改 7 es más curvo que en KanjiVG).
3. Banda de cada trazo = semigrosor LOCAL medido (percentil 30 en ±6 u, ignora los cruces), con
   punta recta. Cruce (píxel en varias bandas) → gana el trazo anterior. Sin banda (remates,
   puntas, uniones) → la banda más cercana por distancia geodésica dentro de la tinta.
4. Extremos prolongados siguiendo la cresta mientras haya tinta, sin entrar en la banda de un
   trazo posterior (si no, le robaría tinta).
5. Recorte de cada trazo = su zona + 0,5 u sobre zonas de trazos ANTERIORES (ya pintadas) para que
   la costura no deje antialiasing. El build falla si un recorte invade la zona de un trazo posterior.
6. Vectorizado por bordes de píxel + Douglas–Peucker. El borde exterior lo da el glifo, no las zonas.

Por qué raster y no booleanas: «el trazo más cercano» (Voronoi de curvas, y además geodésico dentro
de la tinta) no se expresa con unión/intersección/resta; en raster es directo y su error (≤ 1/8 u)
solo afecta a costuras internas, que cubre el solape de 0,5 u.

En ejecución: máscara de punta recta (frente de pluma limpio) prolongada medio grosor en cada
extremo; la prolongación inicial aparece al apoyar la pluma y la final al terminar (p ≥ e).

## Checklist
- [x] Glifos y trazos generados en build — `pnpm glyphs`: «✓ 改 U+6539: 7 trazos · ✓ 善 U+5584: 12 trazos».
- [x] Partición sin huecos ni solapes — 0 px de tinta sin zona; comprobación de invasión en build.
- [x] Escena con sticky + `--p` — capturas al final y a mitad de cada trazo.
- [x] Modo debug: zonas en color, trazos numerados, slider, grosores en vivo, copiar config, auditoría.
- [x] Criterio 1 — ningún trazo se adelanta: 0 px de fuga en 401 estados de --p (Chrome y Firefox) +
      revisión visual del final de los 19 trazos (solo se adelanta el cuadrado de cruce, por regla).
- [x] Criterio 2 — p = 1 idéntico al glifo: 0 px distintos (Δα máx. 0) en Chrome y Firefox.
- [x] Criterio 3 — fluidez móvil (390×844 @3x, CPU ×4): 0 fotogramas > 33 ms en 3 pasadas.
- [ ] Criterio 4 — Safari: no ejecutable en Windows. Pendiente de prueba manual (iPhone/Mac, `?debug` → Auditar).
- [x] Reduced motion: kanji completos sin scroll (captura con `--force-prefers-reduced-motion`).

## Evidence
- Auditoría (render real del navegador, 5 px/u; fuga = tinta fuera de las zonas de trazos empezados;
  hueco = zona de trazo terminado sin tinta; tolerancia Δα 32/255):
  - Chrome: 改 148 estados 0/0, 善 253 estados 0/0, p = 1 → 0 px distintos.
  - Firefox 153: idéntico (0/0, 0 px).
  - Controles negativos (el gate puede fallar): sin recortes → 7 257 / 27 494 px de fuga;
    grosor 2 → > 120 000 px de hueco.
- Rendimiento (Chrome headless, CDP, móvil emulado, CPU ×4, gesto de 1 688 px en ~3,1 s):
  p50 7,0 ms · p95 14,0 ms · máx 20,9–27,9 ms · 0 > 33 ms; estilo ~445 ms/gesto (~1 ms/fotograma
  con ×4); traza: pintado 86 ms total (máx 2 ms), raster 7 ms. Ojo: headless rasteriza por
  software; la GPU de un móvil real puede comportarse distinto.
- Peso: HTML 184 KB (46 KB gzip); la capa de debug se construye en JS solo con `?debug`.

## Fallos encontrados por el camino
- opentype.js 2: `toPathData({…})` voltea el glifo y escribe `NaN` → serializador propio.
- `--done` con `p > e` estricto: la prolongación final del último trazo nunca aparecía (hueco real en 善 12).
- La auditoría razonaba con un `p` distinto del que veía el CSS (redondeo a 4 decimales) → el motor
  guarda exactamente el valor escrito.

## Next
Probar en Safari (iOS y macOS): `pnpm dev --host`, abrir `http://<IP-del-PC>:4321/?debug` y pulsar «Auditar».
