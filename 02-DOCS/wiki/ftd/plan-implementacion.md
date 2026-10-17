---
author: Francisco Bermejo
branch: develop
status: approved
date: 2026-10-16
approved: 2026-10-17
---

# Plan de implementación · portfolio completo

## Intent
Construir el portfolio de una página, **solo en español** (`/`), en escritorio y móvil, papel y sumi,
integrando la escena kaizen ya validada sin rehacerla. Este documento decide la arquitectura y
divide el trabajo en fases de una sesión, cada una con su commit y sus criterios medibles.
No contiene código.

## Respuestas de Fran (17 oct 2026)
| # | Pregunta | Respuesta | Efecto en el plan |
| --- | --- | --- | --- |
| P1 | Ramas | Sí: una rama por fase desde `develop`, PR a `develop`; a `main` al publicar | §3.1 |
| P2 | `kaizen-lab/` → `web/` | Aprobado | §1.1 |
| P3 | Safari antes de la fase 3 | Sí. **Retirado el 17 oct** (fase 3, F18): no se prueba en Safari antes de la fase 8 | Queda solo el criterio 6 de la fase 8 |
| P4 | Preview desplegado | **No**: se despliega al terminar todo | Las pruebas en móvil real y Safari se hacen en red local |
| P5 | Contradicciones | **C1: se sigue la definición (4 hitos)**; el resto, la propuesta | §2, fase 5 |
| P6 | Menú móvil | Lo diseña Fran; se deja para el final | Sale de la fase 1; entra en la fase 8 con su maqueta |
| P7 | Fase 7 nueva | Aprobada | Fase 7 |
| P8 | Definición en el repo | Sí | Movida a `02-DOCS/raw/` |
| P9 | Email | En claro | Fase 6 |
| P10 | CV / idiomas | **De momento la web solo en español** | Fuera: `/en/`, selector de idioma, `hreflang`, traducción y CV en inglés (§1.7) |
| P11 | Traslado de las maquetas a `reference/` | Incluirlo en el primer commit de la fase 1 | Fase 1 |
| P12 | Firefox ya no está instalado (17 oct) | **Fuera de la auditoría**: `qa:kaizen` y D10 solo en Chrome | §1.8, D10 |

## Fuentes leídas
| Fuente | Dónde | Papel en el plan |
| --- | --- | --- |
| Definición del portfolio (15 oct 2026) | `02-DOCS/raw/Portfolio de Fran — Definición.md` (y su PDF) | Qué se construye y por qué |
| Referencias de escritorio | `reference/portfolio-fran-escritorio.html` (14 maquetas a 1440 × 900) | Fuente de verdad de medidas y estilos |
| Referencias de móvil | `reference/portfolio-fran-movil.html` (13 maquetas a 390 px) | Ídem |
| Escena kaizen | `kaizen-lab/` y `02-DOCS/wiki/ftd/kaizen-escena.md` | Se integra tal cual |

Las maquetas son iframes con `srcdoc` y estilos en línea. Se leen como especificación (medidas,
colores, jerarquía, ARIA), no se copia su marcado.

---

## 1. Decisiones de arquitectura

### 1.1 ¿Proyecto nuevo o a partir de kaizen-lab? → Se promueve kaizen-lab a `web/`
`git mv kaizen-lab web` y se construye el portfolio encima.

Por qué:
- El lab ya tiene lo difícil y su configuración probada: Astro 7.3.5, TypeScript `strictest`, pnpm,
  pipeline `assets → glyphs → build`, `astro check` en el build.
- `git mv` conserva el historial de cada fichero de la escena (útil si hay que volver a un intento).
- Un proyecto nuevo obligaría a copiar 10 ficheros y dos scripts de build. Dos copias de la escena
  divergen.

Por qué en `web/` y no en la raíz: la raíz ya es del harness (`01-TOOLS/`, `02-DOCS/`, `.rsc/`).
Un subdirectorio mantiene separados el código y la documentación. Vercel y Cloudflare Pages
aceptan un *root directory*.

La página del lab pasa a `web/src/pages/lab/kaizen.astro` (con `noindex`) mientras la escena no esté
en la página real. Se borra en la fase 3, cuando la auditoría pase sobre la página real.

### 1.2 Integración de la escena kaizen
| Pieza del lab | Destino en `web/` | Cambio permitido |
| --- | --- | --- |
| `src/components/KaizenScene.astro` | `src/components/kaizen/KaizenScene.astro` | Colores → tokens; motor → el compartido; *slot* para la columna de texto; *fallback* sin JS |
| `src/lib/brush.ts` | igual | Ninguno |
| `src/data/kanji-masks.ts`, `kanji-fit.ts` | igual | Ninguno |
| `src/generated/kanji-geometry.ts` | igual (generado, versionado) | Ninguno; se regenera con `pnpm glyphs` |
| `scripts/build-glyphs.ts`, `partition.ts`, `svg-path.ts` | igual | Ninguno |
| `scripts/fetch-assets.ts` | igual | Añade las demás fuentes (Shippori 600, Inter, Plex Mono) |
| `src/scripts/debug.ts` | `src/scripts/kaizen-debug.ts` | Solo el import del motor. Sigue cargando únicamente con `?debug` |

Regla: la geometría (máscaras, zonas, grosores, tramos) no se toca. La regresión se mide con la
misma auditoría de la fase kaizen (0 px de fuga, 0 px de hueco, p = 1 idéntico al glifo).

El `?debug` se mantiene en producción (es un *chunk* aparte que solo se descarga con el parámetro).
Así la prueba de Safari se puede hacer sobre la web desplegada, no solo en la red local.

### 1.3 Motor de scroll compartido
Hoy `startScrollProgress(scene, stage)` sirve a una sola escena y solo re-mide cuando cambia el
tamaño de esa escena. Se generaliza en `src/scripts/scroll.ts`:

- **Descubrimiento declarativo.** Cada escena es `[data-scene]` con un `[data-stage]` dentro.
  El motor las registra todas al cargar.
