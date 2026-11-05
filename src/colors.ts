// Colores ANSI sin dependencias. Solo se emiten códigos cuando stdout es una
// TTY y NO_COLOR no está definida (https://no-color.org) — al redirigir la
// salida (p. ej. `./weather > log`) los archivos quedan limpio de escapes.
type ColorFn = (text: string) => string;

const ENABLED = process.stdout.isTTY === true && !process.env.NO_COLOR;

function wrap(code: string): ColorFn {
  return (text: string) => (ENABLED ? `\x1b[${code}m${text}\x1b[0m` : text);
}

export const cyan = wrap("36"); // menú, bordes ═, prompts
export const yellow = wrap("33"); // temperatura + unidad
export const green = wrap("32"); // confirmaciones (ok)
export const red = wrap("31"); // errores
export const gray = wrap("90"); // mensajes de estado / descripción del clima
