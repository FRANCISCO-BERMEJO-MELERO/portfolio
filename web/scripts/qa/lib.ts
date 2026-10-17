// Base de las herramientas de QA: Chrome instalado controlado por DevTools Protocol (sin Playwright
// ni dependencias), servidor del build y utilidades comunes. Firefox quedó fuera (decisión F1).
//
// Variables: CHROME_BIN (ruta de Chrome), QA_URL (usar un servidor ya levantado), QA_HEADFUL=1.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';

export const CHROME =
  process.env['CHROME_BIN'] ??
  (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
} as const;
export type ViewportName = keyof typeof VIEWPORTS;
export type Theme = 'papel' | 'sumi';
export const THEMES: Theme[] = ['papel', 'sumi'];

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Message = { id?: number; method?: string; params?: any; result?: any; error?: { message: string }; sessionId?: string };
type Listener = (params: any) => void;

/** Conexión CDP al navegador; cada pestaña es una sesión «flatten» sobre el mismo WebSocket. */
class Connection {
  #ws: WebSocket;
  #id = 0;
  #pending = new Map<number, (m: Message) => void>();
  #listeners = new Map<string, Set<Listener>>();

  constructor(ws: WebSocket) {
    this.#ws = ws;
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data)) as Message;
      if (msg.id !== undefined) {
        this.#pending.get(msg.id)?.(msg);
        this.#pending.delete(msg.id);
      } else if (msg.method) {
        for (const fn of this.#listeners.get(`${msg.sessionId ?? ''}:${msg.method}`) ?? []) fn(msg.params);
      }
    });
  }

  send(method: string, params: object = {}, sessionId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.#id;
      this.#pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
      this.#ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  on(sessionId: string, method: string, fn: Listener): () => void {
    const key = `${sessionId}:${method}`;
    if (!this.#listeners.has(key)) this.#listeners.set(key, new Set());
    this.#listeners.get(key)!.add(fn);
    return () => this.#listeners.get(key)!.delete(fn);
  }

  close() {
    this.#ws.close();
  }
}

export type Page = {
  send(method: string, params?: object): Promise<any>;
  on(method: string, fn: Listener): () => void;
  /** Evalúa una expresión en la página (espera promesas) y devuelve su valor. */
  evaluate<T = unknown>(expression: string): Promise<T>;
  /** Navega y espera a la carga, las fuentes y dos fotogramas (con `settle: false`, solo a la carga). */
  goto(url: string, opts?: { settle?: boolean }): Promise<void>;
  viewport(name: ViewportName): Promise<void>;
  /** Emula preferencias del sistema: modo de color y reduced motion. */
  media(opts: { theme?: Theme; reduced?: boolean }): Promise<void>;
  screenshot(): Promise<Buffer>;
  close(): Promise<void>;
};

export type Browser = { newPage(): Promise<Page>; close(): Promise<void> };

