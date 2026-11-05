import type { State } from "../types/State.ts";
import { showSuccess } from "../presentation/output.ts";
import { saveSettings } from "../storage/settingsStorage.ts";

export async function toggleUnit(state: State): Promise<void> {
  state.unit = state.unit === "C" ? "F" : "C";
  await saveSettings({ defaultCity: state.defaultCity, unit: state.unit });
  showSuccess(`Unidad cambiada a °${state.unit}.`);
}
