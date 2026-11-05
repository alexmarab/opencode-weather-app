import type { State } from "../types/State.ts";
import { pickCityIndex } from "../presentation/input.ts";
import { showError, showNoCitiesMessage, showSuccess } from "../presentation/output.ts";
import { saveSettings } from "../storage/settingsStorage.ts";
import { formatCityName, numberedList } from "../utils/format.ts";

export async function setDefaultCity(state: State): Promise<void> {
  if (state.cities.length === 0) {
    showNoCitiesMessage();
    return;
  }

  console.log(numberedList(state.cities.map(formatCityName)));
  const index = await pickCityIndex(state.cities, "  Número de la ciudad default: ");
  if (index === null) {
    showError("Opción no válida.");
    return;
  }

  const selected = state.cities[index];
  if (!selected) {
    showError("Opción no válida.");
    return;
  }

  state.defaultCity = selected;
  await saveSettings({ defaultCity: state.defaultCity, unit: state.unit });
  showSuccess(`Ciudad default: ${selected.name}.`);
}
