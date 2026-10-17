---
author: Francisco Bermejo
branch: fase/2-inicio
status: in-progress
date: 2026-10-17
plan: 02-DOCS/wiki/ftd/plan-implementacion.md (fase 2)
---

# Fase 2 · Inicio

## Intent
El hero (sección 一): nombre, rol, frase, botones, ensō que se dibuja al cargar y el sello que cae
sobre él (C12) y después viaja con el scroll hasta la navegación (C3).

## Scope
- Dentro: todo lo de la fase 2 del plan (§4): `Hanko.astro`, `InkStroke.astro`, `Enso.astro`,
  `data/ink/enso.ts`, `scripts/hanko.ts`, `public/favicon.svg`, `Hero.astro`, `Nav.astro`, ajustes de
  `scroll.ts` y `reference-specs.ts`, pruebas automáticas de los criterios 1–7.
- Fuera: selector de idioma (P10), botón de menú móvil (fase 8, C9), contenido real (rol, frase e
  iniciales siguen con `pending()` / `provisional()`), GSAP (no ha hecho falta: todo con `@keyframes`).

## Decisiones
| # | Tema | Decisión | Quién |
| --- | --- | --- | --- |
| F9 | Contraste del botón principal en papel (`--on-accent` sobre `--accent`: 3,52:1; axe no cuenta el peso 600 como negrita) | Fondo `#c0391d` solo en el botón, en papel (4,76:1, AA a cualquier tamaño). Token nuevo `--accent-solid` (papel `#c0391d`, sumi `#f0573a` = `--accent`). Descartados: peso 700 (+27 KB de Inter, sigue siendo solo texto grande) y texto `--text` (4,30:1, axe lo seguiría marcando) | Fran |
| F10 | Recorrido del sello (plan: recta lineal en `p`) frente a d-02 (en 200 px de scroll lleva el 36 % en x, el 84 % en y y el 53 % del tamaño: ninguna recta pasa por ahí) | Dos tramos lineales en `p` con d-02 como punto intermedio, a 200 px de scroll; en otros tamaños, las mismas fracciones del recorrido. La «interpolación esperada» del criterio 2 es esa curva | Fran |
| F11 | Relevo hero → nav (plan: «en `p = 1` se cambia por el sello de la nav») | **Un solo sello**: el de la nav. Sobre el hero, el CSS lo lleva al sitio del sello del hero, a su escala y con su anillo, radio, giro y letra; en `p = 1` queda sin transformar en su hueco. No hay cambio de un sello por otro que pueda verse. El sello del hero queda como sitio de salida y como el que se ve quieto sin JS o con reduced motion | Claude, implementación (cumple el criterio 3 con 0,00 px) |
| F12 | La caída del sello al cargar (C12) | La hace ese mismo sello de la nav, colocado sobre el ensō: escala 1,9 → 0,94 → 1 con giro y opacidad (`@keyframes`, 1,2–1,58 s). La mancha es una forma SVG fija calculada en el build que solo cambia escala y opacidad (1,38–1,6 s) y desaparece: el estado final es d-01 | Claude, implementación |
| F13 | Antetítulo de sección 1 px más alto que en las maquetas (heredaba el `line-height: 1.5` de la web) | `SectionHeading` con `line-height: normal`, como las maquetas (44 px en escritorio, 37 en móvil) | Claude, corrección de fidelidad |
| F14 | Fuentes del hero precargadas | Shippori 600 (título) e Inter 600 (botones) se precargan. Si llegan tarde, el cambio de fuente rehace la página en mitad de la animación de carga (ver la evidencia del criterio 1) | Claude, corrección de rendimiento |
| F15 | «ō» de ensō (nombre accesible del ensō) | Entra en el subconjunto de Inter. Shippori no tiene vocales con macrón en ninguna versión: `subset-fonts.ts` no las exige en la serif (solo se usan en nombres accesibles o texto de Inter) | Claude |

