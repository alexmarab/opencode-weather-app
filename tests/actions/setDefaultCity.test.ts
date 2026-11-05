import { beforeEach, describe, expect, mock, test } from "bun:test";
import { rmSync } from "node:fs";
import { captureLog, makeCity, makeState, useTempCwd } from "../helpers.ts";
import * as realInput from "../../src/presentation/input.ts";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";

useTempCwd("weather-defaultcity-");

beforeEach(() => {
  rmSync("settings.json", { force: true });
});

// Doble de entrada: pickCityIndex decide la ciudad elegida sin leer stdin.
const pickMock = mock((): number | null => 0);
mock.module("../../src/presentation/input.ts", () => ({ ...realInput, pickCityIndex: pickMock }));

const madrid = makeCity({ name: "Madrid" });
const lima = makeCity({ name: "Lima", latitude: -12.05, longitude: -77.03 });

describe("setDefaultCity", () => {
  test('sin ciudades muestra el aviso "no hay ciudades"', async () => {
    const state = makeState();

    const output = (await captureLog(() => setDefaultCity(state))).join("\n");

    expect(output).toContain("No hay ciudades registradas");
    expect(pickMock.mock.calls.length).toBe(0);
  });

  test("con un índice no válido muestra error y no guarda nada", async () => {
    const state = makeState({ cities: [madrid] });
    pickMock.mockImplementation(() => null);

    const output = (await captureLog(() => setDefaultCity(state))).join("\n");

    expect(output).toContain("Opción no válida.");
    expect(state.defaultCity).toBe(null);
  });

  test("establece la ciudad elegida como default y persiste settings", async () => {
    const state = makeState({ cities: [madrid, lima], unit: "C" });
    pickMock.mockImplementation(() => 1); // Lima

    const output = (await captureLog(() => setDefaultCity(state))).join("\n");

    expect(output).toContain("Ciudad default: Lima.");
    expect(state.defaultCity).toEqual(lima);

    const settings = JSON.parse(await Bun.file("settings.json").text());
    expect(settings).toEqual({ defaultCity: lima, unit: "C" });
  });

  test("imprime la lista numerada antes de preguntar", async () => {
    const state = makeState({ cities: [madrid, lima] });
    pickMock.mockImplementation(() => 0);

    const output = await captureLog(() => setDefaultCity(state));

    expect(output.some((line) => line.includes("  1. Madrid"))).toBe(true);
    expect(output.some((line) => line.includes("  2. Lima"))).toBe(true);
  });
});
