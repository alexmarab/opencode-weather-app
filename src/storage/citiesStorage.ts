import type { City } from "../types/City.ts";
import { isCity } from "../types/City.ts";
import { red } from "../utils/colors.ts";
import { CITIES_FILE } from "../utils/constants.ts";

/** Devuelve las ciudades guardadas o `[]` si el archivo no existe / es inválido. */
export async function loadCities(): Promise<City[]> {
  const file = Bun.file(CITIES_FILE);
  if (!(await file.exists())) return [];

  try {
    const raw = await file.json();
    return Array.isArray(raw) ? raw.filter(isCity) : [];
  } catch {
    console.warn(red(`  Advertencia: ${CITIES_FILE} es inválido. Se usará una lista vacía.`));
    return [];
  }
}

export async function saveCities(cities: City[]): Promise<void> {
  await Bun.write(CITIES_FILE, `${JSON.stringify(cities, null, 2)}\n`);
}
