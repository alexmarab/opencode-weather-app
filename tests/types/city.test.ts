import { describe, expect, test } from "bun:test";
import { isCity } from "../../src/types/City.ts";

describe("isCity", () => {
  test("acepta un objeto City válido", () => {
    expect(isCity({ name: "Madrid", latitude: 40.4168, longitude: -3.7038 })).toBe(true);
  });

  test("acepta coordenadas enteras y nombre no vacío", () => {
    expect(isCity({ name: "Paris", latitude: 48, longitude: 2 })).toBe(true);
  });

  test("rechaza null", () => {
    expect(isCity(null)).toBe(false);
  });

  test("rechaza valores no objeto", () => {
    expect(isCity("Madrid")).toBe(false);
    expect(isCity(42)).toBe(false);
    expect(isCity(undefined)).toBe(false);
  });

  test("rechaza arrays (no son Shape de ciudad)", () => {
    expect(isCity(["Madrid"])).toBe(false);
  });

  test("rechaza el nombre vacío", () => {
    expect(isCity({ name: "", latitude: 40, longitude: -3.7 })).toBe(false);
  });

  test("rechaza un nombre que no es string", () => {
    expect(isCity({ name: 42, latitude: 40, longitude: -3.7 })).toBe(false);
  });

  test("rechaza la latitud no numérica", () => {
    expect(isCity({ name: "Madrid", latitude: "40", longitude: -3.7 })).toBe(false);
  });

  test("rechaza la longitude faltante", () => {
    expect(isCity({ name: "Madrid", latitude: 40 })).toBe(false);
  });

  test("rechaza objetos con campos extra pero incompletos", () => {
    expect(isCity({ name: "Madrid" })).toBe(false);
    expect(isCity({})).toBe(false);
  });
});
