// Textos de interfaz (plan §1.7). Por ahora solo español (P10): están aquí, y no en los
// componentes, para que añadir otro idioma sea traducir este fichero.
import { provisional } from '../lib/pending.ts';

export const sections = [
  { id: 'inicio', index: '一', title: 'Inicio' },
  { id: 'sobre-mi', index: '二', title: 'Sobre mí' },
  { id: 'proyectos', index: '三', title: 'Proyectos' },
  { id: 'trayectoria', index: '四', title: 'Trayectoria' },
  { id: 'stack', index: '五', title: 'Stack' },
  { id: 'contacto', index: '六', title: 'Contacto' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const ui = {
  meta: {
    title: 'Francisco Bermejo · Portfolio',
    description: provisional('Portfolio de Francisco Bermejo, desarrollador Web3 + IA en Córdoba.', 'descripción para buscadores'),
  },
  skipLink: 'Saltar al contenido',
  nav: {
    label: 'Principal',
    // El nombre accesible incluye el texto visible del sello (WCAG 2.5.3, «label in name»).
    home: (initials: string) => `Inicio — sello ${initials} de Francisco Bermejo`,
  },
  theme: {
    toSumi: 'Cambiar a modo oscuro',
    toPapel: 'Cambiar a modo claro',
  },
  hero: {
    enso: 'Ensō, círculo zen de un solo trazo',
    cta: { projects: 'Ver proyectos', contact: 'Contacto' },
    // «Seguir: Sobre mí ↓» en escritorio (d-01); en móvil, sin el prefijo (m-01).
    next: { prefix: 'Seguir:', label: 'Sobre mí' },
  },
} as const;
