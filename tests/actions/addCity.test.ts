import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { rmSync } from "node:fs";
import { captureLog, makeCity, makeState, useTempCwd } from "../helpers.ts";
import * as realInput from "../../src/presentation/input.ts";
import { addCity } from "../../src/actions/addCity.ts";

useTempCwd("weather-addcity-");

beforeEach(() => {
  rmSync("cities.json", { force: true });
});

// El único módulo mockeado es la entrada (nadie más usa el `ask` real en los
// tests) — El geocoding usa el módulo REAL de src, pero con `fetch` global
// sustituido (reversible con afterEach), ya que mock.module no se puede
// revertir y contaminaría los tests de tests/api/*.
const askMock = mock(() => "");

mock.module("../../src/presentation/input.ts", () => ({ ...realInput, ask: askMock }));

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

let fetchCalls = 0;

/** Sustituye fetch con la respuesta del geocoding; registra cuántas llamadas hubo. */
function respondGeocoding(body: unknown): void {
  globalThis.fetch = (async () => {
    fetchCalls++;
    return new Response(JSON.stringify(body));
  }) as unknown as typeof fetch;
}

/** Sustituye fetch por uno que suelta un error de red (geocodeCity lo captura). */
function failWithNetwork(): void {
  globalThis.fetch = (async () => {
    fetchCalls++;
    throw new Error("sin conexión");
  }) as unknown as typeof fetch;
}

describe("addCity", () => {
  test("el nombre vacío muestra error y ni siquiera consulta el geocoding", async () => {
    const state = makeState();
    respondGeocoding({ results: [{ name: "Cualquiercosa", latitude: 1, longitude: 2 }] });
    askMock.mockImplementation(() => "   ");

    const output = (await captureLog(() => addCity(state))).join("\n");
    expect(output).toContain("El nombre no puede estar vacío.");
    expect(fetchCalls).toBe(0);
    expect(state.cities).toHaveLength(0);
  });

  test("rechaza duplicados sin importar mayúsculas/minúsculas", async () => {
    const state = makeState({ cities: [makeCity({ name: "Madrid" })] });
    respondGeocoding({});
    askMock.mockImplementation(() => "madrid");

    const output = (await captureLog(() => addCity(state))).join("\n");
    expect(output).toContain("ya está registrada");
    expect(fetchCalls).toBe(0);
    expect(state.cities).toHaveLength(1); // no se agregó
  });

  test("cuando el geocoding no devuelve resultados muestra error y no guarda", async () => {
    const state = makeState();
    respondGeocoding({});
    askMock.mockImplementation(() => "Atlantis");

    const output = (await captureLog(() => addCity(state))).join("\n");

    expect(output).toContain('No se encontró la ciudad "Atlantis"');
    expect(state.cities).toHaveLength(0);
    expect(await Bun.file("cities.json").exists()).toBe(false);
  });

  test("con un error de red sigue el mismo camino que sin resultados", async () => {
    const state = makeState();
    failWithNetwork();
    askMock.mockImplementation(() => "Atlantis");

    const output = (await captureLog(() => addCity(state))).join("\n");

    expect(output).toContain('No se encontró la ciudad "Atlantis"');
    expect(state.cities).toHaveLength(0);
  });

  test("agrega y persiste la ciudad en disco", async () => {
    const madri = makeCity({ name: "Madrid" });
    const state = makeState();
    respondGeocoding({ results: [madri] });
    askMock.mockImplementation(() => "Madrid");

    const output = (await captureLog(() => addCity(state))).join("\n");

    expect(output).toContain("Madrid agregada.");
    expect(state.cities).toEqual([madri]);
    // persistida por saveCities en el cwd temporal
    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([madri]);
  });

  test("recorta los espacios del nombre antes de buscarlo", async () => {
    fetchCalls = 0;
    const state = makeState();
    respondGeocoding({ results: [makeCity()] });
    askMock.mockImplementation(() => "  Madrid   ");

    await captureLog(() => addCity(state));

    expect(fetchCalls).toBe(1);
  });

  test("compara sin mayúsculas/minúsculas contra las ciudades guardadas", async () => {
    const state = makeState({ cities: [makeCity({ name: "Lima" }), makeCity({ name: "MADRID" })] });
    respondGeocoding({});
    askMock.mockImplementation(() => "madrid");

    const output = (await captureLog(() => addCity(state))).join("\n");

    expect(output).toContain("ya está registrada");
    expect(output).toContain("madrid");
    expect(state.cities).toHaveLength(2);
  });
});
