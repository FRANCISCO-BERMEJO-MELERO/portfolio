---
author: Francisco Bermejo
branch: content/real-content
status: review
date: 2026-10-22
spec: 02-DOCS/wiki/ftd/contenido-spec.md
---

# Contenido real · informe de revisión

## Intent
Sustituir los marcadores del portfolio por contenido real en español e inglés (spec de contenido,
fase única), sin tocar diseño, animaciones ni la escena kaizen. Fuentes: los repos públicos, los datos
verificados de la spec, las maquetas de `reference/` y las respuestas de Fran.

## Cómo leer este informe
- **Origen** de cada texto: `repo:<nombre>/<archivo>`, `spec`, `Fran` o **`redactado`**.
  `redactado` es un texto escrito por Claude con datos de las fuentes: **hay que revisarlo sí o sí**.
  Cuando un texto redactado se apoya en un dato concreto, el dato va entre paréntesis.
- Las traducciones al inglés de textos `redactado` son también `redactado`.
- **Longitudes.** Cada texto tiene las líneas de su hueco en las maquetas (`scripts/qa/reference-specs.ts`):
  rol y frase del hero, 1 línea; «sobre mí», 2; texto del kaizen, 2; línea y problema de cada
  proyecto, 2; dato del proyecto, 1; título, detalle y frase de cada hito, 1. Por eso varios textos
  son más cortos que lo que pide la spec («descripción de 2-3 frases», «2-3 puntos técnicos»): lo que
  no cabe está más abajo, en «Material que no cabe en el diseño».

## Decisiones de Fran (tanda única de preguntas, 22 oct)
| Tema | Decisión |
| --- | --- |
| Inglés | `/en/` con `hreflang` y selector ES / EN en la barra, como en las maquetas (C15). Deja sin efecto P10 |
| Hitos | Se mantienen 4 (C1). El cuarto es «contrato en Gavisa (2025) y giro a la IA», con el título de DAM (también 2025) como dato. El «2023» de la spec para título y contrato era un error |
| LinkedIn | Confirmado el del README de DocChain |
| La previa | Se describe lo que hace el código (lógica en funciones RPC de Supabase) |
| Validación | Con las herramientas del proyecto (Chrome por CDP), no con Playwright (decisión previa del plan, §1.8) |
| Foto | Fuera: el diseño no tiene hueco |
| Email | bermel.f08@gmail.com (respuesta posterior de Fran) |
| Años | Inicio del DAM 2023; Fernauro 2023–24 (primer curso); prácticas en Gavisa 2024–25 (segundo curso, un año); título de DAM y contrato en Gavisa 2025 (contrato desde septiembre); giro a la IA 2025–26 (respuesta posterior de Fran) |
| CV | «Lo subimos al final» |

## Textos por sección

### Global y SEO
| Campo | ES | EN | Origen |
| --- | --- | --- | --- |
| `<title>` | Francisco Bermejo · Desarrollador full-stack y Web3 | Francisco Bermejo · Full-stack & Web3 developer | spec |
| Meta description | Francisco Bermejo, desarrollador full-stack y Web3 en Gavisa TIC (Córdoba): agentes de IA, automatizaciones con n8n, dApps en Solidity y webs con Next.js. (154 caracteres) | Francisco Bermejo, full-stack and Web3 developer at Gavisa TIC in Córdoba, Spain: AI agents, n8n automations, Solidity dApps and websites built with Next.js. (157) | redactado (spec; Solidity y Next.js de repo:DocChain y repo:La-previa) |
| Open Graph | título y descripción = los de arriba; `og:locale` es_ES / en_US con su alternativo; sin `og:image` (no existe) | ídem | spec |
| JSON-LD `Person` | name Francisco Bermejo · jobTitle = rol · worksFor Gavisa TIC · Córdoba, ES · sameAs GitHub y LinkedIn | ídem con el rol en inglés | spec, Fran (LinkedIn) |
| Pie | © año Francisco Bermejo · Trazos de 改善: KanjiVG · CC BY-SA 3.0 (con enlace a la licencia) · Volver arriba | Strokes of 改善 … · Back to top | spec |
| Selector de idioma | ES / EN (nombre accesible «ES (Español)», «EN (English)») | ídem | maquetas d-01, m-01 |

