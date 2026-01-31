/**
 * WASM wrapper for the SIMH I650 emulator.
 *
 * Loads the Emscripten-compiled i650.js/i650.wasm and provides a synchronous
 * API for executing commands, stepping the CPU, and managing the virtual
 * filesystem.
 *
 * Output handling:
 *   - During sendCommand/examineState/depositState, output is captured into a
 *     buffer and returned to the caller. It does NOT flow through onOutput.
 *   - During tick-loop execution (startRunning), any I/O output from the
 *     emulated hardware flows through the onOutput callback.
 */

// Emscripten's default TTY driver calls window.prompt() when C code reads
// from stdin.  We never want interactive stdin, so kill it at module-import
// time before any script loads.
if (typeof window !== 'undefined') {
  window.prompt = () => null;
}

/* ── SIMH status codes (from sim_defs.h) ──────────────────────── */

const SCPE_OK = 0;
const SCPE_STEP = 36;

/* ── Emscripten module types ──────────────────────────────────── */

interface EmscriptenModule {
  ccall: (
    name: string,
    returnType: string,
    argTypes: string[],
    args: unknown[],
  ) => unknown;
  FS: {
    writeFile(path: string, data: string | Uint8Array): void;
    readFile(path: string, opts?: { encoding?: string }): string | Uint8Array;
    mkdir(path: string): void;
    unlink(path: string): void;
    stat(path: string): { mode: number };
  };
}

declare global {
  interface Window {
    createI650Module: (
      config: Record<string, unknown>,
    ) => Promise<EmscriptenModule>;
  }
}

/* ── Module singleton ─────────────────────────────────────────── */

let Module: EmscriptenModule | null = null;

/* ── Output handling ──────────────────────────────────────────── */

let captureBuffer: string[] | null = null;
let outputCallback: ((text: string) => void) | null = null;

/**
 * Central output handler wired to Module.print / Module.printErr.
 *
 * When a capture is active (inside sendCommand), lines are buffered and the
 * output callback is suppressed.  Otherwise lines flow to the callback
 * (used during tick-loop execution for device I/O).
 */
function handleOutput(text: string) {
  if (captureBuffer !== null) {
    captureBuffer.push(text);
  } else {
    outputCallback?.(text + '\n');
  }
}

function beginCapture(): void {
  captureBuffer = [];
}

function endCapture(): string {
  const lines = captureBuffer ?? [];
  captureBuffer = null;
  return lines.join('\n');
}

/* ── Tick-loop state ──────────────────────────────────────────── */

let running = false;
let animFrameId: number | null = null;

const STEPS_PER_TICK = 500;

/* ── Helpers ──────────────────────────────────────────────────── */

/** Inject a <script> tag and wait for it to load. */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}

/**
 * Parse SIMH EXAMINE output into key-value pairs.
 *
 * Handles formats like:
 *   AR:     00000
 *   PR:     0000000000+
 *   0000:   0000000000+
 */
function parseKeyValues(text: string): Record<string, string> {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: Record<string, string> = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9]+)\s*[:/]\s+(.*)$/i);
    if (!match) continue;
    const key = match[1].toUpperCase();
    let val = match[2].trim();
    // AR is stored as a 16-bit int (5 digits); physical register is 4 digits.
    if (/^\d{5}$/.test(val)) {
      val = val.slice(-4);
    }
    result[key] = val;
  }
  return result;
}

/* ── Public API ───────────────────────────────────────────────── */

/** Initialize the WASM module and SIMH emulator. */
export async function init(): Promise<void> {
  if (Module) return;

  await loadScript('/i650.js');

  if (!window.createI650Module) {
    throw new Error('createI650Module not found — i650.js failed to load');
  }

  Module = await window.createI650Module({
    noInitialRun: true,
    print: (text: string) => handleOutput(text),
    printErr: (text: string) => handleOutput(text),
    stdin: () => null,
  });

  const rc = Module.ccall('simh_init', 'number', [], []) as number;
  if (rc !== 0) {
    throw new Error(`simh_init failed with code ${rc}`);
  }

  // Verify preloaded filesystem is available
  try {
    const swStat = Module.FS.stat('/sw');
    console.log('[simh-wasm] /sw directory loaded:', swStat.mode);
  } catch {
    console.warn('[simh-wasm] /sw directory not found — preloaded filesystem may not have loaded');
  }

  try {
    const testsStat = Module.FS.stat('/tests');
    console.log('[simh-wasm] /tests directory loaded:', testsStat.mode);
  } catch {
    console.warn('[simh-wasm] /tests directory not found — preloaded filesystem may not have loaded');
  }
}

