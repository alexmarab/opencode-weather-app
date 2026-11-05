import { rmSync } from "node:fs";
import { beforeEach, describe, expect, test } from "bun:test";
import { captureWarn, makeCity, useTempCwd } from "../helpers.ts";
import { loadCities, saveCities } from "../../src/storage/citiesStorage.ts";

useTempCwd("weather-cities-");

// Limpia el archivo entre tests para que cada caso parta de disco vacío.
beforeEach(() => {
  rmSync("cities.json", { force: true });
});

describe("loadCities", () => {
  test("sin archivo devuelve la lista vacía", async () => {
    expect(await loadCities()).toEqual([]);
  });

  test("lee las ciudades guardadas por saveCities (roundtrip)", async () => {
    const cities = [makeCity(), makeCity({ name: "Lima", latitude: -12.05, longitude: -77.03 })];
    await saveCities(cities);

    const loaded = await loadCities();
    expect(loaded).toHaveLength(2);
    expect(loaded[0]).toEqual(makeCity());
    expect(loaded[1]).toEqual(makeCity({ name: "Lima", latitude: -12.05, longitude: -77.03 }));
  });

  test("con JSON corrupto devuelve lista vacía y advierte", async () => {
    await Bun.write("cities.json", "{esto no es json");
    const output = await captureWarn(loadCities);
    expect(output.some((line) => line.includes("cities.json") && line.includes("inválido"))).toBe(true);
    expect(await loadCities()).toEqual([]);
  });

  test("filtra las entradas que no son ciudades (isCity)", async () => {
    await Bun.write(
      "cities.json",
      JSON.stringify([
        makeCity({ name: "Madrid" }),
        { name: "", latitude: 1, longitude: 2 }, // nombre vacío
        "Madrid", // string suelto
        42, // número suelto
        { name: "Lima" }, // sin coordenadas
      ]),
    );

    const loaded = await loadCities();
    expect(loaded).toEqual([makeCity({ name: "Madrid" })]);
  });

  test("un JSON que no es array devuelve lista vacía", async () => {
    await Bun.write("cities.json", JSON.stringify({ cities: [makeCity()] }));
    expect(await loadCities()).toEqual([]);
  });
});

describe("saveCities", () => {
  test("crea el archivo en disco con JSON legible", async () => {
    await saveCities([makeCity()]);
    const file = Bun.file("cities.json");
    expect(await file.exists()).toBe(true);
    expect(JSON.parse(await file.text())).toEqual([makeCity()]);
  });

  test("sobrescribe el contenido anterior", async () => {
    await saveCities([makeCity({ name: "Uno" })]);
    await saveCities([makeCity({ name: "Dos" })]);
    expect(JSON.parse(await Bun.file("cities.json").text())[0].name).toBe("Dos");
  });
});
