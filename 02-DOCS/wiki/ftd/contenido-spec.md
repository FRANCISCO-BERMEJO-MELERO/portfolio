# Spec · Contenido real del portfolio (fase única)

## Objetivo
Sustituir todos los marcadores del portfolio por contenido real, en español (idioma principal) y en inglés, en una sola sesión. Al terminar no debe quedar ningún marcador, el build debe pasar y cada texto debe caber en el diseño aprobado en escritorio y en móvil, en papel y en sumi.

No se toca diseño, animaciones ni la escena kaizen. Solo contenido y los datos que lo alimentan.

## Fuentes, por orden de prioridad
1. **Los repositorios públicos de Fran** (github.com/FRANCISCO-BERMEJO-MELERO). Son la fuente de verdad para todo lo de Proyectos y para el «usado en» del Stack. Localízalos con `gh repo list FRANCISCO-BERMEJO-MELERO` (o clonándolos si `gh` no está autenticado) y lee de cada uno: README, descripción y topics del repo, `package.json` / `go.mod` / `foundry.toml` o equivalentes, estructura de carpetas, releases/tags e historial de commits (fechas de inicio y última actividad).
2. **Los datos verificados de esta spec** (sección siguiente).
3. **El documento de definición del portfolio y las referencias de diseño** en `reference/`, para saber qué texto va en cada hueco y cuánto espacio tiene.
4. **Los datos que Fran pase en el prompt.**

Regla de oro: **no inventes nada.** Si un dato no está en ninguna de estas fuentes, no lo rellenes con algo plausible: apúntalo como pregunta (ver «Preguntas»).

## Datos verificados de Fran
- Nombre en la web: **Francisco Bermejo**. GitHub: github.com/FRANCISCO-BERMEJO-MELERO
- Basado en Córdoba (España). Datos rápidos del hero/sobre mí: Córdoba · Web3 + IA · Gavisa.
- Trabaja en **Gavisa TIC** como desarrollador full-stack y Web3; hoy su día a día son agentes de IA y automatizaciones (n8n) y webs para clientes.
- Formación: **CFGS DAM** en el Ces Lope de Vega (título en 2023). Participó en el Aula de Software Libre de la FP de Córdoba.
- **Trayectoria, cinco hitos en este orden** (ya fijado en el diseño):
  1. Inicio del DAM en el Ces Lope de Vega. *Año de inicio: pendiente.*
  2. FP dual en **Fernauro**: webs académicas, Java.
  3. Prácticas en **Gavisa** (un año) aprendiendo blockchain: Ethereum (incluido el Yellow Paper), L2/rollups, IPFS (que sigue en producción), Cosmos, account abstraction (ERC-4337 / 7579) y una dApp de piedra, papel o tijera.
  4. **2023**: título de DAM y contrato en Gavisa.
  5. **Giro a la IA**: agentes de IA, automatizaciones con n8n, webs para clientes.
- **Stack** (cerrado, cuatro grupos, no añadas ni quites):
  - Frontend: TypeScript, React, Next.js, Astro, Tailwind
  - Web3: Solidity, Wagmi/Viem, Foundry, Hardhat, IPFS, Cosmos SDK
  - Backend y herramientas: Go, Node.js, Supabase, Java
  - IA y automatización: n8n, Ollama, Claude Code
- **Proyectos** (orden e índice fijados: 一 Chainview, 二 DocChain, 三 La previa, 四 FinTrack, 五 Web3 Blog). Todos tienen el repo abierto. Lo que ya se sabe:
  - **Chainview**: TUI en Go para wallets EVM, open source; publicado en el Alchemy Builders Forum.
  - **La previa**: plataforma gratuita de juegos de fiesta para jugar desde el móvil, al estilo Jackbox. Sin cuentas: alguien crea una sala, elige el juego y el resto se une. Juegos de interacción en grupo (referencia: el juego del impostor), sin juegos de dibujar. Versión 1 lanzada y probada. Stack: Next.js con la API dentro de la propia app y Supabase.
  - **DocChain, FinTrack y Web3 Blog**: todo sale de sus repos.
- Kaizen (改善): 改 = cambiar, 善 = bueno → «cambiar a mejor». La idea de Fran es explicar el término y relacionarlo con su camino.

## Qué hay que rellenar
Empieza haciendo **inventario de todos los marcadores** del proyecto (corchetes tipo `[rol en una línea]`, `TODO`, `lorem`, `placeholder`, `XXXX`, cadenas vacías en los datos de contenido, `href="#"`, imágenes de relleno). Guárdalo y úsalo como checklist. Como mínimo deberían aparecer:

**Global / SEO** (por idioma): `<title>`, meta description, Open Graph (título, descripción, `og:image` si existe), JSON-LD `Person` (nombre, puesto, empresa, ubicación, `sameAs` con GitHub y LinkedIn), textos del pie y atribución de KanjiVG (CC BY-SA 3.0, con enlace).

**Inicio**: rol en una línea, frase del hero, datos rápidos, textos de los botones.

