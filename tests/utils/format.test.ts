import { describe, expect, test } from "bun:test";
import { stripAnsi, makeCity } from "../helpers.ts";
import {
  formatCityName,
  formatCityWeather,
  formatDailyForecast,
  formatForecastDate,
  formatTemperature,
  numberedList,
} from "../../src/utils/format.ts";

describe("numberedList", () => {
  test("numera los items empezando en 1 con sangría de 2 espacios", () => {
    expect(numberedList(["Madrid", "Paris"])).toBe("  1. Madrid\n  2. Paris");
  });

  test("con un solo item produce una línea", () => {
    expect(numberedList(["Lima"])).toBe("  1. Lima");
  });

  test("con lista vacía devuelve string vacío", () => {
    expect(numberedList([])).toBe("");
  });
});

describe("formatTemperature", () => {
  test("en °C mantiene el valor con 1 decimal", () => {
    expect(stripAnsi(formatTemperature(25, "C"))).toContain("25.0 °C");
  });

  test("convierte a °F correctamente", () => {
    expect((25 * 9) / 5 + 32).toBe(77); // 25 °C -> 77 °F
    expect(stripAnsi(formatTemperature(25, "F"))).toContain("77.0 °F");
  });

  test("la conversión negativa a °F es correcta", () => {
    expect((10 * 9) / 5 + 32).toBe(50);
    expect((0 * 9) / 5 + 32).toBe(32);
    expect(stripAnsi(formatTemperature(10, "F"))).toContain("50.0 °F");
    expect(stripAnsi(formatTemperature(0, "F"))).toContain("32.0 °F");
  });

  test("solo hay 1 decimal (23 de JS con toFixed incluso con fallo de coma flotante)", () => {
    // (21.45).toFixed(1) === "21.4" por representación binaria del 0.45:
    // el test congela ese comportamiento REAL, no una convención ideal.
    expect(stripAnsi(formatTemperature(21.45, "C"))).toBe("21.4 °C");
    expect(stripAnsi(formatTemperature(0.04, "C"))).toBe("0.0 °C");
  });

  test("valores decimales se redondean a 1 decimal en °F", () => {
    expect(stripAnsi(formatTemperature(21.45, "F"))).toContain("70.6 °F");
  });
});

describe("formatCityWeather", () => {
  test("combina ciudad, temperatura y descripción del código", () => {
    const withoutAnsi = stripAnsi(formatCityWeather("Madrid", { temperatureC: 21.5, code: 0 }, "C"));
    expect(withoutAnsi).toBe("  Madrid: 21.5 °C — Despejado");
  });

  test("usa la unidad del estado (°F)", () => {
    const withoutAnsi = stripAnsi(formatCityWeather("Paris", { temperatureC: 0, code: 3 }, "F"));
    expect(withoutAnsi).toBe("  Paris: 32.0 °F — Nublado");
  });
});

describe("formatForecastDate", () => {
  test('pasa "2026-11-05" a formato corto español con primera letra mayúscula', () => {
    expect(formatForecastDate("2026-11-05")).toBe("Jue, 5 nov");
  });

  test('pasa "2026-01-01" a "Jue, 1 ene"', () => {
    expect(formatForecastDate("2026-01-01")).toBe("Jue, 1 ene");
  });

  test('pasa "2026-02-16" a "Lun, 16 feb"', () => {
    expect(formatForecastDate("2026-02-16")).toBe("Lun, 16 feb");
  });

  test("el formato no depende de la zona horaria local", () => {
    // 2026-12-21 a las 00:00 UTC es un lunes; en zonas horarias negativas un
    // Date sin "Z" correría el día al domingo. El código lo evita con "Z".
    expect(formatForecastDate("2026-12-21")).toBe("Lun, 21 dic");
  });
});

describe("formatDailyForecast", () => {
  test("primera línea de cabecera con la ciudad", () => {
    expect(stripAnsi(formatDailyForecast("Madrid", [], "C"))).toContain("Pronóstico 7 días · Madrid");
  });

  test("cada día una línea con max / min y condición", () => {
    const forecast = [
      { date: "2026-11-05", minC: 13.8, maxC: 25, code: 0 },
      { date: "2026-11-06", minC: 9.2, maxC: 18.1, code: 61 },
    ];
    const lines = stripAnsi(formatDailyForecast("Madrid", forecast, "C")).split("\n");
    expect(lines.length).toBe(3); // cabecera + 2 días
    expect(lines[1]).toContain("Jue, 5 nov: max 25.0 °C / min 13.8 °C — Despejado");
    expect(lines[2]).toContain("Vie, 6 nov: max 18.1 °C / min 9.2 °C — Lluvia ligera");
  });

  test("un pronóstico vacío solo tiene la cabecera", () => {
    expect(stripAnsi(formatDailyForecast("Lima", [], "C")).split("\n").length).toBe(1);
  });
});

describe("formatCityName", () => {
  test("devuelve el nombre de la ciudad", () => {
    expect(formatCityName(makeCity({ name: "Bogotá" }))).toBe("Bogotá");
  });
});
