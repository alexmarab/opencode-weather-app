import type { City } from "../types/City.ts";
import type { GeocodingResponse } from "../types/Weather.ts";

// Paso 1 del flujo: geocoding. Paso 2 (weather.ts) usa las coordenadas.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Devuelve la primera coincidencia del geocoding, o `null` si no se encontró / falló la red. */
export async function geocodeCity(name: string): Promise<City | null> {
  const params = new URLSearchParams({
    name,
    count: "1",
    language: "es",
    format: "json",
  });

  try {
    const response = await fetch(`${GEOCODING_URL}?${params}`);
    if (!response.ok) return null;

    const data = (await response.json()) as GeocodingResponse;
    const match = data.results?.[0];
    if (!match) return null;

    return {
      name: match.name,
      latitude: match.latitude,
      longitude: match.longitude,
    };
  } catch {
    return null;
  }
}
