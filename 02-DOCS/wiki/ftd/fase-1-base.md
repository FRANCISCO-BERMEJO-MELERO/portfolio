---
author: Francisco Bermejo
branch: fase/1-base
status: done-pending-d9
date: 2026-10-17
plan: 02-DOCS/wiki/ftd/plan-implementacion.md (fase 1)
---

# Fase 1 · Base

## Intent
El esqueleto sobre el que se montan las secciones: proyecto en `web/`, tokens, fuentes, layout,
navegación, tema, textos centralizados, contenido con marcadores, motor de scroll y herramientas de QA.

## Scope
- Dentro: todo lo de la fase 1 del plan (§4), con el punto de corte 1a / 1b.
- Fuera: menú móvil (fase 8, C9), selector de idioma y `/en/` (P10), contenido de las secciones
  (fases 2–6), el sello que viaja (fase 2), colores del kaizen en sumi y `--p: 1` sin JS de la escena
  (fase 3).

## Decisiones (17 oct 2026)
| # | Tema | Decisión | Quién |
| --- | --- | --- | --- |
| F1 | Firefox | Ya no está instalado. **Se elimina de la auditoría**: `qa:kaizen` y D10 solo en Chrome | Fran |
| F2 | Sello de la barra móvil (m-01: 36 × 36) frente a D5 (≥ 44 × 44) | Se ve a 36 px; el área pulsable del enlace es 44 × 44 | Fran |
| F3 | Nav: d-01 (28 px, `aria-current="page"`) frente a d-07 (32 px, `"true"`) | Medidas de d-01; `aria-current="true"` (secciones de una misma página) | Fran |
| F4 | Sello en la nav antes de la fase 2 | Visible y fijo (como d-07 / m-06) hasta que la fase 2 añada el tránsito | Fran |
| F6 | Contraste del sello en papel (3,52:1; axe no cuenta 600 como negrita) | Excepción de logotipo (WCAG 1.4.3): el sello lleva `data-logo` y `qa:axe` lo exime solo de la regla de contraste, contándolo aparte | Fran |
| F7 | Nombre accesible del enlace del sello sin el texto visible «FB» (axe, WCAG 2.5.3) | «Inicio — sello FB de Francisco Bermejo» (d-07 decía «Inicio — sello de Francisco Bermejo») | Claude, corrección de accesibilidad |
| F8 | Área pulsable de los enlaces cortos de la nav («Inicio», «Stack» < 44 px de ancho) | Misma técnica que F2: pseudo-elemento de 46 px, sin cambio visual | Claude, extensión de F2 |
| F5 | API de fuentes de Astro 7.3.5 | Admite proveedor local (`fontProviders.local()`, componente `<Font>` con `preload` y *fallbacks* optimizados). Se usa la API; no hace falta la alternativa del §1.4 | Comprobado en `node_modules/astro` 7.3.5 |

## Checklist
### 1a · mover + tokens + fuentes + layout + motor + QA
- [x] Maquetas a `reference/` (P11) — commit `037909d`; `cmp` byte a byte con las de la raíz: idénticas.
- [x] `git mv kaizen-lab web` — commit `9640fca`; `pnpm build` 0/0/0 y auditoría en Chrome 0 / 0 / 0 (148 + 253 estados) antes de añadir nada.
- [x] Tokens de los dos modos (`tokens.css`) y `global.css` — los 14 tokens del §1.5; sin JS manda `prefers-color-scheme`. Medidos en 1b con `qa:specs`.
- [x] Fuentes subconjuntadas (`subset-fonts.ts`) y registradas con la API de Astro (F5) — 6 WOFF2, 158,2 KB; deterministas (md5 idéntico al regenerar); control negativo: con caracteres sin glifo (`≥ Δ α`) el script falla.
- [x] `Layout.astro` (head, tema sin parpadeo, `html.js`, fuentes, `lang="es"`) — `astro check` 0/0/0; se prueba con la página real en 1b.
- [x] Motor `scroll.ts` (sticky + pass, pasos, reduced motion, `override`) y kaizen migrado — `qa:kaizen`: 0 / 0 / 0 y `--p` exacto en 5 posiciones de scroll.
- [x] Herramientas `scripts/qa/*` — `qa`, `qa:shots`, `specs`, `axe`, `keys`, `overflow`, `nav`, `theme`, `perf`, `kaizen`, `weight`; `tsc` estricto sin errores.
- [x] Commit 1a — `cf83456`.

### 1b · nav, tema, textos, datos
- [x] `Nav.astro`, `ThemeToggle.astro`, `SectionHeading.astro`, `Section.astro`, secciones vacías, `Home.astro`, `pages/index.astro` — `qa:specs` 192 medidas.
- [x] `theme.ts`, `nav.ts` — `qa:theme` y `qa:nav`.
- [x] `i18n/ui.ts`, `data/*`, `lib/pending.ts`, `content-pending.ts` — 22 marcadores listados; contenido real de las maquetas (stack de d-11, trayectoria de d-09, GitHub de d-13).
- [x] `web/LICENSE-kanji.md`
- [x] Commit 1b — el commit «fase 1b» de la rama `fase/1-base`.