## Checklist
### Piezas
- [x] `scroll.ts`: modo `pass` con borde `nav` y `data-scene-track` — el tránsito usa `top nav` / `bottom nav` midiendo `#inicio`; `qa:kaizen` sigue 0 / 0 / 0 con el motor cambiado.
- [x] `Hanko.astro` (104 / 72 / 44 / 50 / 36 px, doble borde, giro) y sustitución del sello provisional de `Nav.astro` — medidas como tokens `--hanko-{hero,knot,nav}-*`; `qa:specs` las mide en los dos sitios.
- [x] `InkStroke.astro` + `data/ink/enso.ts` + `Enso.astro` — 38 tramos copiados de la maqueta; máscara con `stroke-dashoffset` sobre `pathLength = 1`.
- [x] `Hero.astro` (d-01, d-03, m-01, m-02; escala fluida 960–1440) — `qa:specs` 498 medidas.
- [x] Estampación al cargar (ensō 0,1–1,2 s y caída del sello con mancha, ≤ 1,6 s, `@keyframes`) — `qa:hero`.
- [x] `scripts/hanko.ts` y tránsito hero → nav (F10, F11) — `qa:hanko`.
- [x] `public/favicon.svg` — generado por `scripts/favicon.ts` (predev / prebuild) con las iniciales de `site.ts` en trazados de Shippori 600; papel y sumi revisados a ojo.
- [x] `reference-specs.ts` ampliado con el hero; pruebas `qa:hero` y `qa:hanko` en `pnpm qa`.

### Criterios de aceptación
- [ ] 1 · Ensō y caída del sello ≤ 1,6 s; 0 fotogramas > 33 ms durante la animación (móvil, CPU ×4) — duración ✓; fotogramas: **pendiente de una medida con el equipo en reposo** (ver evidencia)
- [x] 2 · Tránsito: 5 estados (0, 25, 50, 75, 100 %) ±2 px de la curva; d-02 ±2 px
- [x] 3 · Relevo en `p = 1`: posición y tamaño ≤ 1 px
- [x] 4 · Volver arriba: mismas 5 medidas, sin saltos
- [x] 5 · Reduced motion / sin JS: ensō y sello del hero estáticos; sello de la nav siempre visible
- [x] 6 · Título 152 px a 1440, `clamp(44px, 17vw, 64px)` en móvil; sin desborde a 960–1440
- [x] 7 · Contraste del botón principal en todos los anchos (F9)

### Definición de terminado
- [x] D1 · `pnpm build` 0 errores / 0 avisos
- [x] D2 · `qa:specs` ±1 px, colores exactos, dos modos
- [x] D3 · Capturas (papel, sumi, móvil, reduced, sin JS; 768 y 1024 para la escala intermedia)
- [x] D4 · `qa:axe` 0 serious / critical, dos modos
- [x] D5 · Teclado: todo alcanzable, foco visible, ≥ 44 × 44
- [x] D6 · Reduced motion
- [x] D7 · Sin JS
- [x] D8 · `qa:overflow` 0 desbordes de 360 a 1440
- [ ] D9 · `qa:perf` 0 fotogramas > 33 ms en 3 pasadas — **pendiente de una medida con el equipo en reposo**
- [x] D10 · `qa:kaizen` 0 / 0 / 0 (Chrome, F1)
- [x] D11 · JS propio ≤ 30 KB gzip sin `?debug`

## Evidence
### Medidas de las maquetas (Chrome, 1440 × 900 y 390 × 844, con las WOFF2 de la web)
- d-01: hero 815 px de alto (y 89 → 904); título y 221, 298 px de alto; rol y 546,9; frase y 602,6;
  botones y 696,6 (199 y 153 px de ancho); ensō x 864, y 212,8, 480 × 484; sello 104 px con centro
  (1272,8, 635,1); pie y 796,6.
- d-02 (hero subido 200 px): sello de 72 px en (822, 104), centro (858, 140), −3,5°.
- m-01: ensō 168 px en (198, 93); sello 50 px con centro (341, 236); título y 281; botones y 534,3 y
  602,3 (342 px); pie y 771.
- Con las fuentes de Google y con las WOFF2 de la web salen las mismas cifras.

### Criterios 2–4 · `pnpm qa:hanko`
- Escritorio (papel y sumi): d-02 en (822,0, 104,0), 72,0 px, Δ 0,01 px. Cinco estados × dos sentidos,
  Δ máx 0,02 px; barrido cada 25 px bajando y subiendo (68 muestras), Δ máx 0,04 px; relevo en la nav
  (p = 1, 1,5 y 3 veces el paso del hero) Δ 0,00 px; salida desde el sello del hero Δ 0,00 px.
- Móvil (papel y sumi): cinco estados × dos sentidos Δ máx 0,03 px; barrido (66 muestras) Δ máx
  0,02 px; relevo 0,00 px; salida 0,00 px.
- Relevo de estilo: en p = 1, anillo, separación, radio, giro y escala de la letra iguales a los del
  sello quieto de la nav (reduced motion), con una tolerancia de 0,01.
- Control negativo (`--control shift`, primer tramo desplazado 3 px): 266 fallos, sale con 1.

