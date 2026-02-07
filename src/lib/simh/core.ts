/**
 * Core SIMH WASM module functionality.
 *
 * Handles module initialization, command execution, and output management.
 */

import type { EmscriptenModule } from './types';
import {
  SCPE_OK,
  SCPE_STOP,
  SCPE_EXIT,
  SCPE_EXPECT,
  SCPE_STEP,
  SCPE_BREAK,
  SCPE_KFLAG,
  SCPE_NOMESSAGE,
} from './constants';

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
          importer(resolveModuleAsset(url));
          resolve();
        } catch (err) {
          reject(err);
        }
        return;
      }
      reject(new Error(`Failed to load ${url} (no document or importScripts)`));
      return;
    }

    const resolvedUrl = resolveModuleAsset(url);
    if (document.querySelector(`script[src="${resolvedUrl}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = resolvedUrl;
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

  const rcResult = Module.ccall('simh_init', 'number', [], []) as number | Promise<number>;
  const rc = typeof rcResult === 'number' ? rcResult : await rcResult;
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
const SIMH_OK_STATUSES = new Set([SCPE_OK, SCPE_STOP, SCPE_EXIT, SCPE_EXPECT, SCPE_STEP]);

function bareStatus(rc: number): number {
  return rc & ~SCPE_FLAG_MASK;
}

/**
 * Handles command echo and output capture setup.
 */
function beginCommandExecution(cmd: string, options?: { streamOutput?: boolean; echo?: boolean }): void {
  if (options?.echo && options?.streamOutput) {
    emitOutput(`sim> ${cmd}`);
  }
  beginCapture(Boolean(options?.streamOutput));
}

/**
 * Processes command output and handles echo/status checking.
 */
function finalizeCommandExecution(
  cmd: string,
  output: string,
  rc: number,
  options?: { streamOutput?: boolean; echo?: boolean }
): string {
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
    return output;
  }
  return output;
}

/**
 * Handles exception during command execution.
 */
function handleCommandException(e: unknown): string {
  const output = endCapture();
  const status = (e as { status?: number }).status;
  if (status !== undefined) {
    return output + `\n[SIMH exited with status ${status}]\n`;
  }
  throw e;
}

export function sendCommand(
  cmd: string,
  options?: { streamOutput?: boolean; echo?: boolean }
): string {
  const emModule = getModule();
  beginCommandExecution(cmd, options);
  let rc = SCPE_OK;
  try {
    rc = emModule.ccall('simh_cmd', 'number', ['string'], [cmd]) as number;
  } catch (e: unknown) {
    return handleCommandException(e);
  }
  const output = endCapture();
  return finalizeCommandExecution(cmd, output, rc, options);
}

export async function sendCommandAsync(
  cmd: string,
  options?: { streamOutput?: boolean; echo?: boolean }
): Promise<string> {
  const emModule = getModule();
  beginCommandExecution(cmd, options);
  let rc = SCPE_OK;
  try {
    const result = emModule.ccall('simh_cmd', 'number', ['string'], [cmd]) as
      | number
      | Promise<number>;
    rc = typeof result === 'number' ? result : await result;
  } catch (e: unknown) {
    return handleCommandException(e);
  }
  const output = endCapture();
  return finalizeCommandExecution(cmd, output, rc, options);
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

export type StateStreamSample = {
  pr: string;
  ar: string;
  ic: string;
  accLo: string;
  accUp: string;
  dist: string;
  ov: number;
};

const STATE_STREAM_OFFSETS = {
  pr: 0,
  ar: 12,
  ic: 17,
  accLo: 22,
  accUp: 34,
  dist: 46,
  ov: 58,
  size: 59,
} as const;

let stateStreamSampleSize: number | null = null;
let stateStreamBufferPtr: number | null = null;

function readCString(bytes: Uint8Array, offset: number, length: number): string {
  let end = offset;
  const max = offset + length;
  while (end < max && bytes[end] !== 0) end += 1;
  return String.fromCharCode(...bytes.subarray(offset, end));
}

function getHeapU8(emModule: EmscriptenModule): Uint8Array | null {
  const heap = emModule.HEAPU8 as Uint8Array | undefined;
  if (heap) return heap;
  const globalModule = (globalThis as { Module?: { HEAPU8?: Uint8Array } }).Module;
  return globalModule?.HEAPU8 ?? null;
}

function ensureStateStreamBuffer(emModule: EmscriptenModule): number {
  if (stateStreamSampleSize === null) {
    stateStreamSampleSize = emModule.ccall('simh_state_stream_sample_size', 'number', [], []) as number;
  }
  const sampleSize = stateStreamSampleSize ?? STATE_STREAM_OFFSETS.size;
  if (sampleSize !== STATE_STREAM_OFFSETS.size) {
    throw new Error(`State stream sample size mismatch (expected ${STATE_STREAM_OFFSETS.size}, got ${sampleSize})`);
  }
  if (!stateStreamBufferPtr) {
    stateStreamBufferPtr = emModule.ccall('simh_state_stream_buffer_ptr', 'number', [], []) as number;
  }
  return stateStreamBufferPtr;
}

export function enableStateStream(enabled: boolean): void {
  const emModule = getModule();
  emModule.ccall('simh_state_stream_enable', 'void', ['number'], [enabled ? 1 : 0]);
}

export function setStateStreamStride(stride: number): void {
  const emModule = getModule();
  emModule.ccall('simh_state_stream_set_stride', 'void', ['number'], [stride]);
}

export function clearStateStream(): void {
  const emModule = getModule();
  emModule.ccall('simh_state_stream_clear', 'void', [], []);
}

export function readStateStream(maxSamples = 64): StateStreamSample[] {
  const emModule = getModule();
  const heap = getHeapU8(emModule);
  if (!heap) {
    return [];
  }
  const bufferPtr = ensureStateStreamBuffer(emModule);
  const count = emModule.ccall(
    'simh_state_stream_read_to_buffer',
    'number',
    ['number'],
    [maxSamples]
  ) as number;
  if (!count) return [];

  const sampleSize = stateStreamSampleSize ?? STATE_STREAM_OFFSETS.size;
  const bytes = new Uint8Array(heap.buffer, bufferPtr, count * sampleSize);
  const samples: StateStreamSample[] = [];
  for (let i = 0; i < count; i += 1) {
    const base = i * sampleSize;
    samples.push({
      pr: readCString(bytes, base + STATE_STREAM_OFFSETS.pr, 12),
      ar: readCString(bytes, base + STATE_STREAM_OFFSETS.ar, 5),
      ic: readCString(bytes, base + STATE_STREAM_OFFSETS.ic, 5),
      accLo: readCString(bytes, base + STATE_STREAM_OFFSETS.accLo, 12),
      accUp: readCString(bytes, base + STATE_STREAM_OFFSETS.accUp, 12),
      dist: readCString(bytes, base + STATE_STREAM_OFFSETS.dist, 12),
      ov: bytes[base + STATE_STREAM_OFFSETS.ov] ?? 0,
    });
  }
  return samples;
}

export function readStateStreamLastSample(): StateStreamSample | null {
  const emModule = getModule();
  const json = emModule.ccall('simh_state_stream_read_last_json', 'string', [], []) as string;
  if (!json) return null;
  try {
    return JSON.parse(json) as StateStreamSample;
  } catch {
    return null;
  }
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
