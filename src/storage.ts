import { red } from "./colors.ts";
import type { City, State } from "./types.ts";

const DATA_FILE = "data.json";

const DEFAULT_STATE: State = {
  cities: [],
  defaultCity: null,
  unit: "C",
};

export async function loadState(): Promise<State> {
  const file = Bun.file(DATA_FILE);
  if (!(await file.exists())) return structuredClone(DEFAULT_STATE);

  try {
    return normalizeState(await file.json());
  } catch {
    console.warn(red(`  Advertencia: ${DATA_FILE} es inválido. Se usará un estado vacío.`));
    return structuredClone(DEFAULT_STATE);
  }
}

export async function saveState(state: State): Promise<void> {
  await Bun.write(DATA_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function normalizeState(raw: unknown): State {
  if (typeof raw !== "object" || raw === null) return structuredClone(DEFAULT_STATE);

  const data = raw as Record<string, unknown>;
  return {
    cities: Array.isArray(data.cities) ? data.cities.filter(isCity) : [],
    defaultCity: isCity(data.defaultCity) ? data.defaultCity : null,
    unit: data.unit === "F" ? "F" : "C",
  };
}

function isCity(value: unknown): value is City {
  if (typeof value !== "object" || value === null) return false;
  const city = value as Record<string, unknown>;
  return (
    typeof city.name === "string" &&
    city.name.length > 0 &&
    typeof city.latitude === "number" &&
    typeof city.longitude === "number"
  );
}
