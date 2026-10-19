// pnpm qa:contact — Stack y Contacto (criterios de la fase 6), en escritorio y móvil, papel y sumi:
// - 1 · Stack: 4 grupos; cada tecnología con proyectos es un botón con aria-expanded y aria-controls
//       que abre su lista con clic, Enter y Espacio, y la cierra igual; las demás son texto plano.
//       Abierta, fondo --surface y enlaces en --accent-text-surface (d-11, m-10). Con ratón
//       (escritorio), el hover muestra la lista sin cambiar aria-expanded. El enlace lleva al panel.
// - 2 · «usado en» coincide con el stack de cada proyecto (lo leído en la página frente a los paneles).
// - 3 · Aparición escalonada: la última pieza acaba ≤ 600 ms tras entrar en vista; con reduced
//       motion, todo con opacidad 1 sin esperar.
// - 4 · El sello del cierre se estampa una sola vez (un animationstart al entrar; ninguno al salir
//       y volver); entre 960 y 1440 px, sello y titular no se pisan ni se salen de la ventana.
// - 5 · CV: enlace con download a un PDF que existe en el build y pesa ≤ 500 KB.
// - 6 · Pie: © con el año actual, KanjiVG con su enlace y la licencia; «Volver arriba» lleva arriba.
// - 7 · Separadores: 2, aria-hidden; su trazo espera parado hasta entrar en vista y entonces se dibuja.
// Control negativo: --control slow alarga la transición del stack a 400 ms (debe fallar el 3).
import { statSync } from 'node:fs';
import { arg, open, run, sleep, THEMES, type Page, type ViewportName } from './lib.ts';

const CONTROL = arg('control');
const YEAR = new Date().getFullYear();

const key = async (page: Page, k: 'Enter' | ' ') => {
  const code = k === 'Enter' ? 'Enter' : 'Space';
  const vk = k === 'Enter' ? 13 : 32;
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, text: k === 'Enter' ? '\r' : ' ' });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};

const mouse = async (page: Page, type: 'mouseMoved' | 'mousePressed' | 'mouseReleased', x: number, y: number) =>
  page.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });

const center = (page: Page, sel: string) =>
  page.evaluate<[number, number]>(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);

