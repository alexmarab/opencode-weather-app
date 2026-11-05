import type { State } from "../src/types/State.ts";
import type { City } from "../src/types/City.ts";
import { afterAll, beforeAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Quita las secuencias de color ANSI para comparar textos limpios, sin importar
 * si los tests corren en una TTY (colores activos) o con salida redirigida.
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Aísla el estado en disco: muda el cwd a un directorio temporal durante la
 * vida del archivo de test y lo devuelve al terminar (borrando el temp).
 *
 * Funciona sin `mock.module` porque los paths de `utils/constants.ts` son
 * relativos ("cities.json"), así que `Bun.file()`/`Bun.write()` resuelven
 * contra el cwd en el momento de la llamada. Evita tocar el estado real
 * del repo (cities.json / settings.json de la raíz) aunque el orden de
 * ejecución de los archivos de test no esté garantizado.
 */
export function useTempCwd(prefix: string): void {
  const originalCwd = process.cwd();
  let dir = "";

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), prefix));
    process.chdir(dir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
  });
}

export function makeCity(partial: Partial<City> = {}): City {
  return { name: "Madrid", latitude: 40.4168, longitude: -3.7038, ...partial };
}

export function makeState(partial: Partial<State> = {}): State {
  return { cities: [], defaultCity: null, unit: "C", ...partial };
}

/**
 * Captura `method` de console (log/warn/error) durante `run()` y devuelve cada
 * línea concatenada y sin ANSI. La salida de la app (showError/showSuccess/
 * showStatus, menú, clima) pasa por console; así las aserciones no dependen de
 * los colores ni del entorno (TTY o salida redirigida).
 */
async function captureMethod<K extends "log" | "warn" | "error">(
  method: K,
  run: () => unknown | Promise<unknown>,
): Promise<string[]> {
  const lines: string[] = [];
  const original = console[method];
  console[method] = ((...args: unknown[]): void => {
    lines.push(args.map((arg) => String(arg)).join(" "));
  }) as (typeof console)[K];

  try {
    await run();
    return lines.map(stripAnsi);
  } finally {
    console[method] = original;
  }
}

/** Captura console.log durante `run()` (include.up varias líneas, mensaje por línea). */
export function captureLog(run: () => unknown | Promise<unknown>): Promise<string[]> {
  return captureMethod("log", run);
}

/** Captura console.warn durante `run()` (advertencias de storage/migrate). */
export function captureWarn(run: () => unknown | Promise<unknown>): Promise<string[]> {
  return captureMethod("warn", run);
}
