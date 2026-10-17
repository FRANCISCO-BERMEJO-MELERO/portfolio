// Datos personales y de contacto. Lo pendiente de Fran va con marcadores (src/lib/pending.ts).
import { done, pending, provisional } from '../lib/pending.ts';

export const site = {
  name: 'Francisco Bermejo',
  hanko: provisional('FB', 'iniciales del sello'),
  role: pending('rol en una línea'),
  phrase: pending('frase del hero'),
  location: done('Córdoba, España'),
  about: pending('texto sobre mí — párrafo en primera persona'),
  kaizen: pending('tu versión de qué significa kaizen para ti'),
  // Datos rápidos de la definición (Córdoba, Web3 + IA, Gavisa).
  facts: [done('Córdoba'), done('Web3 + IA'), done('Gavisa')],
  photo: pending('foto: sí o no'),
  contact: {
    email: pending('email de contacto'),
    github: { label: done('github.com/FRANCISCO-BERMEJO-MELERO'), href: 'https://github.com/FRANCISCO-BERMEJO-MELERO' },
    linkedin: pending('perfil de LinkedIn'),
    cv: pending('CV en PDF'),
  },
};