### 一 Inicio
| Campo | ES | EN | Origen |
| --- | --- | --- | --- |
| Rol | Desarrollador full-stack y Web3 | Full-stack & Web3 developer | spec |
| Frase | De Web3 a la IA. | From Web3 to AI. | **redactado** (spec: el camino de blockchain a IA). Variantes abajo |
| Sello | FB | FB | spec (iniciales del nombre) |
| Ubicación | Córdoba, España | Córdoba, Spain | spec |
| Botones | Ver proyectos · Contacto · Seguir: Sobre mí | See projects · Contact · Next: About | ya estaban (ES); EN redactado |

### 二 Sobre mí
| Campo | ES | EN | Origen |
| --- | --- | --- | --- |
| Texto | Hago agentes de IA, automatizaciones y webs. | I build AI agents, n8n automations and websites. | **redactado** (spec: día a día en Gavisa) |
| Datos rápidos | Base: Córdoba · Foco: Web3 + IA · Ahora: Gavisa | Base · Focus · Now: Córdoba · Web3 + AI · Gavisa | spec |
| 改 / 善 | kai · cambiar / zen · bueno | kai · change / zen · good | spec; EN redactado |
| Equivalencia | = cambiar a mejor | = improvement | spec; EN **redactado** («= change for the better» ocupaba 2 líneas y empujaba el bloque) |
| Kaizen y mi camino | Mejorar paso a paso: DAM, Fernauro, blockchain e IA. | Getting better step by step: DAM, Fernauro, blockchain, AI. | **redactado** (spec: pasos pequeños y constantes). Variantes abajo |

Nota: el texto ES de «sobre mí» no dice «con n8n» y el EN sí: en español no cabía en 2 líneas.

### 三 Proyectos
Etiquetas: hasta 4 visibles por panel (con 5, la fila salta a dos en móvil y el panel crece 40 px).
Las demás tecnologías del repo que están en el stack cuentan para el «usado en» (`uses` en
`projects.ts`).

