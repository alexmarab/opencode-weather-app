import { describe, expect, test } from "bun:test";
import { captureLog, makeCity, makeState, useTempCwd } from "../helpers.ts";
import { toggleUnit } from "../../src/actions/toggleUnit.ts";

useTempCwd("weather-toggleunit-");

describe("toggleUnit", () => {
  test('pasa de °C a °F y persiste settings', async () => {
    const state = makeState({ unit: "C" });

    const output = (await captureLog(() => toggleUnit(state))).join("\n");

    expect(state.unit).toBe("F");
    expect(output).toContain("Unidad cambiada a °F.");
  });

  test('pasa de °F a °C y persiste settings', async () => {
    const state = makeState({ unit: "F" });

    const output = (await captureLog(() => toggleUnit(state))).join("\n");

    expect(state.unit).toBe("C");
    expect(output).toContain("Unidad cambiada a °C.");
  });

  test("alterna: dos llamadas vuelven a la unidad original", async () => {
    const state = makeState({ unit: "C" });

    await toggleUnit(state);
    expect(state.unit).toBe("F");
    await toggleUnit(state);
    expect(state.unit).toBe("C");
  });

  test("persiste settings con la defaultCity intacta", async () => {
    const madrid = makeCity({ name: "Madrid" });
    const state = makeState({ cities: [madrid], defaultCity: madrid, unit: "F" });

    await captureLog(() => toggleUnit(state));

    const settings = JSON.parse(await Bun.file("settings.json").text());
    expect(settings).toEqual({ defaultCity: madrid, unit: "C" });
  });
});
