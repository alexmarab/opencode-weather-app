import type { City } from "./types.ts";

// Paso 1: geocoding. Paso 2: forecast con las coordenadas obtenidas.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

interface GeocodingResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
}

interface ForecastResponse {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
}

export interface WeatherReading {
  temperatureC: number;
  code: number;
}

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

/** Devuelve la temperatura actual (°C) y el código del estado del tiempo. */
export async function getCurrentWeather(city: City): Promise<WeatherReading | null> {
  const params = new URLSearchParams({
    latitude: `${city.latitude}`,
    longitude: `${city.longitude}`,
    current: "temperature_2m,weather_code",
  });

  try {
    const response = await fetch(`${FORECAST_URL}?${params}`);
    if (!response.ok) return null;

    const data = (await response.json()) as ForecastResponse;
    const current = data.current;
    if (!current) return null;

    return {
      temperatureC: current.temperature_2m,
      code: current.weather_code,
    };
  } catch {
    return null;
  }
}