| Proyecto | Campo | ES | EN | Origen |
| --- | --- | --- | --- | --- |
| 一 Chainview | Línea | TUI en Go · open source · Alchemy Builders Forum · 2026 | Go TUI · open source · Alchemy Builders Forum · 2026 | spec; año: repo:chainview (commits jun 2026) |
| | Problema | Vigila wallets EVM desde la terminal, sin claves de API. | Watches EVM wallets from the terminal, with no API keys. | **redactado** (repo:chainview/README.md) |
| | Dato | 7 redes EVM de serie | 7 EVM networks built in | repo:chainview/internal/chain/networks.go |
| | Stack | Go | | repo:chainview/go.mod |
| | Captura | La TUI en HTML: «CHAINVIEW · Accounts Balances Transactions · No wallets — type an address (0x…) or ENS name and press Enter.» | ídem (es la salida real, en inglés) | repo:chainview/internal/ui/testdata/golden/cuentas.golden |
| | Pie | La pestaña de cuentas de Chainview, sin wallets todavía | The Chainview accounts tab, before adding any wallet | redactado |
| | Enlaces | Repositorio (sin demo) | | repo |
| 二 DocChain | Línea | Certificación de documentos en blockchain · 2026 | Document certification on the blockchain · 2026 | ya estaba; año: repo:DocChain (feb–mar 2026) |
| | Problema | Guarda en Ethereum el hash de un archivo, sin subirlo. | Stores a file’s hash on Ethereum without uploading it. | **redactado** (repo:DocChain/README.md, `web/app/app/_components/register-tab.tsx`) |
| | Dato | SHA-256 en el navegador | SHA-256 in the browser | repo:DocChain/web/app/app/_components/register-tab.tsx |
| | Stack | Solidity · Foundry · Wagmi / Viem · Next.js (+ TypeScript, React, Tailwind en «usado en») | | repo:DocChain/web/package.json, DocChain/foundry.toml |
| | Captura | **pendiente** (el repo no trae capturas) | | — |
| | Enlaces | Repositorio (sin demo) | | repo |
| 三 La previa | Línea | Juegos de fiesta para el móvil · v1 lanzada · 2026 | Party games for your phone · v1 released · 2026 | spec; v1: repo:La-previa (release v1.0.0, 15 oct 2026) |
| | Problema | Una sala, un código y cada uno juega desde su móvil. | One room, one code, and everyone plays on their phone. | **redactado** (repo:La-previa/README.md, spec) |
| | Dato | 7 juegos, sin cuentas | 7 games, no accounts | repo:La-previa/README.md, `src/games/` |
| | Stack | Next.js · Supabase · TypeScript · Tailwind (+ React y Claude Code en «usado en») | | repo:La-previa/package.json; Claude Code: `CLAUDE.md` y `.claude/` del repo |
| | Captura | Pantalla de inicio (`docs/img/01-inicio.png`), optimizada con `astro:assets` (AVIF/WebP) | | repo:La-previa/docs/img/01-inicio.png |
| | Texto alternativo | Pantalla de inicio de La previa: campo del código, botones para unirse, escanear QR y crear sala | La previa home screen: room code field and buttons to join, scan a QR code and create a room | repo:La-previa/README.md (alt de la captura), traducido |
| | Pie | Inicio: unirse con código o QR, o crear sala | Home: join with a code or QR, or create a room | repo:La-previa/README.md |
| | Enlaces | Repositorio · Demo (la-previa-plum.vercel.app) | | repo (homepage del repo) |
| 四 FinTrack | Línea | Gestor de finanzas personales · 2025–2026 | Personal finance tracker · 2025–2026 | ya estaba; años: repo:FinTrack (oct 2025 – feb 2026) |
| | Problema | Ingresos, gastos e inversiones en un solo panel. | Income, expenses and investments in one dashboard. | **redactado** (repo:FinTrack/README.md) |
| | Dato | Express y SQLite | Express and SQLite | repo:FinTrack/server/package.json |
| | Stack | React · Node.js · Tailwind | | repo:FinTrack/web/FinTrack-Web/package.json, server/package.json |
| | Captura | **pendiente** (el repo no trae capturas) | | — |
| | Enlaces | Repositorio (sin demo) | | repo |
| 五 Web3 Blog | Línea | Blog sobre Web3 · 2025–2026 | Blog about Web3 · 2025–2026 | ya estaba; años: repo:web3-blog (nov 2025 – jul 2026) |
| | Problema | Web3 explicado desde cero, en español. | Web3 explained from scratch, in Spanish. | **redactado** (repo:web3-blog/README.md) |
| | Dato | 8 artículos publicados | 8 articles published | repo:web3-blog/src/content/posts |
| | Stack | Astro · TypeScript · Tailwind | | repo:web3-blog/package.json |
| | Captura | **pendiente** (solo trae imágenes de los artículos) | | — |
| | Enlaces | Repositorio · Demo (web3-blog-lac.vercel.app) | | repo (homepage del repo) |

