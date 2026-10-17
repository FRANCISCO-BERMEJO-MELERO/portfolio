# Portfolio de Fran — Definición

Oct 15, 2026 · @Fran

## Objetivo y concepto

Un portfolio de estructura clásica (inicio, sobre mí, proyectos, trayectoria, stack y contacto) con una identidad visual propia: **papel de día, tinta de noche**, y una estética japonesa sobria donde cada elemento significa algo.

- **Para quién**: reclutadores y equipos técnicos de Web3 e IA. Tienen que encontrar los proyectos en menos de 30 segundos.
- **Qué tiene que transmitir**: que Fran construye cosas reales y mejora de forma constante. Ese hilo es el *kaizen*.
- **Regla de oro**: ningún elemento japonés es decoración. Nada de cerezos, kanji sin sentido ni fuentes «estilo japonés». Si un elemento no aporta significado, fuera.
- **Referencia de método**: margarethamilton.dev de midudev. No se copia su estética, sino su forma de trabajar: cada animación nace del contenido.

## Paletas

Dos modos que parecen el mismo objeto: el modo claro es papel y el oscuro es tinta *sumi*. El bermellón es el rojo de los sellos *hanko* y se usa con moderación: sello, enlaces, botón principal e índices.

| Token | Claro (papel) | Oscuro (sumi) | Uso |
| --- | --- | --- | --- |
| `--bg` | `#f3efe6` | `#15130f` | Fondo de página |
| `--surface` | `#ebe5d8` | `#1e1b16` | Tarjetas y paneles |
| `--text` | `#1b1a17` | `#ece6d8` | Texto principal |
| `--text-2` | `#6b665c` | `#8c8577` | Texto secundario |
| `--line` | `#d6cfbf` | `#2e2a23` | Bordes y separadores |
| `--accent` | `#e2482a` | `#f0573a` | Bermellón: sello, CTA, enlaces |

- El modo se elige por `prefers-color-scheme` y se puede cambiar con un interruptor (se recuerda en `localStorage`).
- Pendiente de validar el modo oscuro en una maqueta antes de cerrarlo.

## Tipografía

Serif con alma japonesa para títulos y una sans limpia para leer. Las dos en Google Fonts, autoalojadas con la API de fuentes de Astro.

| Rol | Fuente | Pesos | Notas |
| --- | --- | --- | --- |
| Títulos y kanji | Shippori Mincho | 400, 600 | Incluye kanji, así que 改善 y los números 一 二 三 salen de la misma familia |
| Texto corrido | Inter (o Zen Kaku Gothic New) | 400, 500 | Inter si se prioriza legibilidad en latino; Zen Kaku si se quiere más coherencia japonesa |
| Código y datos | IBM Plex Mono | 400 | Solo en detalles técnicos: stack, hashes de DocChain, la TUI de Chainview |

Shippori Mincho con kanji pesa bastante: hay que subconjuntarla (*subsetting*) a los caracteres que usemos.

## Secciones

Seis secciones en una sola página, con navegación fija que marca la sección activa. La escena estrella es el kaizen de «Sobre mí».

| # | Sección | Contenido | Animación |
| --- | --- | --- | --- |
| 一 | Inicio | Nombre, rol en una línea, frase propia, botones «Ver proyectos» y «Contacto» | Un sello *hanko* rojo con las iniciales se estampa al cargar (escala + leve rotación + mancha de tinta). Ese sello es el logo de toda la web |
| 二 | Sobre mí | Párrafo en primera persona, datos rápidos (Córdoba, Web3 + IA, Gavisa) y el bloque kaizen | 改善 se dibuja trazo a trazo en su orden real con el scroll. Al lado, el texto: 改 (cambiar) + 善 (bueno) = cambiar a mejor, y cómo eso describe su camino y su forma de aprender |
| 三 | Proyectos | Un panel por proyecto: captura, problema que resuelve, stack y enlaces a repo y demo | Escenario *sticky*: cada proyecto entra como un panel *shoji* que se desliza. Índice en kanji (一, 二, 三…) |
| 四 | Trayectoria | DAM 2023 → Fernauro → prácticas en Gavisa (blockchain) → empleado en Gavisa (IA) | Un trazo de pincel se dibuja con el scroll; cada hito se ilumina al pasar. Años en vertical con `writing-mode: vertical-rl` |
| 五 | Stack | Tecnologías agrupadas: Frontend, Web3, Backend, IA y automatización | Aparición escalonada; en hover cada tecnología muestra en qué proyecto se usó |
| 六 | Contacto | Email, GitHub, LinkedIn y CV descargable bajo un «¿Hablamos?» grande | El *hanko* vuelve y se estampa sobre el titular, cerrando el círculo con el inicio |

**Transversal**

- Un *ensō* (círculo zen de un trazo) dibujado en SVG como elemento de transición o fondo del hero.
- Separadores sumi-e mínimos (ola o montaña) entre secciones, como mucho dos o tres en toda la web.
- Selector ES/EN y selector claro/oscuro en la navegación.
- Con `prefers-reduced-motion` todo aparece ya dibujado, sin animar.

## Proyectos

Cinco proyectos, todos con repo abierto, ordenados de más a menos peso técnico para el perfil Web3 + IA.

| # | Proyecto | Qué es | Detalle visual propio |
| --- | --- | --- | --- |
| 一 | Chainview | TUI en Go para wallets EVM, open source | Captura de la TUI reproducida en HTML con Plex Mono |
| 二 | DocChain | Certificación de documentos en blockchain | El hash del documento se escribe carácter a carácter y cae el sello |
| 三 | La previa | Plataforma de juegos de fiesta para móvil, v1 lanzada | Mockup de móviles en una sala; destacar que está en uso real |
| 四 | FinTrack | Gestor de finanzas personales | Cifras que se cuentan y una gráfica que se dibuja |
| 五 | Web3 Blog | Blog sobre Web3 | Un artículo que aparece como si se publicara |

