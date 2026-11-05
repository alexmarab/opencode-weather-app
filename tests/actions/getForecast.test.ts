import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { rmSync } from "node:fs";
import { captureLog, makeCity, makeState, useTempCwd } from "../helpers.ts";
import * as realInput from "../../src/presentation/input.ts";
import { showDailyForecast } from "../../src/actions/getForecast.ts";

useTempCwd("weather-getforecast-");

beforeEach(() => {
  rmSync("cities.json", { force: true });
  rmSync("settings.json", { force: true });
});

// Solo se mockea la entrada (nadie más usa el pickCityIndex real en los
// tests); la API usa el módulo REAL de src con `fetch` global sustituido
// (reversible con afterEach) para no contaminar tests/api/* con mock.module.
const pickMock = mock((): number | null => 0);
const askMock = mock(() => "");

mock.module("../../src/presentation/input.ts", () => ({ ...realInput, pickCityIndex: pickMock, ask: askMock }));

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const madrid = makeCity({ name: "Madrid" });

/** Respuesta daily de OpenMeteo para 2 días desde 2026-11-05. */
const DAILY_OK = {
  daily: {
    time: ["2026-11-05", "2026-11-06"],
    weather_code: [0, 61],
    temperature_2m_max: [25, 18.1],
    temperature_2m_min: [13.8, 9.2],
  },
};

describe("showDailyForecast", () => {
  test('sin ciudades muestra el aviso "no hay ciudades"', async () => {
    const state = makeState();
    globalThis.fetch = (async () => new Response(JSON.stringify(DAILY_OK))) as unknown as typeof fetch;

    const output = (await captureLog(() => showDailyForecast(state))).join("\n");

    expect(output).toContain("No hay ciudades registradas");
  });

  test("con un índice no válido muestra error y no consulta la API", async () => {
    const state = makeState({ cities: [madrid] });
    pickMock.mockImplementation(() => null);
    globalThis.fetch = (async () => new Response(JSON.stringify(DAILY_OK))) as unknown as typeof fetch;

    const output = (await captureLog(() => showDailyForecast(state))).join("\n");

    expect(output).toContain("Opción no válida.");
  });

  test("con la API caída (respuesta 500) muestra el mensaje de error", async () => {
    const state = makeState({ cities: [madrid] });
    pickMock.mockImplementation(() => 0);
    globalThis.fetch = (async () => new Response("upstream error", { status: 500 })) as unknown as typeof fetch;

    const output = (await captureLog(() => showDailyForecast(state))).join("\n");

    expect(output).toContain("Consultando pronóstico de Madrid...");
    expect(output).toContain("No se pudo obtener el pronóstico.");
  });

  test("con datos incompletos muestra igualmente el mensaje de error", async () => {
    const state = makeState({ cities: [madrid] });
    pickMock.mockImplementation(() => 0);
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ daily: { time: ["2026-11-05"], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] } }),
      )) as unknown as typeof fetch;

    const output = (await captureLog(() => showDailyForecast(state))).join("\n");

    expect(output).toContain("No se pudo obtener el pronóstico.");
  });

  test("imprime el pronóstico de la ciudad elegida", async () => {
    const state = makeState({ cities: [madrid] });
    pickMock.mockImplementation(() => 0);
    globalThis.fetch = (async () => new Response(JSON.stringify(DAILY_OK))) as unknown as typeof fetch;

    const output = (await captureLog(() => showDailyForecast(state))).join("\n");

    expect(output).toContain("Consultando pronóstico de Madrid...");
    expect(output).toContain("Pronóstico 7 días · Madrid");
    expect(output).toContain("Jue, 5 nov: max 25.0 °C / min 13.8 °C — Despejado");
    expect(output).toContain("Vie, 6 nov: max 18.1 °C / min 9.2 °C — Lluvia ligera");
  });

  test("muestra el pronóstico en la unidad del estado (°F)", async () => {
    const state = makeState({ cities: [madrid], unit: "F" });
    pickMock.mockImplementation(() => 0);
    globalThis.fetch = (async () => new Response(JSON.stringify(DAILY_OK))) as unknown as typeof fetch;

    const output = (await captureLog(() => showDailyForecast(state))).join("\n");

    expect(output).toContain("max 77.0 °F / min 56.8 °F");
  });

  test("imprime la lista numerada antes de preguntar", async () => {
    const state = makeState({ cities: [makeCity({ name: "Aaa" }), madrid] });
    pickMock.mockImplementation(() => 1);
    globalThis.fetch = (async () => new Response(JSON.stringify(DAILY_OK))) as unknown as typeof fetch;

    const output = await captureLog(() => showDailyForecast(state));

    expect(output.some((line) => line.includes("  1. Aaa"))).toBe(true);
    expect(output.some((line) => line.includes("  2. Madrid"))).toBe(true);
  });
});