**Sobre mí**: texto sobre mí y el bloque «cómo el kaizen describe mi camino», más las glosas de 改 y 善.

**Proyectos**, por cada uno: frase de qué problema resuelve (una línea), descripción (2-3 frases), qué hizo Fran / qué destaca técnicamente (2-3 puntos concretos sacados del código), etiquetas de stack (solo tecnologías que aparezcan de verdad en el repo), enlace al repo, enlace a demo solo si existe (no la inventes), estado (p. ej. «v1 lanzada»), años, y texto alternativo de la imagen.

**Trayectoria**: año, título y 1-2 frases por hito.

**Stack**: el «usado en» de cada tecnología, calculado a partir de las dependencias reales de los repos. Si una tecnología del stack no aparece en ningún proyecto (p. ej. Java, n8n, Ollama), su «usado en» apunta a la trayectoria (Fernauro, Gavisa) en lugar de a un proyecto, o se omite; nunca a un proyecto donde no está.

**Contacto**: titular, texto breve, email, LinkedIn, GitHub, enlace al CV.

## Cómo escribir
- **Español de España**, en primera persona, tono cercano y profesional. Nada de «apasionado por la tecnología», «soluciones innovadoras», «sinergias» ni emojis.
- Concreto antes que adjetivos: «calcula el hash del documento y lo registra en la cadena» mejor que «solución robusta de certificación».
- Las frases de problema de los proyectos empiezan por el problema o por lo que hace, no por el stack.
- Inglés: traducción natural, no literal, con el mismo tono. Mantén sin traducir los nombres propios y los términos japoneses (kaizen, 改善, hanko).
- Terminología coherente en toda la web (decide «account abstraction» o «abstracción de cuentas» una vez y úsalo siempre igual).
- **Longitudes**: mide en `reference/` cuánto ocupa cada hueco y respétalo. El inglés suele ser más corto, pero comprueba los dos.

### Textos personales (hero y kaizen)
La frase del hero y la relación del kaizen con su camino son lo más personal de la web. Escribe **tres variantes de cada una**, deja puesta la que mejor encaje y deja las otras dos en el informe de revisión. La línea de partida del kaizen: su camino ha sido una sucesión de pasos pequeños y constantes (DAM → Fernauro → blockchain en Gavisa → IA), no un salto único. No le atribuyas sentimientos, anécdotas ni motivaciones que no estén en esta spec.

## Imágenes de proyectos
- Si un repo trae capturas o GIFs en el README o en una carpeta de assets, úsalos (optimizados con el pipeline de imágenes de Astro y con texto alternativo).
- Si no hay, **no generes capturas falsas ni maquetas**: deja el tratamiento de relleno que ya tiene el diseño y apúntalo en el informe como pendiente.

## Validación (obligatoria antes de dar la fase por cerrada)
1. **Cero marcadores**: vuelve a pasar la búsqueda del inventario y debe salir vacía (excepto lo que esté explícitamente en «Preguntas»).
2. **Build** limpio, sin avisos nuevos.
3. **Enlaces**: todos los enlaces externos (repos, demos, LinkedIn, KanjiVG) responden 200.
4. **Encaje**: con Playwright, capturas de cada sección a 1440, 390 y 320 px, en papel y sumi, en ES y EN. En cada una comprueba por código que ningún contenedor de texto desborda (`scrollWidth > clientWidth` o `scrollHeight > clientHeight` en elementos que no deberían hacer scroll) y que el nombre del hero no parte mal a 320 px. Guarda las capturas en `02-DOCS/wiki/ftd/capturas-contenido/`.
5. **SEO**: `hreflang` correcto entre ES y EN, JSON-LD válido y una meta description por página y por idioma (120-160 caracteres).
6. **Accesibilidad del contenido**: `lang` correcto por idioma, los kanji llevan su lectura o traducción accesible (`aria-label` o texto oculto) y todas las imágenes tienen `alt`.

## Entregables
- Contenido real en los archivos de datos y en las traducciones (ES y EN).
- `02-DOCS/wiki/ftd/contenido-revision.md` con:
  - Una tabla por sección: texto final, idioma y **origen** de cada dato (`repo:<nombre>/<archivo>`, `spec`, `Fran` o `redactado` — esto último marca lo que Fran tiene que revisar sí o sí).
  - Las variantes descartadas del hero y del kaizen.
  - Lo que ha quedado pendiente (imágenes, demos inexistentes, datos que faltan).
  - Las incoherencias encontradas: p. ej. un repo sin README o con la descripción vacía, o un proyecto cuyo código no coincide con lo que dice esta spec.
- Un commit en una rama `content/real-content` con mensaje descriptivo. No hagas merge.

## Preguntas
Antes de escribir nada, investiga los repos. Después, si falta algún dato que no puedas sacar de las fuentes, **haz una única tanda de preguntas** con todo lo que necesites (como mucho cuatro) y sigue. Si algo queda sin respuesta, déjalo marcado como pendiente en el informe en vez de inventarlo.
