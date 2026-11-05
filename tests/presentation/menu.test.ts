import { describe, expect, test } from "bun:test";
import { makeCity, makeState, stripAnsi } from "../helpers.ts";
import { isMenuOption, renderMenu } from "../../src/presentation/menu.ts";

describe("renderMenu", () => {
  test("muestra WEATHER CLI y las 8 opciones del menú (sin la 7)", () => {
    const output = stripAnsi(renderMenu(makeState()));
    expect(output).toContain("WEATHER CLI");
    expect(output).toContain("  1. Clima de ciudad default");
    expect(output).toContain("  2. Clima de todas las ciudades (0)");
    expect(output).toContain("  3. Buscar y agregar ciudad");
    expect(output).toContain("  4. Eliminar ciudad");
    expect(output).toContain("  5. Establecer ciudad default");
    expect(output).toContain("  6. Pronóstico 7 días");
    expect(output).toContain("  8. Ajustes (°C)");
    expect(output).toContain("  9. Salir");
  });

  test("el contador de ciudades refleja el estado", () => {
    const state = makeState({ cities: [makeCity(), makeCity({ name: "Lima" }), makeCity({ name: "Paris" })] });
    expect(stripAnsi(renderMenu(state))).toContain("Clima de todas las ciudades (3)");
  });

  test("la unidad mostrada viene del estado", () => {
    expect(stripAnsi(renderMenu(makeState({ unit: "F" })))).toContain("Ajustes (°F)");
  });

  test("bordes superiores e inferiores con 40 ═", () => {
    const output = stripAnsi(renderMenu(makeState()));
    expect(output).toContain(`${"═".repeat(40)}\n         WEATHER CLI`);
    expect(output).toEndWith(`${"═".repeat(40)}`);
  });

  test("cumple el formato exacto del README (### Ejemplo del menú)", () => {
    const expected = [
      "═".repeat(40),
      "         WEATHER CLI",
      "═".repeat(40),
      "  1. Clima de ciudad default",
      "  2. Clima de todas las ciudades (1)",
      "  3. Buscar y agregar ciudad",
      "  4. Eliminar ciudad",
      "  5. Establecer ciudad default",
      "  6. Pronóstico 7 días",
      "  8. Ajustes (°C)",
      "  9. Salir",
      "═".repeat(40),
    ].join("\n");
    expect(stripAnsi(renderMenu(makeState({ cities: [makeCity()] })))).toBe(expected);
  });
});

describe("isMenuOption", () => {
  test("acepta las opciones 1 a 6, 8 y 9", () => {
    for (const option of ["1", "2", "3", "4", "5", "6", "8", "9"]) {
      expect(isMenuOption(option)).toBe(true);
    }
  });

  test('rechaza la "7" (reservada, no está en el menú)', () => {
    expect(isMenuOption("7")).toBe(false);
  });

  test("rechaza entradas que no son opciones del menú", () => {
    expect(isMenuOption("")).toBe(false);
    expect(isMenuOption("a")).toBe(false);
    expect(isMenuOption("12")).toBe(false);
    expect(isMenuOption("1a")).toBe(false);
    expect(isMenuOption("0")).toBe(false);
  });
});
