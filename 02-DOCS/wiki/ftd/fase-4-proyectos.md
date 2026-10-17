---
author: Francisco Bermejo
branch: fase/4-proyectos
status: review
date: 2026-10-17
plan: 02-DOCS/wiki/ftd/plan-implementacion.md (fase 4)
---

# Fase 4 · Proyectos (escenario y paneles)

## Intent
La sección 三 Proyectos según d-07, d-08, m-06 y m-07, con los cinco proyectos: en escritorio, paneles
shoji que entran con el scroll en una escena sticky de cinco tramos; en móvil, un carrusel con
`scroll-snap` nativo y pestañas 一–五. Contenido base con marcadores; las animaciones propias de cada
proyecto quedan para la fase 7.

## Scope
- Dentro: todo lo de la fase 4 del plan (§4): `ProjectPanel.astro`, `ShojiEdge.astro`,
  `ProjectIndex.astro`, `TuiFrame.astro`, `scripts/projects.ts`, `sections/Projects.astro`,
  `data/projects.ts`, `reference-specs.ts`. Además: evento `scenestep` en el motor (`scroll.ts`),
  prueba nueva `qa:projects` (en `pnpm qa`), estados `<escena>:<f>` en `qa:shots` (antes solo
  `kaizen:`), tipos AVIF/WebP en el servidor de QA y `sharp` como dependencia de desarrollo.
- Fuera: Safari (F18), contenido real (problema, stack, dato, enlaces, capturas: con `pending()`),
  detalles animados de cada proyecto (fase 7), móvil real en red local (no hay dispositivo en esta sesión).

## Decisiones
| # | Tema | Decisión | Quién |
| --- | --- | --- | --- |
| F24 | m-06 atenúa las pestañas inactivas con opacidad 0,55 sobre `--accent-text`: da 2,3:1 en papel, por debajo del 3:1 de texto grande (el mismo problema que F17) | Inactivas en `--text-2` (4,97:1), activa en `--accent-text` con su filete. Sin opacidad | Claude, implementación |
| F25 | Con el contenido de d-07 el panel solo cabe en el escenario a partir de ~860 px de alto: a 1280 × 720 se salía 135 px (el criterio del plan exige el escenario a 1280 × 720) | **Panel compacto** en escritorio de ≤ 860 px de alto: sin el kanji del panel (ya está en el índice y en el borde shoji), nombre de 44 px, márgenes de 16 px, captura y texto a partes iguales, y márgenes de la sección de 32 px. Por debajo de 700 px de alto, apilado (plan) | Claude, implementación |
| F26 | Entre 960 y ~1250 px no hay maqueta y el texto del panel quedaba en ~180 px | Índice de 160 px y hueco de 32 px por debajo de 1200 px; si el mazo mide menos de 860 px (*container query*), captura y texto a partes iguales y nombre de 44 px. Capturas a 1024 y 1280 × 720 para que las valides | Claude, implementación |
| F27 | Cómo entra cada panel | El panel j entra desde la derecha en torno al límite j/5 (12 % del recorrido); a la vez, el siguiente asoma 96 px con su celosía e índice, que se desvanece en el primer tercio de su entrada. En el centro de cada tramo el panel está quieto y entero; ahí llevan el índice y los `#hash`. `aria-current` cambia a mitad de la entrada (`data-step` del motor) | Claude, implementación |
| F28 | La franja shoji en móvil | Fija a la derecha del carrusel (como en m-06): el panel siguiente pasa por debajo. Se oculta en el último panel. El último panel también se alinea a la izquierda (hueco de 18 px al final del carrusel) | Claude, implementación |
| F29 | Stack con menos de 3 tecnologías y enlaces sin URL | Se rellenan con «[tecnología]» hasta tres (m-06 lleva Go + 2). Un enlace pendiente lleva a su propio panel (`#chainview`, como el `#repo` de las maquetas) y lleva `data-pending` | Claude, implementación |
| F30 | Pie de captura en móvil | m-06 no lo muestra: se mantiene para lectores de pantalla, oculto a la vista | Claude, implementación |
| F31 | Captura con `<Picture>`: `astro build` no genera variantes sin `sharp` como dependencia directa con pnpm (el build fallaba con *MissingSharp* en cuanto hay una imagen) | `sharp@0.35.5` en `devDependencies` (la misma versión que ya traía Astro) | Claude, implementación |

