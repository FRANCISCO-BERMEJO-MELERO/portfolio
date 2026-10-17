// Los cinco proyectos, de más a menos peso técnico (definición). El stack de cada uno usa los
// nombres de stack.ts: el build falla si un proyecto usa una tecnología que no está allí.
import type { ImageMetadata } from 'astro';
import { done, pending, type Text } from '../lib/pending.ts';

/**
 * Captura del panel:
 * - tui: la terminal de Chainview, reproducida en HTML (texto real; la salida llega en la fase 7).
 * - image: una o varias capturas con astro:assets. Sin `src`, un marco de relleno con el marcador.
 */
export type Shot =
  | { kind: 'tui'; title: string; body: Text }
  | { kind: 'image'; src?: ImageMetadata; alt: Text };

export type Project = {
  id: string;
  index: string;
  name: string;
  summary: Text;
  problem: Text;
  /** 3–5 tecnologías, con el nombre exacto de stack.ts. */
  stack: string[];
  /** Marcador mientras el stack del proyecto no esté completo. */
  stackTodo?: Text;
  fact: Text;
  repo: Text;
  demo: Text;
  shot: Shot;
  caption: Text;
};

const base = {
  problem: pending('qué problema resuelve y para quién'),
  fact: pending('dato concreto'),
  repo: pending('enlace al repositorio'),
  demo: pending('enlace a la demo'),
  stackTodo: pending('tecnología'),
  caption: pending('pie de captura'),
};

const image = (name: string): Shot => ({ kind: 'image', alt: pending(`captura de ${name}`) });

export const projects: Project[] = [
  {
    ...base,
    id: 'chainview',
    index: '一',
    name: 'Chainview',
    summary: done('TUI en Go para wallets EVM · open source'),
    stack: ['Go'],
    shot: { kind: 'tui', title: 'chainview', body: pending('captura de la TUI de Chainview') },
  },
  { ...base, id: 'docchain', index: '二', name: 'DocChain', summary: done('Certificación de documentos en blockchain'), stack: [], shot: image('DocChain') },
  { ...base, id: 'la-previa', index: '三', name: 'La previa', summary: done('Plataforma de juegos de fiesta para móvil · v1 lanzada'), stack: [], shot: image('La previa') },
  { ...base, id: 'fintrack', index: '四', name: 'FinTrack', summary: done('Gestor de finanzas personales'), stack: [], shot: image('FinTrack') },
  { ...base, id: 'web3-blog', index: '五', name: 'Web3 Blog', summary: done('Blog sobre Web3'), stack: [], shot: image('Web3 Blog') },
];
