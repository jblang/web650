/**
 * Core SIMH WASM module functionality.
 *
 * Handles module initialization, command execution, and output management.
 */

import type { EmscriptenModule } from './types';
import { SCPE_OK, SCPE_STOP, SCPE_EXIT, SCPE_EXPECT, SCPE_BREAK, SCPE_KFLAG, SCPE_NOMESSAGE } from './constants';

// Emscripten's default TTY driver calls prompt() when C code reads from stdin.
// We never want interactive stdin, so kill it at module-import time before any script loads.
const globalPromptTarget = typeof globalThis !== 'undefined' ? (globalThis as { prompt?: () => unknown }) : null;
if (globalPromptTarget && typeof globalPromptTarget.prompt === 'function') {
  globalPromptTarget.prompt = () => null;
}

/* ── Module singleton ─────────────────────────────────────────── */

let Module: EmscriptenModule | null = null;
let assetBaseUrl: string | null = null;

export function getModule(): EmscriptenModule {
  if (!Module) throw new Error('WASM module not initialized');
  return Module;
}

export function setModule(module: EmscriptenModule): void {
  Module = module;
}

export function resetModule(): void {
  Module = null;
}

export function setAssetBase(baseUrl: string | null): void {
  assetBaseUrl = baseUrl;
}

/* ── Output handling ──────────────────────────────────────────── */

let captureBuffer: string[] | null = null;
let captureStream = false;
let outputCallback: ((text: string) => void) | null = null;

/**
 * Central output handler wired to Module.print / Module.printErr.
 *
 * When a capture is active (inside sendCommand), lines are buffered and the
 * output callback is suppressed.  Otherwise lines flow to the callback
 * (used during tick-loop execution for device I/O).
 */
export function handleOutput(text: string) {
  if (captureBuffer !== null) {
    captureBuffer.push(text);
    if (captureStream) {
      outputCallback?.(text + '\n');
    }
  } else {
    outputCallback?.(text + '\n');
  }
}

function emitOutput(text: string): void {
  if (!outputCallback) return;
  const normalized = text.endsWith('\n') ? text : `${text}\n`;
  outputCallback(normalized);
}

function beginCapture(streamOutput: boolean): void {
  captureBuffer = [];
  captureStream = streamOutput;
}

function endCapture(): string {
  const lines = captureBuffer ?? [];
  captureBuffer = null;
  captureStream = false;
  return lines.join('\n');
}

/* ── Helpers ──────────────────────────────────────────────────── */

/** Inject a <script> tag and wait for it to load (or importScripts in worker). */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      const importer = (globalThis as unknown as { importScripts?: (...urls: string[]) => void }).importScripts;
      if (importer) {
        try {
          const loc = (globalThis as unknown as { location?: Location }).location;
          let resolved = url;
          if (loc) {
            if (url.startsWith('/') && loc.origin && loc.origin !== 'null') {
              resolved = `${loc.origin}${url}`;
            } else {
              resolved = new URL(url, loc.href).toString();
            }
          }
          importer(resolveModuleAsset(resolved));
          resolve();
        } catch (err) {
          reject(err);
        }
        return;
      }
      reject(new Error(`Failed to load ${url} (no document or importScripts)`));
      return;
    }

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

