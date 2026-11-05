import { describe, expect, test } from "bun:test";
import { cyan, gray, green, red, yellow } from "../../src/utils/colors.ts";

// Misma condición que usa colors.ts: solo hay códigos ANSI en una TTY real
// y sin NO_COLOR. El runner puede correr con TTY (terminal) o sin ella (CI,
// salida piped); cada grupo de tests solo se activa en su entorno.
const ansiEnabled = process.stdout.isTTY === true && !process.env.NO_COLOR;

describe("colors — texto plano (sin ANSI)", () => {
  test.skipIf(ansiEnabled)('cyan(texto) devuelve el texto limpio', () => {
    expect(cyan("opción")).toBe("opción");
  });

  test.skipIf(ansiEnabled)("las 5 funciones pasan el texto sin códigos de escape", () => {
    for (const fn of [cyan, yellow, green, red, gray]) {
      expect(fn("hola")).toBe("hola");
    }
  });
});

describe("colors — modo ANSI (con TTY y sin NO_COLOR)", () => {
  test.skipIf(!ansiEnabled)('cyan envuelve con \\x1b[36m ... \\x1b[0m', () => {
    expect(cyan("x")).toBe("\x1b[36mx\x1b[0m");
  });

  test.skipIf(!ansiEnabled)("cada función usa su propio código de color", () => {
    expect(yellow("x")).toBe("\x1b[33mx\x1b[0m");
    expect(green("x")).toBe("\x1b[32mx\x1b[0m");
    expect(red("x")).toBe("\x1b[31mx\x1b[0m");
    expect(gray("x")).toBe("\x1b[90mx\x1b[0m");
  });
});
