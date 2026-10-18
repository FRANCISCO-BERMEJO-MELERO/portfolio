---
author: Francisco Bermejo
branch: fase/6-stack-contacto
status: review
date: 2026-10-18
plan: 02-DOCS/wiki/ftd/plan-implementacion.md (fase 6)
---

# Fase 6 · Stack y Contacto

## Intent
Las secciones 五 Stack y 六 Contacto según d-11 a d-14 y m-10 a m-13, y los dos separadores sumi-e
(C13). Stack: cuatro grupos; las tecnologías que usa algún proyecto abren su lista «usado en» (C5).
Contacto: «¿Hablamos?» con el sello que se estampa al entrar en vista (C4), enlaces, CV y pie.

## Scope
- Dentro: todo lo de la fase 6 del plan (§4): `stack/TechItem.astro`, `Footer.astro`,
  `InkDivider.astro`, `scripts/reveal.ts`, `public/cv/` (PDF de prueba), `sections/Stack.astro`,
  `sections/Contact.astro`, `Home.astro` (separadores), `reference-specs.ts`. Además:
  `scripts/stack.ts` (desplegables), `data/ink/divider.ts` (trazo del separador), variante `contact`
  de `Hanko`, textos en `ui.ts`, y la prueba `qa:contact` (en `pnpm qa`).
- Fuera: contenido real (email, LinkedIn, CV: con marcadores; el PDF es de prueba); Safari (F18) y
  Firefox (F1); móvil real en red local.
- Arreglo fuera de la sección: `scripts/projects.ts`. En móvil, un enlace a un panel desde fuera de
  Proyectos solo movía el carrusel y la página no bajaba (F48).

## Decisiones
| # | Tema | Decisión | Quién |
| --- | --- | --- | --- |
| F40 | Las maquetas solo enseñan el desplegable abierto | Empieza **cerrado**. El botón tiene 12 px de margen lateral en los dos estados, así el texto no se mueve al abrir. Fondo `--surface` solo abierto. En móvil ocupa la fila entera (m-10): la pista cabe y abrir no recoloca la rejilla | Claude, implementación |
| F41 | Sin JS el botón no hace nada | Sin JS, la lista «usado en» se ve siempre (D7). Con JS, se oculta mientras `aria-expanded="false"` | Claude, implementación |
| F42 | Hover y clic sobre el mismo botón (riesgo del plan) | Solo con ratón (`hover: hover` y `pointer: fine`): el hover enseña la lista sin cambiar `aria-expanded`, y el clic la fija o la suelta. En táctil, solo el toque | Claude, como pide el riesgo del plan |
| F43 | «¿Hablamos?» a 184 px y el sello a la derecha, entre 960 y 1440 px | Titular `min(12,78vw, 184px)`. Sello, letra y anillo escalan igual (tokens `--hanko-contact-*`). Separación de 40 px a 1440. En móvil, `clamp(48px, 14,87vw, 58px)`: 58 px a 390 y cabe a 360 | Claude, implementación |
| F44 | C14: enlaces de 44 px sin cambiar las filas de las maquetas | El área pulsable crece con un `::after` de 46 px, como en la nav (F2). Las filas miden lo de d-13 y m-12. En el pie móvil, el área de KanjiVG se metía 8 px en la de «Volver arriba»: este enlace baja 8 px respecto a m-12 | Claude, implementación |
| F45 | El pie va dentro de Contacto en las maquetas | Se respeta: `<footer>` al fondo de la pantalla de Contacto, dentro de `main` (no es el *landmark* `contentinfo`) | Claude, por las maquetas |
| F46 | Separadores sin maqueta (C13) | Pincelada horizontal calculada en el build (`data/ink/divider.ts`): entra cargada y sale seca. 160 × 12 px en móvil, 240 × 18 px en escritorio, centrada, en `--text-2`, con 24 / 32 px de aire. Se dibuja en 0,7 s cuando entra entera en la ventana | Claude, propuesta: **validar Fran** |
| F47 | Stack entre 960 y 1199 px (sin maqueta): «herramientas» no cabe en columnas de 194 px a 32 px (desbordaba 13 px a 960) | Títulos de 26 px y tecnologías de 17 px en ese tramo, como F39 | Claude, implementación |
| F48 | En móvil, el enlace «Chainview» del stack dejaba la página donde estaba (el carrusel se movía arriba, fuera de la vista) | `projects.ts`: si el enlace está fuera de la sección de Proyectos, también se baja hasta ella | Claude, arreglo |
| F49 | Aparición escalonada ≤ 600 ms (criterio 3) | 150 ms por pieza. El comienzo de las 22 piezas (4 títulos y 18 tecnologías) se reparte en 400 ms, haya las que haya. Medido: 561–567 ms | Claude, implementación |
| F51 | «Trazos de 改善» en el pie duplicaba 改善 en el árbol accesible (la escena lo anuncia una vez, fase 3) | Los kanji van `aria-hidden` y el lector oye «kaizen» (`visually-hidden`) | Claude, arreglo |
| F50 | Email y LinkedIn pendientes | Mientras sean marcador, enlazan a `#contacto`, como los enlaces pendientes de los paneles. El CV es `provisional`: PDF de prueba de 0,7 KB en `public/cv/` | Claude, implementación |

