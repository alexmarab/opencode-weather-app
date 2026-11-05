import { geocodeCity } from "../api/geocoding.ts";
import type { State } from "../types/State.ts";
import { ask } from "../presentation/input.ts";
import { showError, showStatus, showSuccess } from "../presentation/output.ts";
import { saveCities } from "../storage/citiesStorage.ts";

export async function addCity(state: State): Promise<void> {
  const name = (await ask("  Nombre de la ciudad: ")).trim();
  if (!name) {
    showError("El nombre no puede estar vacío.");
    return;
  }
  if (state.cities.some((city) => city.name.toLowerCase() === name.toLowerCase())) {
    showError(`"${name}" ya está registrada.`);
    return;
  }

  showStatus("Buscando ciudad...");
  const city = await geocodeCity(name);
  if (!city) {
    showError(`No se encontró la ciudad "${name}". Intenta con otro nombre.`);
    return;
  }

  state.cities.push(city);
  await saveCities(state.cities);
  showSuccess(`${city.name} agregada.`);
}
