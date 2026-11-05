import { afterEach, describe, expect, test } from "bun:test";
import { geocodeCity } from "../../src/api/geocoding.ts";

// fetch real capturado antes de cualquier test (nunca se usa: cada test lo
// reemplaza antes de llamar a geocodeCity). afterEach des-hace el reemplazo.
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

let calledUrl = "";

/** Instala un fetch de prueba que responde `body` (cuerpo crudo = JSON inválido). */
function respond(body: unknown | string, status = 200): void {
  globalThis.fetch = (async (input?: unknown) => {
    calledUrl = String(input);
    return typeof body === "string" ? new Response(body, { status }) : new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

/** Instala un fetch que suelta un error de red. */
function failWithNetwork(): void {
  globalThis.fetch = (async () => {
    throw new Error("se cayó la Internet simulada");
  }) as unknown as typeof fetch;
}

describe("geocodeCity", () => {
  test("mapea la primera coincidencia a una City", async () => {
    respond({
      results: [
        { name: "Madrid", latitude: 40.4168, longitude: -3.7038 },
        { name: "Madrid Sur", latitude: 39, longitude: -3 },
      ],
    });

    const city = await geocodeCity("Madrid");
    expect(city).toEqual({ name: "Madrid", latitude: 40.4168, longitude: -3.7038 });
  });

  test("llama al endpoint correcto con los parámetros esperados", async () => {
    respond({ results: [] });
    await geocodeCity("Madrid");

    expect(calledUrl.startsWith("https://geocoding-api.open-meteo.com/v1/search?")).toBe(true);
    const params = new URL(calledUrl).searchParams;
    expect(params.get("name")).toBe("Madrid");
    expect(params.get("count")).toBe("1"); // solo la primera coincidencia
    expect(params.get("language")).toBe("es"); // la UI es en español
    expect(params.get("format")).toBe("json");
  });

  test("sin resultados devuelve null", async () => {
    respond({});
    expect(await geocodeCity("CiudadQuijotesca")).toBe(null);
  });

  test("results vacío devuelve null", async () => {
    respond({ results: [] });
    expect(await geocodeCity("Narnia")).toBe(null);
  });

  test("con respuesta HTTP inválida (500) devuelve null", async () => {
    respond({ error: true }, 500);
    expect(await geocodeCity("Madrid")).toBe(null);
  });

  test("con JSON inválido en el cuerpo devuelve null", async () => {
    respond("{casi json");
    expect(await geocodeCity("Madrid")).toBe(null);
  });

  test("con error de red devuelve null", async () => {
    failWithNetwork();
    expect(await geocodeCity("Madrid")).toBe(null);
  });
});
