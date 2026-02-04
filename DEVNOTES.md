# Developer Notes

Extended background and detailed reference material for the IBM 650 web emulator.

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
│   ├── EmulatorConsole.tsx  # Console input/output component
│   ├── EmulatorStateProvider.tsx   # Emulator state context
│   ├── EmulatorConsoleProvider.tsx # Console context
│   ├── EmulatorActionsProvider.tsx # Action handlers context
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
│   ├── simh/                # WASM wrapper modules (generic SIMH)
│   │   ├── index.ts         # Main entry point, re-exports all modules
│   │   ├── core.ts          # Module init, commands, output handling
│   │   ├── control.ts       # Execution control (step, stop, restart)
│   │   ├── filesystem.ts    # Virtual filesystem
│   │   ├── constants.ts     # Constants (SCPE codes, defaults)
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── debug.ts         # Debug logging helpers
│   │   ├── echo.ts          # Echo settings + persistence
│   │   ├── simh.worker.ts   # Single web worker entrypoint (generic SIMH)
│   │   └── workerClient.ts  # Worker client (generic SIMH)
│   └── simh/i650/           # IBM 650-specific abstraction
│       ├── service.ts       # High-level i650 state + workflows (push model)
│       ├── registers.ts     # Register operations & validation
│       ├── memory.ts        # Memory operations & validation
│       ├── controls.ts      # Switch positions & display logic
│       ├── constants.ts     # IBM 650 constants
│       └── format.ts        # Value formatting (10-digit IBM 650 format with sign)
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
- **Output capture** uses a two-tier system: during `sendCommand`/`examine`/`deposit`, output is buffered and returned to the caller. During long-running execution, output flows through the `onOutput` callback.
- **State management** uses three React contexts (state, console, actions). The providers subscribe to the `i650` service state (push model) and expose it to components.
- **Front panel controls** are connected via `useFrontPanelControls()` hook, which maps between emulator state (register values) and UI state (knob positions, light states).

## C API layer (`simh/simh_api.c`)

The WASM module exposes `EMSCRIPTEN_KEEPALIVE` functions called via Emscripten `ccall`:

- **`simh_init()`** → `int` — Runs SIMH's `main()` initialization sequence (socket init, filesystem init, timer init, terminal init, `reset_all_p(0)`, breakpoint init) but skips `process_stdin_commands()` via a guard flag in `scp.c`. Returns 0 on success.
- **`simh_cmd(cmd)`** → `int` — Parses and executes one SIMH command string. Mirrors the core of `process_stdin_commands`: `get_glyph_cmd()` → `find_cmd()` → `cmdp->action()`. All output flows through `sim_printf` → Emscripten `Module.print` → captured in JS.
- **`simh_step(n)`** → `int` — Sets `sim_step = n`, calls `sim_instr()`, returns the status code (`SCPE_STEP`, `SCPE_OK`, `SCPE_STOP`, etc.). Minimal version of `run_cmd` without console mode switching.
- **`simh_stop()`** → `void` — Sets `stop_cpu = TRUE`. Since `sim_instr()` checks this flag periodically, the current `simh_step` call returns early.
- **`simh_is_running()`** → `int` — Returns 1 if the CPU is currently running.
- **`simh_is_busy()`** → `int` — Returns 1 if a command is active or the CPU is running.
- **`simh_get_yield_steps()`** / **`simh_set_yield_steps(steps)`** — Get/set instruction slice size for yielding.
- **`simh_get_yield_enabled()`** / **`simh_set_yield_enabled(enabled)`** — Get/set yield enablement.

## Virtual filesystem

Emscripten provides an in-memory filesystem (MEMFS). SIMH scripts (`DO` files) and device attachments (`ATTACH CDR1 deck.crd`) open files via the C standard library, which Emscripten routes through MEMFS.

- **Preloaded files**: The build uses `--preload-file I650/sw@/sw` and `--preload-file I650/tests@/tests` to bundle the `sw/` and `tests/` directories into `i650.data`, mapped to `/sw/` and `/tests/` in the virtual FS. Scripts like `DO run_soap.ini` work because the files exist at these paths.
- **Runtime files**: User-uploaded card decks or custom scripts are written to MEMFS at runtime via `simh/filesystem` module functions (`writeFile`, `readFile`, `mkdir`, `unlink`).
- **Limitation**: Interactive stdin is disabled (`window.prompt = () => null`). Scripts using `set env -P "prompt"` will get EOF and the variable will be unset. The built-in demo scripts only use this as a "press enter to continue" pause, so this is acceptable.

## Testing

### Unit tests

Colocated with source files. Component tests use `createRoot` + `act()`.

```bash
npm test
```

### Integration tests

Integration tests live under `src/lib/simh/__tests__` and use a Node WASM loader.

```bash
npx vitest run src/lib/simh/__tests__
```

The SIMH integration tests cover:
- SIMH command execution (EXAMINE, DEPOSIT, RESET, etc.)
- Generic register round-tripping via `EXAMINE STATE` + `DEPOSIT`
- The complete SIMH i650 test suite (`/tests/i650_test.ini`)

To run the full i650 suite only:

```bash
npm test -- i650-test-suite.integration.test.ts
```

### Coverage

```bash
npm test -- --coverage
```

## Rebuilding the SIMH WASM Module

The simulator is compiled to WebAssembly using Emscripten. The SIMH source is included as a git submodule.

1. Install the Emscripten SDK and activate it in your shell.
2. Initialize the submodule and run the build script:

```bash
git submodule update --init
./scripts/build-wasm.sh
```

This produces `i650.js`, `i650.wasm`, and `i650.data` in the `public/` directory.
