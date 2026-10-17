// Trayectoria: los 4 hitos de la definición (C1). Los textos de detalle salen de d-09; el cuarto
// hito une «Título y contrato» y «Giro a la IA» de la maqueta. Los años quedan pendientes (C2).
import { done, pending, provisional, type Text } from '../lib/pending.ts';

export type Milestone = { year: Text; title: Text; detail: Text; line: Text };

const line = () => pending('una frase sobre este paso');

export const journey: Milestone[] = [
  { year: pending('año'), title: done('Inicio del DAM'), detail: done('CFGS DAM · Ces Lope de Vega'), line: line() },
  { year: pending('año'), title: done('FP dual en Fernauro'), detail: done('Webs académicas y Java'), line: line() },
  {
    year: pending('año'),
    title: done('Prácticas en Gavisa'),
    detail: done('Blockchain: Ethereum, L2, IPFS, Cosmos y account abstraction (ERC-4337 / 7579)'),
    line: line(),
  },
  {
    year: pending('año'),
    title: provisional('Desarrollador en Gavisa', 'título del hito 4 (C1)'),
    detail: provisional('DAM terminado · agentes de IA y automatización', 'detalle del hito 4 (C1)'),
    line: line(),
  },
];