### Criterios de aceptación
- [x] 1 · `qa:kaizen` en `/lab/kaizen` con el motor nuevo: 0 / 0 / 0 (Chrome, F1)
- [x] 2 · Nav 88 / 64 px, fija; `qa:specs` ±1 px contra d-01 y m-01
- [x] 3 · Sección activa correcta en 6/6 posiciones
- [x] 4 · Tema: sigue al sistema, se recuerda, 0 parpadeo (primer pintado con CPU ×4)
- [x] 5 · Barra móvil 64 px con sello y tema, sin menú; `<html lang="es">`
- [x] 6 · Ningún texto de interfaz a mano en componentes
- [x] 7 · Fuentes: Shippori ≤ 60 KB por peso, total ≤ 220 KB, 0 caracteres sin glifo, CLS ≤ 0,02
- [x] 8 · `content:pending` lista los marcadores; `STRICT_CONTENT=1 pnpm build` falla

### Definición de terminado
- [x] D1 · `pnpm build` 0 errores / 0 avisos
- [x] D2 · `qa:specs` ±1 px, colores exactos, dos modos
- [x] D3 · Capturas (papel, sumi, móvil, reduced)
- [x] D4 · `qa:axe` 0 serious / critical, dos modos
- [x] D5 · Teclado: todo alcanzable, foco visible, ≥ 44 × 44
- [x] D6 · Reduced motion
- [x] D7 · Sin JS
- [x] D8 · `qa:overflow` 0 desbordes de 360 a 1440
- [~] D9 · `qa:perf` 0 fotogramas > 33 ms en 3 pasadas — **parcial**: 2 de 4 ejecuciones limpias; en las otras, 1 fotograma suelto (33,4 y 38,9 ms). Ver evidencia.
- [x] D10 · `qa:kaizen` 0 / 0 / 0 (Chrome, F1)
- [x] D11 · JS propio ≤ 30 KB gzip sin `?debug`

## Evidence
### 1a
- Traslado: `pnpm install` + `pnpm build` en `web/` → `astro check` 0 errores / 0 avisos / 0 hints.
- Auditoría del kaizen antes de tocar nada (Chrome, `?debug&audit`): 改 148 estados y 善 253, fuga 0 px,
  hueco 0 px, p = 1 frente al glifo 0 px (Δα 0). Igual que en el lab.
- Motor nuevo (`pnpm qa:kaizen`): mismos 148 + 253 estados, 0 / 0 / 0; `--p` = 0 · 0,25 · 0,5 · 0,75 · 1
  en las cinco posiciones de scroll (error ≤ 1e-6). Control negativo `--control noclip`: 6 124 px y
  31 780 px de fuga → sale con 1.
- Fuentes (`pnpm fonts`): Shippori 400 30,8 KB · 600 32,7 KB · Inter 400/500/600 26,6 / 27,1 / 27,2 KB ·
  Plex Mono 13,8 KB · total 158,2 KB. CJK del contenido: 改 善 (extraídos de `src/data`).
- Peso (`pnpm qa:weight`): JS propio 1,7 KB gzip (el chunk `?debug`, 48,9 KB, no cuenta).
- `qa:overflow` en `/lab/kaizen/`: 0 desbordes de 360 a 1440 px.

### Hallazgo · fluidez del kaizen (no lo causa esta fase)
- El script de rendimiento de la fase kaizen (`Input.synthesizeScrollGesture` con `touch`) **ya no
  desplaza la página** en Chrome 155: termina con `scrollY = 0` y `--p = 0`. Sus fotogramas de 5,6 ms
  eran de una página quieta. `qa:perf` usa `gestureSourceType: 'default'` y comprueba que el gesto
  llega al final (si no, falla).
- Con desplazamiento real, `/lab/kaizen/` en 390 × 844, CPU ×4: p50 33–44 ms, 6–24 fotogramas > 33 ms
  por pasada. Con CPU ×1: p50 11 ms, 0–3 > 33 ms.
- **El motor antiguo da lo mismo** (build del commit `9640fca` en un worktree temporal: p50 33–39 ms,
  17–27 > 33 ms con ×4). La fase 1 no empeora la escena.
- Calibración: una página trivial de la misma altura da p50 5,6 ms y 0 > 33 ms con ×4. La herramienta
  mide bien.
- Traza: el coste es `UpdateLayoutTree` (89 elementos por cambio de `--p`): ~1,1 ms con ×1, ~29 ms
  de media con ×4 (más de 4×: la ralentización emulada trocea las tareas). Durante la medida había un
  juego abierto en el equipo (Overwatch), que compite por CPU y GPU.
- Consecuencia: D9 se mide en `/`. La fluidez del kaizen pasa a ser un riesgo explícito de la fase 3
  (su criterio 5), con medida en un móvil real.