### 四 Trayectoria
| Hito | Campo | ES | EN | Origen |
| --- | --- | --- | --- | --- |
| 1 | Año | 2023 | 2023 | Fran |
| | Título · detalle | Inicio del DAM · CFGS DAM · Ces Lope de Vega | Starting DAM · DAM degree · Ces Lope de Vega | spec |
| | Frase | Y el Aula de Software Libre de la FP. | Plus the Free Software Classroom. | **redactado** (spec) |
| 2 | Año | 2023 | 2023 | Fran (2023–24: en escritorio el año se escribe en vertical y solo cabe uno; va el de inicio) |
| | Título · detalle | FP dual en Fernauro · Webs académicas y Java | Fernauro, dual VET · Academic websites and Java | spec |
| | Frase | Primer curso: primeros proyectos. | First year: first real projects. | **redactado** («primer curso», de Fran; «Primer curso · webs académicas y Java» en el detalle partía la línea en móvil) |
| 3 | Año | 2024 | 2024 | Fran (2024–25, segundo curso; «Segundo curso, un año.» partía la línea en móvil) |
| | Título · detalle | Prácticas en Gavisa · Blockchain: Ethereum, L2, IPFS, Cosmos y account abstraction (ERC-4337 / 7579) | Internship at Gavisa · … and account abstraction (ERC-4337 / 7579) | spec |
| | Frase | Un año. IPFS sigue en producción. | A year. IPFS is still in production. | **redactado** (spec) |
| 4 | Año | 2025 | 2025 | Fran (título y contrato; el giro a la IA es 2025–26) |
| | Título · detalle | Contrato en Gavisa · Título de DAM · giro a la IA | Hired at Gavisa · DAM degree · turn to AI | spec, Fran |
| | Frase | Desde septiembre: IA, n8n y webs. | Since September: AI, n8n, websites. | **redactado** (spec, Fran; «agentes de IA» partía la línea en móvil) |

Terminología: «account abstraction» en los dos idiomas, sin traducir, como ya estaba.

### 五 Stack · «usado en»
Calculado desde las dependencias de los repos (`projects.ts`). Sin proyecto, apunta a la trayectoria
cuando la spec sitúa allí la tecnología; si no, no lleva «usado en».

| Tecnología | Usado en | Origen |
| --- | --- | --- |
| TypeScript | DocChain, La previa, Web3 Blog | package.json / tsconfig de cada repo |
| React | DocChain, La previa, FinTrack | package.json |
| Next.js | DocChain, La previa | package.json |
| Astro | Web3 Blog | package.json |
| Tailwind | DocChain, La previa, FinTrack, Web3 Blog | package.json |
| Solidity · Foundry · Wagmi / Viem | DocChain | `DocChain/src/DocManager.sol`, `foundry.toml`, `web/package.json` (wagmi, viem) |
| Hardhat | — | no aparece en ningún repo público ni en la spec |
| IPFS · Cosmos SDK | Gavisa (trayectoria) | spec (prácticas) |
| Go | Chainview | go.mod |
| Node.js | FinTrack | server/package.json |
| Supabase | La previa | package.json |
| Java | Fernauro (trayectoria) | spec |
| n8n | Gavisa (trayectoria) | spec |
| Ollama | — | no aparece en ningún repo público ni en la spec |
| Claude Code | La previa | `CLAUDE.md` y `.claude/` en el repo. **Revísalo**: es una herramienta de desarrollo, no una dependencia |

Grupos en inglés: Frontend · Web3 · Backend & tools · AI & automation (**redactado**).

### 六 Contacto
| Campo | ES | EN | Origen |
| --- | --- | --- | --- |
| Titular | ¿Hablamos? | Let's talk | ya estaba; EN **redactado** («Shall we talk?» empujaba el sello 6 px fuera de la pantalla a 1440) |
| Texto breve | — | — | el diseño no tiene hueco para él (d-13, m-12) |
| Email | bermel.f08@gmail.com | | Fran |
| GitHub | github.com/FRANCISCO-BERMEJO-MELERO | | spec |
| LinkedIn | linkedin.com/in/francisco-bermejo-melero-250669302/ | | repo:DocChain/README.md, confirmado por Fran |
| CV | **pendiente** (enlaza aún al PDF de prueba, marcado como provisional) | | — |

## Variantes descartadas
### Frase del hero (hueco: 1 línea, también en móvil)
1. **Puesta:** «De Web3 a la IA.» / «From Web3 to AI.»
2. «De Web3 a la IA, paso a paso.» / «From Web3 to AI, step by step.» Ocupa 2 líneas en móvil y baja los botones 38 px.
3. «Construyo con IA y blockchain, paso a paso.» / «I build with AI and blockchain, one step at a time.» 2 líneas en escritorio.

