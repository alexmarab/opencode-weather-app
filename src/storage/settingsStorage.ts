import type { Settings } from "../types/Settings.ts";
import { isCity } from "../types/City.ts";
import { red } from "../utils/colors.ts";
import { SETTINGS_FILE } from "../utils/constants.ts";

export const DEFAULT_SETTINGS: Settings = {
  defaultCity: null,
  unit: "C",
};

/** Devuelve las preferencias guardadas o los defaults si el archivo no existe / es inválido. */
export async function loadSettings(): Promise<Settings> {
  const file = Bun.file(SETTINGS_FILE);
  if (!(await file.exists())) return structuredClone(DEFAULT_SETTINGS);

  try {
    return normalizeSettings(await file.json());
  } catch {
    console.warn(red(`  Advertencia: ${SETTINGS_FILE} es inválido. Se usarán los valores por defecto.`));
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await Bun.write(SETTINGS_FILE, `${JSON.stringify(settings, null, 2)}\n`);
}

function normalizeSettings(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null) return structuredClone(DEFAULT_SETTINGS);

  const data = raw as Record<string, unknown>;
  return {
    defaultCity: isCity(data.defaultCity) ? data.defaultCity : null,
    unit: data.unit === "F" ? "F" : "C",
  };
}
