import type { City } from "../types/City.ts";
import type { DailyForecast, DailyForecastResponse, ForecastResponse, WeatherReading } from "../types/Weather.ts";

// Paso 2 del flujo: forecast con las coordenadas del geocoding.
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

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

/** Devuelve el pronóstico de 7 días o `null` si falló la red / vinieron datos incompletos. */
export async function get7DayForecast(city: City): Promise<DailyForecast[] | null> {
  const params = new URLSearchParams({
    latitude: `${city.latitude}`,
    longitude: `${city.longitude}`,
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "7",
    timezone: "auto",
  });

  try {
    const response = await fetch(`${FORECAST_URL}?${params}`);
    if (!response.ok) return null;

    const data = (await response.json()) as DailyForecastResponse;
    const daily = data.daily;
    if (!daily) return null;

    const forecasts: DailyForecast[] = [];
    for (const [index, date] of daily.time.entries()) {
      const code = daily.weather_code[index];
      const maxC = daily.temperature_2m_max[index];
      const minC = daily.temperature_2m_min[index];
      if (date === undefined || code === undefined || maxC === undefined || minC === undefined) {
        return null;
      }
      forecasts.push({ date, minC, maxC, code });
    }
    return forecasts.length > 0 ? forecasts : null;
  } catch {
    return null;
  }
}
