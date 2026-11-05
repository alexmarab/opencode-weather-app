import { describe, expect, test } from "bun:test";
import { describeWeather } from "../../src/utils/constants.ts";

describe("describeWeather", () => {
  test("mapea los códigos WMO principales", () => {
    expect(describeWeather(0)).toBe("Despejado");
    expect(describeWeather(1)).toBe("Mayormente despejado");
    expect(describeWeather(2)).toBe("Parcialmente nublado");
    expect(describeWeather(3)).toBe("Nublado");
    expect(describeWeather(51)).toBe("Llovizna ligera");
    expect(describeWeather(61)).toBe("Lluvia ligera");
    expect(describeWeather(65)).toBe("Lluvia fuerte");
    expect(describeWeather(71)).toBe("Nevada ligera");
    expect(describeWeather(75)).toBe("Nevada fuerte");
    expect(describeWeather(80)).toBe("Chubascos ligeros");
    expect(describeWeather(85)).toBe("Chubascos de nieve ligeros");
    expect(describeWeather(95)).toBe("Tormenta eléctrica");
    expect(describeWeather(96)).toBe("Tormenta eléctrica con granizo");
    expect(describeWeather(99)).toBe("Tormenta fuerte con granizo");
  });

  test("mapea los códigos de niebla y heladas", () => {
    expect(describeWeather(45)).toBe("Niebla");
    expect(describeWeather(48)).toBe("Niebla con escarcha");
    expect(describeWeather(56)).toBe("Llovizna helada ligera");
    expect(describeWeather(57)).toBe("Llovizna helada intensa");
    expect(describeWeather(66)).toBe("Llovizna helada ligera");
    expect(describeWeather(67)).toBe("Lluvia helada fuerte");
    expect(describeWeather(77)).toBe("Granos de nieve");
  });

  test("los códigos intermedios de lluvia y chubascos existen", () => {
    expect(describeWeather(53)).toBe("Llovizna moderada");
    expect(describeWeather(55)).toBe("Llovizna intensa");
    expect(describeWeather(63)).toBe("Lluvia moderada");
    expect(describeWeather(73)).toBe("Nevada moderada");
    expect(describeWeather(81)).toBe("Chubascos moderados");
    expect(describeWeather(82)).toBe("Chubascos fuertes");
    expect(describeWeather(86)).toBe("Chubascos de nieve fuertes");
  });

  test("los códigos desconocidos tienen descripción de reserva", () => {
    expect(describeWeather(27)).toBe("Condición desconocida");
    expect(describeWeather(999)).toBe("Condición desconocida");
    expect(describeWeather(-1)).toBe("Condición desconocida");
  });
});
