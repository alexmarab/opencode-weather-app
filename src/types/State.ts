import type { City } from "./City.ts";
import type { Unit } from "./Settings.ts";

export interface State {
  cities: City[];
  defaultCity: City | null;
  unit: Unit;
}
