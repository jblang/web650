# WASM Integration Plan: Replace REST API with Direct WASM Calls

## Summary

Replace the current architecture (node-pty → REST API → fetch) with a client-side
WASM module that the EmulatorProvider calls directly. A thin C API layer
(`simh_api.c`) exposes init/command/step/stop functions. Program execution uses a
main-thread tick loop (requestAnimationFrame). No Web Worker, no ASYNCIFY needed.

---

## 1. C API Layer — `simh/simh_api.c`

New file. Provides four `EMSCRIPTEN_KEEPALIVE` functions callable from JS via `ccall`.

```c
simh_init()        → int    // Run SIMH main() init sequence, skip command loop. Returns 0 on success.
simh_cmd(cmd)      → int    // Parse & execute one SIMH command string. Returns t_stat.
simh_step(n)       → int    // Execute n CPU instructions. Returns t_stat (SCPE_STEP, SCPE_STOP, etc).
simh_stop()        → void   // Set stop_cpu=TRUE so current/next simh_step returns early.
```

### simh_init

Reuses SIMH's `main()` initialization (scp.c:2735-2914) — socket init, filesystem
init, timer init, terminal init, `reset_all_p(0)`, breakpoint init — but skips
`process_stdin_commands()`. Implementation: add a guard flag checked at scp.c:2974
that causes it to skip the command loop call.

### simh_cmd

Mirrors the core of `process_stdin_commands` for a single command:
`get_glyph_cmd()` → `find_cmd()` → `cmdp->action(cmdp->arg, cptr)`.
All output flows through `sim_printf` → `fprintf(stdout)` → Emscripten `Module.print`
→ captured in JS.

### simh_step

Sets `sim_step = n`, `sim_is_running = TRUE`, `stop_cpu = FALSE`, calls `sim_instr()`,
then sets `sim_is_running = FALSE` and returns the status. This is a minimal version
of `run_cmd` (scp.c:9153) without the console mode switching (already no-op on
Emscripten) or signal handler setup.

### simh_stop

Sets `stop_cpu = TRUE`. Since `sim_instr()` checks this flag periodically, the
current `simh_step` call will return early. From JS this is called before we stop
the tick loop to ensure a clean stop.

---

## 2. Build Changes

### `simh/emscripten-build/Emscripten-HTML.cmake` — modify

Remove ASYNCIFY flags. Add MODULARIZE, EXPORT_NAME, EXPORTED_FUNCTIONS:

```cmake
# REMOVE these:
#   -s ASYNCIFY=1
#   -s ASYNCIFY_STACK_SIZE=131072
#   -s ASYNCIFY_IGNORE_INDIRECT=1
#   -s ASYNCIFY_IMPORTS=[...]

# KEEP:
-s ALLOW_MEMORY_GROWTH=1
-s EXIT_RUNTIME=0
-s NO_EXIT_RUNTIME=1
-s FORCE_FILESYSTEM=1

# ADD:
-s MODULARIZE=1
-s EXPORT_NAME=createI650Module
-s EXPORTED_FUNCTIONS=['_simh_init','_simh_cmd','_simh_step','_simh_stop','_main']
-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','FS']
```

### `simh/sim_console.c` — modify (one-line change)

At line 3886, remove the ASYNCIFY sleep. The `sim_os_poll_kbd` Emscripten path
should just return immediately when no input is available:

```c
#if defined(__EMSCRIPTEN__)
if (status != 1) {
    return SCPE_OK;  // No input available, return immediately
}
#endif
```

This removes the `EM_ASM({ Asyncify.handleSleep(...) })` block (lines 3893-3898).

### `simh/scp.c` — modify (add skip flag)

Add a global flag and guard around the `process_stdin_commands` call at line 2974:

```c
// Near top of file (after includes):
#ifdef __EMSCRIPTEN__
int simh_skip_cmdloop = 0;
#endif

// At line 2974:
#ifdef __EMSCRIPTEN__
if (!simh_skip_cmdloop)
#endif
    process_stdin_commands(SCPE_BARE_STATUS(stat), argv, FALSE);
```

### `simh/I650/CMakeLists.txt` — modify

Add `simh_api.c` to the I650 source list so it gets compiled and linked.

### Build & copy script — `scripts/build-wasm.sh` (new)

