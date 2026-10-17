// pnpm qa:theme — criterio 4 de la fase 1:
// 1. Sin elección guardada sigue al sistema, también en vivo.
// 2. Tras elegir con el botón, se recuerda al recargar (aunque el sistema diga lo contrario).
// 3. 0 parpadeo: con «sumi» guardado y el sistema en claro, CPU ×4, todos los fotogramas desde el
//    primer pintado tienen el fondo de sumi (capturas de la traza de Chrome).
//    `--expect papel` sirve de control negativo: debe fallar.
import { arg, open, run, sleep } from './lib.ts';

const BG = { papel: [0xf3, 0xef, 0xe6], sumi: [0x15, 0x13, 0x0f] } as const;
const expectFlicker = (arg('expect') ?? 'sumi') as 'papel' | 'sumi';

await run('qa:theme', async ({ url, browser, fail }) => {
  const theme = (p: { evaluate<T>(e: string): Promise<T> }) => p.evaluate<string>('document.documentElement.dataset.theme');

  // 1 · Sigue al sistema.
  const page = await open(browser, `${url}/`, { viewport: 'desktop', theme: 'sumi' });
  const a = await theme(page);
  await page.media({ theme: 'papel' });
  await sleep(200);
  const b = await theme(page);
  await page.media({ theme: 'sumi' });
  await sleep(200);
  const c = await theme(page);
  console.log(`  sistema oscuro → ${a} · claro (en vivo) → ${b} · oscuro (en vivo) → ${c}`);
  if (a !== 'sumi' || b !== 'papel' || c !== 'sumi') fail(`no sigue al sistema: ${a} / ${b} / ${c}`);

  // 2 · El botón cambia el modo y se recuerda; el sistema ya no manda.
  await page.evaluate("document.querySelector('[data-qa=theme-toggle]').click()");
  const d = await theme(page);
  const stored = await page.evaluate<string | null>("localStorage.getItem('theme')");
  const label = await page.evaluate<string>("document.querySelector('[data-qa=theme-toggle]').getAttribute('aria-label')");
  await page.goto(`${url}/`);
  const e = await theme(page);
  await page.media({ theme: 'papel' });
  await page.media({ theme: 'sumi' });
  await sleep(200);
  const f = await theme(page);
  console.log(`  clic → ${d} (guardado: ${stored}, botón: «${label}») · recarga → ${e} · cambio de sistema → ${f}`);
  if (d !== 'papel' || stored !== 'papel' || e !== 'papel' || f !== 'papel') fail(`no se recuerda la elección: ${d} / ${stored} / ${e} / ${f}`);
  if (label !== 'Cambiar a modo oscuro') fail(`etiqueta del botón en papel: «${label}»`);
  await page.close();

  // 3 · Primer pintado con CPU ×4: ningún fotograma del modo equivocado.
  const p = await browser.newPage();
  await p.viewport('desktop');
  await p.media({ theme: 'papel' });
  await p.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.send('Page.addScriptToEvaluateOnNewDocument', { source: "try { localStorage.setItem('theme', 'sumi') } catch {}" });
  const events: any[] = [];
  const offData = p.on('Tracing.dataCollected', (d) => events.push(...d.value));
  const done = new Promise<void>((r) => p.on('Tracing.tracingComplete', () => r()));
  await p.send('Tracing.start', {
    categories: 'disabled-by-default-devtools.screenshot,loading,devtools.timeline',
    transferMode: 'ReportEvents',
  });
  await p.goto(`${url}/`);
  await sleep(1500);
  await p.send('Tracing.end');
  await done;
  offData();
  const firstPaint = events.find((ev) => ev.name === 'firstPaint' || ev.name === 'firstContentfulPaint');
  const shots = events
    .filter((ev) => ev.name === 'Screenshot' && ev.args?.snapshot && (!firstPaint || ev.ts >= firstPaint.ts - 1))
    .map((ev) => ev.args.snapshot as string);
  if (!firstPaint) fail('la traza no tiene firstPaint');
  if (!shots.length) fail('la traza no tiene capturas');
  // Se decodifica cada JPEG en la propia página y se leen tres píxeles de fondo.
  const colors = await p.evaluate<number[][][]>(`Promise.all(${JSON.stringify(shots)}.map(async (b64) => {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return [[4, 4], [img.width - 5, img.height / 2], [img.width / 2, img.height - 5]].map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)]);
  }))`);
  const want = BG[expectFlicker];
  const wrong = colors.filter((frame) => frame.some((px) => px.some((v, i) => Math.abs(v - want[i]!) > 8)));
  console.log(`  primer pintado (CPU ×4, «sumi» guardado, sistema claro): ${colors.length} fotogramas, ${wrong.length} con otro fondo`);
  if (wrong.length) fail(`${wrong.length} de ${colors.length} fotogramas no son ${expectFlicker} (p. ej. ${JSON.stringify(wrong[0])})`);
  await p.close();
});
