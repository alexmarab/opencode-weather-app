import { beforeEach, describe, expect, mock, test } from "bun:test";
import { rmSync } from "node:fs";
import { captureLog, makeCity, makeState, useTempCwd } from "../helpers.ts";
import * as realInput from "../../src/presentation/input.ts";
import { removeCity } from "../../src/actions/removeCity.ts";

useTempCwd("weather-removecity-");

beforeEach(() => {
  rmSync("cities.json", { force: true });
  rmSync("settings.json", { force: true });
});

// Doble de entrada: pickCityIndex decide la ciudad a eliminar sin leer stdin.
const pickMock = mock((): number | null => 0);
mock.module("../../src/presentation/input.ts", () => ({ ...realInput, pickCityIndex: pickMock }));

const madrid = makeCity({ name: "Madrid" });
const lima = makeCity({ name: "Lima", latitude: -12.05, longitude: -77.03 });

describe("removeCity", () => {
  test('sin ciudades muestra el aviso "no hay ciudades"', async () => {
    const state = makeState();

    const output = (await captureLog(() => removeCity(state))).join("\n");

    expect(output).toContain("No hay ciudades registradas");
    expect(pickMock.mock.calls.length).toBe(0);
  });

  test("con un índice no válido muestra error y no guarda nada", async () => {
    const state = makeState({ cities: [madrid] });
    pickMock.mockImplementation(() => null);

    const output = (await captureLog(() => removeCity(state))).join("\n");

    expect(output).toContain("Opción no válida.");
    expect(state.cities).toEqual([madrid]);
  });

  test("elimina la ciudad elegida y persiste la lista restante", async () => {
    const state = makeState({ cities: [madrid, lima] });
    pickMock.mockImplementation(() => 1); // Lima

    const output = (await captureLog(() => removeCity(state))).join("\n");

    expect(output).toContain("Lima eliminada.");
    expect(state.cities).toEqual([madrid]);
    // persistida en el cwd temporal
    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([madrid]);
  });

  test("al eliminar la ciudad default la limpia y guarda settings", async () => {
    const state = makeState({ cities: [madrid], defaultCity: madrid, unit: "F" });
    pickMock.mockImplementation(() => 0); // Madrid (es la default)

    const output = (await captureLog(() => removeCity(state))).join("\n");

    expect(output).toContain("era la default");
    expect(output).toContain("Madrid eliminada.");
    expect(state.defaultCity).toBe(null);

    const settings = JSON.parse(await Bun.file("settings.json").text());
    expect(settings).toEqual({ defaultCity: null, unit: "F" });
    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([]);
  });

  test("al eliminar una ciudad no-default conserva la default (settings sin tocar)", async () => {
    const salvador = makeCity({ name: "Salvador", latitude: -12.97, longitude: -38.5 });
    const state = makeState({ cities: [madrid, lima, salvador], defaultCity: madrid, unit: "C" });
    pickMock.mockImplementation(() => 2); // Salvador

    await captureLog(() => removeCity(state));

    expect(state.defaultCity).toEqual(madrid);
    // no llama a saveSettings: el archivo ni siquiera existe tras el beforeEach
    expect(await Bun.file("settings.json").exists()).toBe(false);
    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([madrid, lima]);
  });

  test("imprime la lista numerada antes de preguntar", async () => {
    const state = makeState({ cities: [madrid, lima] });
    pickMock.mockImplementation(() => 0);

    const output = await captureLog(() => removeCity(state));

    expect(output.some((line) => line.includes("  1. Madrid"))).toBe(true);
    expect(output.some((line) => line.includes("  2. Lima"))).toBe(true);
  });
});
