import { geocodeCity, getCurrentWeather } from "./src/api.ts";
import { gray, green, red } from "./src/colors.ts";
import { InputClosedError, ask } from "./src/prompt.ts";
import { loadState, saveState } from "./src/storage.ts";
import type { City, State } from "./src/types.ts";
import { formatCityName, formatCityWeather, numberedList, renderMenu } from "./src/ui.ts";

async function pickCityIndex(cities: City[], prompt: string): Promise<number | null> {
  const raw = (await ask(prompt)).trim();
  const index = Number.parseInt(raw, 10);
  if (Number.isNaN(index) || index < 1 || index > cities.length) return null;
  return index - 1;
}

function showNoCitiesMessage(): void {
  console.log(red("  No hay ciudades registradas. Usa la opción 3 para buscar y agregar una."));
}

async function showCityWeather(city: City, state: State): Promise<void> {
  const reading = await getCurrentWeather(city);
  if (!reading) {
    console.log(red("  No se pudo obtener el clima. Revisa tu conexión."));
    return;
  }
  console.log(formatCityWeather(city.name, reading, state.unit));
}

async function showDefaultCityWeather(state: State): Promise<void> {
  if (!state.defaultCity) {
    console.log(red("  No hay ciudad default. Agrega una (opción 3) y establécela como default (opción 5)."));
    return;
  }
  console.log(gray(`  Consultando clima de ${state.defaultCity.name}...`));
  await showCityWeather(state.defaultCity, state);
}

async function showAllCitiesWeather(state: State): Promise<void> {
  if (state.cities.length === 0) {
    showNoCitiesMessage();
    return;
  }
  for (const city of state.cities) {
    console.log(gray(`  Consultando ${city.name}...`));
    await showCityWeather(city, state);
  }
}

async function handleAddCity(state: State): Promise<void> {
  const name = (await ask("  Nombre de la ciudad: ")).trim();
  if (!name) {
    console.log(red("  El nombre no puede estar vacío."));
    return;
  }
  if (state.cities.some((city) => city.name.toLowerCase() === name.toLowerCase())) {
    console.log(red(`  "${name}" ya está registrada.`));
    return;
  }

  console.log(gray("  Buscando ciudad..."));
  const city = await geocodeCity(name);
  if (!city) {
    console.log(red(`  No se encontró la ciudad "${name}". Intenta con otro nombre.`));
    return;
  }

  state.cities.push(city);
  await saveState(state);
  console.log(green(`  ${city.name} agregada.`));
}

async function handleRemoveCity(state: State): Promise<void> {
  if (state.cities.length === 0) {
    console.log(red("  No hay ciudades registradas."));
    return;
  }

  console.log(numberedList(state.cities.map(formatCityName)));
  const index = await pickCityIndex(state.cities, "  Número de la ciudad a eliminar: ");
  if (index === null) {
    console.log(red("  Opción no válida."));
    return;
  }

  const [removed] = state.cities.splice(index, 1);
  if (removed && state.defaultCity?.name === removed.name && state.defaultCity.latitude === removed.latitude) {
    state.defaultCity = null;
    console.log(red("  La ciudad eliminada era la default; ya no hay ciudad default."));
  }
  await saveState(state);
  console.log(green(`  ${removed?.name ?? "La ciudad"} eliminada.`));
}

async function handleSetDefaultCity(state: State): Promise<void> {
  if (state.cities.length === 0) {
    showNoCitiesMessage();
    return;
  }

  console.log(numberedList(state.cities.map(formatCityName)));
  const index = await pickCityIndex(state.cities, "  Número de la ciudad default: ");
  if (index === null) {
    console.log(red("  Opción no válida."));
    return;
  }

  const selected = state.cities[index];
  if (!selected) {
    console.log(red("  Opción no válida."));
    return;
  }

  state.defaultCity = selected;
  await saveState(state);
  console.log(green(`  Ciudad default: ${selected.name}.`));
}

async function handleToggleUnit(state: State): Promise<void> {
  state.unit = state.unit === "C" ? "F" : "C";
  await saveState(state);
  console.log(green(`  Unidad cambiada a °${state.unit}.`));
}

async function main(): Promise<void> {
  const state = await loadState();

  for (;;) {
    console.log(renderMenu(state));
    const option = (await ask("  Selecciona una opción: ")).trim();

    switch (option) {
      case "1":
        await showDefaultCityWeather(state);
        break;
      case "2":
        await showAllCitiesWeather(state);
        break;
      case "3":
        await handleAddCity(state);
        break;
      case "4":
        await handleRemoveCity(state);
        break;
      case "5":
        await handleSetDefaultCity(state);
        break;
      case "8":
        await handleToggleUnit(state);
        break;
      case "9":
        console.log(green("  ¡Hasta luego!"));
        return;
      default:
        console.log(red("  Opción no válida. Elige un número del menú."));
    }
  }
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