### Criterios 1, 5, 6 y 7 · `pnpm qa:hero`
- 1 · Duración: `ink-draw` 100–1200 ms · `hanko-stamp` 1200–1580 ms · `hanko-splash` 1380–1600 ms; el
  sello cae cuando acaba el ensō. Igual en escritorio y móvil.
- 1 · Fotogramas (móvil, CPU ×4). Historia de la investigación:
  - Primera versión: fotogramas sueltos de 39–60 ms en 1 de cada 4–8 cargas. Prueba A/B (16 + 16
    cargas): con animación 2–8 cargas con algún fotograma > 33 ms; sin animación, 0.
  - Traza de Chrome: el coste no estaba en cada fotograma (unos 4 pintados de 1,6–2 ms) sino al
    principio, a 150–250 ms: repintado completo de la página (11,5 ms), de una capa enorme del SVG
    (58 000 px de ancho, por `overflow: visible`) y maquetación completa (8–10 ms, hasta 99 ms en las
    cargas lentas). Es el cambio a las fuentes reales: Shippori 600 e Inter 600 no se precargaban.
  - Cambios: precarga de Shippori 600 e Inter 600 (F14); SVG del ensō sin `overflow: visible`, con la
    región de la máscara ajustada al lienzo y capa propia mientras se dibuja; la animación mueve solo
    el `stroke-dashoffset` de la máscara (antes una propiedad heredada que recalculaba todo el SVG);
    `hanko.ts` marca «listo» en el sello, no en `<html>`; el ensō empieza a 100 ms.
  - Tras los cambios, con el equipo tranquilo: A/B de 32 + 32 cargas, **0 cargas** con fotogramas
    > 33 ms con y sin animación; evento más largo durante la animación 12,8 ms (antes 46–99 ms).
  - `qa:hero` mide desde que el ensō empieza a moverse (su retardo de 100 ms) hasta 1,6 s. El único
    fotograma largo que quedaba caía a 6 ms de crearse las animaciones, en el primer pintado de la
    página, antes de que se mueva nada.
  - **Pendiente:** la medida final de `qa:hero` se tomó con el equipo cargado (CPU al 73–82 % sin
    pruebas: League of Legends, Wallpaper Engine, The iTero Coach). En esas condiciones la animación
    empezaba a 450–990 ms en vez de a 100–300 y Chrome daba la mitad de fotogramas: cargas con 1–9
    fotogramas largos. No sirve como evidencia ni a favor ni en contra.
- 5 · Reduced motion y sin JS, escritorio y móvil: 0 animaciones, máscara del ensō entera
  (`stroke-dashoffset` 0), sello del hero visible, sello de la nav visible, sin transformar y en su
  hueco (Δ 0,00 px).
- 6 · Título: 1440 → 152 px; 1366 → 144,2; 1280 → 135,1; 1024 → 108,1; 960 → 101,3 (10,5556vw, mín.
  88); siempre 2 líneas, dentro de su columna (margen 3,9–45,3 px) y a 67,9–109,3 px del ensō. Móvil:
  320 → 54,4; 360 → 61,2; 390, 430 y 768 → 64 (= `clamp(44px, 17vw, 64px)`).
- 7 · Botón principal de 360 a 1440 px: papel 4,76:1, sumi 5,42:1; 19 px en móvil y 20 px en
  escritorio, peso 600.

### Definición de terminado
- D1 · `pnpm build`: `astro check` 0 errores, 0 avisos, 0 hints.
- D2 · `qa:specs`: **498 medidas** (192 de la fase 1 + hero: tamaños, posiciones al cargar, tipografía
  y colores; escritorio y móvil, papel y sumi) contra d-01, d-03, d-07, m-01, m-02, m-06: 0 fallos.
  Nuevo en la herramienta: posiciones (`rect`) y medida con reduced motion (el sello de la nav, que sin
  ella está en tránsito sobre el hero). Control negativo (y del título 221 → 231): 2 fallos.
- D3 · Capturas en `fase-2-inicio/`, con la carga terminada (`--wait 1800`, nuevo en `qa:shots`):
  - `inicio-{desktop,mobile}-{papel,sumi}-{0,200px,450px,sobre-mi}.png`: sello recién estampado, d-02,
    mitad del tránsito y sello ya en la nav.
  - `-reduced-` (escritorio papel, móvil sumi) y `-nojs-` (escritorio y móvil papel).
  - **Para que las valides tú**: `inicio-768-papel-*` (768 × 1024, diseño móvil con los botones a
    480 px como máximo) e `inicio-1024-papel-*` (1024 × 768, escritorio a escala).
  - Revisadas a ojo frente a d-01, d-02, d-03, m-01 y m-02. En `desktop-sumi-450px` asoma la cola de la
    «j» de «Bermejo» bajo la nav: es el título pasando por debajo, no un fallo.