/**
 * Execute a single SIMH command.
 *
 * Output is captured and returned as a string.  It does NOT flow through the
 * onOutput callback — the caller decides whether to echo it.
 */
export function sendCommand(cmd: string): string {
  if (!Module) throw new Error('WASM module not initialized');
  beginCapture();
  try {
    Module.ccall('simh_cmd', 'number', ['string'], [cmd]);
  } catch (e: unknown) {
    // Emscripten throws ExitStatus when C code calls exit().
    // Capture any output produced before the exit and return it.
    const output = endCapture();
    const status = (e as { status?: number }).status;
    if (status !== undefined) {
      return output + `\n[SIMH exited with status ${status}]\n`;
    }
    throw e;
  }
  return endCapture();
}

/** EXAMINE a register or address.  Returns parsed key-value pairs. */
export function examineState(ref: string): Record<string, string> {
  return parseKeyValues(sendCommand(`EXAMINE ${ref.trim().toUpperCase()}`));
}

/** DEPOSIT a value into a register or address. */
export function depositState(ref: string, value: string): void {
  sendCommand(`DEPOSIT ${ref.trim().toUpperCase()} ${value}`);
}

/** Execute n CPU instructions.  Returns the SIMH status code. */
export function step(n: number): number {
  if (!Module) throw new Error('WASM module not initialized');
  return Module.ccall('simh_step', 'number', ['number'], [n]) as number;
}

/** Request the CPU to stop (sets stop_cpu flag). */
export function stop(): void {
  if (!Module) return;
  Module.ccall('simh_stop', 'void', [], []);
}

/** True if the tick loop is currently active. */
export function isRunning(): boolean {
  return running;
}

/**
 * Begin tick-loop execution via requestAnimationFrame.
 *
 * `onTick` is called after each batch of STEPS_PER_TICK instructions,
 * receiving the SIMH status code.  The loop stops automatically on halt,
 * breakpoint, or error (any status other than SCPE_STEP / SCPE_OK).
 */
export function startRunning(onTick: (status: number) => void): void {
  if (!Module) throw new Error('WASM module not initialized');
  if (running) return;

  running = true;

  const tick = () => {
    if (!running) return;

    const status = Module!.ccall(
      'simh_step',
      'number',
      ['number'],
      [STEPS_PER_TICK],
    ) as number;

    if (status !== SCPE_STEP && status !== SCPE_OK) {
      running = false;
    }

    onTick(status);

    if (running) {
      animFrameId = requestAnimationFrame(tick);
    }
  };

  animFrameId = requestAnimationFrame(tick);
}

/** Stop the tick loop and request CPU stop. */
export function stopRunning(): void {
  running = false;
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  stop();
}

/** Reload the WASM module from scratch (full restart). */
export async function restart(): Promise<void> {
  stopRunning();

  const oldScript = document.querySelector('script[src="/i650.js"]');
  if (oldScript) oldScript.remove();

  delete (window as unknown as Record<string, unknown>).createI650Module;
  Module = null;

  await init();
}

/** Subscribe to emulator output (from tick-loop I/O).  Pass null to unsubscribe. */
export function onOutput(cb: ((text: string) => void) | null): void {
  outputCallback = cb;
}

/* ── Virtual filesystem ───────────────────────────────────────── */

export function writeFile(path: string, data: string | Uint8Array): void {
  if (!Module) throw new Error('WASM module not initialized');
  Module.FS.writeFile(path, data);
}

export function readFile(path: string): string {
  if (!Module) throw new Error('WASM module not initialized');
  return Module.FS.readFile(path, { encoding: 'utf8' }) as string;
}

export function mkdir(path: string): void {
  if (!Module) throw new Error('WASM module not initialized');
  Module.FS.mkdir(path);
}

export function unlink(path: string): void {
  if (!Module) throw new Error('WASM module not initialized');
  Module.FS.unlink(path);
}
