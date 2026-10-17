---
author: Francisco Bermejo
branch: fase/3-sobre-mi
status: review
date: 2026-10-17
plan: 02-DOCS/wiki/ftd/plan-implementacion.md (fase 3)
---

# Fase 3 · Sobre mí (integración del kaizen)

## Intent
La escena kaizen dentro de su sección real (二 Sobre mí), con el párrafo, la columna de significado
(改 kai cambiar · 善 zen bueno · = cambiar a mejor · texto) y los datos rápidos, según d-04…06 y
m-03…05, en papel y sumi. Se borra `/lab/kaizen`.

## Scope
- Dentro: todo lo de la fase 3 del plan (§4): `KaizenScene.astro` (tokens, slots, `--p: 1` sin JS),
  `KaizenMeaning.astro` (nuevo), `About.astro`, `reference-specs.ts`, borrado de `pages/lab/kaizen.astro`.
  Además: ajuste del motor (`scroll.ts`) para escenarios pegados bajo la nav, `qa:kaizen` sobre `/`
  en papel y sumi, prueba nueva `qa:about`, estado `kaizen:<p>` y tamaños `ancho×alto` en `qa:shots`.
- Fuera: la prueba de Safari (F18), contenido real (párrafo, tu versión del kaizen y foto siguen con
  `pending()`), Lenis (decisión pendiente: ver Next).

## Decisiones
| # | Tema | Decisión | Quién |
| --- | --- | --- | --- |
| F17 | Las maquetas atenúan la columna de significado con opacidad (0,3 / 0,6 / 1) y ese texto no llega a AA (axe: 4 serious; Lighthouse lo vería al cargar, con la sección en p = 0) | **Color en vez de opacidad.** Cada fila (kanji + significado) en `--text-2` hasta que empieza su kanji y en `--text` desde entonces; la equivalencia (texto y filete) pasa a `--text` al terminar 善. El texto de abajo ya es `--text-2` y no cambia. Cumple AA en todo momento; el «se enciende» es más sutil que en las maquetas | Fran |
| F18 | Prueba de Safari antes de esta fase (P3, riesgo de la fase) | **Retirada**: no se prueba en Safari. Queda solo el criterio 6 de la fase 8 (Safari real sobre la web desplegada) | Fran |
| F19 | C10 decía párrafo y datos rápidos en móvil «antes de la escena» | **Después** de la escena. El encabezado abre el escenario, como en m-03 («Sobre mí · kaizen»); poner el párrafo antes dejaría texto de la sección por encima de su encabezado. El párrafo y los datos están dos veces en el HTML (escritorio dentro del escenario, móvil después); cada copia solo se muestra y se lee en su diseño | Claude, implementación |
| F20 | A 1280 × 720 la columna de significado (con «= cambiar a mejor» en dos líneas) no cabe junto a los datos rápidos y los pisaba | En escritorio con menos de 800 px de alto los datos rápidos salen del escenario y van justo después (como en móvil). Los kanji crecen a 396 px. Es la salida que prevé el criterio 3 («si no cabe, sale del escenario») | Claude, implementación |
| F21 | Entre 960 y 1440 px no hay maqueta, y el `flex-wrap` de d-04 pasaría la columna de significado debajo de los kanji en cuanto el ancho baja de 1440 | Rejilla de dos columnas: la de texto entre 280 y 320 px (25,64 % = 320 / 1248 a 1440 px) y los kanji se reparten el resto, hasta 440 px. Encabezado y cuerpo comparten columnas. Capturas a 1024 y 768 para que las valides | Claude, implementación |
| F22 | El motor medía `p = (scrollY − top) / …`: con el escenario pegado bajo la nav (89 px), p = 0 llegaba 89 px después de que la escena se pegara | `p = (scrollY − (top − sticky)) / …`, con `sticky` = el `top` calculado del escenario (0 sin sticky). `qa:kaizen` comprueba la fórmula en escritorio y móvil | Claude, implementación |
| F23 | Las pruebas tenían la ruta de Chrome de Windows | Ruta por plataforma (`/usr/bin/google-chrome` fuera de Windows); `CHROME_BIN` sigue mandando | Claude |

## Checklist
### Piezas
- [x] `KaizenScene.astro`: tinta = `--text`, guía = `--line` (C11); slots `head`, por defecto y `foot`; sticky solo con `html.js` y sin reduced motion; `--p: 1` por defecto; tamaño de los kanji según el hueco (escritorio: alto del cuerpo con *container queries*; móvil: ancho y alto de la ventana). Geometría, máscaras y tramos sin tocar.
- [x] `KaizenMeaning.astro`: lista `dl` (改 / 善), equivalencia y texto; estados ligados a `--p` (F17); en móvil cada fila a la altura de su kanji.
- [x] `About.astro`: escritorio todo en el escenario (d-04); móvil encabezado + kanji + significado en el escenario y párrafo + datos después (F19); escritorio bajo (F20).
- [x] `SectionHeading` con slot (el «· kaizen» de m-03, solo en móvil); `Section` con `flush`.
- [x] Borrado `pages/lab/kaizen.astro`; `qa:kaizen` y `qa:overflow` sobre `/`.
- [x] `reference-specs.ts` ampliado con Sobre mí; prueba nueva `qa:about` (en `pnpm qa`).

