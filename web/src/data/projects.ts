// Los cinco proyectos, de más a menos peso técnico (definición). El stack de cada uno usa los
// nombres de stack.ts: el build falla si un proyecto usa una tecnología que no está allí.
import { done, pending, type Text } from '../lib/pending.ts';

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
};

const base = {
  problem: pending('qué problema resuelve y para quién'),
  fact: pending('dato concreto'),
  repo: pending('enlace al repositorio'),
  demo: pending('enlace a la demo'),
  stackTodo: pending('stack principal: 3–5 tecnologías'),
};

export const projects: Project[] = [
  { ...base, id: 'chainview', index: '一', name: 'Chainview', summary: done('TUI en Go para wallets EVM · open source'), stack: ['Go'] },
  { ...base, id: 'docchain', index: '二', name: 'DocChain', summary: done('Certificación de documentos en blockchain'), stack: [] },
  { ...base, id: 'la-previa', index: '三', name: 'La previa', summary: done('Plataforma de juegos de fiesta para móvil · v1 lanzada'), stack: [] },
  { ...base, id: 'fintrack', index: '四', name: 'FinTrack', summary: done('Gestor de finanzas personales'), stack: [] },
  { ...base, id: 'web3-blog', index: '五', name: 'Web3 Blog', summary: done('Blog sobre Web3'), stack: [] },
];
