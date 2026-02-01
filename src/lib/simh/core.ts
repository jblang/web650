/**
 * Core SIMH WASM module functionality.
 *
 * Handles module initialization, command execution, and output management.
 */

import type { EmscriptenModule } from './types';

// Emscripten's default TTY driver calls window.prompt() when C code reads
// from stdin.  We never want interactive stdin, so kill it at module-import
// time before any script loads.
if (typeof window !== 'undefined') {
  window.prompt = () => null;
}

/* ── Module singleton ─────────────────────────────────────────── */

let Module: EmscriptenModule | null = null;

export function getModule(): EmscriptenModule {
  if (!Module) throw new Error('WASM module not initialized');
  return Module;
}

export function resetModule(): void {
  Module = null;
}

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
export function parseKeyValues(text: string): Record<string, string> {
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
    const val = match[2].trim();
    result[key] = val;
  }
  return result;
}

/* ── Public API ───────────────────────────────────────────────── */

/** Initialize the WASM module and SIMH emulator. */
export async function init(moduleName: string): Promise<void> {
  if (Module) return;

  const scriptPath = `/${moduleName}.js`;
  await loadScript(scriptPath);

  const createModuleFn = (window as unknown as Record<string, unknown>)[`create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`];
  if (typeof createModuleFn !== 'function') {
    throw new Error(`create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module not found — ${scriptPath} failed to load`);
  }

  Module = await (createModuleFn as (config: Record<string, unknown>) => Promise<EmscriptenModule>)({
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
    console.log('[simh] /sw directory loaded:', swStat.mode);
  } catch {
    console.warn('[simh] /sw directory not found — preloaded filesystem may not have loaded');
  }

  try {
    const testsStat = Module.FS.stat('/tests');
    console.log('[simh] /tests directory loaded:', testsStat.mode);
  } catch {
    console.warn('[simh] /tests directory not found — preloaded filesystem may not have loaded');
  }
}

/**
 * Execute a single SIMH command.
 *
 * Output is captured and returned as a string.  It does NOT flow through the
 * onOutput callback — the caller decides whether to echo it.
 */
export function sendCommand(cmd: string): string {
  const emModule = getModule();
  beginCapture();
  try {
    emModule.ccall('simh_cmd', 'number', ['string'], [cmd]);
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

/** Subscribe to emulator output (from tick-loop I/O).  Pass null to unsubscribe. */
export function onOutput(cb: ((text: string) => void) | null): void {
  outputCallback = cb;
}
