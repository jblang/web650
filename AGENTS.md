# AGENTS.md

Guidance for AI coding agents working on this codebase.

For background context and deep dives, see `DEVNOTES.md`.

## Project Summary

Web-based UI for the Open SIMH IBM 650 simulator. The simulator runs entirely in the browser via WebAssembly, compiled from Open SIMH using Emscripten. A Next.js app serves static pages, and a modular TypeScript wrapper (`src/lib/simh/`) provides the FFI layer over the Emscripten module. The frontend renders an interactive front panel simulation with knobs, switches, and indicator lights using IBM Carbon Design System.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint (flat config, strict TypeScript)
npm test             # Run all tests (vitest, watch mode)
npx vitest run       # Run tests once (CI mode)
npx vitest run --coverage  # Tests with coverage report
```

**WASM build (requires Emscripten SDK):**
```bash
git submodule update --init
./scripts/build-wasm.sh
```

Note: the Emscripten CMake toolchain file lives in `simh/cmake/emscripten-wasm.cmake`. The `simh/emscripten-build` directory is build output only and should remain ignored.

## Architecture (Short)

- **Single SIMH worker**: `src/lib/simh/simh.worker.ts` hosts the only worker and exposes generic SIMH methods.
- **Generic SIMH API**: `src/lib/simh/*` mirrors SIMH commands and behavior (no 650-specific validation or register names).
- **IBM 650 API**: `src/lib/simh/i650/*` provides the 650 abstraction, validation, and register naming.
- **React boundary**: UI uses the i650 service (`src/lib/simh/i650/service.ts`) as the source of truth and stays emulator-agnostic.

## SIMH Boundaries

- **Single worker**: `src/lib/simh/simh.worker.ts` hosts the only worker and only exposes generic SIMH methods.
- **Generic SIMH API** (`src/lib/simh/*`): mirrors SIMH commands and behavior. It should not know IBM 650 register names or validate 650-specific formats. Use `sendCommand`, `examine`, and `deposit` to mirror SIMH.
- **IBM 650 API** (`src/lib/simh/i650/*`): provides an emulator-agnostic IBM 650 abstraction implemented on top of SIMH. Validation for 650 words/addresses and knowledge of register names belongs here.
- **Error handling**: SIMH command failures should surface as thrown errors with SIMH’s error text.

## Code Conventions

- **TypeScript**: strict mode; `@/*` maps to `src/*`.
- **Components**: `PascalCase.tsx` and `'use client'` directive where needed.
- **Hooks**: `use*` naming.
- **Testing**: colocate unit tests; integration tests live in `src/lib/simh/__tests__`.
- **Carbon**: Use IBM Carbon Design System components whenever a suitable control exists.

## Testing

```bash
npm test                     # Watch mode
npx vitest run               # Single run
npx vitest run src/lib/      # Run tests in a specific directory
npx vitest run --coverage    # With coverage report
```

## Linting

```bash
npm run lint
```

## Pre-commit Checks

Before committing, always run tests and lint:

```bash
npx vitest run
npm run lint
```

## Important Notes

- **React Compiler enabled** (`reactCompiler: true` in `next.config.ts`). Don’t add manual memoization unless measured.
- **Static site**: all pages are statically generated; no server-side API.
- **WASM artifacts** (`public/i650.js`, `public/i650.wasm`, `public/i650.data`) are checked into git so users can run the UI without rebuilding. Rebuild via `scripts/build-wasm.sh` only when changing SIMH.

## More Context

See `DEVNOTES.md` for the full architecture map, SIMH C API details, virtual filesystem behavior, and deeper testing notes.
