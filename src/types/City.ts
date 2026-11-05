export interface City {
  name: string;
  latitude: number;
  longitude: number;
}

/** Guard para validar ciudades que llegan del disco (JSON parseado sin tipos). */
export function isCity(value: unknown): value is City {
  if (typeof value !== "object" || value === null) return false;
  const city = value as Record<string, unknown>;
  return (
    typeof city.name === "string" &&
    city.name.length > 0 &&
    typeof city.latitude === "number" &&
    typeof city.longitude === "number"
  );
}