## Checklist
### Piezas
- [x] `ProjectPanel.astro`: número, nombre, línea, captura (TUI o `<Picture>` AVIF/WebP, o marco de relleno con el marcador), problema, stack, dato, enlaces. HTML en orden de lectura; en escritorio, rejilla 7 : 5 con la captura a la izquierda.
- [x] `ShojiEdge.astro`: celosía de 96 px con índice (escritorio, dentro del panel siguiente) y franja de 18 px (móvil).
- [x] `ProjectIndex.astro`: lista de 200 px (escritorio) y pestañas de 52 × 52 (móvil), un solo `<ol>`; nombre accesible = nombre del proyecto.
- [x] `TuiFrame.astro`: marco de terminal con `--term-*` y texto real (fase 7 pondrá la salida de la TUI).
- [x] `Projects.astro`: tres modos con el mismo HTML (escenario, carrusel, apilado).
- [x] `scripts/projects.ts`: índice ↔ panel (paso del motor / IntersectionObserver), clic y `#hash` al centro del tramo o al panel del carrusel, foco del teclado a la vista, `data-last`.
- [x] `scroll.ts`: evento `scenestep`.
- [x] `reference-specs.ts` (d-07 y m-06) y `qa:projects`.

### Criterios de aceptación
- [x] 1 · Escritorio: panel visible = `aria-current` en 5/5 tramos (papel y sumi)
- [x] 2 · Índice 5/5 y `#hash` 5/5, en escritorio y móvil
- [x] 3 · Tab recorre los 10 enlaces de los paneles en orden y cada uno queda visible (escritorio y móvil)
- [x] 4 · Móvil: deslizar 8/8 (ida y vuelta) y pestañas 5/5 sincronizan `aria-current`; `scroll-snap` alinea ±1 px
- [x] 5 · Medidas de d-07 y m-06 ±1 px; `--accent-text-surface` en los enlaces y el número del panel
- [~] 6 · `astro:assets` comprobado con una captura de relleno temporal (ver Evidence); **sin capturas reales todavía** — repetir al llegar
- [x] 7 · D1–D11

### Definición de terminado
- [x] D1 · `pnpm build` 0 errores / 0 avisos / 0 hints
- [x] D2 · `qa:specs` ±1 px, colores exactos, dos modos
- [x] D3 · Capturas (papel, sumi, móvil, reduced, sin JS; 1280 × 720, 768 y 1024)
- [x] D4 · `qa:axe` 0 serious / critical, dos modos
- [x] D5 · `qa:keys` foco visible y ≥ 44 × 44 en todas las paradas
- [x] D6 · Reduced motion: apilado
- [x] D7 · Sin JS: apilado
- [x] D8 · `qa:overflow` 0 desbordes de 360 a 1440
- [x] D9 · `qa:perf` 0 fotogramas > 33 ms en 3 pasadas
- [x] D10 · `qa:kaizen` 0 / 0 / 0 (Chrome)
- [x] D11 · JS propio ≤ 30 KB gzip sin `?debug`

## Evidence
Equipo: Linux, Chrome de `/usr/bin/google-chrome`.

### Medidas de las maquetas frente a la web · `qa:projects`
- d-07 (1440 × 900, escenario pegado, p = 0): encabezado (96, 137) 1248 × 44; índice (96, 213) 200 × 639;
  primer enlace (96, 214) 200 × 64; mazo (344, 213) 1000 × 639; panel (344, 235) 888 × 595; TUI (381, 272)
  452,33 × 521; nombre (873,33, 332) 321,67 × 63; stack (873,33, 572) × 74; dato (873,33, 670) × 33,8;
  enlaces (873,33, 749) × 44; borde shoji (1248, 235) 96 × 595. Web: Δ máx **0,03 px**, papel y sumi.
- m-06 (390 × 844, sección bajo la nav): encabezado (24, 93); pestañas (24, 150) 342 × 53; mazo (24, 227)
  342 × 628,97; panel (24, 243) 316 × 596,97; TUI (45, 376,38) 274 × 182; enlaces (45, 774,97); franja (348, 243)
  18 × 596,97; aviso (24, 869,97). Web: Δ máx **0,41 px**, papel y sumi.
- Medidas sacadas de d-07 y m-06 abiertas en el mismo Chrome con sus fuentes.
- Control negativo (`--control shift`): 40 fallos, Δ 3,02 / 3,41 px.

### Criterios 1–4 · `qa:projects`
- 1: en el centro de cada tramo, el panel de encima en el centro del mazo es el k, está alineado (±1 px) y
  `aria-current` es el k: 5/5 en papel y 5/5 en sumi.
- 2: clic real (CDP) en los enlaces del índice en orden 五, 二, 四, 一, 三: 5/5 en escritorio (panel quieto,
  escenario pegado, `location.hash` actualizado) y 5/5 en móvil (panel alineado en el carrusel). Página
  nueva con cada `#hash`: 5/5 y 5/5 (en móvil el panel entero dentro de la ventana).
- 3: Tab desde el último enlace del índice: los 10 enlaces de los paneles en orden; cada uno visible
  (`elementFromPoint` en su centro lo alcanza a él). Escritorio y móvil.