Por cada proyecto hace falta:

- [ ] 2-3 capturas o un vídeo corto (mejor en formato horizontal y vertical)
- [ ] Una frase: qué problema resuelve y para quién
- [ ] Stack principal (3-5 tecnologías)
- [ ] Enlace al repo y, si existe, a la demo
- [ ] Un dato concreto si lo hay (usuarios, partidas, documentos certificados, estrellas)

## Elementos japoneses

Seis elementos, cada uno con un papel concreto. Ninguno más sin justificarlo.

| Elemento | Qué es | Dónde se usa | Por qué |
| --- | --- | --- | --- |
| 改善 *kaizen* | Mejora continua: 改 cambiar + 善 bueno | Sobre mí | Resume la trayectoria de Fran: pasos pequeños y constantes |
| 判子 *hanko* | Sello personal rojo que sustituye a la firma | Logo, inicio y contacto | Es su firma: abre y cierra la web |
| 円相 *ensō* | Círculo zen trazado de una sola pincelada | Hero o transiciones | Simboliza lo completo dentro de lo imperfecto |
| 障子 *shoji* | Panel corredero de papel y madera | Proyectos | Cada proyecto se «abre» como una puerta |
| 墨絵 *sumi-e* | Pintura a tinta, trazo suelto y mucho vacío | Separadores e ilustraciones | Da el tono de tinta del modo oscuro |
| 一 二 三 | Números en kanji | Índices de secciones y proyectos | Orden visual sin añadir ruido |

## Técnica y stack

Astro estático, sin frameworks de UI, con el mismo motor de scroll que margarethamilton.dev y GSAP solo donde CSS no llegue.

- **Astro** con componentes `.astro`, CSS con ámbito y TypeScript estricto. Despliegue gratis en Vercel o Cloudflare Pages.
- **Motor de scroll propio**: cada `[data-scene]` es un contenedor alto con un escenario `position: sticky`. Un script calcula su progreso de 0 a 1 y lo expone como `--p`, así casi todas las animaciones son CSS puro.
- **Trazos de kanji y pincel**: SVG con `stroke-dasharray` y `stroke-dashoffset` ligados a `--p`. Cada trazo de 改善 tiene su tramo del progreso, en orden.
- **GSAP** solo para la estampación del *hanko* y alguna secuencia con *timeline*; si se puede hacer con CSS, no entra.
- **Lenis** opcional para scroll suave; se decide al probar en móvil.
- **i18n** de Astro: español en `/` y inglés en `/en/`.
- **Accesibilidad y rendimiento**: `prefers-reduced-motion`, textos alternativos, imágenes optimizadas con `astro:assets` y objetivo de Lighthouse 95+.

## Estructura del proyecto

Un componente por sección, los datos de proyectos y trayectoria separados del marcado, y los scripts de animación aislados.

```
/
├── public/                 # favicon (el hanko), og-image, robots.txt
└── src/
    ├── assets/
    │   ├── projects/       # capturas de cada proyecto
    │   ├── kanji/          # SVG de KanjiVG: 改, 善
    │   └── ink/            # ensō e ilustraciones sumi-e
    ├── components/
    │   ├── sections/       # Hero, About, Projects, Journey, Stack, Contact
    │   ├── Hanko.astro     # sello reutilizable
    │   ├── KanjiStroke.astro
    │   ├── Enso.astro
    │   └── Nav.astro
    ├── data/
    │   ├── projects.ts     # textos ES/EN, stack, enlaces
    │   └── journey.ts      # hitos de la trayectoria
    ├── layouts/Layout.astro
    ├── pages/              # / (ES) y /en/ (EN)
    ├── scripts/
    │   ├── scroll.ts       # progreso --p por escena
    │   ├── hanko.ts        # estampación con GSAP
    │   └── theme.ts        # claro / oscuro
    ├── styles/tokens.css   # paletas y tipografía
    └── i18n.ts
```

## Recursos y licencias

Todo lo externo es libre, pero dos recursos exigen atribución en el pie de la web.

| Recurso | Para qué | Licencia | Obligación |
| --- | --- | --- | --- |
| [KanjiVG](https://kanjivg.tagaini.net/) | Trazos de 改 y 善 en orden de escritura | CC BY-SA 3.0 | Atribuir y compartir los SVG derivados con la misma licencia |
| Shippori Mincho, Inter, IBM Plex Mono | Tipografía | SIL Open Font License | Ninguna práctica al autoalojarlas |
| [margarethamilton.dev](https://github.com/midudev/margarethamilton.dev) | Referencia de técnica | MIT | Solo inspiración; si se reutiliza código, mantener el aviso MIT |
| Ilustraciones sumi-e | Ensō y separadores | Propias (SVG) | Ninguna |

## Pendiente de Fran

Sin estos materiales, las animaciones no tienen nada que mostrar. Es lo primero que hay que cerrar.

- [ ] Frase del hero, con tus palabras (nada de «passionate developer»)
- [ ] Texto de «Sobre mí» y tu versión de qué significa kaizen para ti
- [ ] Foto: ¿sí o no? Si sí, una con fondo neutro
- [ ] Material de los cinco proyectos (ver checklist de Proyectos)
- [ ] Fechas exactas de la trayectoria (Fernauro, inicio de prácticas, contrato en Gavisa)
- [ ] Iniciales o carácter para el *hanko*
- [ ] Email de contacto y CV en PDF
- [ ] Dominio: ¿tienes uno pensado?
- [ ] Validar el modo oscuro *sumi* en una maqueta
