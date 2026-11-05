// Archivos de datos, todos en la raíz del repo.
export const CITIES_FILE = "cities.json";
export const SETTINGS_FILE = "settings.json";
// data.json es el archivo del estado viejo (pre-refactor); `migrate.ts` lo
// particiona a los dos de arriba y lo elimina.
export const LEGACY_DATA_FILE = "data.json";

// Códigos WMO que devuelve OpenMeteo en `current.weather_code`.
const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia fuerte",
  66: "Llovizna helada ligera",
  67: "Lluvia helada fuerte",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada fuerte",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos fuertes",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve fuertes",
  95: "Tormenta eléctrica",
  96: "Tormenta eléctrica con granizo",
  99: "Tormenta fuerte con granizo",
};

export function describeWeather(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Condición desconocida";
}