- **Dos modos.**
  - `sticky` (por defecto, el del lab): `p = (scrollY − top) / (alto escena − alto escenario)`.
  - `pass`: progreso mientras un elemento normal atraviesa la ventana, con inicio y fin
    configurables (`data-scene-start="top 80%"`, `data-scene-end="bottom 50%"`). Lo usan el tránsito
    del sello y la trayectoria móvil.
- **Un solo bucle.** Un listener de `scroll` pasivo y un `requestAnimationFrame` para todas las
  escenas. Solo se actualizan las escenas cercanas a la ventana (IntersectionObserver).
- **Medidas cacheadas.** Se miden al cargar, al cambiar el tamaño de la escena, al cambiar el tamaño
  de `body` (cubre cambios de layout por encima de la escena) y tras `document.fonts.ready`.
  En el scroll solo se lee `scrollY`. No fuerza layouts.
- **Escritura exacta.** Se mantiene la regla del lab: el valor guardado es exactamente el escrito en
  `--p` (6 decimales), y solo se escribe si cambia.
- **Pasos discretos opcionales.** `data-steps="5"` hace que el motor escriba `data-step="k"` en la
  escena. Lo usan el índice de proyectos (`aria-current`) y los hitos de la trayectoria.
- **Reduced motion y sin JS.** Con `prefers-reduced-motion` el motor escribe `p = 1`. Sin JS, el CSS
  parte de `--p: 1` y sin modo sticky: todo se ve dibujado. El modo animado solo se activa con la
  clase `html.js`, que pone el script del `<head>`.
- **API para depurar.** `getScene(el).override(p)` sustituye al `override` actual de `debug.ts`.

Criterio de corte: el kaizen migrado al motor nuevo da la misma auditoría que en el lab.

### 1.4 Fuentes autoalojadas y subconjuntadas
- `scripts/fetch-assets.ts` descarga los TTF originales (no se versionan, como ahora).
- `scripts/subset-fonts.ts` genera WOFF2 en `src/assets/fonts/`:
  - Shippori Mincho 400 y 600: Latin básico + Latin-1 + puntuación usada + los kanji que aparecen
    en el contenido. Los kanji se **extraen automáticamente** de `src/data/` y `src/i18n/`.
    El script falla si un carácter CJK del contenido no está en el subconjunto.
  - Inter 400, 500 y 600: Latin + Latin-1 + flechas (↓ ↑ ↗ →).
  - IBM Plex Mono 400: Latin + Latin-1.
- La escena kaizen no necesita la fuente: dibuja paths generados en build. Sí la necesitan 改 y 善 en
  texto (columna de significado, pie).
- Carga: se registran los WOFF2 con la API de fuentes de Astro (proveedor local) para tener `preload`
  y métricas de *fallback* que eviten saltos de layout. **Por verificar en la fase 1** que Astro 7
  ofrece esa API y proveedor local; si no, `@font-face` a mano + `preload` + `size-adjust`.

Desviación de la definición: la definición dice «autoalojadas con la API de fuentes de Astro». La API
se usa para cargar, pero el subconjunto por texto lo hace nuestro script (la API no subconjunta por
caracteres concretos, que es lo que necesita una fuente de 8 MB con kanji).

### 1.5 Tokens de los dos modos
Salen de las referencias. Las celdas en cursiva no están en la definición: las añaden las maquetas.

| Token | Papel | Sumi | Uso | Contraste medido |
| --- | --- | --- | --- | --- |
| `--bg` | `#f3efe6` | `#15130f` | Fondo | — |
| `--surface` | `#ebe5d8` | `#1e1b16` | Paneles, item desplegado | — |
| `--text` | `#1b1a17` | `#ece6d8` | Texto principal | — |
| `--text-2` | `#6b665c` | `#8c8577` | Secundario | 4,97 / 5,07 sobre bg · 4,55 / 4,69 sobre surface |
| `--line` | `#d6cfbf` | `#2e2a23` | Bordes, guía de trazos | decorativo |
| `--accent` | `#e2482a` | `#f0573a` | Relleno: sello, botón principal | — |
| *`--on-accent`* | `#f3efe6` | `#15130f` | Texto sobre `--accent` | 3,52 / 5,42 |
| *`--accent-text`* | `#c0391d` | `#f0573a` | Enlaces e índices sobre `--bg` | 4,76 / 5,42 |
| *`--accent-text-surface`* | `#b4351b` | `#f0573a` | Enlaces e índices sobre `--surface` | 4,83 / 5,01 |
| *`--accent-hover`* | `#9e2e17` | `#ff7a5e` | Hover de enlaces | 6,41 / 7,24 |
| *`--term-bg`* | `#1b1a17` | `#0c0b08` | Captura de la TUI | — |
| *`--term-line`* | `#3a362e` | `#3a362e` | Separadores de la TUI | — |
| *`--term-text`* | `#ece6d8` | `#ece6d8` | Texto de la TUI | — |
| *`--term-text-2`* | `#b5ae9f` | `#b5ae9f` | Texto secundario de la TUI | 7,89 / 8,92 |

Regla que se deriva: en papel, `--on-accent` sobre `--accent` da 3,52:1. Solo es válido como texto
grande (≥ 18,66 px en negrita o ≥ 24 px). Los botones de las maquetas (20 px y 19 px a peso 600)
cumplen. Ningún texto sobre `--accent` puede bajar de 18,66 px en negrita.

`#c0391d` sobre `--surface` da 4,35:1 y no llega a AA: por eso existe `--accent-text-surface`.

### 1.6 Tema claro / oscuro
- `data-theme="papel" | "sumi"` en `<html>`. Script en línea en el `<head>` (antes del primer
  pintado): `localStorage` si hay elección guardada; si no, `prefers-color-scheme`.
- Sin elección guardada, sigue los cambios del sistema en vivo.
- `color-scheme` y `<meta name="theme-color">` acordes a cada modo.
- Sin JS: manda `prefers-color-scheme` (los tokens se definen también con la media query).

