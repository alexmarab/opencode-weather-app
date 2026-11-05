export class InputClosedError extends Error {
  override name = "InputClosedError";
}

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

export function ask(prompt: string): Promise<string> {
  if (!pumpStarted) {
    pumpStarted = true;
    void pumpStdin();
  }

  process.stdout.write(prompt);
  return new Promise((resolve, reject) => {
    waiters.push({ resolve, reject });
    deliverAvailableLines();
  });
}
