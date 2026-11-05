import type { City, State, Unit } from "./types.ts";
import type { WeatherReading } from "./api.ts";
import { cyan, gray, yellow } from "./colors.ts";
import { describeWeather } from "./weather-codes.ts";

// Formato de {@link https://github.com/README.md | README} -> "### Ejemplo del menú".
const BORDER = cyan("═".repeat(40));

export function renderMenu(state: State): string {
  return [
    BORDER,
    cyan("         WEATHER CLI"),
    BORDER,
    "  1. Clima de ciudad default",
    `  2. Clima de todas las ciudades (${state.cities.length})`,
    "  3. Buscar y agregar ciudad",
    "  4. Eliminar ciudad",
    "  5. Establecer ciudad default",
    `  8. Ajustes (°${state.unit})`,
    "  9. Salir",
    BORDER,
  ].join("\n");
}

export function numberedList(items: string[]): string {
  return items.map((item, index) => `  ${index + 1}. ${item}`).join("\n");
}

export function formatTemperature(temperatureC: number, unit: Unit): string {
  if (unit === "C") return yellow(`${temperatureC.toFixed(1)} °C`);
  return yellow(`${((temperatureC * 9) / 5 + 32).toFixed(1)} °F`);
}

export function formatCityWeather(cityName: string, reading: WeatherReading, unit: Unit): string {
  const temperature = formatTemperature(reading.temperatureC, unit);
  return `  ${cityName}: ${temperature} — ${gray(describeWeather(reading.code))}`;
}

export function formatCityName(city: City): string {
  return city.name;
}