## Checklist
### Piezas
- [x] `ui.ts` (stack, contacto, pie) y `site.ts` (GitHub con host aparte, CV `provisional`).
- [x] `Hanko.astro`: variante `contact` y sus tokens.
- [x] `stack/TechItem.astro` + `scripts/stack.ts` (F40–F42).
- [x] `sections/Stack.astro`: d-11 y m-10, aparición escalonada (F49), tramo 960–1199 (F47).
- [x] `sections/Contact.astro` + `Footer.astro`: d-13 y m-12, estampación al entrar en vista, F43–F45.
- [x] `InkDivider.astro` + `data/ink/divider.ts` + `scripts/reveal.ts`; dos en `Home.astro` (F46).
- [x] `public/cv/francisco-bermejo-cv.pdf` (prueba).
- [x] `reference-specs.ts` (d-11, m-10, d-13, m-12) y `qa:contact` (en `pnpm qa` y `package.json`).

### Criterios de aceptación
- [x] 1 · Stack: 4 grupos. Cada tecnología con proyectos es un botón con `aria-expanded` y enlace al panel. Abre con clic, toque, Enter, Espacio y hover con ratón. Las demás son texto plano
- [x] 2 · `usedIn` coincide 100 % con `projects.ts`. Control negativo: quitar Go de `stack.ts` hace fallar el build
- [x] 3 · Aparición escalonada ≤ 600 ms. Con reduced motion, todo visible al instante
- [x] 4 · «¿Hablamos?» a 184 / 58 px (±1). El sello se estampa una sola vez. Enlaces ≥ 44 px (C14)
- [x] 5 · CV: el enlace descarga el PDF (`download`), de 0,7 KB (prueba)
- [x] 6 · Pie: © con el año del build, KanjiVG con enlace y licencia, «Volver arriba» funciona
- [x] 7 · Separadores: 2, se dibujan al entrar en vista, `aria-hidden`
- [ ] 8 · D1–D11 — **parcial**: todo pasa salvo D9 (fluidez), que también falla en `develop` (ver Verificación)

## Evidence
### `qa:contact`
- 1 · En escritorio y móvil, papel y sumi: empieza cerrado; clic (escritorio) o toque (móvil) abre; el
  fondo es `--surface` y el enlace `--accent-text-surface`; segundo clic o toque cierra; con ratón
  encima se ve sin cambiar `aria-expanded` y al salir se oculta; Enter abre y Espacio cierra; el
  enlace deja `#chainview` a la vista (en móvil, tras F48).
- 2 · «usado en» = los paneles que listan la tecnología, en los dos sentidos.
- 3 · Fin de la aparición: 567 / 564 ms (escritorio), 561 / 565 ms (móvil). Control negativo
  (`--control slow`, 400 ms por pieza): 818–839 ms, 4 fallos.
- 4 · Un `animationstart` al entrar y ninguno al salir y volver. Separación titular → sello y margen
  derecho: 960: 21,5 / 111,7 · 1024: 22,9 / 112,8 · 1100: 24,6 / 114,0 · 1200: 26,8 / 115,6 ·
  1280: 28,6 / 116,9 · 1440: 32,2 / 119,5 px.
- 7 · Antes de entrar en vista, animación `paused`; después, `stroke-dashoffset` 0.
- Reduced motion: 0 piezas ocultas, sello con opacidad 1, separadores enteros.

