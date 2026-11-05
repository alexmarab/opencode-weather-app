import type { MenuOption } from "../types/MenuOption.ts";
import type { State } from "../types/State.ts";
import { ask } from "./input.ts";
import { showError, showSuccess } from "./output.ts";
import { addCity } from "../actions/addCity.ts";
import { removeCity } from "../actions/removeCity.ts";
import { setDefaultCity } from "../actions/setDefaultCity.ts";
import { showAllCitiesWeather, showDefaultCityWeather } from "../actions/getWeather.ts";
import { showDailyForecast } from "../actions/getForecast.ts";
import { toggleUnit } from "../actions/toggleUnit.ts";
import { cyan } from "../utils/colors.ts";

// Formato de {@link https://github.com/README.md | README} -> "### Ejemplo del menú".
const BORDER = cyan("═".repeat(40));

type ActionHandler = (state: State) => Promise<void>;

const HANDLERS: { [K in Exclude<MenuOption, "9">]: ActionHandler } = {
  "1": showDefaultCityWeather,
  "2": showAllCitiesWeather,
  "3": addCity,
  "4": removeCity,
  "5": setDefaultCity,
  "6": showDailyForecast,
  "8": toggleUnit,
};

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
    "  6. Pronóstico 7 días",
    `  8. Ajustes (°${state.unit})`,
    "  9. Salir",
    BORDER,
  ].join("\n");
}

export function isMenuOption(value: string): value is MenuOption {
  return value === "9" || value in HANDLERS;
}

export async function runMenu(state: State): Promise<void> {
  for (;;) {
    console.log(renderMenu(state));
    const option = (await ask("  Selecciona una opción: ")).trim();

    if (!isMenuOption(option)) {
      showError("Opción no válida. Elige un número del menú.");
      continue;
    }
    if (option === "9") {
      showSuccess("¡Hasta luego!");
      return;
    }

    const handler = HANDLERS[option];
    if (!handler) {
      showError("Opción no válida. Elige un número del menú.");
      continue;
    }
    await handler(state);
  }
}
