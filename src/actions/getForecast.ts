import { get7DayForecast } from "../api/weather.ts";
import type { State } from "../types/State.ts";
import { pickCityIndex } from "../presentation/input.ts";
import { showError, showNoCitiesMessage, showStatus } from "../presentation/output.ts";
import { formatCityName, formatDailyForecast, numberedList } from "../utils/format.ts";

export async function showDailyForecast(state: State): Promise<void> {
  if (state.cities.length === 0) {
    showNoCitiesMessage();
    return;
  }

  console.log(numberedList(state.cities.map(formatCityName)));
  const index = await pickCityIndex(state.cities, "  Número de la ciudad para el pronóstico: ");
  if (index === null) {
    showError("Opción no válida.");
    return;
  }

  const selected = state.cities[index];
  if (!selected) {
    showError("Opción no válida.");
    return;
  }

  showStatus(`Consultando pronóstico de ${selected.name}...`);
  const forecasts = await get7DayForecast(selected);
  if (!forecasts) {
    showError("No se pudo obtener el pronóstico. Revisa tu conexión.");
    return;
  }
  console.log(formatDailyForecast(selected.name, forecasts, state.unit));
}
