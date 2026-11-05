import { getCurrentWeather } from "../api/weather.ts";
import type { City } from "../types/City.ts";
import type { State } from "../types/State.ts";
import { showError, showNoCitiesMessage, showStatus } from "../presentation/output.ts";
import { formatCityWeather } from "../utils/format.ts";

async function showCityWeather(city: City, state: State): Promise<void> {
  const reading = await getCurrentWeather(city);
  if (!reading) {
    showError("No se pudo obtener el clima. Revisa tu conexión.");
    return;
  }
  console.log(formatCityWeather(city.name, reading, state.unit));
}

export async function showDefaultCityWeather(state: State): Promise<void> {
  if (!state.defaultCity) {
    showError("No hay ciudad default. Agrega una (opción 3) y establécela como default (opción 5).");
    return;
  }
  showStatus(`Consultando clima de ${state.defaultCity.name}...`);
  await showCityWeather(state.defaultCity, state);
}

export async function showAllCitiesWeather(state: State): Promise<void> {
  if (state.cities.length === 0) {
    showNoCitiesMessage();
    return;
  }
  for (const city of state.cities) {
    showStatus(`Consultando ${city.name}...`);
    await showCityWeather(city, state);
  }
}
