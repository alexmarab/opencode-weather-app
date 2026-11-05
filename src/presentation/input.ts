import type { City } from "../types/City.ts";
import { cyan } from "../utils/colors.ts";

// `node:readline/promises` responde solo la primera pregunta cuando stdin es
// un pipe (quirk de Bun: las siguientes `rl.question` cuelgan). Leemos las
// líneas manualmente con Bun.stdin.stream().
const decoder = new TextDecoder();

let buffer = "";
let ended = false;
let pumpStarted = false;
let waiters: Array<{
  resolve: (line: string) => void;
  reject: (error: unknown) => void;
}> = [];

function deliverAvailableLines(): void {
  while (waiters.length > 0) {
    const newlineIndex = buffer.indexOf("\n");
    if (newlineIndex === -1) break;
    const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
    buffer = buffer.slice(newlineIndex + 1);
    waiters.shift()?.resolve(line);
  }
  if (ended && waiters.length > 0) {
    for (const waiter of waiters.splice(0)) waiter.reject(new InputClosedError());
  }
}

async function pumpStdin(): Promise<void> {
  for await (const chunk of Bun.stdin.stream()) {
    buffer += decoder.decode(chunk, { stream: true });
    deliverAvailableLines();
  }
  ended = true;
  deliverAvailableLines();
}

export class InputClosedError extends Error {
  override name = "InputClosedError";
}

export function ask(prompt: string): Promise<string> {
  if (!pumpStarted) {
    pumpStarted = true;
    void pumpStdin();
  }

  process.stdout.write(cyan(prompt));
  return new Promise((resolve, reject) => {
    waiters.push({ resolve, reject });
    deliverAvailableLines();
  });
}

/** Convierte la respuesta del usuario en un índice de la lista, o `null` si es inválida. */
export async function pickCityIndex(cities: City[], prompt: string): Promise<number | null> {
  const raw = (await ask(prompt)).trim();
  const index = Number.parseInt(raw, 10);
  if (Number.isNaN(index) || index < 1 || index > cities.length) return null;
  return index - 1;
}
