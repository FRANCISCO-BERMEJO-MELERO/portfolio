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
    // En claro (P9). Cuando llegue: la dirección (el enlace es mailto:).
    email: pending('email de contacto'),
    // En móvil se ve solo el usuario (m-12): el host va aparte.
    github: { host: 'github.com/', user: 'FRANCISCO-BERMEJO-MELERO', href: 'https://github.com/FRANCISCO-BERMEJO-MELERO' },
    // Cuando llegue: la URL completa del perfil.
    linkedin: pending('perfil de LinkedIn'),
    // PDF en public/cv/. El que hay es de prueba (máximo 500 KB: criterio 5 de la fase 6).
    cv: provisional('/cv/francisco-bermejo-cv.pdf', 'CV en PDF'),
  },
};
