# AGENTS.md

## Project

Weather CLI app built with Bun + TypeScript, in Spanish (menu, prompts, output). Entry point: `src/index.ts` (root `index.ts` is a 1-line shim re-importing it, kept so `bun index.ts` / `bun build` still work). Fully implemented: state is split across `cities.json` + `settings.json` at the repo root (both gitignored); the old single-file `data.json` is migrated automatically on first run. Code is layered by folder under `src/`: `actions/` (one file per menu action), `presentation/` (menu, input, output messages), `storage/` (data files), `types/`, `api/` (OpenMeteo), `utils/` (colors, formatting, constants). Optionally shipped as a binary via `bun build --compile`. No tests, lint, or CI exist yet.

## Commands

```bash
bun install        # do NOT use npm/pnpm/yarn
bun index.ts       # run the app (interactive; pipe input to script it)
bun run typecheck  # runs `bun check`; verified working
bun build --compile index.ts --outfile weather  # ship the executable binary
```

- Full Bun-specific rules: see `bun-instructions.md` at the repo root — follow it for file edits and API choices.
- `bun` auto-loads `.env`; never add dotenv.

## Bun rules (from bun-instructions.md, the important ones)

- `bun test` / `import { test, expect } from "bun:test"` — no jest/vitest.
- HTTP with built-in `fetch`; no axios/express.
- File I/O: prefer `Bun.file` over `node:fs` read/write.

## TypeScript code style (tsconfig enforces these — typecheck will fail otherwise)

- `verbatimModuleSyntax`: use `import type` for type-only imports.
- `allowImportingTsExtensions`: relative imports include the `.ts` extension (`./foo.ts`).
- `noUncheckedIndexedAccess`: index access returns `T | undefined` — guard before use.
- `strict` is on.

## Weather API (OpenMeteo, no API key needed)

Two-step flow, geocode first then forecast:

```
https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m
```

`language=es` matters — results are used directly in the Spanish UI.

## UX conventions (README.md is the spec)

- Menu format and option numbers are shown in README `### Ejemplo del menú` — match it.
- State is split in two files at the repo root: `cities.json` (city list) and `settings.json` (default city + °C/°F unit). Each is loaded/saved via `src/storage/citiesStorage.ts` and `src/storage/settingsStorage.ts`. One-time migration of legacy `data.json` happens in `src/storage/migrate.ts`.
- Bun readline quirk (hard-earned): `node:readline/promises` answers only the FIRST `rl.question()` when stdin is a pipe; later ones hang forever. The app reads lines manually in `src/presentation/input.ts` over `Bun.stdin.stream()` — do not reintroduce readline.
- Puedes usar `@bun-instructions.md` para obtener instrucciones de Bun.