### 1.7 Idioma y contenido
- **Solo español por ahora (P10).** Una página en `/`, `<html lang="es">`. No hay rutas `/en/`,
  selector de idioma, `hreflang` ni traducción. Esto se aparta de la definición y de las maquetas,
  que muestran el selector ES / EN en la navegación: la barra se monta sin él.
- Para que añadir el inglés más adelante sea barato, los textos de interfaz se centralizan igualmente
  en `src/i18n/ui.ts` (un solo idioma). No se configura el i18n de Astro.
- `src/data/{site,projects,journey,stack}.ts`: contenido en español, separado del marcado.
- **Marcadores.** El contenido pendiente se escribe con `pending('frase del hero')`. Se ve como
  `[frase del hero]` (igual que en las maquetas), lleva `data-pending` y lo lista `pnpm content:pending`.
  En la fase 8, `STRICT_CONTENT=1 pnpm build` falla si queda alguno.
- `usedIn` del stack **se calcula** desde `projects.ts`. El build falla si un proyecto usa una
  tecnología que no está en `stack.ts`.

### 1.8 Herramientas de verificación (sin Playwright)
Decisión previa de Fran: nada de Playwright. Se usa Chrome instalado por CDP (Firefox salió de la
auditoría el 17 oct, P12). Se añaden en la fase 1 bajo `web/scripts/qa/`:

| Comando | Qué mide |
| --- | --- |
| `pnpm qa:shots` | Capturas en 1440 × 900 y 390 × 844 (@3x), papel y sumi, y con reduced motion, en los estados de scroll que se pidan |
| `pnpm qa:specs` | Compara estilos calculados (tamaño, interlineado, colores, paddings) de elementos marcados con `data-qa` contra la tabla de medidas de las maquetas (`scripts/qa/reference-specs.ts`) |
| `pnpm qa:axe` | axe-core inyectado: 0 incidencias *serious* o *critical*, en los dos modos |
| `pnpm qa:overflow` | Sin scroll horizontal a 360, 390, 768, 1024, 1280 y 1440 px |
| `pnpm qa:perf` | Gesto de scroll en 390 × 844, CPU ×4: fotogramas > 33 ms (tras una pasada de calentamiento que no cuenta; fase 1, D9) |
| `pnpm qa:kaizen` | Ejecuta la auditoría del `?debug` en Chrome y falla si fuga, hueco o diff ≠ 0 |
| `pnpm qa` | Todo lo anterior |

Lighthouse se ejecuta con su CLI (usa el Chrome instalado).

### 1.9 Otras decisiones
- **GSAP**: no entra por defecto. La estampación del sello se intenta con `@keyframes`. Solo entra si
  la estampación no queda bien con CSS (la definición lo permite para ese caso).
- **Lenis**: no entra por defecto. Se decide al final de la fase 3, con el kaizen probado en un
  móvil real.
- **Corte móvil / escritorio**: 960 px, el mismo del lab.
- **Componente de pincel único**: `InkStroke.astro` dibuja un trazo de grosor variable (línea central
  + perfil de grosor) que se revela con máscara y `stroke-dashoffset`. Lo usan el ensō, la
  trayectoria y los separadores. Sustituye a `Enso.astro` y `KanjiStroke.astro` de la definición
  (el kanji ya tiene su componente propio).
- **Licencias**: `kanji-geometry.ts` es derivado de KanjiVG → se publica bajo CC BY-SA 3.0 con un
  `LICENSE-kanji.md` y el enlace del pie. Shippori Mincho no declara *Reserved Font Name* en su
  `OFL.txt`: subconjuntarla no obliga a renombrarla.

---

## 2. Contradicciones entre referencias y definición
Resueltas por Fran el 17 oct 2026: C1 sigue la definición; el resto, la propuesta. C9 (menú móvil)
queda para el final con una maqueta suya.

| # | Tema | Definición | Referencias | Decisión | Fase |
| --- | --- | --- | --- | --- | --- |
| C1 | Hitos de la trayectoria | 4: DAM 2023 → Fernauro → prácticas Gavisa → empleado Gavisa (IA) | 5: Inicio del DAM · FP dual Fernauro · Prácticas Gavisa · **Título y contrato** · **Giro a la IA** | **Definición: 4 hitos.** Se mantienen las medidas de la maqueta repartidas en 4 columnas | Fase 5 |
| C2 | Año 2023 | «DAM 2023» (parece el inicio) | 2023 aparece en «Título y contrato» | Lo decides tú con las fechas reales | Fase 8 |
| C3 | Sello del inicio | Se estampa al cargar | Además viaja con el scroll hasta la navegación (la nav está vacía hasta entonces) | Las dos cosas: se estampa al cargar y luego viaja | Fase 2 |
| C4 | Sello de contacto | «Se estampa sobre el titular» | A la derecha de «¿Hablamos?» (escritorio) y debajo a la derecha (móvil), sin taparlo | Seguir las referencias | Fase 6 |
| C5 | «Usado en» del stack | En hover | Botón desplegable (`aria-expanded`), funciona con toque y teclado | Botón desplegable + apertura en hover en dispositivos con ratón | Fase 6 |
| C6 | Nombre del grupo | «Backend» | «Backend y herramientas» | Seguir las referencias | — |
| C7 | Pesos de Inter | 400 y 500 | Usa 600 en botones | Añadir 600 (+~25 KB) | Fase 1 |
| C8 | Fuente de texto | Inter **o** Zen Kaku Gothic New | Inter | Inter | Fase 1 |
| C9 | Navegación móvil | No se menciona | Menú hamburguesa; no hay maqueta del menú abierto | **Lo diseña Fran.** Hasta entonces, la barra móvil sin menú | Fase 8 |
| C10 | «Sobre mí» en móvil | Párrafo + datos rápidos + kaizen | Solo el kaizen; no aparecen el párrafo ni los datos rápidos | Párrafo y datos rápidos en flujo normal, antes de la escena | Fase 3 |
| C11 | Kaizen en sumi | Validar el modo oscuro en una maqueta | No hay maqueta del kaizen en sumi | Tinta = `--text`, guía = `--line`; validar con captura en la fase 3 | Fase 3 |
| C12 | Ensō | Transición o fondo del hero | Al lado del nombre, con el sello encima; no dice si se anima | Se dibuja una vez al cargar (≈ 1,2 s) y después cae el sello | Fase 2 |
| C13 | Separadores sumi-e | 2 o 3 en toda la web | No aparecen | Dos, entre Proyectos→Trayectoria y Stack→Contacto, con `InkStroke` | Fase 6 |
| C14 | Enlaces de contacto en móvil | — | Alto mínimo 32 px (el resto de la web usa 44 px) | 44 px en todos | — |
| C15 | Selector de idioma | ES / EN en la navegación | Selector ES / EN | **Fuera por ahora (P10)**: la web solo en español | — |

