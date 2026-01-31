# AGENTS.md

Guidance for AI coding agents working on this codebase.

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

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── front-panel/        # Front panel simulator page
│   ├── emulator/           # Console/terminal page
│   ├── programming/        # Programming sheet editor
│   ├── reader/             # Card reader with file upload
│   ├── docs/               # About page (renders Markdown)
│   └── (stubs)             # punch/, printer/, tape/, ramac/ (placeholders)
├── components/
│   ├── EmulatorProvider.tsx # Main state provider (registers, console, controls)
│   ├── EmulatorConsole.tsx  # Console input/output component
│   ├── CardDeckProvider.tsx # Card deck state management
│   ├── PunchedCard.tsx      # Punched card visualization
│   ├── FrontPanel/          # Front panel components (knobs, lights, displays)
│   │   ├── FrontPanel.tsx   # Layout and composition
│   │   ├── DecimalKnob.tsx  # Digit selector knob (0-9)
│   │   ├── LabeledKnob.tsx  # Multi-position labeled knob
│   │   ├── BiQuinaryDigit.tsx # Bi-quinary indicator lights
│   │   ├── useFrontPanelControls.ts # Hook bridging emulator state to panel props
│   │   └── ...              # Display, control, config, status sections
│   ├── Header.tsx           # Navigation header
│   └── Providers.tsx        # Root context composition
├── lib/
│   ├── simh/                # WASM wrapper modules
│   │   ├── index.ts         # Main entry point, re-exports all modules
│   │   ├── core.ts          # Module init, commands, output handling
│   │   ├── registers.ts     # Register operations
│   │   ├── memory.ts        # Memory operations & validation
│   │   ├── control.ts       # Execution control (step, start, stop)
│   │   ├── filesystem.ts    # Virtual filesystem
│   │   ├── constants.ts     # Constants (SCPE codes, defaults)
│   │   └── types.ts         # TypeScript interfaces
│   └── format.ts            # Value formatting (10-digit IBM 650 format with sign)
public/
├── i650.js                  # Emscripten-generated JS loader
├── i650.wasm                # Compiled WASM binary
└── i650.data                # Preloaded filesystem (/sw and /tests directories)
simh/                        # Open SIMH git submodule
scripts/
└── build-wasm.sh            # Emscripten build script
```

### Key patterns

- **WASM singleton** in `src/lib/simh/core.ts` loads the Emscripten module once via `init()` and stores it as a module-level variable. All emulator interaction goes through this wrapper.
- **Output capture** uses a two-tier system: during `sendCommand`/`examineState`/`depositState`, output is buffered and returned to the caller. During tick-loop execution (`startRunning`), I/O flows through the `onOutput` callback.
- **Tick loop** uses `requestAnimationFrame` to execute 500 CPU steps per frame, providing smooth 60fps rendering during program execution.
- **State management** uses React context via `EmulatorProvider`. The provider holds register snapshots in local state, syncing them with the WASM module via `examineState`/`depositState` calls.
- **Front panel controls** are connected via `useFrontPanelControls()` hook, which maps between emulator state (register values) and UI state (knob positions, light states).

### C API layer (`simh/simh_api.c`)

The WASM module exposes four `EMSCRIPTEN_KEEPALIVE` functions called via Emscripten `ccall`:

- **`simh_init()`** → `int` — Runs SIMH's `main()` initialization sequence (socket init, filesystem init, timer init, terminal init, `reset_all_p(0)`, breakpoint init) but skips `process_stdin_commands()` via a guard flag in `scp.c`. Returns 0 on success.
- **`simh_cmd(cmd)`** → `int` — Parses and executes one SIMH command string. Mirrors the core of `process_stdin_commands`: `get_glyph_cmd()` → `find_cmd()` → `cmdp->action()`. All output flows through `sim_printf` → Emscripten `Module.print` → captured in JS.
- **`simh_step(n)`** → `int` — Sets `sim_step = n`, calls `sim_instr()`, returns the status code (`SCPE_STEP`, `SCPE_OK`, `SCPE_STOP`, etc.). Minimal version of `run_cmd` without console mode switching.
- **`simh_stop()`** → `void` — Sets `stop_cpu = TRUE`. Since `sim_instr()` checks this flag periodically, the current `simh_step` call returns early.

### Virtual filesystem

Emscripten provides an in-memory filesystem (MEMFS). SIMH scripts (`DO` files) and device attachments (`ATTACH CDR1 deck.crd`) open files via the C standard library, which Emscripten routes through MEMFS.

- **Preloaded files**: The build uses `--preload-file I650/sw@/sw` and `--preload-file I650/tests@/tests` to bundle the `sw/` and `tests/` directories into `i650.data`, mapped to `/sw/` and `/tests/` in the virtual FS. Scripts like `DO run_soap.ini` work because the files exist at these paths.
- **Runtime files**: User-uploaded card decks or custom scripts are written to MEMFS at runtime via `simh/filesystem` module functions (`writeFile`, `readFile`, `mkdir`, `unlink`).
- **Limitation**: Interactive stdin is disabled (`window.prompt = () => null`). Scripts using `set env -P "prompt"` will get EOF and the variable will be unset. The built-in demo scripts only use this as a "press enter to continue" pause, so this is acceptable.

## Code Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig).
- Path alias: `@/*` maps to `src/*`. Use `@/lib/simh`, `@/components/Header`, etc.
- React components use `React.FC<Props>` pattern with explicit prop interfaces.

### File naming
- Components: `PascalCase.tsx` (e.g., `EmulatorConsole.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useFrontPanelControls.ts`)
- Libraries: `camelCase.ts` (e.g., `simh-wasm.ts`, `format.ts`)
- Tests: colocated as `*.test.ts` or `*.test.tsx` next to the source file

### Component conventions
- Client components use `'use client'` directive at the top of the file.
- Pages are thin wrappers that delegate to components and hooks.
- Styles use SCSS modules or inline style objects.
- The project uses IBM Carbon Design System components (`@carbon/react`). Prefer Carbon components over custom HTML where applicable.

## Testing

### Framework
- **Vitest** with `jsdom` environment for component tests.
- Tests colocated next to source files (e.g., `format.test.ts` next to `format.ts`).
- Component tests use `react-dom/client` `createRoot` with `act()` wrappers (not `@testing-library/react`).
- Path alias resolved via `vitest.config.ts`.

### Test patterns
- Component tests mock dependencies (Carbon components, context hooks) via `vi.mock()`.
- The WASM module (`public/i650.js`) can be loaded directly in Node.js for integration tests via `require('./public/i650.js')` with `locateFile: (name) => './public/' + name`.

### Running tests
```bash
npm test                     # Watch mode
npx vitest run               # Single run
npx vitest run src/lib/      # Run tests in a specific directory
npx vitest run --coverage    # With coverage report
```

### Writing new tests
- Place test files next to the source: `src/lib/foo.ts` → `src/lib/foo.test.ts`
- For components, use `createRoot` + `act()` pattern to match existing tests.
- Use `vi.mock()` for external dependencies. Use `vi.fn()` for function spies.
- Run `npx vitest run` to verify all tests pass before committing.

## Linting

ESLint flat config with Next.js core-web-vitals and TypeScript rules. Unsafe TypeScript operations (`no-unsafe-assignment`, etc.) are set to `warn` in production code and `off` in test files.

```bash
npm run lint     # Run ESLint
```

## Important Notes

- **The React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`). It provides automatic memoization. Do not add manual `React.memo`, `useMemo`, or `useCallback` unless there is a measured performance reason — the compiler handles most cases.
- **All pages are statically generated.** There is no server-side API or backend — the emulator runs entirely in the browser via WASM.
- **The WASM build artifacts** (`public/i650.js`, `public/i650.wasm`, `public/i650.data`) are not checked into git. They must be built from the simh submodule using `scripts/build-wasm.sh`.
