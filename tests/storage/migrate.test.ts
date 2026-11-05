import { beforeEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { captureLog, captureWarn, makeCity, useTempCwd } from "../helpers.ts";
import { migrateLegacyData } from "../../src/storage/migrate.ts";

useTempCwd("weather-migrate-");

beforeEach(() => {
  for (const file of ["data.json", "cities.json", "settings.json"]) {
    rmSync(file, { force: true });
  }
});

describe("migrateLegacyData", () => {
  test("no hace nada si no hay estado previo (ni legacy ni migrados)", async () => {
    await migrateLegacyData();
    expect(existsSync("cities.json")).toBe(false);
    expect(existsSync("settings.json")).toBe(false);
    expect(existsSync("data.json")).toBe(false);
  });

  test("reparte data.json en cities.json + settings.json y elimina el legacy", async () => {
    const madrid = makeCity();
    const lima = makeCity({ name: "Lima", latitude: -12.05, longitude: -77.03 });
    writeFileSync(
      "data.json",
      JSON.stringify({ cities: [madrid, lima], defaultCity: lima, unit: "F" }),
      "utf8",
    );

    const output = await captureLog(migrateLegacyData);

    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([madrid, lima]);
    expect(JSON.parse(await Bun.file("settings.json").text())).toEqual({
      defaultCity: lima,
      unit: "F",
    });
    expect(existsSync("data.json")).toBe(false);
    expect(output.some((line) => line.includes("Migración completada"))).toBe(true);  });

  test("no se ejecuta si ya existe cities.json (migración única)", async () => {
    await Bun.write("cities.json", JSON.stringify([makeCity({ name: "Ya migrado" })]));
    writeFileSync("data.json", JSON.stringify({ cities: [makeCity({ name: "Legacy" })] }), "utf8");

    await migrateLegacyData();

    expect(JSON.parse(await Bun.file("cities.json").text())[0].name).toBe("Ya migrado");
    expect(existsSync("settings.json")).toBe(false); // no toca settings
    expect(existsSync("data.json")).toBe(true); // no elimina el legacy
  });

  test("escribe defaults cuando el legacy no trae esa clave", async () => {
    writeFileSync("data.json", JSON.stringify({}), "utf8");

    await migrateLegacyData();

    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([]);
    expect(JSON.parse(await Bun.file("settings.json").text())).toEqual({
      defaultCity: null,
      unit: "C",
    });
    expect(existsSync("data.json")).toBe(false);
  });

  test("escribe solo las ciudades válidas y descarta las inválidas", async () => {
    const lima = makeCity({ name: "Lima", latitude: -12.05, longitude: -77.03 });
    writeFileSync(
      "data.json",
      JSON.stringify({ cities: ["basura", { name: "" }, lima], defaultCity: "no-city", unit: "F" }),
      "utf8",
    );

    await migrateLegacyData();

    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([lima]);
    expect(JSON.parse(await Bun.file("settings.json").text())).toEqual({
      defaultCity: null,
      unit: "F",
    });
  });

  test("con data.json inválido advierte y no crea ni borra nada", async () => {
    writeFileSync("data.json", "{roto", "utf8");

    const output = await captureWarn(migrateLegacyData);

    expect(output.some((line) => line.includes("data.json") && line.includes("inválido"))).toBe(true);
    expect(existsSync("cities.json")).toBe(false);
    expect(existsSync("settings.json")).toBe(false);
    expect(existsSync("data.json")).toBe(true);
  });

  test("datos JSON no objeto se tratan como estado vacío", async () => {
    writeFileSync("data.json", JSON.stringify([1, 2]), "utf8");

    await migrateLegacyData();

    expect(JSON.parse(await Bun.file("cities.json").text())).toEqual([]);
    expect(JSON.parse(await Bun.file("settings.json").text())).toEqual({ defaultCity: null, unit: "C" });
  });
});