---

## 3. Reglas comunes a todas las fases

### 3.1 Forma de trabajar
- Una fase por sesión, en su rama `fase/N-<nombre>` creada desde `develop`. Al terminar: commit,
  push y PR a `develop`. A `main` solo se lleva al publicar (fase 8).
- Sin preview desplegado (P4): las pruebas en un móvil real y en Safari se hacen en red local con
  `pnpm dev --host`.
- Cada fase abre su documento FTD en `02-DOCS/wiki/ftd/fase-N-<nombre>.md` con checklist y evidencias,
  como `kaizen-escena.md`.
- Si una fase se alarga, se corta en su **punto de corte** (indicado en cada fase) con un commit
  intermedio, nunca a medias de una pieza.

### 3.2 Definición de terminado (se aplica a todas las fases, además de sus criterios propios)
Todo se comprueba en escritorio (1440 × 900) y móvil (390 × 844), en papel y en sumi, y con
`prefers-reduced-motion`. No se deja nada de esto para el final.

| # | Criterio | Medida |
| --- | --- | --- |
| D1 | Compila sin errores | `pnpm build` (incluye `astro check`): 0 errores, 0 avisos de tipos |
| D2 | Fiel a las referencias | `pnpm qa:specs`: tamaños y espaciados ±1 px; colores exactos; en los dos modos |
| D3 | Capturas | `pnpm qa:shots` de lo construido, guardadas en el FTD de la fase (papel, sumi, móvil, reduced) |
| D4 | Accesibilidad automática | `pnpm qa:axe`: 0 *serious* / *critical* en los dos modos |
| D5 | Teclado | Todo lo interactivo se alcanza con Tab, tiene foco visible y área ≥ 44 × 44 px |
| D6 | Reduced motion | Todo aparece ya dibujado, sin animar y sin escenas sticky |
| D7 | Sin JS | El contenido se ve completo y legible (equivale a reduced motion) |
| D8 | Sin desbordes | `pnpm qa:overflow`: 0 scroll horizontal de 360 a 1440 px |
| D9 | Fluidez | `pnpm qa:perf`: 0 fotogramas > 33 ms en 3 pasadas |
| D10 | Kaizen intacto (desde la fase 1) | `pnpm qa:kaizen`: 0 fuga, 0 hueco, diff final 0 px en Chrome (P12) |
| D11 | Peso | JS propio ≤ 30 KB gzip sin contar el `?debug` (se mide en cada fase y se anota la evolución) |

---

## 4. Fases

### Fase 1 · Base

**Objetivo.** El esqueleto completo sobre el que se montan las secciones: proyecto, tokens, fuentes,
layout, navegación, tema, textos centralizados, contenido con marcadores, motor de scroll y
herramientas de QA.

**Entregable.** `/` con la navegación fija funcionando y las seis secciones vacías (solo su
encabezado 一–六), en papel y sumi. El kaizen del lab sigue en `/lab/kaizen` sobre el motor nuevo.
En móvil, la barra lleva el sello y el selector de tema; el menú llega en la fase 8 (C9).

**Archivos.**
- Primer commit (P11): el traslado de las maquetas a `reference/` (borrado en la raíz + alta en
  `reference/`).
- Se mueve: `kaizen-lab/` → `web/` (`git mv`).
- Se crean:
  - `web/src/styles/tokens.css` (§1.5), `web/src/styles/global.css` (reset, tipografía base, `.visually-hidden`, foco)
  - `web/scripts/subset-fonts.ts`, `web/src/assets/fonts/*.woff2` (generados)
  - `web/src/layouts/Layout.astro` (head, script de tema, `html.js`, fuentes, `lang`)
  - `web/src/components/Nav.astro`, `ThemeToggle.astro`, `SectionHeading.astro` (índice kanji + título)
  - `web/src/components/sections/{Hero,About,Projects,Journey,Stack,Contact}.astro` (vacías)
  - `web/src/components/Home.astro`, `web/src/pages/index.astro`
  - `web/src/i18n/ui.ts` (textos de interfaz, solo ES)
  - `web/src/data/{site,projects,journey,stack}.ts` + `web/src/lib/pending.ts`
  - `web/src/scripts/scroll.ts`, `theme.ts`, `nav.ts` (sección activa)
  - `web/scripts/qa/*` (§1.8) y `web/scripts/qa/reference-specs.ts` (nav, encabezados de sección)
  - `web/scripts/content-pending.ts`
  - `LICENSE-kanji.md`
- Se modifican: `web/package.json` (nombre, scripts), `web/astro.config.mjs` (`site`, fuentes),
  `web/scripts/fetch-assets.ts`, `KaizenScene.astro` (solo el import del motor), `debug.ts` → `kaizen-debug.ts`.
- Se borra: `web/src/scripts/scroll-progress.ts` (sustituido por `scroll.ts`).