### Criterios de aceptación
- [x] 1 · `qa:kaizen` sobre `/`: 0 fuga, 0 hueco, diff final 0 px, Chrome, papel y sumi
- [x] 2 · Estados p = 0 / mitad / 1 comparables con d-04…06 y m-03…05; columna según F17 (las opacidades de las maquetas se sustituyen por color)
- [x] 3 · Encaje a 1440 × 900, 1280 × 720 y 375 × 667 (y 390 × 844): nada cortado ni pisado
- [x] 4 · «改善» se anuncia una vez; columna leída como texto; SVG fuera del árbol accesible
- [ ] 5 · Fluidez: 0 fotogramas > 33 ms ✓; p95 ≤ 16 ms **no medible aquí** (ver Evidence)
- [ ] 6 · Sumi validado por Fran con las capturas (C11) — **pendiente de Fran**

### Definición de terminado
- [x] D1 · `pnpm build` 0 errores / 0 avisos / 0 hints
- [x] D2 · `qa:specs` ±1 px, colores exactos, dos modos
- [x] D3 · Capturas (papel, sumi, móvil, reduced, sin JS; 1280 × 720, 375 × 667, 768 y 1024)
- [x] D4 · `qa:axe` 0 serious / critical, dos modos
- [x] D5 · Teclado: la sección no añade nada interactivo; recorrido igual que en la fase 2
- [x] D6 · Reduced motion
- [x] D7 · Sin JS
- [x] D8 · `qa:overflow` 0 desbordes de 360 a 1440
- [x] D9 · `qa:perf` 0 fotogramas > 33 ms en 3 pasadas
- [x] D10 · `qa:kaizen` 0 / 0 / 0 (Chrome)
- [x] D11 · JS propio ≤ 30 KB gzip sin `?debug`

## Evidence
Equipo: Linux, Chrome de `/usr/bin/google-chrome`, carga media 0,3–0,7 (en reposo, a diferencia de la
fase 2).

### Medidas de las maquetas frente a la web (Chrome, escenario pegado, p = 0) · `qa:about`
- d-04 (1440 × 900): encabezado (96, 137) 880 × 44; párrafo (1024, 149) 320 × 64; kanji (96, 249)
  440 × 440; primera fila (1024, 312,5) 320 × 87; equivalencia (1024, 486,5) 320 × 65,5; datos rápidos
  (96, 778) 1248 × 82. Web: Δ máx **0,05 px**, papel y sumi.
- m-03 (390 × 844): encabezado (24, 89) 342 × 37; kanji (16, 138) 260 × 260; fila (276, 138) 90 × 260;
  equivalencia (24, 660) 342 × 54,5. Web: Δ máx **0,00 px**, papel y sumi.
- Control negativo (`--control shift`, posiciones esperadas desplazadas 3 px): falla en todas.

### Criterio 1 · `pnpm qa:kaizen` sobre `/`
- Papel y sumi: 改 148 estados, 善 253 estados, 0 px de fuga, 0 px de hueco, p = 1 frente al glifo 0 px.
- Motor, escritorio y móvil: `--p` exacto (±1e-6) en 0, 25, 50, 75 y 100 % con la fórmula de F22.
- Control negativo (`--control noclip`): 6 124 + 31 780 px de fuga, falla.

### Criterio 2 · estados (F17) · `qa:about` y capturas
- Columna en p ≈ 0 / 0,25 / 0,45 / 0,55 / 0,75 / 1 (escritorio y móvil, papel y sumi), [fila 改, fila
  善, equivalencia, filete, texto]: todo `--text-2` → 改 `--text` → 改 y 善 `--text` → todo `--text`
  salvo el texto (siempre `--text-2`). 6/6 estados en los 4 casos.
- Capturas `inicio-{desktop,mobile}-{papel,sumi}-kaizen-{0,0.65,1}.png`: 0 = d-04 / m-03, 0,65 ≈ d-05 /
  m-04 (改 hecho, 善 a medias), 1 = d-06 / m-05.

### Criterio 3 · encaje · `qa:about`
- 1440 × 900: kanji 440 px · 1280 × 720: 396,4 px (datos fuera del escenario, F20) · 390 × 844: 260 px ·
  375 × 667: 193 px. En los cuatro: nada fuera del escenario y sin solapes entre encabezado, cuerpo y pie
  ni fuera del cuerpo. Antes de F20, 1280 × 720 daba 21–43 px de la columna sobre los datos.
