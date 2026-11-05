import type { State } from "../types/State.ts";
import { pickCityIndex } from "../presentation/input.ts";
import { showError, showSuccess } from "../presentation/output.ts";
import { saveCities } from "../storage/citiesStorage.ts";
import { saveSettings } from "../storage/settingsStorage.ts";
import { formatCityName, numberedList } from "../utils/format.ts";

export async function removeCity(state: State): Promise<void> {
  if (state.cities.length === 0) {
    showError("No hay ciudades registradas.");
    return;
  }

  console.log(numberedList(state.cities.map(formatCityName)));
  const index = await pickCityIndex(state.cities, "  Número de la ciudad a eliminar: ");
  if (index === null) {
    showError("Opción no válida.");
    return;
  }

  const [removed] = state.cities.splice(index, 1);
  if (removed && state.defaultCity?.name === removed.name && state.defaultCity?.latitude === removed.latitude) {
    state.defaultCity = null;
    showError("La ciudad eliminada era la default; ya no hay ciudad default.");
    await saveSettings({ defaultCity: null, unit: state.unit });
  }
  await saveCities(state.cities);
  showSuccess(`${removed?.name ?? "La ciudad"} eliminada.`);
}
