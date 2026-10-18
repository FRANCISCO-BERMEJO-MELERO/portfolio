---
author: Francisco Bermejo
branch: fase/5-trayectoria
status: in-progress
date: 2026-10-18
plan: 02-DOCS/wiki/ftd/plan-implementacion.md (fase 5)
---

# Fase 5 · Trayectoria

## Intent
La sección 四 Trayectoria según d-09, d-10, m-08 y m-09: un trazo de pincel que se dibuja con el
scroll y enciende cada hito cuando su punta llega al círculo. Escritorio: escena sticky, trazo
horizontal y años en vertical. Móvil: trazo vertical que avanza mientras la lista cruza la ventana.
Los 4 hitos de la definición (C1); años y frases con marcadores (C2 sigue abierta).

## Scope
- Dentro: todo lo de la fase 5 del plan (§4): `JourneyStroke.astro`, `data/ink/journey.ts`,
  `sections/Journey.astro`, `data/journey.ts`, `reference-specs.ts`. Además: `scripts/journey.ts`
  (umbrales y encendido), opciones `stretch` y `guide` en `InkStroke`, `data-scene-pass` y
  `setSteps` en el motor, y la prueba `qa:journey` (en `pnpm qa`).
- Fuera: Safari (F18) y Firefox (F1): el criterio 3 del plan («años en vertical legibles en Chrome,
  Firefox y Safari») queda solo en Chrome; contenido real (años, frases: con `pending()`); móvil
  real en red local (no hay dispositivo en esta sesión).

## Decisiones
| # | Tema | Decisión | Quién |
| --- | --- | --- | --- |
| F32 | d-09 y m-08 atenúan los hitos pendientes con opacidad 0,4: no llega a AA (el mismo caso que F17) | **Color en vez de opacidad**, como F17: año (escritorio), título y frase en `--text-2` hasta que la punta llega al círculo y en `--text` desde entonces; el detalle ya es `--text-2`. El círculo pendiente es hueco (`--bg` con borde `--line`, como las maquetas) y se rellena de `--text` al llegar | Claude, por analogía con F17 |
| F33 | El trazo se estira con el ancho (riesgo del plan) | Cada lienzo se estira solo en su eje largo (`preserveAspectRatio="none"`): el horizontal mide 60 px de alto (= su lienzo) y el vertical 28 px de ancho (= su lienzo). En el eje corto la escala es 1 y el grosor no se deforma. Los círculos son HTML (no SVG) para que no se vuelvan elipses | Claude, implementación |
| F34 | «Se ilumina exactamente cuando la punta alcanza su círculo» | El encendido no va por tramos iguales: `scripts/journey.ts` mide en qué fracción de la línea central cae el centro de cada círculo y se lo da al motor como umbral (`setSteps`). Se vuelve a medir al cambiar el tamaño o las fuentes | Claude, implementación |
| F35 | Una escena sticky en escritorio y `pass` en móvil | Motor: `data-scene-pass="<media query>"` elige el modo en cada medida; `data-scene-track` solo cuenta en modo `pass` (el sello de la nav, el único que lo usaba, ya es `pass`). Móvil y escritorio de menos de 700 px de alto: `pass`, con la punta en el 70 % del alto de la ventana | Claude, implementación |
| F36 | El año de d-09 está en una fila aparte con `aria-hidden` | El año va dentro de cada hito (`<li>`), así la lista se lee entera y en orden sin el trazo (criterio 4). En escritorio, la rejilla del hito lo coloca en la banda de 200 px, en vertical | Claude, implementación |
| F37 | La punta seca de las maquetas (el pincel en movimiento) | El trazo se pinta entero y se revela con una máscara: los grosores siguen bajando tras la parte dibujada de la maqueta y el final se afina | Claude, implementación |
| F39 | El bloque de d-09 no cabe en el escenario a 960 × 700 (se salía 8,6 px y, a 1280 × 720, quedaba a 6 px del encabezado) | Escritorio de ≤ 860 px de alto: márgenes de 32 px y 24 px mínimos bajo el encabezado (como F25). Entre 960 y 1199 px de ancho (sin maqueta): títulos de 24 px, textos de 16 px y 24 px entre columnas (como F26). A 960 × 700 cabe con 1 px de margen y los textos de relleno | Claude, implementación |
| F38 | Hitos de m-08 con altura fija de 200 px: con textos largos (o a 360 px) se pisarían | Alto mínimo de 200 px y 24 px de aire debajo: con los textos de la maqueta mide lo mismo; con textos largos, crece | Claude, implementación |

## Checklist
### Piezas
- [ ] `data/ink/journey.ts`: líneas centrales y grosores, horizontal (1248 × 60) y vertical (28 × 750).
- [ ] `InkStroke.astro`: `stretch` y `guide`.
- [ ] `JourneyStroke.astro`: los dos lienzos, `--ink = --p`.
- [ ] `Journey.astro`: lista `<ol>`, escritorio (d-09) y móvil (m-08), estados de encendido (F32).
- [ ] `scroll.ts`: `data-scene-pass` y `setSteps` (F34, F35).
- [ ] `scripts/journey.ts`: umbrales y `data-lit`.
- [ ] `reference-specs.ts` (d-09 y m-08) y `qa:journey`.

### Criterios de aceptación
- [ ] 1 · Cada hito se enciende cuando la punta alcanza su círculo (±4 px), 4/4, escritorio y móvil
- [ ] 2 · Estados intermedios comparables con d-09 (tres hitos encendidos) y m-08
- [ ] 3 · Años en vertical legibles (solo Chrome: F1, F18)
- [ ] 4 · La lista es un `<ol>` con los hitos en orden y legible sin el trazo
- [ ] 5 · D1–D11

## Evidence
(pendiente)

## Next
(pendiente)
