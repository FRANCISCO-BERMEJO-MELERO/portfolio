---
author: Francisco Bermejo
branch: develop
status: blocked
---

# Escena kaizen · fase 1 (prueba técnica aislada)

## Intent
Probar, en un proyecto mínimo (`kaizen-lab/`), que 改善 se dibuja trazo a trazo con el scroll,
en orden de escritura real, y que la forma final es exactamente el glifo de Shippori Mincho.

## Scope
- Dentro: Astro + pnpm + TS estricto; glifos de Shippori → paths SVG con opentype.js en build;
  trazos de KanjiVG como máscara; motor de scroll con `--p`; grosores en `src/data/kanji-masks.ts`;
  `prefers-reduced-motion`; modo `?debug`.
- Fuera: el resto del portfolio, navegación, textos de la sección «Sobre mí».

## Decisiones
- Referencias: los ficheros se llaman al revés en el prompt; manda su título (escritorio = 1440 px, móvil = 390 px).
- Peso Regular (400), glifo a 92 unidades en caja de 109, centrado como `dominant-baseline: central`
  en Chrome (ascender/descender de `hhea`), que es como se pintaron las referencias. Verificado:
  el path generado y el `<text>` de la fuente se superponen sin diferencia.
- Guía `#d6cfbf` (la de las referencias); desaparece al completar cada kanji.
- Corte móvil/escritorio: 960 px (dos kanji de 440 px + márgenes caben desde ~930 px).
- Tramo de cada trazo proporcional a su longitud (velocidad de pluma constante).
- Sin Playwright (decisión del usuario): verificación con Chrome headless ya instalado.

## Problemas encontrados en el build
- opentype.js 2: `toPathData({…})` voltea el glifo (`flipY` por defecto) y escribe `NaN` en 善.
  Solución: serializador propio de los comandos + el build falla si aparece `NaN`.

## Resultado de las máscaras (criterios 1 y 2) — NO se cumplen a la vez
Medido con la auditoría de `?debug` (rejilla de 0,25 u ≈ 1 px a 440 px; «fuga» = tinta destapada
por un trazo anterior a su dueño, a más de 2 u de distancia; los cruces no cuentan).

| Configuración | 改 huecos / fugas | 善 huecos / fugas |
|---|---|---|
| Encaje de cajas, grosor 10 | 3 778 / 1 109 | 6 865 / 1 917 |
| Encaje de cajas, grosores optimizados | 2 / 1 794 | 266 / 7 568 |
| Alineación global optimizada, prioridad 0 huecos (**actual**) | **0 / 2 392** | **1 / 4 374** |
| Diagnóstico: + traslación por trazo | 98 / 684 | 117 / 3 200 |

Trazos que fallan con la configuración actual (trazo → trazo que destapa antes de tiempo):
- 改: **6 → 7** (1 663; la barrida 7 aparece casi entera al acabar el 6), 1 → 2 (275), 2 → 3 (227), 4 → 5, 7 (227).
- 善: **5 → 6, 7, 8, 9** (2 342; al acabar el horizontal 5 ya se ven el vertical 6 y los puntos 7 y 8),
  11 → 12 (614), 10 → 11, 12 (538), 3 → 6, 4 (390), 2 → 3 (286), 4 → 6 (203).

Causa: una máscara de grosor uniforme no reproduce un trazo Mincho (horizontales finos con remate
triangular, diagonales que engordan, trazos a ~11 u). Tapar el remate exige engordar la máscara, y
eso destapa al vecino. Ni alineando cada trazo por separado se resuelve.

## Checklist
- [x] Glifos y trazos generados en build — `pnpm glyphs`: «✓ 改 U+6539: 7 trazos · ✓ 善 U+5584: 12 trazos»; superposición path/fuente idéntica.
- [x] Escena con sticky + `--p` — capturas Chrome a p = 0,42 / 0,71 / 1.
- [x] Modo debug: superposición numerada, slider, grosores en vivo, copiar config, auditoría — captura con panel.
- [ ] Criterio 1 — ningún trazo se adelanta: **falla** (ver tabla).
- [x] Criterio 2 — p = 1 idéntico al glifo: 0 huecos en 改, 1 punto (< 1 px) en 善, con la config actual.
- [ ] Criterio 3 — fluido en móvil: sin medir.
- [ ] Criterio 4 — Chrome, Firefox, Safari: solo Chrome probado.
- [ ] Reduced motion: sin verificar.

## Evidence
- Auditoría Chrome headless, config actual: 改 huecos 0 / fugas 2 392; 善 huecos 1 / fugas 4 374.
- Capturas: p = 0,42 (改 7 casi entero tras el 6), p = 0,71 (善 6, 7, 8 visibles tras el 5), p = 1 (idéntico al glifo).

## Next
Decisión del usuario: plan B (revelar cada trazo con opacidad o clip-path) u otra variante.
