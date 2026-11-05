import { rm } from "node:fs/promises";
import { isCity } from "../types/City.ts";
import type { Unit } from "../types/Settings.ts";
import { green, red } from "../utils/colors.ts";
import { CITIES_FILE, LEGACY_DATA_FILE, SETTINGS_FILE } from "../utils/constants.ts";
import { saveCities } from "./citiesStorage.ts";
import { saveSettings } from "./settingsStorage.ts";

/**
 * Migración única del estado viejo en un archivo (`data.json`) al esquema
 * actual de dos archivos (cities.json + settings.json). Solo se ejecuta si el
 * archivo nuevo no existe; el viejo se elimina solo después de escribir
 * los dos archivos nuevos con éxito.
 */
export async function migrateLegacyData(): Promise<void> {
  if (await Bun.file(CITIES_FILE).exists()) return;

  const legacy = Bun.file(LEGACY_DATA_FILE);
  if (!(await legacy.exists())) return;

  let raw: unknown;
  try {
    raw = await legacy.json();
  } catch {
    console.warn(red(`  Advertencia: ${LEGACY_DATA_FILE} es inválido. Se usará un estado vacío.`));
    return;
  }

  const data = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const cities = Array.isArray(data.cities) ? data.cities.filter(isCity) : [];
  const defaultCity = isCity(data.defaultCity) ? data.defaultCity : null;
  const unit: Unit = data.unit === "F" ? "F" : "C";

  await saveCities(cities);
  await saveSettings({ defaultCity, unit });
  await rm(LEGACY_DATA_FILE);
  console.log(green(`  Migración completada: ${LEGACY_DATA_FILE} → ${CITIES_FILE} + ${SETTINGS_FILE}.`));
}
