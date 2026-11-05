# AGENTS.md

## Project

Weather CLI app built with Bun + TypeScript, in Spanish (menu, prompts, output). Entry point: `index.ts`. Goal of the exercise is to ship a binary at the end (`bun build --compile`). No tests, lint, or CI exist yet.

## Commands

```bash
bun install        # do NOT use npm/pnpm/yarn
bun index.ts       # run the app
bun run typecheck  # runs `bun check`; verified working
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
- Sustained state (cities, default city, °C/°F) is not implemented yet; pick simple local persistence in Bun unless the user says otherwise.
- Puedes usar `@bun-instructions.md` para obtener instrucciones de Bun.
