// Trayectoria (fase 5): cada hito se enciende cuando la punta del trazo llega a su círculo.
// - El trazo se revela con --ink = --p (InkStroke): la punta está en la fracción p de la longitud de
//   la línea central de su máscara.
// - Aquí se mide, en el lienzo visible (horizontal en escritorio, vertical en móvil), en qué fracción
//   de esa línea cae el centro de cada círculo, y se dan al motor como umbrales (setSteps). El motor
//   escribe data-step (= hitos alcanzados) y lanza «scenestep»; aquí se marca data-lit en cada hito.
// - Se vuelve a medir cuando cambia el tamaño de la línea de tiempo (ancho, saltos de texto, fuentes).
// Sin JS o con reduced motion todo está encendido (CSS y p = 1).
import { getScene } from './scroll.ts';

const scene = document.querySelector<HTMLElement>('[data-journey-scene]');
const engine = scene && getScene(scene);
if (scene && engine) {
  const timeline = scene.querySelector<HTMLElement>('[data-journey-track]')!;
  const items = [...scene.querySelectorAll<HTMLElement>('[data-milestone]')];
  const canvases = [...scene.querySelectorAll<SVGSVGElement>('[data-journey-stroke] svg')];

  /** Fracción de la línea central donde cae el centro de cada círculo. */
  function measure() {
    const svg = canvases.find((s) => s.getBoundingClientRect().width > 0);
    const path = svg?.querySelector<SVGPathElement>('mask path');
    if (!svg || !path) return;
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    // La línea avanza por el eje largo del lienzo (x en el horizontal, y en el vertical).
    const horizontal = vb.width > vb.height;
    const total = path.getTotalLength();
    const at = items.map((item) => {
      const dot = item.querySelector('[data-journey-dot]')!.getBoundingClientRect();
      const target = horizontal
        ? vb.x + ((dot.left + dot.width / 2 - box.left) * vb.width) / box.width
        : vb.y + ((dot.top + dot.height / 2 - box.top) * vb.height) / box.height;
      let lo = 0;
      let hi = total;
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2;
        const pt = path.getPointAtLength(mid);
        if ((horizontal ? pt.x : pt.y) < target) lo = mid;
        else hi = mid;
      }
      return Math.round(((lo + hi) / 2 / total) * 1e6) / 1e6;
    });
    items.forEach((item, i) => (item.dataset['at'] = String(at[i])));
    engine!.setSteps(at);
  }

  scene.addEventListener('scenestep', (e) => {
    const k = (e as CustomEvent<number>).detail;
    items.forEach((item, i) => item.toggleAttribute('data-lit', i < k));
  });

  new ResizeObserver(measure).observe(timeline);
  void document.fonts.ready.then(measure);
  measure();
}