### `qa:specs`
1204 medidas (antes 1018), 0 fallos: d-11, m-10, d-13 y m-12, en papel y sumi.

### Control negativo del criterio 2
Sin «Go» en `stack.ts`: `Error: projects.ts: Chainview usa Go, que no está en stack.ts` y el build falla.

### Capturas (`fase-6-stack-contacto/`)
Escritorio y móvil en papel y sumi, `-reduced-` y `-nojs-`, en `#stack` y `#contacto`.

## Verificación · 2026-10-18
- Estado del código: `97bd545` + cambios de esta fase en `fase/6-stack-contacto`.
- D1 · `astro check`: 0 errores, 0 avisos, 0 hints (89 ficheros). `astro build` correcto.
- `pnpm qa` (15 pruebas), primera pasada: ✓ weight (D11), specs (D2), axe (D4), keys (D5), overflow
  (D8), nav, theme, hanko, projects, journey, contact, kaizen (D10). ✗ about, hero, perf.
- ✗ about → **arreglado** (F51): el pie decía «Trazos de 改善» y la palabra salía dos veces en el árbol
  accesible. Ahora el lector oye «kaizen» y la vista ve los kanji. Repetidas después: ✓ about, axe,
  keys, contact.
- ✗ hero y ✗ perf (D9) → **no atribuibles a esta fase**, medidos frente a `develop` (worktree aparte,
  mismo equipo, una pasada tras otra):

  | Prueba | `develop` | `fase/6` |
  | --- | --- | --- |
  | `qa:hero`: fotogramas > 33 ms en las 3 cargas | 1 · 1 · 1 | 1 · 2 · 2 |
  | `qa:perf`: fotogramas > 33 ms en las 3 pasadas | 5 · 3 · 5 (antes: 28 · 2 · 31) | 21 · 6 · 0 (antes: 41 · 42 · 42) |

  `develop` también falla, y las dos ramas varían mucho entre pasadas: el equipo estaba cargado. Con
  esta dispersión no se puede decir si la fase empeora D9. Hay que repetirlo con el equipo en reposo.
- Capturas con `qa:shots --settle 900` (opción nueva: espera a que termine lo que aparece al entrar
  en vista).

### Pasada fresca (tras el último cambio de producto, F51) · source_state: `97bd545` + cambios sin commit (dirty)
- D1 · `astro check`: 0 errores, 0 avisos, 0 hints. Build correcto.
- `pnpm qa`: ✓ weight, specs (1204 medidas), axe, keys, overflow, nav, theme, hanko, about, projects,
  journey. ✗ hero (1 · 3 · 2 fotogramas > 33 ms en la carga).
- La batería se **colgó** en `qa:contact` (sin salida durante más de 30 min; parada a mano). Sola,
  `qa:contact` pasa (aparición: 553–559 ms). Para que no vuelva a bloquear la batería, cada paso de
  `qa:contact` tiene ahora un límite de 20 s y falla con su nombre. No se reprodujo, así que la causa
  del cuelgue queda **sin averiguar**.
- `qa:perf` aparte: ✗ 1 · 7 · 2 fotogramas > 33 ms (CLS 0). `develop`, en este mismo equipo: 5 · 3 · 5.
- `qa:kaizen` aparte: ✓.

### Veredicto: FALLA por D9
Todo lo demás tiene evidencia y pasa. D9 (0 fotogramas > 33 ms) falla en esta rama y en `develop`, con
cifras del mismo orden. No hay evidencia de que la fase lo empeore. Tampoco de que no lo haga.

### Capas no ejecutadas
- **PENDIENTE** — D9 con el equipo en reposo (`qa:perf` y `qa:hero`, comparando con `develop`).
- **RETIRADA** — Safari (F18) y Firefox (F1).
- **NO-APLICA** — móvil real en red local: no hay dispositivo en esta sesión.

## Next
- Repetir `qa:perf` y `qa:hero` con el equipo en reposo, frente a `develop`, antes de llevar
  `develop` a `main`.
- Fran: validar F46 (los separadores) y F40 (el desplegable empieza cerrado).
- Contenido: email, LinkedIn y el CV real en PDF (máximo 500 KB). Al llegar, cambiar el PDF de
  `public/cv/` y quitar los marcadores de `site.ts`.
