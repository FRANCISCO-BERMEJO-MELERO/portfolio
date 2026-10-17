// Tecnologías agrupadas (d-11). «Usado en» se calcula desde projects.ts; si un proyecto usa una
// tecnología que no está aquí, el build falla.
import { projects } from './projects.ts';

const groups = [
  { title: 'Frontend', items: ['TypeScript', 'React', 'Next.js', 'Astro', 'Tailwind'] },
  { title: 'Web3', items: ['Solidity', 'Wagmi / Viem', 'Foundry', 'Hardhat', 'IPFS', 'Cosmos SDK'] },
  { title: 'Backend y herramientas', items: ['Go', 'Node.js', 'Supabase', 'Java'] },
  { title: 'IA y automatización', items: ['n8n', 'Ollama', 'Claude Code'] },
] as const;

const known = new Set<string>(groups.flatMap((g) => g.items));
for (const p of projects) {
  const unknown = p.stack.filter((t) => !known.has(t));
  if (unknown.length) throw new Error(`projects.ts: ${p.name} usa ${unknown.join(', ')}, que no está en stack.ts`);
}

export const stack = groups.map((g) => ({
  title: g.title,
  items: g.items.map((name) => ({
    name,
    usedIn: projects.filter((p) => p.stack.includes(name)).map((p) => ({ id: p.id, name: p.name })),
  })),
}));
