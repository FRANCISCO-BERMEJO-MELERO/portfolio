---
author: Francisco Bermejo
branch: fase/1-base
status: in-progress
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
- [ ] Commit 1a

### 1b · nav, tema, textos, datos
- [ ] `Nav.astro`, `ThemeToggle.astro`, `SectionHeading.astro`, secciones vacías, `Home.astro`
- [ ] `theme.ts`, `nav.ts`
- [ ] `i18n/ui.ts`, `data/*`, `lib/pending.ts`, `content-pending.ts`
- [ ] `LICENSE-kanji.md`
- [ ] Commit 1b

### Criterios de aceptación
- [ ] 1 · `qa:kaizen` en `/lab/kaizen` con el motor nuevo: 0 / 0 / 0 (Chrome, F1)
- [ ] 2 · Nav 88 / 64 px, fija; `qa:specs` ±1 px contra d-01 y m-01
- [ ] 3 · Sección activa correcta en 6/6 posiciones
- [ ] 4 · Tema: sigue al sistema, se recuerda, 0 parpadeo (primer pintado con CPU ×4)
- [ ] 5 · Barra móvil 64 px con sello y tema, sin menú; `<html lang="es">`
- [ ] 6 · Ningún texto de interfaz a mano en componentes
- [ ] 7 · Fuentes: Shippori ≤ 60 KB por peso, total ≤ 220 KB, 0 caracteres sin glifo, CLS ≤ 0,02
- [ ] 8 · `content:pending` lista los marcadores; `STRICT_CONTENT=1 pnpm build` falla

### Definición de terminado
- [ ] D1 · `pnpm build` 0 errores / 0 avisos
- [ ] D2 · `qa:specs` ±1 px, colores exactos, dos modos
- [ ] D3 · Capturas (papel, sumi, móvil, reduced)
- [ ] D4 · `qa:axe` 0 serious / critical, dos modos
- [ ] D5 · Teclado: todo alcanzable, foco visible, ≥ 44 × 44
- [ ] D6 · Reduced motion
- [ ] D7 · Sin JS
- [ ] D8 · `qa:overflow` 0 desbordes de 360 a 1440
- [ ] D9 · `qa:perf` 0 fotogramas > 33 ms en 3 pasadas
- [ ] D10 · `qa:kaizen` 0 / 0 / 0 (Chrome, F1)
- [ ] D11 · JS propio ≤ 30 KB gzip sin `?debug`

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

## Next
1b: nav, tema, textos y datos.
