// Marcadores de contenido (plan §1.7). Todo lo que falta de Fran se escribe con uno de estos dos:
// - pending('frase del hero')           → se ve «[frase del hero]», como en las maquetas.
// - provisional('FB', 'iniciales…')     → se ve el valor de las maquetas, pero sigue pendiente.
// Los dos llevan data-pending en el HTML y los lista `pnpm content:pending`.
// Con STRICT_CONTENT=1 (fase 8) cualquiera de ellos hace fallar el build.

export type Text = { readonly text: string; readonly pending?: string };

const strict = process.env['STRICT_CONTENT'] === '1';

function check(label: string) {
  if (strict) throw new Error(`STRICT_CONTENT: contenido pendiente «${label}»`);
}

export function pending(label: string): Text {
  check(label);
  return { text: `[${label}]`, pending: label };
}

export function provisional(value: string, label: string): Text {
  check(label);
  return { text: value, pending: label };
}

/** Texto definitivo (para mezclar con los marcadores en el mismo campo). */
export function done(text: string): Text {
  return { text };
}