- D4 · `qa:axe` (con la carga terminada): 0 serious/critical y 0 moderate/minor en escritorio y móvil,
  papel y sumi; 1 contraste de logotipo exento (F6) en papel.
- D5 · `qa:keys`: 12 paradas en escritorio (salto, sello, 6 enlaces, tema, «Ver proyectos», «Contacto»,
  «Seguir: Sobre mí») y 6 en móvil; todas con foco visible y área ≥ 44 × 44. Corrección de la
  herramienta: detectaba la vuelta por el texto y se paraba en el segundo «Contacto»; ahora marca cada
  elemento visitado.
- D6 · Reduced motion: `qa:hero` (criterio 5) y capturas `-reduced-`: todo dibujado y quieto.
- D7 · Sin JS: `qa:hero` (criterio 5) y capturas `-nojs-`: hero completo y legible; sello en la nav.
- D8 · `qa:overflow`: 0 desbordes en `/` y `/lab/kaizen/` de 360 a 1440 px. Encontró uno real a 1024 px
  (19 px): el sello, al empezar a caer a escala 1,9 junto al borde derecho. Corregido con
  `overflow-x: clip` en la cabecera (no crea contenedor de scroll; el `sticky` no cambia).
  Corrección de la herramienta: la limpieza del perfil temporal de Chrome (`EPERM`) ya no tumba la
  prueba; reintenta y avisa.
- D9 · `qa:perf` con el equipo cargado: p50 5,6 ms, CLS 0; pasadas 1 y 3 limpias, pasada 2 con un
  fotograma de 33,4 ms. **Pendiente** de repetir en reposo, como el criterio 1.
- D10 · `qa:kaizen` (Chrome, F1): 148 + 253 estados, 0 / 0 / 0; `--p` exacto en las 5 posiciones.
- D11 · `qa:weight`: JS propio **3,6 KB gzip** (fase 1: 2,7 KB; +0,9 KB por `hanko.ts` y el motor
  ampliado). Fuentes: 6 WOFF2, 159,2 KB.

## Verificación · 2026-10-17
- Estado del código: `ab38618` + cambios sin confirmar (dirty) en `fase/2-inicio`.
- Ejecución nueva tras el último cambio: `pnpm build` → 0 errores, 0 avisos, 0 hints.
  `pnpm qa` → ✓ weight, specs, axe, keys, overflow, nav, theme, hanko, kaizen · ✗ hero (solo la parte de
  fotogramas), ✗ perf. CPU del equipo al 71 % sin pruebas en marcha.
- Controles de las pruebas nuevas: `qa:hanko --control shift` falla (266); `qa:specs` con la `y` del
  título alterada falla (2). Los dos pasan con la página correcta. Límite: prueban que esos dos fallos
  concretos se detectan, no cualquier desviación posible.

### Capas no ejecutadas
- **SUSTITUIDA** — criterio 1 (fotogramas) y D9: medidos con el equipo cargado. En esas condiciones
  Chrome da la mitad de fotogramas (p50 del scroll 11 ms en vez de 5,6) y no se puede distinguir una
  regresión de la página del ruido del equipo. La A/B de 32 + 32 cargas con el equipo tranquilo
  (0 / 0) apoya que la animación no añade fotogramas largos, pero no es la medida de `qa:hero`.
- **NO-APLICA** — Safari / iPhone en red local (riesgo de la fase en el plan): no hay dispositivo en
  esta sesión; queda para la prueba de Safari previa a la fase 3 (P3).

### Hallazgos descartados
- Marca clara junto al sello en `desktop-sumi-450px`: es la cola de la «j» de «Bermejo» bajo la nav
  (recorte ampliado ×4 en el scroll de 450 px).
- `kanji-geometry.ts` aparece modificado: solo cambia el final de línea al regenerarse; `git diff` no
  muestra cambios de contenido.

### Veredicto: FAIL — 2 puntos abiertos (criterio 1 · fotogramas y D9), sin evidencia válida por la
carga del equipo. Todo lo demás, verificado.

## Next
- Repetir `pnpm qa:hero` y `pnpm qa:perf` con el equipo en reposo y cerrar el criterio 1 y la D9.
- Fran: validar la escala intermedia (capturas de 768 y 1024).
- Contenido pendiente para esta sección: rol, frase del hero e iniciales del sello.