**Criterios de aceptación.**
1. `pnpm qa:kaizen` sobre `/lab/kaizen` con el motor nuevo: 0 / 0 / 0 px en Chrome (igual que en el lab; P12).
2. Navegación: 88 px en escritorio, 64 px en móvil, fija; `qa:specs` ±1 px contra d-01 y m-01.
3. Sección activa: al hacer scroll por las seis secciones, el enlace correcto lleva `aria-current` en 6/6 posiciones de prueba.
4. Tema: sin elección guardada sigue al sistema; tras elegir, se recuerda al recargar; 0 parpadeo del modo equivocado (captura del primer pintado con CPU ×4).
5. Barra móvil: 64 px con sello y selector de tema; sin botón de menú hasta la fase 8; `<html lang="es">`.
6. Textos: ningún texto de interfaz escrito a mano en los componentes; todos salen de `ui.ts` o de `data/` (revisión por búsqueda).
7. Fuentes: Shippori ≤ 60 KB por peso, total de fuentes ≤ 220 KB; 0 caracteres del contenido sin glifo (el script lo comprueba); CLS ≤ 0,02 al cargar.
8. Marcadores: `pnpm content:pending` lista todos los `pending()`; `STRICT_CONTENT=1 pnpm build` falla (control negativo).
9. D1–D11.

**Riesgos.**
| Riesgo | Mitigación |
| --- | --- |
| La API de fuentes de Astro 7 no admite proveedor local o cambia de forma | Verificar en la doc de la versión instalada antes de usarla; alternativa `@font-face` manual (§1.4) |
| Inter de Google Fonts es variable; subconjuntar fijando pesos puede fallar | Probar `subset-font` con instanciado; si falla, usar los estáticos de la *release* oficial de Inter |
| `git mv` + rutas relativas rompen los scripts de build | El primer paso es mover y comprobar `pnpm build` + `qa:kaizen` antes de añadir nada |
| La fase es grande | **Punto de corte**: 1a = mover + tokens + fuentes + layout + motor + QA (commit); 1b = nav, tema, textos, datos |

**Dependencias.** Ninguna. Recomendado antes: la prueba del kaizen en Safari (ver P3).

**Contenido de Fran.** Ninguno. Puede avanzar entero con marcadores. Útil, no bloqueante: dominio
(para `site` en `astro.config`).

---

### Fase 2 · Inicio

**Objetivo.** El hero: nombre, rol, frase, botones, ensō dibujado y el sello que se estampa y viaja
hasta la navegación.

**Entregable.** Sección 一 completa según d-01, d-02, d-03, m-01 y m-02.

**Archivos.**
- Se crean: `web/src/components/Hanko.astro` (tamaños 104 / 72 / 44 / 50 / 36 px de las maquetas,
  doble borde, rotación), `web/src/components/InkStroke.astro`, `web/src/components/Enso.astro`
  (usa `InkStroke`), `web/src/data/ink/enso.ts` (línea central + perfil de grosor de la maqueta),
  `web/src/scripts/hanko.ts` (mide origen y destino, publica variables CSS), `web/public/favicon.svg` (el sello).
- Se modifican: `sections/Hero.astro`, `Nav.astro` (hueco del sello), `scroll.ts` (si el modo `pass` necesita ajustes), `reference-specs.ts`.

**Diseño del tránsito.** Un solo motor: la escena `pass` del hero va de `scrollY = 0` hasta que el
hero sale bajo la navegación. El sello del hero se traslada y escala con `--p` hacia el hueco de la
nav (la traslación compensa el scroll, que es lineal en `p`, así que basta `calc()` con variables
medidas). En `p = 1` se cambia por el sello de la nav. Ese cambio no debe verse.

**Criterios de aceptación.**
1. Al cargar: el ensō se dibuja y después cae el sello (escala + rotación + mancha) en ≤ 1,6 s en total; 0 fotogramas > 33 ms durante la animación en móvil CPU ×4.
2. Tránsito: en 5 estados de scroll (0, 25, 50, 75, 100 %) la posición del sello coincide con la interpolación esperada ±2 px; d-02 (72 px, en tránsito) se reproduce ±2 px.
3. Relevo: en `p = 1` la diferencia de posición y tamaño entre el sello que viaja y el de la nav es ≤ 1 px.
4. Volver arriba: el sello vuelve del revés sin saltos (mismas 5 medidas).
5. Reduced motion / sin JS: ensō y sello del hero estáticos; sello de la nav visible siempre.
6. Título: 152 px a 1440 px, `clamp(44px, 17vw, 64px)` en móvil; sin desborde a 960–1440 px (escala fluida definida entre los dos extremos).
7. Contraste del botón principal: texto ≥ 18,66 px en negrita (regla §1.5) en todos los anchos.
8. D1–D11.

**Riesgos.**
| Riesgo | Mitigación |
| --- | --- |
| Salto visible en el relevo hero → nav | Medir los dos rectángulos en el resize; criterio 3 con medida automática |
| En iOS la barra de direcciones cambia el alto y descoloca el tránsito | Unidades `svh` y re-medida en `resize`; probar en un iPhone en red local (`pnpm dev --host`) |
| La «mancha de tinta» con filtros SVG animados cuesta en móvil | Mancha precalculada como forma SVG estática; solo se animan `transform` y `opacity` |
| Tamaños intermedios (tablet) sin maqueta | Escala fluida entre 390 y 1440; capturas a 768 y 1024 en el FTD para validarlas tú |

**Dependencias.** Fase 1 (motor `pass`, tokens, nav).

**Contenido de Fran.** Rol en una línea, frase del hero, iniciales del sello (las maquetas usan «FB»).
Puede avanzar con marcadores.

---

### Fase 3 · Sobre mí (integración del kaizen)

**Objetivo.** La escena kaizen dentro de su sección real, con el párrafo, la columna de significado
y los datos rápidos.

**Entregable.** Sección 二 según d-04, d-05, d-06 (escritorio) y m-03, m-04, m-05 (móvil), en papel
y sumi. Se borra `/lab/kaizen`.

**Archivos.**
- Se modifican: `kaizen/KaizenScene.astro` (colores → `--text` y `--line`; el escenario recibe la
  composición de la sección por *slot*; `--p: 1` sin JS), `sections/About.astro`, `reference-specs.ts`.
- Se crea: `web/src/components/kaizen/KaizenMeaning.astro` (改 cambiar · 善 bueno · = cambiar a mejor
  · texto), con opacidades ligadas a `--p` según las tres maquetas.
