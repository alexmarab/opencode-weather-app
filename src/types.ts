export interface City {
  name: string;
  latitude: number;
  longitude: number;
}

export type Unit = "C" | "F";

export interface State {
  cities: City[];
  defaultCity: City | null;
  unit: Unit;
}