- **Límite**: medido con los textos provisionales. Con el párrafo real (escritorio) o tu texto del
  kaizen (móvil) hay que repetirlo; la prueba ya lo detecta.

### Criterio 4 · accesibilidad · `qa:about`
- Árbol accesible de Chrome (escritorio y móvil): «改善» en 1 nodo de texto (`<span lang="ja">改善</span>,
  kaizen`, oculto a la vista); 0 SVG; `dl` con 改 y 善 como términos y «kai cambiar», «zen bueno» como
  texto. En móvil el 改 / 善 de la lista está oculto a la vista (ya se ve grande al lado) y sí se lee.

### Criterio 5 · fluidez · `qa:perf` (móvil emulado, CPU ×4, 5 839 px de gesto)
- 3 pasadas: 0 fotogramas > 33 ms; p50 16,7 · p95 16,7–16,8 · máx 16,8–33,4 ms; CLS 0.
- p95 ≤ 16 ms no se puede comprobar en este equipo: Chrome va sincronizado a 60 Hz y cada fotograma
  dura 16,7 ms (en la fase kaizen, en Windows, salía 14,0). La medida que manda será la del móvil real.

### Definición de terminado
- D1 · `pnpm build`: 0 errores, 0 avisos, 0 hints.
- D2 · `qa:specs`: **620 medidas** (498 de las fases 1–2 + Sobre mí: tamaños, tipografía y colores de
  d-04 y m-03) con 0 fallos. El color de la equivalencia sale de las specs (depende del estado, F17) y
  lo comprueba `qa:about`.
- D3 · Capturas en `fase-3-sobre-mi/`: papel y sumi en escritorio y móvil en p = 0 / 0,65 / 1;
  `-reduced-` y `-nojs-`; `1280x720` y `375x667` (criterio 3); **para que las valides tú**: `768` y `1024`.
- D4 · `qa:axe`: 0 serious/critical y 0 moderate/minor, escritorio y móvil, papel y sumi (1 contraste de
  logotipo exento, F6). Antes de F17: 4 serious de contraste (control negativo natural).
- D5 · `qa:keys`: 12 paradas en escritorio y 6 en móvil, como en la fase 2 (la sección no tiene nada
  interactivo).
- D6 / D7 · `qa:about`: con reduced motion y sin JS, en escritorio y móvil, `--p` = 1, escenario sin
  sticky, escena de 0,84 pantallas y la columna entera en su estado final.
- D8 · `qa:overflow`: 0 desbordes en `/` de 360 a 1440 px.
- D9 · `qa:perf`: ver criterio 5.
- D10 · `qa:kaizen`: ver criterio 1.
- D11 · `qa:weight`: JS propio **3,7 KB gzip** (fase 2: 3,6). Fuentes: 6 WOFF2, 159,2 KB (los kanji de
  la columna ya estaban en el subconjunto).

### F16 (reservas de la fase 2), repetido en reposo
- `qa:hero`: 3 cargas (+ calentamiento), 0 fotogramas > 33 ms, máx 16,8 ms.
- `qa:perf`: 3 pasadas, 0 fotogramas > 33 ms.
- Sigue siendo Chrome emulado; el móvil real queda pendiente (ver Next).

## Verificación · 2026-10-17
- Estado del código: `5f31123` + cambios sin confirmar en `fase/3-sobre-mi`.
- `pnpm build` → 0 / 0 / 0. `pnpm qa` → ✓ weight, specs, axe, keys, overflow, nav, theme, hanko, hero,
  about, perf, kaizen (12/12).
- Controles: `qa:about --control shift` falla; `qa:kaizen --control noclip` falla; los dos pasan con la
  página correcta.

### Capas no ejecutadas
- **RETIRADA** — Safari (F18).
- **NO-APLICA** — móvil real en red local: no hay dispositivo en esta sesión (Lenis y la medida de
  fluidez que manda dependen de él).

### Hallazgos descartados
- Punta del primer trazo visible en la captura de sumi con p = 0: el scroll redondeaba hacia arriba
  (p = 0,0002). `qa:shots` redondea ahora hacia abajo; no es un fallo de la página.

## Next
- Fran: validar sumi (criterio 6, C11) y la escala intermedia con las capturas de 768 y 1024.
- Fran: decidir Lenis tras probar el scroll en un móvil real (`pnpm dev --host`). Recomendación: no;
  el scroll nativo da 0 fotogramas > 33 ms y Lenis cambiaría el comportamiento del motor y de las anclas.
- Contenido pendiente para esta sección: párrafo «Sobre mí», tu versión del kaizen, foto sí o no.
  Al llegar, repetir `pnpm qa:about` (criterio 3).