- Se borran: `web/src/pages/lab/kaizen.astro`.

**Criterios de aceptación.**
1. `pnpm qa:kaizen` sobre `/`: 0 fuga, 0 hueco, diff final 0 px, en Chrome (P12), en papel **y** en sumi.
2. Estados: capturas a `p = 0`, `0,5` y `1` comparables con d-04/05/06 y m-03/04/05; opacidades de la columna iguales a las maquetas.
3. Encaje: a 1440 × 900 la sección completa cabe en el escenario sticky; a 1280 × 720 y a 375 × 667 no se corta nada (los kanji se reducen; si no cabe, el párrafo sale del escenario).
4. Accesibilidad: 改善 se anuncia una vez («改善, kaizen») y la columna de significado se lee como texto; los SVG van `aria-hidden`.
5. Fluidez: los números de la fase kaizen se mantienen (p95 ≤ 16 ms, 0 > 33 ms en móvil CPU ×4) con la página completa alrededor.
6. Sumi validado por ti con las capturas (C11).
7. D1–D11.

**Riesgos.**
| Riesgo | Mitigación |
| --- | --- |
| Safari aún sin probar: si las máscaras fallan allí, se descubre aquí | Hacer la prueba de Safari pendiente **antes** de esta fase (P3) |
| La página completa encima cambia `top` de la escena | El motor re-mide con el `ResizeObserver` de `body` y tras `fonts.ready` (§1.3); criterio 1 lo detecta |
| Alturas pequeñas (portátil 720 px, iPhone SE) | Tamaño `min()` del lab + criterio 3 con dos medidas concretas |
| Tocar el componente rompe la geometría | Solo se cambian colores, motor y slot; `qa:kaizen` en cada commit |

**Dependencias.** Fase 1. Prueba de Safari del lab (recomendada como requisito).

**Decisión al cerrar la fase.** Lenis sí o no, tras probar el scroll en un móvil real.

**Contenido de Fran.** Párrafo «Sobre mí», tu versión del kaizen, datos rápidos (las maquetas dicen
Córdoba · Web3 + IA · Gavisa), foto sí o no. Puede avanzar con marcadores.

---

### Fase 4 · Proyectos (escenario y paneles)

**Objetivo.** El escenario de proyectos: paneles *shoji* que se deslizan con el scroll en escritorio
y pestañas con deslizamiento lateral en móvil. Con el contenido base de cada proyecto (sin sus
animaciones propias, que van en la fase 7).

**Entregable.** Sección 三 según d-07, d-08, m-06 y m-07, con los cinco proyectos.

**Archivos.**
- Se crean: `web/src/components/projects/ProjectPanel.astro` (captura, nombre, línea, problema,
  stack, dato, enlaces), `ShojiEdge.astro` (borde del panel siguiente con celosía y su índice),
  `ProjectIndex.astro` (lista lateral en escritorio, pestañas 一–五 en móvil), `TuiFrame.astro`
  (marco de terminal con `--term-*`), `web/src/scripts/projects.ts` (índice ↔ scroll, foco, *hash*).
- Se modifican: `sections/Projects.astro`, `data/projects.ts`, `reference-specs.ts`.

**Comportamiento.**
- Escritorio (≥ 960 px y alto ≥ 700 px): escena sticky de 5 tramos (`data-steps="5"`). El panel k+1
  entra desde la derecha sobre el k. El índice marca `aria-current` según `data-step`. Pulsar un
  índice o abrir `#docchain` lleva al scroll de ese tramo. Si el foco del teclado entra en un panel
  no visible, se hace scroll hasta su tramo.
- Móvil: carrusel horizontal con `scroll-snap` nativo (sin JS para deslizar). Las pestañas son
  enlaces que llevan a su panel y marcan `aria-current`. Se ve el borde del panel siguiente (18 px).
- Reduced motion / sin JS / alto < 700 px: los cinco paneles apilados en flujo normal.

**Criterios de aceptación.**
1. En escritorio, en los 5 tramos el panel visible y el `aria-current` del índice coinciden (5/5).
2. Pulsar cada índice y abrir cada `#hash` deja ese panel completamente visible (5/5 y 5/5).
3. Tab recorre los enlaces de los cinco paneles en orden y cada uno queda visible al recibir foco.
4. En móvil, deslizar y pulsar pestañas sincroniza `aria-current` (5/5); el `scroll-snap` deja cada panel alineado ±1 px.
5. Medidas de d-07 y m-06 ±1 px (`qa:specs`); `--accent-text-surface` en los enlaces sobre el panel.
6. Imágenes con `astro:assets` (AVIF/WebP, `width`/`height`, `loading="lazy"` salvo la primera); CLS de la sección 0.
7. D1–D11.

**Riesgos.**
| Riesgo | Mitigación |
| --- | --- |
| El contenido de un panel no cabe en el escenario a alturas medias | Umbral de alto (700 px) con *fallback* apilado; criterio a 1280 × 720 |
| `scroll-snap` y pestañas desincronizados en Safari | Sincronizar con IntersectionObserver (no con `scrollend`, que Safari soporta peor); probar en un iPhone en red local |
| Anclas `#proyecto` caen en mitad de un tramo | `projects.ts` intercepta el *hash* y calcula el scroll del tramo |
| Las capturas reales cambian de proporción | Marco con `aspect-ratio` fijo y `object-fit`; versión horizontal y vertical con `<picture>` |

**Dependencias.** Fase 1 (motor con pasos, datos).

**Contenido de Fran.** Por proyecto: frase de problema, stack (3–5), enlaces a repo y demo, dato
concreto, 2–3 capturas. Puede avanzar con marcadores y capturas de relleno.

---

### Fase 5 · Trayectoria

**Objetivo.** El trazo de pincel que se dibuja con el scroll e ilumina cada hito al pasar.

**Entregable.** Sección 四 según d-09, d-10 (horizontal, años en vertical) y m-08, m-09 (vertical,
años en horizontal).