export async function launch(): Promise<Browser> {
  const profile = mkdtempSync(join(tmpdir(), 'qa-chrome-'));
  const proc = spawn(CHROME, [
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    ...(process.env['QA_HEADFUL'] ? [] : ['--headless=new']),
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    '--font-render-hinting=none',
    'about:blank',
  ]);
  // Chrome escribe en stderr la URL del WebSocket del navegador.
  const wsUrl = await new Promise<string>((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome no responde')), 20000);
    proc.stderr.on('data', (d: Buffer) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]!);
      }
    });
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => {
    ws.addEventListener('open', r, { once: true });
    ws.addEventListener('error', j, { once: true });
  });
  const conn = new Connection(ws);
  // La pestaña inicial se cierra en cuanto hay otra: con dos pestañas, la nueva queda en segundo
  // plano (gestos táctiles ignorados, fotogramas a 30 Hz).
  const { targetInfos } = await conn.send('Target.getTargets');
  const initial = (targetInfos as { targetId: string; type: string }[]).filter((t) => t.type === 'page').map((t) => t.targetId);

  return {
    async newPage() {
      const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank' });
      for (const id of initial.splice(0)) await conn.send('Target.closeTarget', { targetId: id });
      const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
      const send = (method: string, params: object = {}) => conn.send(method, params, sessionId);
      await send('Page.enable');
      await send('Runtime.enable');
      // Las pestañas en segundo plano no reciben gestos ni van a la cadencia real de fotogramas.
      await send('Page.bringToFront');
      const page: Page = {
        send,
        on: (method, fn) => conn.on(sessionId, method, fn),
        async evaluate<T>(expression: string) {
          const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
          if (r.exceptionDetails) throw new Error(`evaluate: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
          return r.result.value as T;
        },
        async goto(url, { settle = true } = {}) {
          const loaded = new Promise<void>((resolve) => {
            const off = conn.on(sessionId, 'Page.loadEventFired', () => {
              off();
              resolve();
            });
          });
          await send('Page.navigate', { url });
          await loaded;
          if (!settle) return;
          await page.evaluate('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))');
        },
        async viewport(name) {
          const v = VIEWPORTS[name];
          await send('Emulation.setDeviceMetricsOverride', v);
          await send('Emulation.setTouchEmulationEnabled', v.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
        },
        async media({ theme, reduced }) {
          await send('Emulation.setEmulatedMedia', {
            features: [
              { name: 'prefers-color-scheme', value: theme === 'sumi' ? 'dark' : theme === 'papel' ? 'light' : '' },
              { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : '' },
            ],
          });
        },
        async screenshot() {
          const { data } = await send('Page.captureScreenshot', { format: 'png' });
          return Buffer.from(data, 'base64');
        },
        async close() {
          await conn.send('Target.closeTarget', { targetId });
        },
      };
      return page;
    },
    async close() {
      await conn.send('Browser.close').catch(() => {});
      conn.close();
      proc.kill();
      await sleep(300);
      // Chrome puede tardar en soltar el perfil: se reintenta y, si sigue bloqueado, se avisa sin
      // fallar (es limpieza de un temporal, no un resultado de la prueba).
      try {
        rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
      } catch {
        console.warn(`  (aviso: no se pudo borrar el perfil temporal ${profile})`);
      }
    },
  };
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

/** Sirve dist/ con un servidor estático propio (o usa QA_URL). Devuelve la URL base y cómo pararlo. */
export async function serve(): Promise<{ url: string; stop(): void }> {
  if (process.env['QA_URL']) return { url: process.env['QA_URL'].replace(/\/$/, ''), stop() {} };
  const root = resolve('dist');
  if (!existsSync(join(root, 'index.html'))) throw new Error('falta dist/: ejecuta pnpm build');
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) return void res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      const notFound = join(root, '404.html');
      res.writeHead(404, { 'content-type': TYPES['.html']! });
      return void res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, stop: () => server.close() };
}

/** Ejecuta una prueba con servidor y navegador, y sale con código 1 si hay fallos. */
export async function run(name: string, body: (ctx: { url: string; browser: Browser; fail(msg: string): void }) => Promise<void>) {
  const failures: string[] = [];
  const server = await serve();
  const browser = await launch();
  try {
    await body({ url: server.url, browser, fail: (msg) => failures.push(msg) });
  } catch (error) {
    failures.push(String(error instanceof Error ? (error.stack ?? error.message) : error));
  } finally {
    await browser.close();
    server.stop();
  }
  if (failures.length) {
    console.error(`✗ ${name}: ${failures.length} fallo(s)`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✓ ${name}`);
}

/** Abre una página en un viewport y modo dados (modo por preferencia del sistema, sin elección guardada). */
export async function open(browser: Browser, url: string, opts: { viewport: ViewportName; theme: Theme; reduced?: boolean }) {
  const page = await browser.newPage();
  await page.viewport(opts.viewport);
  await page.media({ theme: opts.theme, reduced: opts.reduced ?? false });
  await page.goto(url);
  return page;
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