function resolveModuleAsset(path: string): string {
  if (assetBaseUrl) {
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
      return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${assetBaseUrl}${normalized}`;
  }
  const loc = (globalThis as unknown as { location?: Location }).location;
  if (!loc) return path;
  if (path.startsWith('/') && loc.origin && loc.origin !== 'null') {
    return `${loc.origin}${path}`;
  }
  try {
    return new URL(path, loc.href).toString();
  } catch {
    return path;
  }
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

  const createModuleFn = (globalThis as unknown as Record<string, unknown>)[`create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`];
  if (typeof createModuleFn !== 'function') {
    throw new Error(`create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module not found — ${scriptPath} failed to load`);
  }

  Module = await (createModuleFn as (config: Record<string, unknown>) => Promise<EmscriptenModule>)({
    noInitialRun: true,
    print: (text: string) => handleOutput(text),
    printErr: (text: string) => handleOutput(text),
    stdin: () => null,
    locateFile: (path: string) => resolveModuleAsset(path),
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
const SCPE_FLAG_MASK = SCPE_BREAK | SCPE_KFLAG | SCPE_NOMESSAGE;
const SIMH_OK_STATUSES = new Set([SCPE_OK, SCPE_STOP, SCPE_EXIT, SCPE_EXPECT]);

function bareStatus(rc: number): number {
  return rc & ~SCPE_FLAG_MASK;
}

function throwSimhError(rc: number, output: string): never {
  const message = output.trim() || `SIMH error (${rc})`;
  const error = new Error(message);
  (error as { code?: number }).code = rc;
  throw error;
}

export function sendCommand(
  cmd: string,
  options?: { streamOutput?: boolean; echo?: boolean }
): string {
  const emModule = getModule();
  if (options?.echo && options?.streamOutput) {
    emitOutput(`sim> ${cmd}`);
  }
  beginCapture(Boolean(options?.streamOutput));
  let rc = SCPE_OK;
  try {
    rc = emModule.ccall('simh_cmd', 'number', ['string'], [cmd]) as number;
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
  const output = endCapture();
  const status = bareStatus(rc);
  if (options?.echo) {
    if (!options?.streamOutput) {
      emitOutput(`sim> ${cmd}`);
    }
    if (!options?.streamOutput && output.trim().length > 0) {
      emitOutput(output);
    }
  }
  if (!SIMH_OK_STATUSES.has(status)) {
    throwSimhError(status, output);
  }
  return output;
}

export async function sendCommandAsync(
  cmd: string,
  options?: { streamOutput?: boolean; echo?: boolean }
): Promise<string> {
  const emModule = getModule();
  if (options?.echo && options?.streamOutput) {
    emitOutput(`sim> ${cmd}`);
  }
  beginCapture(Boolean(options?.streamOutput));
  let rc = SCPE_OK;
  try {
    const result = emModule.ccall('simh_cmd', 'number', ['string'], [cmd]) as
      | number
      | Promise<number>;
    rc = typeof result === 'number' ? result : await result;
  } catch (e: unknown) {
    const output = endCapture();
    const status = (e as { status?: number }).status;
    if (status !== undefined) {
      return output + `\n[SIMH exited with status ${status}]\n`;
    }
    throw e;
  }
  const output = endCapture();
  const status = bareStatus(rc);
  if (options?.echo) {
    if (!options?.streamOutput) {
      emitOutput(`sim> ${cmd}`);
    }
    if (!options?.streamOutput && output.trim().length > 0) {
      emitOutput(output);
    }
  }
  if (!SIMH_OK_STATUSES.has(status)) {
    throwSimhError(status, output);
  }
  return output;
}

/** True if the simulator CPU is currently running. */
export function isCpuRunning(): boolean {
  const emModule = getModule();
  const running = emModule.ccall('simh_is_running', 'number', [], []) as number;
  return running !== 0;
}

/** True if the simulator is executing a command or running CPU. */
export function isEmulatorBusy(): boolean {
  const emModule = getModule();
  const busy = emModule.ccall('simh_is_busy', 'number', [], []) as number;
  return busy !== 0;
}

export function getYieldSteps(): number {
  const emModule = getModule();
  return emModule.ccall('simh_get_yield_steps', 'number', [], []) as number;
}

export function setYieldSteps(steps: number): void {
  const emModule = getModule();
  emModule.ccall('simh_set_yield_steps', 'void', ['number'], [steps]);
}

export function getYieldEnabled(): boolean {
  const emModule = getModule();
  const enabled = emModule.ccall('simh_get_yield_enabled', 'number', [], []) as number;
  return enabled !== 0;
}

export function setYieldEnabled(enabled: boolean): void {
  const emModule = getModule();
  emModule.ccall('simh_set_yield_enabled', 'void', ['number'], [enabled ? 1 : 0]);
}


/** EXAMINE a register or address.  Returns parsed key-value pairs. */
export function examine(ref: string): Record<string, string> {
  return parseKeyValues(sendCommand(`EXAMINE ${ref.trim().toUpperCase()}`));
}

/** DEPOSIT a value into a register or address. */
export function deposit(ref: string, value: string): void {
  sendCommand(`DEPOSIT ${ref.trim().toUpperCase()} ${value}`);
}

export async function examineAsync(
  ref: string,
  options?: { echo?: boolean }
): Promise<Record<string, string>> {
  return parseKeyValues(
    await sendCommandAsync(`EXAMINE ${ref.trim().toUpperCase()}`, { echo: options?.echo })
  );
}

export async function depositAsync(
  ref: string,
  value: string,
  options?: { echo?: boolean }
): Promise<void> {
  await sendCommandAsync(`DEPOSIT ${ref.trim().toUpperCase()} ${value}`, { echo: options?.echo });
}

/** Subscribe to emulator output (from tick-loop I/O).  Pass null to unsubscribe. */
export function onOutput(cb: ((text: string) => void) | null): void {
  outputCallback = cb;
}