**Archivos.**
- Se crean: `web/src/components/journey/JourneyStroke.astro` (usa `InkStroke`),
  `web/src/data/ink/journey.ts` (líneas centrales y perfiles horizontal y vertical, tomados de las maquetas).
- Se modifican: `sections/Journey.astro`, `data/journey.ts`, `reference-specs.ts`.

**Comportamiento.**
- Escritorio: escena sticky. Cuatro columnas (C1: los 4 hitos de la definición); años con `writing-mode: vertical-rl` y
  `text-orientation: upright`; el trazo avanza de izquierda a derecha; al llegar a cada hito, su
  círculo se rellena y su columna pasa de opacidad 0,4 a 1.
- Móvil: sin sticky. Modo `pass`: el trazo vertical avanza mientras la lista atraviesa la ventana.
- Los hitos se marcan con `data-step` (no se anuncian con `aria-live`: es decoración del orden).

**Criterios de aceptación.**
1. Cada hito se ilumina exactamente cuando la punta del trazo alcanza su círculo (±4 px), en los 4 hitos, en escritorio y móvil.
2. Estados intermedios comparables con d-09 (tres hitos encendidos) y m-08.
3. Años en vertical legibles en Chrome, Firefox y Safari (Safari en red local).
4. La lista es un `<ol>` con los hitos en orden y legible sin el trazo.
5. D1–D11.

**Riesgos.**
| Riesgo | Mitigación |
| --- | --- |
| `vertical-rl` con dígitos `upright` se ve distinto entre navegadores | Capturas en los tres motores; alternativa: dígitos apilados con un `<span>` por dígito |
| El trazo se deforma con el ancho (`preserveAspectRatio="none"` de la maqueta) | Escalar solo en el eje largo y mantener el grosor con `vector-effect` o regenerando el perfil por ancho |
| El número de hitos cambia más adelante | La sección se construye para N hitos desde `journey.ts`, no para 4 fijos |

**Dependencias.** Fase 1 (motor), fase 2 (`InkStroke`).

**Contenido de Fran.** Fechas exactas y una frase por hito; resolver C1 y C2. Puede avanzar con
marcadores.

---

### Fase 6 · Stack y Contacto

**Objetivo.** El stack con «usado en» y el cierre: «¿Hablamos?», el sello final, CV y pie.

**Entregable.** Secciones 五 y 六 según d-11 a d-14 y m-10 a m-13, y los dos separadores sumi-e (C13).

**Archivos.**
- Se crean: `web/src/components/stack/TechItem.astro` (desplegable si tiene `usedIn`),
  `web/src/components/Footer.astro`, `web/src/components/InkDivider.astro` (usa `InkStroke`),
  `web/src/scripts/reveal.ts` (aparición escalonada y estampación final por IntersectionObserver),
  `web/public/cv/` (PDF).
- Se modifican: `sections/Stack.astro`, `sections/Contact.astro`, `data/stack.ts`, `Home.astro`
  (separadores), `reference-specs.ts`.

**Criterios de aceptación.**
1. Stack: 4 grupos; cada tecnología con proyectos tiene botón con `aria-expanded` y enlace al panel; abre con clic, toque, Enter/Espacio y, con ratón, en hover; las que no tienen proyectos son texto plano.
2. `usedIn` coincide 100 % con `projects.ts`; quitar una tecnología de `stack.ts` que use un proyecto hace fallar el build (control negativo).
3. Aparición escalonada ≤ 600 ms en total; con reduced motion, todo visible al instante.
4. Contacto: «¿Hablamos?» 184 px en escritorio y 58 px en móvil (±1 px); el sello se estampa una sola vez al entrar en vista; enlaces ≥ 44 px de alto (C14).
5. CV: el enlace descarga el PDF en español; peso del PDF ≤ 500 KB.
6. Pie: © con el año de build, atribución de KanjiVG con enlace y licencia, «Volver arriba» funcional y con foco visible.
7. Separadores: 2 en toda la página; se dibujan al entrar en vista; `aria-hidden`.
8. D1–D11.

**Riesgos.**
| Riesgo | Mitigación |
| --- | --- |
| Hover + clic en el mismo botón se pisan (abre en hover, el clic lo cierra) | En dispositivos con ratón, el hover solo previsualiza; el clic fija o suelta el estado |
| Email expuesto a *scraping* | Aceptado (P9): va en claro |
| `¿Hablamos?` a 184 px desborda entre 960 y 1200 px con el sello a la derecha | Escala fluida y el sello se recoloca; criterio de desborde D8 |

**Dependencias.** Fase 4 (`projects.ts` para `usedIn` y anclas), fase 2 (`Hanko`, `InkStroke`).

**Contenido de Fran.** Lista final del stack, email, LinkedIn, CV en PDF. Puede avanzar con
marcadores y un PDF de prueba.

---

### Fase 7 · Proyectos: detalles propios (propuesta nueva)

**Por qué la añado.** Tu estructura mete las animaciones propias de cada proyecto dentro de la fase de
Proyectos. Las separo porque (1) no caben en la misma sesión que el escenario y (2) **no pueden
avanzar con marcadores**: la TUI de Chainview, el hash de DocChain o las cifras de FinTrack necesitan
el material real. Así las fases 1–6 avanzan mientras reúnes el material.

**Objetivo.** El detalle visual de cada panel, ligado al progreso de su tramo.

**Entregable.**
| Proyecto | Detalle (de la definición) |
| --- | --- |
| 一 Chainview | Captura de la TUI reproducida en HTML con Plex Mono |
| 二 DocChain | El hash se escribe carácter a carácter y cae el sello |
| 三 La previa | Móviles en una sala; destacar que está en uso real |
| 四 FinTrack | Cifras que se cuentan y gráfica que se dibuja |
| 五 Web3 Blog | Un artículo que aparece como si se publicara |

**Archivos.** `web/src/components/projects/details/{Chainview,DocChain,LaPrevia,FinTrack,Web3Blog}.astro`,
`web/src/assets/projects/*`, `data/projects.ts`.