```bash
cd simh/emscripten-build
cmake -DCMAKE_TOOLCHAIN_FILE=./Emscripten-HTML.cmake ..
make i650
cp ../BIN/i650.js ../BIN/i650.wasm ../../public/
```

---

## 3. Virtual Filesystem & Script Compatibility

SIMH scripts (`DO` files) and device attachments (`ATTACH CDR1 deck.crd`) open
files via the C standard library. In Emscripten, these go through a virtual
filesystem (MEMFS). Files must be loaded into this FS before they can be referenced
by SIMH commands.

### Preloading the `sw/` directory

The `simh/I650/sw/` directory contains built-in scripts, card decks, tape images,
and disk images (e.g., `run_soap.ini`, `soap/soap_example_1_src.txt`,
`soaplib.tap`, `ramac0.dsk`). These are bundled at build time using Emscripten's
`--preload-file` flag, which creates a `.data` file loaded alongside the WASM:

```cmake
# In the build script or cmake:
--preload-file ${CMAKE_SOURCE_DIR}/I650/sw@/sw
```

This maps the host's `I650/sw/` to `/sw/` inside the virtual FS. Scripts that
do `cd sw` followed by `do run_soap.ini` will work as-is.

### Runtime file management

For user-uploaded card decks or custom scripts, the TypeScript wrapper exposes
Emscripten's FS API:

```typescript
writeFile(path: string, data: string | Uint8Array): void;  // Create/overwrite a file
readFile(path: string): string;                              // Read a file
mkdir(path: string): void;                                   // Create directory
unlink(path: string): void;                                  // Delete a file
```

These call `Module.FS.writeFile()`, `Module.FS.readFile()`, etc. The provider
or a future file-upload UI can use these to populate the FS before running scripts.

### Script execution

`simh_cmd("DO run_soap.ini")` works because:
1. `find_cmd("DO")` returns the `do_cmd` handler from the command table
2. `do_cmd` opens the file via `fopen()` → Emscripten FS → MEMFS
3. It reads commands line by line and executes each one via the same
   `find_cmd` → `action()` path
4. Nested `DO` calls work (up to 20 levels deep)
5. `ATTACH` / `DETACH` commands work the same way (file access through FS)

### Limitation: interactive prompts

Some scripts use `set env -P "prompt" var=cont` which reads a line from stdin.
With no interactive stdin, this will return NULL (EOF) and the variable will be
unset. Scripts that depend on this for flow control may need modification.
This is acceptable for now — the built-in demo scripts use it only as a
"press enter to continue" pause between test runs.

---

## 4. TypeScript Wrapper — `src/lib/simh-wasm.ts` (rewrite)

Replaces both `src/lib/simh.ts` and all REST API routes.

### Module loading

```typescript
let Module: EmscriptenModule | null = null;

async function loadModule(): Promise<EmscriptenModule> {
  // Dynamically load /i650.js which defines createI650Module
  const factory = await import(/* webpackIgnore: true */ '/i650.js');
  Module = await factory.default({
    print: (text: string) => handleOutput(text),
    printErr: (text: string) => handleOutput(text),
  });
  return Module;
}
```

### Output capture

`Module.print` is called synchronously during C execution. We use a capture buffer
that is active only during command calls:

```typescript
let captureBuffer: string[] | null = null;
let onOutputCallback: ((text: string) => void) | null = null;

function handleOutput(text: string) {
  captureBuffer?.push(text);
  onOutputCallback?.(text + '\n');  // Always echo to console
}

function capturedOutput(): string {
  const lines = captureBuffer ?? [];
  captureBuffer = null;
  return lines.join('\n');
}
```

### Public API

```typescript
export interface SimhWasm {
  init(): Promise<void>;
  sendCommand(cmd: string): string;           // Synchronous — runs C command, returns captured output
  examineState(ref: string): Record<string, string>;  // EXAMINE + parse
  depositState(ref: string, value: string): void;     // DEPOSIT
  step(n: number): number;                    // Execute n instructions, return status
  stop(): void;                               // Request stop
  startRunning(onTick: () => void): void;     // Begin tick loop
  stopRunning(): void;                        // End tick loop
  restart(): Promise<void>;                   // Reload WASM module
  onOutput(cb: (text: string) => void): void; // Subscribe to all emulator output
  // Virtual filesystem (for scripts, card decks, tape/disk images)
  writeFile(path: string, data: string | Uint8Array): void;
  readFile(path: string): string;
  mkdir(path: string): void;
  unlink(path: string): void;
}
```

