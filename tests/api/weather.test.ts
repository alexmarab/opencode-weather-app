import { afterEach, describe, expect, test } from "bun:test";
import { makeCity } from "../helpers.ts";
import { getCurrentWeather, get7DayForecast } from "../../src/api/weather.ts";

// fetch real capturado antes de cualquier test; cada test lo reemplaza y
// afterEach devuelve el original, sea cual sea el orden de ejecución.
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

let calledUrl = "";

function respond(body: unknown | string, status = 200): void {
  globalThis.fetch = (async (input?: unknown) => {
    calledUrl = String(input);
    return typeof body === "string" ? new Response(body, { status }) : new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

function failWithNetwork(): void {
  globalThis.fetch = (async () => {
    throw new Error("error de red simulado");
  }) as unknown as typeof fetch;
}

describe("getCurrentWeather", () => {
  test("obtiene la temperatura actual y el código WMO", async () => {
    respond({ current: { temperature_2m: 21.5, weather_code: 0 } });

    const reading = await getCurrentWeather(makeCity());
    expect(reading).toEqual({ temperatureC: 21.5, code: 0 });
  });

  test('pide current=temperature_2m,weather_code con las coordenadas de la ciudad', async () => {
    respond({ current: { temperature_2m: 20, weather_code: 1 } });
    await getCurrentWeather(makeCity({ latitude: 40.4168, longitude: -3.7038 }));

    expect(calledUrl.startsWith("https://api.open-meteo.com/v1/forecast?")).toBe(true);
    const params = new URL(calledUrl).searchParams;
    expect(params.get("latitude")).toBe("40.4168");
    expect(params.get("longitude")).toBe("-3.7038");
    expect(params.get("current")).toBe("temperature_2m,weather_code");
  });

  test("sin campo current devuelve null", async () => {
    respond({});
    expect(await getCurrentWeather(makeCity())).toBe(null);
  });

  test("con respuesta HTTP inválida (500) devuelve null", async () => {
    respond("upstream error", 500);
    expect(await getCurrentWeather(makeCity())).toBe(null);
  });

  test("con JSON inválido devuelve null", async () => {
    respond("{roto");
    expect(await getCurrentWeather(makeCity())).toBe(null);
  });

  test("con error de red devuelve null", async () => {
    failWithNetwork();
    expect(await getCurrentWeather(makeCity())).toBe(null);
  });
});

describe("get7DayForecast", () => {
  /** Cuerpo daily de OpenMeteo con `days` días consecutivos desde 2026-11-05. */
  function dailyBody(days: string[]): unknown {
    return {
      daily: {
        time: days,
        weather_code: days.map((_, index) => index),
        temperature_2m_max: days.map((_, index) => 20 + index),
        temperature_2m_min: days.map((_, index) => 10 + index),
      },
    };
  }

  test("obtiene el pronóstico completo de 7 días", async () => {
    const dates = Array.from({ length: 7 }, (_, index) =>
      new Date(Date.UTC(2026, 10, 5 + index)).toISOString().slice(0, 10),
    );
    respond(dailyBody(dates));

    const forecasts = await get7DayForecast(makeCity());
    expect(forecasts).toHaveLength(7);
    expect(forecasts?.[0]).toEqual({ date: "2026-11-05", minC: 10, maxC: 20, code: 0 });
    expect(forecasts?.[6]).toEqual({
      date: "2026-11-11",
      minC: 16,
      maxC: 26,
      code: 6,
    });
  });

  test('pide daily=weather_code,temperature_2m_max,temperature_2m_min con timezone=auto', async () => {
    respond({});
    await get7DayForecast(makeCity());

    expect(calledUrl.startsWith("https://api.open-meteo.com/v1/forecast?")).toBe(true);
    const params = new URL(calledUrl).searchParams;
    expect(params.get("daily")).toBe("weather_code,temperature_2m_max,temperature_2m_min");
    expect(params.get("forecast_days")).toBe("7");
    expect(params.get("timezone")).toBe("auto");
  });

  test("devuelve solo los días presentes (menos de 7)", async () => {
    respond(dailyBody(["2026-11-05", "2026-11-06"]));
    expect(await get7DayForecast(makeCity())).toHaveLength(2);
  });

  test("con arrays desalineados (datos incompletos) devuelve null", async () => {
    respond({
      daily: {
        time: ["2026-11-05", "2026-11-06", "2026-11-07"],
        weather_code: [0, 1, 2],
        temperature_2m_max: [20, 21], // falta el tercero
        temperature_2m_min: [10, 11, 12],
      },
    });
    expect(await get7DayForecast(makeCity())).toBe(null);
  });

  test("con daily ausente devuelve null", async () => {
    respond({});
    expect(await get7DayForecast(makeCity())).toBe(null);
  });

  test("con daily vacío devuelve null", async () => {
    respond({ daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] } });
    expect(await get7DayForecast(makeCity())).toBe(null);
  });

  test("con respuesta HTTP inválida (500) devuelve null", async () => {
    respond("upstream error", 500);
    expect(await get7DayForecast(makeCity())).toBe(null);
  });

  test("con JSON inválido devuelve null", async () => {
    respond("{roto");
    expect(await get7DayForecast(makeCity())).toBe(null);
  });

  test("con error de red devuelve null", async () => {
    failWithNetwork();
    expect(await get7DayForecast(makeCity())).toBe(null);
  });
});