- 4: gesto táctil (`synthesizeScrollGesture`) 一→五→一: 8/8 alineados ±1 px con `aria-current` correcto;
  la franja vuelve al salir del último.

### Encaje · `qa:projects`
- En el centro de cada tramo, nada del panel sale de su caja de contenido: 1440 × 900, 1280 × 720,
  1024 × 768, 1920 × 1080 y 960 × 700. Antes de F25: 1280 × 720 +135–210 px, 1024 × 768 +70–111 px,
  960 × 700 +138–207 px; con F25 y relleno de 28 px, 960 × 700 aún +2 px (bajado a 24 px).
- **Límite**: medido con los marcadores. Con el texto real (problema, stack de 5) hay que repetirlo; la
  prueba lo detecta.

### Criterio 6 · imágenes (`<Picture>`)
- Con una captura de relleno temporal de 1600 × 1000 en los cuatro paneles con imagen (no se versiona):
  `<picture>` con AVIF y WebP a 480/960/1440 w, `<img>` con `width`/`height` y `loading="lazy"`, `decoding="async"`;
  se sirve `image/avif`. Encaje 5/5 tamaños dentro; `qa:perf` CLS **0,0000** en 3 pasadas.
- Dos fallos encontrados así y corregidos: sin `sharp` directo el build fallaba (F31); `<picture>` no
  ocupaba el hueco y la imagen desbordaba el panel 300–600 px.
- Chainview no lleva imagen (su captura es la TUI en HTML), así que la primera imagen de la sección
  (DocChain) es diferida: está en el segundo tramo.

### Definición de terminado
- D1 · `pnpm build`: 0 errores, 0 avisos, 0 hints.
- D2 · `qa:specs`: **886 medidas** (620 de las fases 1–3 + Proyectos: d-07 y m-06) con 0 fallos.
- D3 · Capturas en `fase-4-proyectos/`: escritorio papel y sumi en p = 0 / 0,2 (entrando) / 0,5 / 0,95;
  móvil papel y sumi; `-reduced-` y `-nojs-` (apilado); **para que las valides tú**: `1280x720`
  (compacto, F25), `1024` (F26) y `768` (carrusel).
- D4 · `qa:axe`: 0 serious/critical y 0 moderate/minor, escritorio y móvil, papel y sumi (1 contraste de
  logotipo exento, F6).
- D5 · `qa:keys`: 27 paradas en escritorio (12 + 5 del índice + 10 de los paneles) y 21 en móvil (6 + 5 + 10);
  todas con foco visible, dentro de la ventana y ≥ 44 × 44.
- D6 / D7 · `qa:projects`: con reduced motion y sin JS, en escritorio y móvil, y a 1280 × 650: escenario
  sin sticky, paneles en flujo y en orden, sin desplazamiento, sin bordes shoji y sin el aviso de deslizar.
- D8 · `qa:overflow`: 0 desbordes de 360 a 1440 px.
- D9 · `qa:perf`: 3 pasadas, 0 fotogramas > 33 ms (máx 16,8–33,4 ms), CLS 0.
- D10 · `qa:kaizen`: 0 / 0 / 0 en papel y sumi; motor exacto en escritorio y móvil.
- D11 · `qa:weight`: JS propio **5,0 KB gzip** (fase 3: 3,7). Fuentes sin cambios: 159,2 KB.

## Verificación · 2026-10-17
- Estado del código: `5fe5465` + cambios sin confirmar en `fase/4-proyectos`.
- `pnpm build` → 0 / 0 / 0. `pnpm qa` → ✓ weight, specs, axe, keys, overflow, nav, theme, hanko, hero,
  about, projects, perf, kaizen (13/13).
- Controles: `qa:projects --control shift` falla; pasa con la página correcta.

### Capas no ejecutadas
- **RETIRADA** — Safari (F18). El riesgo del plan («scroll-snap y pestañas desincronizados en Safari») está
  mitigado con IntersectionObserver (no `scrollend`), pero sin probar.
- **NO-APLICA** — móvil real en red local: no hay dispositivo en esta sesión.

### Hallazgos descartados
- El gesto `touch` explícito no desplaza el carrusel en Chrome sin interfaz (igual que en `qa:perf`); con
  `default` y la emulación táctil, sí. Es de la herramienta, no de la página.

## Next
- Fran: validar el panel compacto (1280 × 720, F25), la escala intermedia (1024, F26) y la entrada de los
  paneles (p = 0,2) con las capturas.
- Contenido pendiente por proyecto: problema, stack (3–5), enlaces a repo y demo, dato y capturas. Al
  llegar, repetir `pnpm qa:projects` (encaje) y el criterio 6 con las capturas reales.
- Fase 7: los detalles animados de cada panel pueden leer el avance de su tramo de `--p` y `--e`.
