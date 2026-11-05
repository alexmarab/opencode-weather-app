import { runMenu } from "./presentation/menu.ts";
import { green } from "./utils/colors.ts";
import { InputClosedError } from "./presentation/input.ts";
import { migrateLegacyData } from "./storage/migrate.ts";
import { loadCities } from "./storage/citiesStorage.ts";
import { loadSettings } from "./storage/settingsStorage.ts";
import type { State } from "./types/State.ts";

async function loadState(): Promise<State> {
  const [cities, settings] = await Promise.all([loadCities(), loadSettings()]);
  return {
    cities,
    defaultCity: settings.defaultCity,
    unit: settings.unit,
  };
}

async function main(): Promise<void> {
  await migrateLegacyData();
  const state = await loadState();
  await runMenu(state);
}

try {
  await main();
} catch (error) {
  if (error instanceof InputClosedError) {
    // Ctrl+D / fin de la entrada: salimos limpio.
    console.log(green("  ¡Hasta luego!"));
  } else {
    console.error("Error inesperado:", error);
    process.exit(1);
  }
}

// Bun.stdin.stream() mantiene vivo el loop de eventos de Bun aunque nadie
// lea más de stdin (Ctrl+D incluido); sin esta línea el programa no termina.
process.exit(0);