### Kaizen y mi camino (hueco: 2 líneas, dentro del escenario sticky)
1. **Puesta:** «Mejorar paso a paso: DAM, Fernauro, blockchain e IA.» / «Getting better step by step: DAM, Fernauro, blockchain, AI.»
2. «Pasos pequeños y seguidos: DAM, Fernauro, Gavisa, IA.» / «Small, steady steps: DAM, Fernauro, Gavisa, AI.»
3. «Mejorar poco a poco, sin parar. Así ha ido mi camino: DAM, Fernauro, blockchain en Gavisa e IA.»
   No cabe: a 1280 × 720 y a 375 × 667 se sale del escenario.

## Material que no cabe en el diseño
Sacado de los repos, por si se abre hueco (fase 7, detalles de cada proyecto):
- **Chainview.** Saldos, tokens ERC-20, valor en USD (DefiLlama), historial con la acción decodificada
  («Transfer 100 USDC → 0x…»), ENS, gas en vivo, paleta de comandos (Ctrl+K), exportación a CSV y
  redes EVM configurables en TOML. Sin claves de API: DefiLlama, Blockscout y RPC públicos. 34
  ficheros de tests (golden y fuzzing), CI y goreleaser. Licencia MIT.
- **DocChain.** El SHA-256 se calcula en el navegador y el archivo no sale del equipo. `DocManager.sol`
  rechaza hashes repetidos. La verificación busca el evento `DocumentRegistered` por hash. La app
  genera un certificado en PDF (jsPDF). Wagmi + RainbowKit para la wallet. Next.js 16 y Tailwind 4.
- **La previa.** 7 juegos (El lobo, El impostor, ¿Quién es más probable que…?, ¿Quién lo dijo?, Una
  sola pista, ¿Qué prefieres?, Palabras prohibidas), de 3 a 16 jugadores. Sala con código de cuatro
  letras, enlace o QR. Los móviles no leen ni escriben tablas: llaman a funciones RPC de Postgres que
  devuelven a cada jugador solo lo que puede ver. Realtime avisa de los cambios. Pruebas: Vitest,
  pgTAP y Playwright. Pensada para fiestas reales: reconexión, Wake Lock y traspaso del anfitrión.
- **FinTrack.** API REST en Express sobre SQLite (better-sqlite3): transacciones, inversiones (tipo,
  plataforma, activo, unidades), gastos fijos que se aplican una vez al mes (`GET /gastosFijos/sincronizar`),
  objetivos y exportación a CSV. Frontend con React 19, Vite, Tailwind 4 y Recharts.
- **Web3 Blog.** Astro 5 con content collections, búsqueda con Fuse.js y sitemap. Artículos: qué es
  blockchain, historia de Bitcoin, IPFS, EOAs frente a cuentas de contrato, trilema, Layer 2,
  soulbound tokens y Bittensor.
- **Sobre mí.** La versión larga que no cabía: «Soy desarrollador full-stack y Web3 en Gavisa TIC,
  en Córdoba. Estudié DAM en el Ces Lope de Vega y aprendí blockchain en Gavisa. Hoy hago agentes de
  IA, automatizaciones con n8n y webs para clientes.»

## Pendiente
| Qué | Dónde se cambia | Nota |
| --- | --- | --- |
| CV en PDF | `web/public/cv/` y `contact.cv` en `site.ts` | El de ahora es de prueba. Fran lo sube al final |
| Capturas de DocChain, FinTrack y Web3 Blog (y su pie) | `web/src/assets/projects/` + `projects.ts` | Los repos no las traen; no se han inventado |
| `og:image` | `web/public/og-image.png` | No existe; prevista en la fase 8 |
| URL absolutas (canonical, `hreflang`, `og:url`) | `astro.config.mjs` (`site`) | Sin dominio son relativas; Google pide absolutas. Fase 8 |