### Tick-based execution

```typescript
let running = false;
const STEPS_PER_TICK = 500;  // Tunable

function startRunning(onTick: () => void) {
  running = true;
  const tick = () => {
    if (!running) return;
    const status = Module.ccall('simh_step', 'number', ['number'], [STEPS_PER_TICK]);
    if (status !== 0 /* SCPE_STEP */) {
      running = false;  // Hit breakpoint, halt, or error
    }
    onTick();  // Let provider refresh registers / UI
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

---

## 5. EmulatorProvider Changes — `src/components/EmulatorProvider.tsx`

### Remove

- `createEmulatorApi()` function and all fetch()/REST calls
- SSE EventSource subscription (`/api/console/stream`)
- `commandQueue` ref (no longer needed — commands are synchronous)

### Replace `createEmulatorApi` internals

Each API call becomes a direct call to the WASM wrapper:

| Current (REST)                        | New (WASM)                                    |
|---------------------------------------|-----------------------------------------------|
| `fetch('/api/command', { body: cmd })` | `simh.sendCommand(cmd)`                       |
| `fetch('/api/state', { method: 'GET' })` | `simh.examineState('STATE')`               |
| `fetch('/api/state/AR', { method: 'PUT', body: { value } })` | `simh.depositState('AR', value)` |
| `fetch('/api/command/go', { method: 'POST' })` | `simh.startRunning(onTick)`          |
| `fetch('/api/escape', { method: 'POST' })` | `simh.stopRunning(); simh.stop()`      |
| `fetch('/api/command/reset', { method: 'POST' })` | `simh.sendCommand('RESET')`       |
| `fetch('/api/restart', { method: 'POST' })` | `simh.restart()`                       |
| SSE EventSource for console output    | `simh.onOutput(text => setOutput(prev => prev + text))` |

### refreshRegisters

Becomes synchronous:
```typescript
const regs = simh.examineState('STATE');
setAddressRegisterState(regs.AR ?? '0000');
// ... etc
```

### Initialization effect

```typescript
useEffect(() => {
  simh.onOutput(text => setOutput(prev => prev + text));
  simh.init().then(() => {
    simh.sendCommand('SET CPU 1K');
    refreshRegisters();
    setInitialized(true);
  });
}, []);
```

---

## 6. Files

| Action  | File                                          |
|---------|-----------------------------------------------|
| **New** | `simh/simh_api.c`                             |
| **New** | `scripts/build-wasm.sh`                       |
| Rewrite | `src/lib/simh-wasm.ts`                        |
| Modify  | `src/components/EmulatorProvider.tsx`          |
| Modify  | `simh/emscripten-build/Emscripten-HTML.cmake` |
| Modify  | `simh/scp.c` (add skip flag, ~3 lines)        |
| Modify  | `simh/sim_console.c` (remove ASYNCIFY sleep)  |
| Modify  | `simh/I650/CMakeLists.txt` (add simh_api.c)   |
| Rebuild | `public/i650.js`, `public/i650.wasm`, `public/i650.data` |

The REST API routes (`src/app/api/`) and `src/lib/simh.ts` become unused but are
left in place for now — they can be removed in a follow-up cleanup.

---

## 7. Verification

1. **Build**: Run `scripts/build-wasm.sh` — produces public/i650.js + i650.wasm
2. **Load**: `npm run dev`, open browser, check console for "SIMH WASM emulator ready"
3. **Registers**: Verify front panel lights show initial register values (all zeros)
4. **Deposit/Examine**: Use console to deposit a value, verify it reads back
5. **Program execution**: Load a simple program (e.g., via card deck), press Program Start,
   verify lights update and program runs to completion
6. **Stop**: Press Program Stop during execution, verify emulator halts and registers freeze
7. **Reset**: Program Reset and Computer Reset buttons work as before
8. **Scripts**: Run `simh.sendCommand('CD sw')` then `simh.sendCommand('DO run_soap.ini soap/soap_example_1_src.txt 1000')` — verify script executes and output appears in console