// Cada paso tiene un límite: si la página no responde (equipo cargado), falla con su nombre en vez
// de colgar la batería entera.
const within = <T>(label: string, p: Promise<T>, ms = 20000): Promise<T> =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label}: sin respuesta en ${ms / 1000} s`)), ms))]);

const frames = `new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))`;

await run('qa:contact', async ({ url, browser, fail }) => {
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    for (const theme of THEMES) {
      const where = `${viewport} ${theme}`;
      const page = await open(browser, url + '/', { viewport, theme });
      if (CONTROL === 'slow') {
        await page.evaluate(`(() => { const s = document.createElement('style'); s.textContent = '[data-qa=stack-groups] .title, [data-qa=stack-groups] .tech { transition-duration: 400ms !important; }'; document.head.append(s); })()`);
      }

      // --- 3 · Aparición escalonada: antes de entrar, ocultas; después, la última acaba ≤ 600 ms. ---
      const before = await page.evaluate<number>(`getComputedStyle(document.querySelector('[data-qa=stack-title]')).opacity`);
      if (Number(before) !== 0) fail(`${where} · 3: antes de entrar en vista el stack ya se ve (opacidad ${before})`);
      const stagger = await within(`${where} · aparición`, page.evaluate<{ end: number; n: number }>(`(async () => {
        const groups = document.querySelector('[data-qa=stack-groups]');
        const pieces = [...groups.querySelectorAll('.title, .tech')];
        const t0 = await new Promise((r) => {
          new MutationObserver((_, o) => { if (groups.hasAttribute('data-revealed')) { o.disconnect(); r(performance.now()); } }).observe(groups, { attributes: true });
          document.querySelector('#stack').scrollIntoView({ behavior: 'instant' });
        });
        const ends = await Promise.all(pieces.map((p) => new Promise((r) => {
          const done = () => r(performance.now());
          p.addEventListener('transitionend', (e) => { if (e.propertyName === 'opacity') done(); }, { once: false });
          setTimeout(done, 2000);
        })));
        return { end: Math.max(...ends) - t0, n: pieces.length };
      })()`));
      // 1 fotograma de margen sobre los 600 ms (el evento llega en el fotograma siguiente).
      if (stagger.end > 617) fail(`${where} · 3: la aparición escalonada acaba a los ${stagger.end.toFixed(0)} ms (máx. 600)`);
      console.log(`  ${where} · aparición: ${stagger.n} piezas en ${stagger.end.toFixed(0)} ms`);

      // --- 1 y 2 · Desplegables ---
      const info = await within(`${where} · desplegables`, page.evaluate<{ groups: number; plain: number; toggles: { name: string; controls: string; used: string[] }[]; panels: Record<string, string[]> }>(`(() => {
        const toggles = [...document.querySelectorAll('[data-qa=stack-toggle]')].map((b) => ({
          name: b.firstChild.textContent.trim(),
          controls: b.getAttribute('aria-controls'),
          used: [...document.getElementById(b.getAttribute('aria-controls')).querySelectorAll('a')].map((a) => a.hash.slice(1)),
        }));
        const panels = {};
        for (const p of document.querySelectorAll('[data-project-panel]')) {
          panels[p.id] = [...p.querySelectorAll('[data-qa=project-tech]')].map((t) => t.textContent.trim());
        }
        return { groups: document.querySelectorAll('[data-qa=stack-group]').length, plain: document.querySelectorAll('[data-qa=stack-item] button').length, toggles, panels };
      })()`));
      if (info.groups !== 4) fail(`${where} · 1: ${info.groups} grupos (4)`);
      if (info.plain) fail(`${where} · 1: ${info.plain} tecnologías sin proyectos con botón`);
      if (!info.toggles.length) fail(`${where} · 1: ninguna tecnología con proyectos`);
      // 2 · Cada tecnología enlaza exactamente a los paneles que la listan.
      const names = new Set<string>();
      for (const t of info.toggles) {
        names.add(t.name);
        const expected = Object.entries(info.panels).filter(([, s]) => s.includes(t.name)).map(([id]) => id).sort();
        if (JSON.stringify([...t.used].sort()) !== JSON.stringify(expected)) fail(`${where} · 2: ${t.name} → ${t.used.join(', ')}; los paneles dicen ${expected.join(', ')}`);
      }
      for (const [id, s] of Object.entries(info.panels)) {
        for (const tech of s) if (!names.has(tech)) fail(`${where} · 2: ${id} usa ${tech}, que no abre su lista en el stack`);
      }

      const state = (sel: string) =>
        page.evaluate<{ expanded: string; shown: boolean; bg: string; link: string }>(`(() => {
          const b = document.querySelector('${sel}');
          const list = document.getElementById(b.getAttribute('aria-controls'));
          const a = list.querySelector('a');
          return { expanded: b.getAttribute('aria-expanded'), shown: list.offsetHeight > 0, bg: getComputedStyle(b.parentElement).backgroundColor, link: getComputedStyle(a).color };
        })()`);
      const sel = '[data-qa=stack-toggle]';
      const tokens = await page.evaluate<{ surface: string; bg: string; link: string }>(`(() => {
        const probe = document.createElement('span'); document.body.append(probe);
        const read = (v) => { probe.style.color = 'var(' + v + ')'; return getComputedStyle(probe).color; };
        const out = { surface: read('--surface'), link: read('--accent-text-surface') }; probe.remove(); return out;
      })()`);
      // Lejos del botón: el ratón no debe estar encima al empezar.
      await mouse(page, 'mouseMoved', 5, 5);
      let s = await state(sel);
      if (s.expanded !== 'false' || s.shown) fail(`${where} · 1: el desplegable no empieza cerrado (${s.expanded}, ${s.shown ? 'visible' : 'oculto'})`);
      // Clic (escritorio: ratón; móvil: toque).
      const [x, y] = await center(page, sel);
      if (viewport === 'mobile') {
        await within(`${where} · toque`, page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }));
        await within(`${where} · toque`, page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
        await sleep(400);
      } else {
        await mouse(page, 'mouseMoved', x, y);
        await mouse(page, 'mousePressed', x, y);
        await mouse(page, 'mouseReleased', x, y);
      }
      await page.evaluate(frames);
      s = await state(sel);
      if (s.expanded !== 'true' || !s.shown) fail(`${where} · 1: el ${viewport === 'mobile' ? 'toque' : 'clic'} no abre (${s.expanded})`);
      if (s.bg !== tokens.surface) fail(`${where} · 1: abierto, fondo ${s.bg} (--surface ${tokens.surface})`);
      if (s.link !== tokens.link) fail(`${where} · 1: enlace ${s.link} (--accent-text-surface ${tokens.link})`);
      // Hover (escritorio): tras soltar con el ratón encima sigue visible; al cerrar con clic, el hover
      // lo sigue mostrando sin cambiar aria-expanded; al salir, oculto.
      if (viewport === 'desktop') {
        await mouse(page, 'mousePressed', x, y);
        await mouse(page, 'mouseReleased', x, y);
        await page.evaluate(frames);
        s = await state(sel);
        if (s.expanded !== 'false') fail(`${where} · 1: el segundo clic no suelta (${s.expanded})`);
        if (!s.shown) fail(`${where} · 1: con el ratón encima, la lista no se previsualiza`);
        await mouse(page, 'mouseMoved', 5, 5);
        await page.evaluate(frames);
        s = await state(sel);
        if (s.shown) fail(`${where} · 1: al salir el ratón, la lista sigue visible`);
        await mouse(page, 'mouseMoved', x, y);
        await page.evaluate(frames);
        s = await state(sel);
        if (s.expanded !== 'false' || !s.shown) fail(`${where} · 1: el hover cambia el estado o no muestra la lista (${s.expanded})`);
        await mouse(page, 'mouseMoved', 5, 5);
      } else {
        await within(`${where} · toque`, page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }));
        await within(`${where} · toque`, page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
        await sleep(400);
        s = await state(sel);
        if (s.expanded !== 'false' || s.shown) fail(`${where} · 1: el segundo toque no cierra (${s.expanded})`);
      }
      // Teclado: Enter abre, Espacio cierra.
      await page.evaluate(`document.querySelector('${sel}').focus()`);
      await key(page, 'Enter');
      await page.evaluate(frames);
      s = await state(sel);
      if (s.expanded !== 'true' || !s.shown) fail(`${where} · 1: Enter no abre (${s.expanded})`);
      await key(page, ' ');
      await page.evaluate(frames);
      s = await state(sel);
      if (s.expanded !== 'false' || s.shown) fail(`${where} · 1: Espacio no cierra (${s.expanded})`);
      // El enlace lleva a su panel.
      await key(page, 'Enter');
      await page.evaluate(`document.querySelector('[data-qa=stack-project]').click()`);
      await sleep(1200);
      const target = await page.evaluate<{ id: string; top: number; bottom: number; navH: number; vh: number; vw: number; left: number }>(`(() => {
        const id = document.querySelector('[data-qa=stack-project]').hash.slice(1);
        const r = document.getElementById(id).getBoundingClientRect();
        return { id, top: r.top, bottom: r.bottom, left: r.left, navH: document.querySelector('[data-nav-header]').offsetHeight, vh: innerHeight, vw: innerWidth };
      })()`);
      if (target.top < target.navH - 2 || target.top > target.vh / 2 || target.left < -2 || target.left > target.vw / 2) {
        fail(`${where} · 1: el enlace no deja ${target.id} a la vista (arriba ${target.top.toFixed(0)}, izquierda ${target.left.toFixed(0)})`);
      }

      // --- 4 · El sello del cierre se estampa una vez ---
      const stamps = await within(`${where} · sello`, page.evaluate<{ first: number; again: number; opacity: string }>(`(async () => {
        const seal = document.querySelector('[data-qa=contact-seal]');
        let n = 0;
        seal.addEventListener('animationstart', () => n++);
        document.querySelector('#contacto').scrollIntoView({ behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 900));
        const first = n;
        const opacity = getComputedStyle(seal).opacity;
        scrollTo({ top: 0, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 300));
        document.querySelector('#contacto').scrollIntoView({ behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 900));
        return { first, again: n - first, opacity };
      })()`));
      if (stamps.first !== 1 || stamps.again !== 0) fail(`${where} · 4: el sello se estampa ${stamps.first} vez/veces al entrar y ${stamps.again} al volver (1 y 0)`);
      if (stamps.opacity !== '1') fail(`${where} · 4: tras estamparse, el sello tiene opacidad ${stamps.opacity}`);

      // --- 5 · CV ---
      const cv = await page.evaluate<{ href: string; download: boolean }>(`(() => { const a = document.querySelector('[data-qa=contact-cv]'); return { href: a.getAttribute('href'), download: a.hasAttribute('download') }; })()`);
      if (!cv.download) fail(`${where} · 5: el enlace del CV no lleva download`);
      try {
        const size = statSync(`dist${cv.href}`).size;
        if (!cv.href.endsWith('.pdf') || size > 500 * 1024) fail(`${where} · 5: ${cv.href} pesa ${(size / 1024).toFixed(0)} KB (máx. 500)`);
        if (viewport === 'desktop' && theme === 'papel') console.log(`  CV: ${cv.href}, ${(size / 1024).toFixed(1)} KB`);
      } catch {
        fail(`${where} · 5: ${cv.href} no está en el build`);
      }

      // --- 6 · Pie ---
      const foot = await page.evaluate<{ copy: string; kanjivg: string; text: string }>(`(() => ({
        copy: document.querySelector('[data-qa=footer-copy]').textContent,
        kanjivg: document.querySelector('[data-qa=footer-kanjivg]').href,
        text: document.querySelector('[data-qa=footer]').textContent,
      }))()`);
      if (!foot.copy.includes(`© ${YEAR}`)) fail(`${where} · 6: «${foot.copy}» sin el año ${YEAR}`);
      if (!foot.kanjivg.startsWith('https://kanjivg.tagaini.net')) fail(`${where} · 6: KanjiVG enlaza a ${foot.kanjivg}`);
      if (!foot.text.includes('CC BY-SA 3.0')) fail(`${where} · 6: falta la licencia CC BY-SA 3.0`);
      await page.evaluate(`document.querySelector('[data-qa=footer-top]').click()`);
      await sleep(600);
      const top = await page.evaluate<number>('scrollY');
      if (top > 1) fail(`${where} · 6: «Volver arriba» deja el scroll en ${top}`);
      await page.close();
    }
  }

  // --- 7 · Separadores (sin depender del modo) ---
  const page = await open(browser, url + '/', { viewport: 'desktop', theme: 'papel' });
  const dividers = await page.evaluate<{ n: number; hidden: boolean[]; before: string[] }>(`(() => {
    const d = [...document.querySelectorAll('[data-qa=ink-divider]')];
    return { n: d.length, hidden: d.map((x) => x.getAttribute('aria-hidden') === 'true'), before: d.map((x) => getComputedStyle(x.querySelector('.reveal')).animationPlayState) };
  })()`);
  if (dividers.n !== 2) fail(`7: ${dividers.n} separadores (2)`);
  if (dividers.hidden.some((h) => !h)) fail('7: algún separador sin aria-hidden');
  if (dividers.before.some((s) => s !== 'paused')) fail(`7: antes de entrar en vista el trazo no espera (${dividers.before.join(', ')})`);
  const drawn = await within('separadores', page.evaluate<string[]>(`(async () => {
    const out = [];
    for (const d of document.querySelectorAll('[data-qa=ink-divider]')) {
      d.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise((r) => setTimeout(r, 1000));
      out.push(getComputedStyle(d.querySelector('.reveal')).strokeDashoffset);
    }
    return out;
  })()`));
  if (drawn.some((o) => Math.abs(Number.parseFloat(o)) > 0.001)) fail(`7: tras entrar en vista, trazo sin terminar (dashoffset ${drawn.join(', ')})`);
  await page.close();

  // --- Reduced motion: todo visible sin esperar (3), separadores enteros (7), sello quieto (4) ---
  for (const viewport of ['desktop', 'mobile'] as ViewportName[]) {
    const still = await open(browser, url + '/', { viewport, theme: 'papel', reduced: true });
    const r = await still.evaluate<{ hiddenPieces: number; seal: string; offsets: string[] }>(`(() => ({
      hiddenPieces: [...document.querySelectorAll('[data-qa=stack-groups] .title, [data-qa=stack-groups] .tech')].filter((p) => getComputedStyle(p).opacity !== '1').length,
      seal: getComputedStyle(document.querySelector('[data-qa=contact-seal]')).opacity,
      offsets: [...document.querySelectorAll('[data-qa=ink-divider] .reveal')].map((p) => getComputedStyle(p).strokeDashoffset),
    }))()`);
    if (r.hiddenPieces) fail(`reduced ${viewport} · 3: ${r.hiddenPieces} piezas del stack sin opacidad 1`);
    if (r.seal !== '1') fail(`reduced ${viewport} · 4: sello con opacidad ${r.seal}`);
    if (r.offsets.some((o) => Math.abs(Number.parseFloat(o)) > 0.001)) fail(`reduced ${viewport} · 7: separadores sin dibujar (${r.offsets.join(', ')})`);
    await still.close();
  }

  // --- 4 · Escala del cierre entre 960 y 1440 px: sello a la derecha del titular, sin pisarlo ni salirse ---
  const wide = await open(browser, url + '/', { viewport: 'desktop', theme: 'papel', reduced: true });
  for (const width of [960, 1024, 1100, 1200, 1280, 1440]) {
    await wide.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(150);
    const m = await wide.evaluate<{ title: number; sealL: number; sealR: number; vw: number; scroll: number }>(`(() => {
      const t = document.querySelector('[data-qa=contact-title]');
      const range = document.createRange(); range.selectNodeContents(t);
      const s = document.querySelector('[data-qa=contact-hanko]').getBoundingClientRect();
      return { title: range.getBoundingClientRect().right, sealL: s.left, sealR: s.right, vw: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth };
    })()`);
    const gap = m.sealL - m.title;
    if (gap < 8) fail(`${width} px · 4: el sello pisa el titular (separación ${gap.toFixed(1)} px)`);
    if (m.sealR > m.vw - 16 || m.scroll > m.vw) fail(`${width} px · 4: el sello se sale (borde ${m.sealR.toFixed(0)} de ${m.vw}; scroll ${m.scroll})`);
    console.log(`  ${width} px · cierre: separación titular → sello ${gap.toFixed(1)} px, margen derecho ${(m.vw - m.sealR).toFixed(1)} px`);
  }
  await wide.close();
});