Los marcadores que quedan (`pnpm content:pending`) son exactamente estos: CV,
3 capturas y su pie (en ES y EN). `STRICT_CONTENT=1 pnpm build` fallará hasta que lleguen.

## Incoherencias encontradas
- **Spec · título de DAM y contrato en 2023.** Era un error de la spec (Fran): los dos son de 2025. Corregido en la web (ES y EN) y en la spec. Sobre mí, kaizen, meta description y JSON-LD no llevan años.
- **Spec · La previa «con la API dentro de la propia app».** El código no tiene rutas API: la lógica
  está en funciones RPC de Postgres en Supabase. Se describe el código.
- **Spec · «cinco hitos ya fijados en el diseño».** El diseño tiene 4 (C1). Se mantienen 4.
- **Spec · «con Playwright».** El plan (§1.8) lo descarta. Se ha validado con las herramientas del
  proyecto (Chrome por CDP). Fran está de acuerdo.
- **Spec · inglés frente a P10** (web solo en español). Resuelto por Fran: inglés en `/en/`.
- **Spec · descripción de 2-3 frases y 2-3 puntos técnicos por proyecto, y un «texto breve» en
  Contacto.** El diseño no tiene huecos para ellos. El material está arriba.
- **Los cinco repos** tienen la descripción de GitHub y los topics vacíos.
- **DocChain.** El README de `DocChain/` habla de una carpeta `test/` que no existe. El README raíz
  dice `git clone https://github.com/your-username/DocChain.git`. `.env.example` trae la dirección del
  contrato a cero: no consta un despliegue público, así que no hay demo.
- **FinTrack.** El README dice «This project is private and proprietary», pero el repo es público. La
  sección de backend dice «(Additional backend details to be added)».
- **Chainview.** Tiene flujo de release con goreleaser, pero ninguna release ni etiqueta publicada. Lo
  del Alchemy Builders Forum no aparece en el repo (sale de la spec).
- **Web3 Blog.** El `package.json` se llama «awesome-altitude» (el nombre de la plantilla) y hay un
  `build_log.txt` versionado.
- **LinkedIn** responde 999 a cualquier cliente que no sea un navegador (bloqueo de bots). No se
  puede comprobar el 200 por código; lo confirmó Fran.
- **Rama.** `fase/6-stack-contacto` no está en `develop`. `content/real-content` sale de ella porque
  el contenido necesita las secciones de la fase 6.

## Cambios de código (solo lo necesario para el contenido)
- **Idiomas.** `src/i18n/lang.ts` (idiomas y rutas) y `src/i18n/locale.ts`: cada componente saca
  textos y datos del idioma de su URL. `ui.ts` y `data/*.ts` tienen un bloque por idioma. Página nueva
  `src/pages/en/index.astro`.
- **Selector ES / EN** en `Nav.astro`, con las medidas de d-01 y m-01: enlaces a la portada de cada
  idioma, el actual subrayado (`aria-current`).
- **SEO** en `Layout.astro`: `lang`, canonical, `hreflang` (es, en, x-default), Open Graph, Twitter y
  JSON-LD `Person`.
- **Pie:** «CC BY-SA 3.0» enlaza a la licencia.
- **Proyectos:** la demo solo sale si existe. Desaparecen los huecos «[tecnología]». La TUI pinta
  líneas de texto real. `uses` para el «usado en».
- **Stack:** el «usado en» enlaza a un panel o a la trayectoria (`href`).
- **QA.** `qa:content` nueva (capturas, desbordes, solapes y nombre del hero a 320 px). `qa:contact`
  y `qa:projects` adaptadas a lo que pide la spec: el «usado en» puede incluir más que las etiquetas
  visibles, y el orden de Tab cuenta los enlaces reales de cada panel. `reference-specs.ts`: fuera
  la medida de `project-tech-todo`, que ya no existe.

