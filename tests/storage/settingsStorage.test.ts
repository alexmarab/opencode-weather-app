import { beforeEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { captureWarn, makeCity, useTempCwd } from "../helpers.ts";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "../../src/storage/settingsStorage.ts";

useTempCwd("weather-settings-");

beforeEach(() => {
  rmSync("settings.json", { force: true });
});

describe("loadSettings", () => {
  test("sin archivo devuelve los valores por defecto", async () => {
    expect(await loadSettings()).toEqual({ defaultCity: null, unit: "C" });
  });

  test("devuelve una copia (los defaults no se contaminan)", async () => {
    const settings = await loadSettings();
    settings.unit = "F";
    expect(DEFAULT_SETTINGS.unit).toBe("C");
    expect((await loadSettings()).unit).toBe("C");
  });

  test("lee lo guardado por saveSettings (roundtrip)", async () => {
    const settings = { defaultCity: makeCity(), unit: "F" as const };
    await saveSettings(settings);
    expect(await loadSettings()).toEqual(settings);
  });

  test("normaliza una unidad fuera de dominio a °C conservando la defaultCity", async () => {
    await Bun.write(
      "settings.json",
      JSON.stringify({ unit: "Kelvin", defaultCity: makeCity({ name: "Lima" }) }),
    );
    expect(await loadSettings()).toEqual({ defaultCity: makeCity({ name: "Lima" }), unit: "C" });
  });

  test("normaliza una defaultCity inválida a null conservando °F", async () => {
    await Bun.write("settings.json", JSON.stringify({ unit: "F", defaultCity: "Lima" }));
    expect(await loadSettings()).toEqual({ defaultCity: null, unit: "F" });
  });

  test("acepta settings vacíos ({})", async () => {
    await Bun.write("settings.json", "{}");
    expect(await loadSettings()).toEqual({ defaultCity: null, unit: "C" });
  });

  test("con JSON corrupto devuelve los defaults y advierte", async () => {
    await Bun.write("settings.json", "{no json");
    const output = await captureWarn(loadSettings);
    expect(output.some((line) => line.includes("settings.json") && line.includes("inválido"))).toBe(true);
    expect(await loadSettings()).toEqual({ defaultCity: null, unit: "C" });
  });

  test("un JSON no objeto devuelve los defaults", async () => {
    await Bun.write("settings.json", "[1,2,3]");
    expect(await loadSettings()).toEqual({ defaultCity: null, unit: "C" });
  });
});

describe("saveSettings", () => {
  test("crea el archivo en disco", async () => {
    await saveSettings({ defaultCity: makeCity({ name: "Oslo" }), unit: "F" });
    const raw = JSON.parse(await Bun.file("settings.json").text());
    expect(raw).toEqual({ defaultCity: { name: "Oslo", latitude: 40.4168, longitude: -3.7038 }, unit: "F" });
  });

  test("sobrescribe el contenido anterior", async () => {
    await saveSettings({ defaultCity: null, unit: "C" });
    await saveSettings({ defaultCity: null, unit: "F" });
    expect(JSON.parse(await Bun.file("settings.json").text()).unit).toBe("F");
  });
});
