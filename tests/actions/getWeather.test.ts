import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { captureLog, makeCity, makeState, useTempCwd } from "../helpers.ts";
import { showDefaultCityWeather, showAllCitiesWeather } from "../../src/actions/getWeather.ts";

useTempCwd("weather-getweather-");

// La API de clima usa el módulo REAL de src con `fetch` global sustituido
// (reversible con afterEach) — mock.module no se puede revertir en Bun 1.4
// y contaminaría los tests de tests/api/* si mockeáramos api/weather.ts.
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

let fetchCalls = 0;

/** Sustituye fetch; el cuerpo depende de la ciudad pedida vía su latitud. */
function respondWeather(byLatitude: Record<string, unknown>): void {
  globalThis.fetch = (async (input?: unknown) => {
    fetchCalls++;
    const latitude = String(input).split("latitude=")[1]?.split("&")[0] ?? "";
    const body = byLatitude[latitude] ?? {};
    return new Response(JSON.stringify(body));
  }) as unknown as typeof fetch;
}

const madrid = makeCity({ name: "Madrid" });
const lima = makeCity({ name: "Lima", latitude: -12.05, longitude: -77.03 });

beforeEach(() => {
  fetchCalls = 0;
});

describe("showDefaultCityWeather", () => {
  test("sin ciudad default muestra error y no consulta la API", async () => {
    const state = makeState({ cities: [madrid] }); // hay ciudades pero no default

    const output = (await captureLog(() => showDefaultCityWeather(state))).join("\n");

    expect(output).toContain("No hay ciudad default");
    expect(fetchCalls).toBe(0);
  });

  test("consulta y muestra el clima de la ciudad default", async () => {
    const state = makeState({ defaultCity: madrid });
    respondWeather({ "40.4168": { current: { temperature_2m: 21.5, weather_code: 0 } } });

    const output = (await captureLog(() => showDefaultCityWeather(state))).join("\n");

    expect(output).toContain("Consultando clima de Madrid...");
    expect(output).toContain("Madrid: 21.5 °C");
    expect(output).toContain("Despejado");
  });

  test("mostrar la temperatura en la unidad del estado (°F)", async () => {
    const state = makeState({ defaultCity: madrid, unit: "F" });
    respondWeather({ "40.4168": { current: { temperature_2m: 21.5, weather_code: 0 } } });

    const output = (await captureLog(() => showDefaultCityWeather(state))).join("\n");

    expect(output).toContain("70.7 °F");
  });

  test("con la API caída muestra el mensaje de error", async () => {
    const state = makeState({ defaultCity: madrid });
    respondWeather({});

    const output = (await captureLog(() => showDefaultCityWeather(state))).join("\n");

    expect(output).toContain("No se pudo obtener el clima.");
  });
});

describe("showAllCitiesWeather", () => {
  test('sin ciudades muestra el aviso "no hay ciudades"', async () => {
    const state = makeState();
    respondWeather({});

    const output = (await captureLog(() => showAllCitiesWeather(state))).join("\n");

    expect(output).toContain("No hay ciudades registradas");
    expect(fetchCalls).toBe(0);
  });

  test("consulta el clima de cada ciudad en orden", async () => {
    const state = makeState({ cities: [madrid, lima] });
    respondWeather({
      "40.4168": { current: { temperature_2m: 21.5, weather_code: 0 } },
      "-12.05": { current: { temperature_2m: 12.0, weather_code: 61 } },
    });

    const output = await captureLog(() => showAllCitiesWeather(state));
    const joined = output.join("\n");

    expect(output.some((line) => line.includes("Consultando Madrid..."))).toBe(true);
    expect(output.some((line) => line.includes("Consultando Lima..."))).toBe(true);
    expect(joined).toContain("Madrid: 21.5 °C");
    expect(joined).toContain("Lima: 12.0 °C");
    expect(joined).toContain("Lluvia ligera");
  });

  test("si una ciudad falla, sigue con la siguiente", async () => {
    const state = makeState({ cities: [madrid, lima] });
    respondWeather({
      "40.4168": { current: { temperature_2m: 21.5, weather_code: 0 } },
      // Lima: {} → sin `current` → getCurrentWeather devuelve null
    });

    const output = await captureLog(() => showAllCitiesWeather(state));
    const joined = output.join("\n");

    expect(joined).toContain("Madrid: 21.5 °C"); // la primera sí salió
    expect(joined).toContain("No se pudo obtener el clima."); // la segunda falló
    expect(output.some((line) => line.includes("Consultando Madrid..."))).toBe(true);
    expect(output.some((line) => line.includes("Consultando Lima..."))).toBe(true);
  });
});