## Validación (22 oct, sobre el build de esta rama)
| # (spec) | Comprobación | Resultado |
| --- | --- | --- |
| 1 | Cero marcadores | `pnpm content:pending`: quedan solo los de «Pendiente» (CV, 3 capturas y su pie). En el HTML de `/` y `/en/`: sin `href="#"`, `lorem`, `TODO` ni `XXXX` |
| 2 | Build | `pnpm build`: `astro check` 0 errores, 0 avisos, 0 sugerencias; 2 páginas (`/`, `/en/`); sin avisos nuevos |
| 3 | Enlaces externos | 10 responden 200: los 5 repos, el perfil de GitHub, las 2 demos, KanjiVG y la licencia CC BY-SA 3.0. LinkedIn: 999 (bloqueo de bots; ver incoherencias) |
| 4 | Encaje | `pnpm qa:content` ✓: 1440, 390 y 320 px × papel y sumi × ES y EN, con y sin reduced motion. Sin desbordes, sin textos que se crucen y el nombre del hero en 2 líneas a 320 px. 72 capturas en `capturas-contenido/` (`<idioma>-<ancho>-<modo>-<sección>.jpg`). Se comprobó que la regla de solapes detecta el fallo real que hubo (el kaizen largo sobre los datos rápidos) |
| 4 | Pruebas de cada sección | ✓ `qa:about`, `qa:journey`, `qa:contact`, `qa:hanko`, `qa:kaizen`, `qa:nav`, `qa:theme`, `qa:weight`; ✓ `qa:axe`, `qa:keys` y `qa:overflow` en `/` y en `/en/` |
| 4 | `qa:specs` y `qa:projects` | ✗ por una sola diferencia: Chainview tiene **una** tecnología del stack (Go) y su fila de etiquetas mide 33 px en vez de los 74 de la maqueta (que tenía relleno); el dato y los enlaces suben 41 px. Es contenido real, no un desborde. **Decide**: dejarlo así y actualizar la medida, o dar a la fila un alto mínimo |
| — | `qa:hero` y `qa:perf` | ✗ fotogramas de más de 33 ms con CPU ×4. Ya estaba abierto en la fase 6 («repetir con el equipo en reposo»). No se ha medido contra la rama anterior en esta sesión |
| 5 | SEO | `lang` es / en; `hreflang` es, en y x-default recíprocos en las dos páginas; JSON-LD válido (`JSON.parse`) con `Person`; descripción de 154 (ES) y 157 (EN) caracteres. URL relativas hasta que haya dominio |
| — | Control de `qa:content` (puerta nueva) | Falla con un caso malo conocido (el kaizen largo inyectado: detecta el cruce) y pasa con el contenido final. Límite: solo mira cajas de texto; un elemento no textual que se sale (el sello de Contacto) lo detectó `qa:overflow`, no `qa:content` |
| 6 | Accesibilidad del contenido | `lang` por página; los kanji llevan `lang="ja"` y su lectura (escena: «改善, kaizen»; significado: kai / zen; pie: lectura oculta); la única imagen tiene `alt`; axe 0 serious/critical en ES y EN |

Última pasada, con el árbol final (base `4d0e36c`, cambios sin commit hasta este): build 0/0/0,
`qa:content` ✓, `qa:specs` y `qa:projects` ✗ solo por la fila de etiquetas de Chainview.
`qa:about`, `qa:journey`, `qa:hanko`, `qa:kaizen`, `qa:nav`, `qa:theme` y `qa:weight` pasaron sobre el
build anterior al último cambio (titular EN de Contacto y espacio del pie); `qa:contact`,
`qa:overflow` y `qa:content` se repitieron después.

**Veredicto: no cerrada.** Quedan abiertos: los pendientes de Fran (CV, capturas), la
decisión sobre la fila de etiquetas de Chainview y los fotogramas de `qa:hero` / `qa:perf` (abierto
desde la fase 6). Todo lo demás de la spec tiene evidencia arriba.

## Siguiente paso
Fran revisa los textos marcados como **redactado**, pasa los datos pendientes y decide lo de Chainview.
Con eso, `STRICT_CONTENT=1 pnpm build` debe pasar y la fase se cierra.
