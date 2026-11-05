import { gray, green, red } from "../utils/colors.ts";

export function showError(message: string): void {
  console.log(red(`  ${message}`));
}

export function showSuccess(message: string): void {
  console.log(green(`  ${message}`));
}

export function showStatus(message: string): void {
  console.log(gray(`  ${message}`));
}

export function showNoCitiesMessage(): void {
  showError("No hay ciudades registradas. Usa la opción 3 para buscar y agregar una.");
}