### 1b
- `pnpm build` (D1): `astro check` 0 errores, 0 avisos, 0 hints; `tsc` estricto sobre scripts sin errores.
- `pnpm qa` (build final): weight ✓, specs ✓, axe ✓, keys ✓, overflow ✓, nav ✓, theme ✓, kaizen ✓, perf ✗ (D9, abajo).
- D2 · `qa:specs`: **192 medidas** (nav, sello, enlaces, separador, botón, icono y encabezados; escritorio y móvil, papel y sumi) contra d-01, d-03, d-07, m-01, m-06: 0 fallos. Control negativo (alto 88 → 80 y `--text-2` alterado en 1 unidad): 5 fallos detectados.
- Criterio 3 · `qa:nav`: escritorio 12/12 posiciones (comienzo y mitad de cada sección) y 6/6 clics en la nav; móvil 12/12.
- Criterio 4 · `qa:theme`: sistema oscuro → sumi, claro en vivo → papel, oscuro en vivo → sumi; clic → papel guardado, botón «Cambiar a modo oscuro», recarga → papel, cambio de sistema → sigue papel. Primer pintado con CPU ×4, «sumi» guardado y sistema claro: 4–5 fotogramas desde `firstPaint`, 0 con otro fondo.
- Criterio 5 · barra móvil 64 px (`qa:specs`), sello 36 px con área de 44, botón de tema, sin botón de menú; `<html lang="es">` en `Layout.astro`.
- Criterio 6 · búsqueda de texto entre etiquetas y de `aria-label|title|alt|placeholder` literales en `components/`, `sections/`, `layouts/` y `pages/index.astro`: 0 resultados. Excepción conocida: `KaizenScene.astro` («Kaizen», «改善, kaizen»), que pasa a `ui.ts` en la fase 3.
- Criterio 7 · fuentes 6 WOFF2: Shippori 400 31,3 KB y 600 33,2 KB (con 一–六, 改, 善), Inter 26,6 / 27,1 / 27,2 KB, Plex Mono 13,8 KB; total 159 KB. CLS 0,0000 en las pasadas de `qa:perf` (CPU ×4).
- Criterio 8 · `pnpm content:pending`: 22 marcadores con fichero y línea. `STRICT_CONTENT=1 pnpm build` → exit 1 («STRICT_CONTENT: contenido pendiente «descripción para buscadores»»).
- D3 · capturas en `fase-1-base/`: `inicio-{desktop,mobile}-{papel,sumi}-{0,proyectos}.png`, `-reduced-` (escritorio papel, móvil sumi) y `-nojs-` (escritorio y móvil). Revisadas a ojo frente a d-01, d-03 y m-01.
- D4 · `qa:axe`: 0 serious/critical y 0 moderate/minor en escritorio y móvil, papel y sumi; 1 contraste de logotipo exento (F6) en papel. Antes de F6/F7 detectaba 6 incidencias (control negativo natural).
- D5 · `qa:keys`: 9 paradas en escritorio (salto, sello, 6 enlaces, tema), 3 en móvil; todas con foco visible (2 px) y área ≥ 44 × 44. Antes de F8 fallaban «Inicio», «Stack» y el botón.
- D6 · reduced motion: la fase 1 no anima nada en `/`; capturas `-reduced-` idénticas en bytes a las normales (16 086 y 17 924 B en escritorio papel). El motor escribe p = 1 con reduced motion.
- D7 · sin JS: capturas `-nojs-` con barra, enlaces y encabezados legibles; el botón de tema se oculta (no haría nada) sin mover la barra. Sin `aria-current` sin JS.
- D8 · `qa:overflow`: 0 desbordes en `/` y `/lab/kaizen/` a 360, 390, 768, 1024, 1280 y 1440 px.
- D10 · `qa:kaizen` (Chrome, F1): 148 + 253 estados, 0 / 0 / 0.
- D11 · `qa:weight`: JS propio 2,7 KB gzip (nav, tema y escena; `?debug` 48,9 KB aparte, no cuenta).

### D9 · fluidez en `/` (parcial)
- 4 ejecuciones de `qa:perf` (3 pasadas cada una, 390 × 844, CPU ×4): p50 5,6 ms y CLS 0 en todas. Dos
  ejecuciones limpias; dos con **un** fotograma > 33 ms (33,4 ms en la pasada 2; 38,9 ms en la pasada 1).
- Traza de una primera pasada: las tareas largas son `EventDispatch scroll` de ~21 ms y un `Commit` de
  28 ms. El manejador de scroll de `nav.ts` solo pide un `requestAnimationFrame`; con CPU ×1 no aparece.
  Es el mismo patrón de la ralentización emulada que en el lab (tareas troceadas), con un juego abierto
  en el equipo. No es determinista y no he encontrado trabajo propio que recortar.
- Propuesta: repetir `pnpm qa:perf` con el equipo libre y, en la fase 3, en un móvil real.

## Next
- Repetir `pnpm qa:perf` con el equipo sin carga para cerrar D9.
- Fase 2 (Inicio): `Hanko.astro` sustituye al sello de la nav; ocultarlo sobre el hero (C3).
- Aviso para la fase 2: los botones del hero (20 px, peso 600, `--on-accent` sobre `--accent`) darán
  el mismo aviso de contraste que el sello en papel (F6), y ahí no vale la excepción de logotipo.
  La regla del §1.5 («≥ 18,66 px en negrita») no la cumple el peso 600 para axe.
