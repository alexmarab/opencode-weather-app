export interface WeatherReading {
  temperatureC: number;
  code: number;
}

export interface DailyForecast {
  /** Fecha ISO del día, p. ej. "2026-11-05". */
  date: string;
  minC: number;
  maxC: number;
  code: number;
}

// Respuestas de OpenMeteo (solo los campos que usamos).
export interface GeocodingResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface ForecastResponse {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
}

export interface DailyForecastResponse {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}