**Criterios de aceptación.**
1. Cada detalle depende solo de `--p` local de su tramo (reversible al subir), sin temporizadores.
2. Con reduced motion o sin JS, cada detalle aparece en su estado final.
3. El texto de la TUI y el hash son texto real (seleccionable y legible por lector de pantalla), no imágenes.
4. Las cifras animadas tienen su valor final en el HTML (lo anuncian los lectores de pantalla).
5. D1–D11; JS añadido por esta fase ≤ 8 KB gzip.

**Riesgos.** Cinco micro-escenas en una sesión → **punto de corte** tras Chainview + DocChain.
La gráfica de FinTrack necesita datos: se usan datos de ejemplo marcados como tales si no hay reales.

**Dependencias.** Fase 4. Material real de cada proyecto.

**Contenido de Fran.** Bloqueante: salida real de la TUI de Chainview, un hash de ejemplo de DocChain,
capturas de La previa, cifras de FinTrack, un artículo del blog.

---

### Fase 8 · Cierre

**Objetivo.** Menú móvil, contenido real, SEO, auditoría de accesibilidad, rendimiento, Safari real
y despliegue.

**Entregable.** La web publicada en el dominio, sin marcadores, en español.

**Archivos.**
- Se crean: `web/src/components/NavMenu.astro` (según la maqueta de Fran, C9),
  `web/src/components/Seo.astro` (title, description, canonical, Open Graph, Twitter), JSON-LD
  (`Person` + `WebSite`), `web/public/og-image.png` (1200 × 630, papel, nombre + sello),
  `web/public/robots.txt`, `web/src/pages/404.astro`, configuración del despliegue (cabeceras de
  caché para fuentes y `_astro/`).
- Se modifican: todos los `data/*.ts` e `i18n/ui.ts` (contenido real), `Nav.astro` (botón de menú),
  `nav.ts`, `Layout.astro` (SEO), `astro.config.mjs` (`site`, sitemap).
- Dependencia nueva: `@astrojs/sitemap`.

**Punto de corte.** 8a = menú móvil + contenido real (commit); 8b = SEO, auditorías y despliegue.

**Criterios de aceptación.**
1. Menú móvil: coincide con la maqueta de Fran (`qa:specs` ±1 px); abre y cierra con botón y Esc; el foco queda atrapado dentro y vuelve al botón al cerrar; `aria-expanded` correcto; papel, sumi y reduced motion.
2. `STRICT_CONTENT=1 pnpm build` pasa: 0 marcadores.
3. SEO: validadores de Open Graph y de datos estructurados sin errores; `sitemap-index.xml` con la URL de la web.
4. Lighthouse ≥ 95 en las cuatro categorías, móvil y escritorio (2 mediciones, mediana de 3 pasadas cada una).
5. Accesibilidad manual: recorrido completo con teclado; NVDA en Windows; VoiceOver en iOS y macOS; zoom al 200 % sin pérdida de contenido.
6. Safari real (iOS y macOS): auditoría `?debug` del kaizen 0 / 0 / 0 sobre la web desplegada y recorrido de las seis secciones en los dos modos.
7. Despliegue: HTTPS, dominio, 404 propia, fuentes con `Cache-Control: immutable`.
8. D1–D11 sobre la web desplegada.

**Riesgos.**
| Riesgo | Mitigación |
| --- | --- |
| Safari falla tarde (no hay preview, P4) | Prueba del lab antes de la fase 3 y comprobación en red local (`pnpm dev --host`) al cerrar cada fase con animación (2–6) |
| El primer despliegue revela diferencias con local (rutas, cabeceras, caché) | `pnpm build && pnpm preview` en local como paso previo; despliegue en 8b con tiempo para corregir |
| La maqueta del menú llega tarde | La fase 8a empieza por el contenido; el menú se hace cuando llegue la maqueta |
| Lighthouse < 95 por el peso de Shippori o del HTML del kaizen (184 KB) | Presupuestos medidos desde la fase 1 (criterio 7 y D11); el kaizen ya da 46 KB gzip |

**Dependencias.** Todas las anteriores. Maqueta del menú móvil de Fran.

**Contenido de Fran.** Bloqueante: todo lo de la lista «Pendiente de Fran» de la definición, maqueta
del menú móvil, dominio y cuenta de despliegue.

---

## 5. Mapa de dependencias
```
F1 Base ──┬── F2 Inicio ──────────────┬── F6 Stack y Contacto ──┐
          ├── F3 Sobre mí (kaizen)    │                         │
          ├── F4 Proyectos ───────────┤                         ├── F8 Cierre
          │        └──────────── F7 Detalles de proyectos ──────┤
          └── F5 Trayectoria (usa InkStroke de F2) ─────────────┘
Prueba de Safari del lab ──► antes de F3
```
Orden propuesto: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. La 7 puede adelantarse en cuanto haya material.

## 6. Contenido que necesito, por fase
| Fase | Contenido | ¿Bloquea? |
| --- | --- | --- |
| 1 | Dominio (opcional) | No |
| 2 | Rol, frase del hero, iniciales del sello | No |
| 3 | Párrafo «Sobre mí», tu versión del kaizen, datos rápidos, foto sí/no | No |
| 4 | Por proyecto: problema, stack, enlaces, dato, capturas | No |
| 5 | Fechas y frase por hito (4 hitos, C1); año de cada uno (C2) | No |
| 6 | Stack final, email, LinkedIn, CV en PDF (español) | No |
| 7 | Material de cada proyecto (TUI, hash, capturas, cifras, artículo) | **Sí** |
| 8 | Todo lo anterior + maqueta del menú móvil + dominio y despliegue | **Sí** |

---

## 7. Preguntas
Las 11 preguntas del borrador están resueltas (ver «Respuestas de Fran»). Queda abierta una, que no
bloquea hasta la fase 5:

- **C2 · Año de cada hito.** La definición dice «DAM 2023» y la maqueta pone 2023 en «Título y
  contrato». Con los 4 hitos de la definición, ¿qué año lleva cada uno?
