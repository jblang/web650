type RequestMessage = {
  id: number;
  method: string;
  args?: unknown[];
};

type ResponseMessage = {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
};

type OutputMessage = { type: 'output'; text: string };
type RunStateMessage = { type: 'runstate'; running: boolean };
type StateStreamMessage = {
  type: 'state';
  sample: {
    pr: string;
    ar: string;
    ic: string;
    accLo: string;
    accUp: string;
    dist: string;
    ov: number;
    halfCycle: number;
    op: number;
    opIo: number;
    opInquiry: number;
    opRamac: number;
    opTape: number;
    opAccumulator: number;
    stopReason: number;
    chkProgramRegister: number;
    chkControlUnit: number;
    chkStorageSelection: number;
    chkStorageUnit: number;
    chkDistributor: number;
    chkClocking: number;
    chkAccumulator: number;
    chkErrorSense: number;
  };
};

type AnyMessage = ResponseMessage | OutputMessage | RunStateMessage | StateStreamMessage;

import { debugLog } from './debug';
import type { FilesystemEntry } from './filesystem';
import { parseCpuOptions, parseCpuSettings, parseShowConfig, type SimulatorConfiguration } from './config';

let worker: Worker | null = null;
let requestId = 1;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (err: Error) => void }>();
let outputCallback: ((text: string) => void) | null = null;
let runStateCallback: ((running: boolean) => void) | null = null;
let stateStreamCallback: ((sample: StateStreamMessage['sample']) => void) | null = null;
let running = false;
let initPromise: Promise<void> | null = null;
let initModuleName: string | null = null;

function disposeWorker(): void {
  if (!worker) return;
  worker.terminate();
  worker = null;
  running = false;
}

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./simh.worker.ts', import.meta.url), { type: 'classic' });
  worker.onmessage = (event: MessageEvent<AnyMessage>) => {
    const data = event.data;
    if ('type' in data) {
      if (data.type === 'output') {
        outputCallback?.(data.text);
        return;
      }
      if (data.type === 'runstate') {
        if (running !== data.running) {
          running = data.running;
          runStateCallback?.(data.running);
        }
        return;
      }
      if (data.type === 'state') {
        stateStreamCallback?.(data.sample);
        return;
      }
    }

    const response = data as ResponseMessage;
    const pendingRequest = pending.get(response.id);
    if (!pendingRequest) return;
    pending.delete(response.id);
    if (response.ok) {
      pendingRequest.resolve(response.result);
    } else {
      pendingRequest.reject(new Error(response.error ?? 'Unknown worker error'));
    }
  };
  worker.onerror = (event) => {
    if (event instanceof ErrorEvent) {
      event.preventDefault();
    }
    const message = event instanceof ErrorEvent ? event.message : 'Worker error';
    const error = new Error(message);
    for (const { reject } of pending.values()) {
      reject(error);
    }
    pending.clear();
    initPromise = null;
    disposeWorker();
  };
  worker.onmessageerror = () => {
    const error = new Error('Worker message error');
    for (const { reject } of pending.values()) {
      reject(error);
    }
    pending.clear();
    initPromise = null;
    disposeWorker();
  };
  return worker;
}

function call<T = unknown>(method: string, ...args: unknown[]): Promise<T> {
  const id = requestId++;
  const payload: RequestMessage = { id, method, args };
  const activeWorker = ensureWorker();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    activeWorker.postMessage(payload);
  });
}

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    throw new Error('Worker client not initialized. Call init(moduleName) first.');
  }
  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

function inferBasePathFromScripts(): string {
  if (typeof document === 'undefined') return '';
  const script = document.querySelector<HTMLScriptElement>('script[src*="/_next/"]');
  if (!script?.src) return '';
  try {
    const url = new URL(script.src);
    const marker = '/_next/';
    const index = url.pathname.indexOf(marker);
    if (index <= 0) return '';
    const prefix = url.pathname.slice(0, index);
    return prefix === '/' ? '' : prefix;
  } catch {
    return '';
  }
}

export async function init(moduleName: string): Promise<void> {
  initModuleName = moduleName;
  const envBasePath = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '') : '';
  const normalizedEnvBasePath = envBasePath && envBasePath !== '/' ? envBasePath.replace(/\/$/, '') : '';
  const scriptBasePath = inferBasePathFromScripts();
  const inferredBasePath = normalizedEnvBasePath || scriptBasePath;
  const baseUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${inferredBasePath}` : '';
  debugLog('worker init start', { moduleName, baseUrl });
  initPromise = call('init', moduleName, baseUrl);
  try {
    await initPromise;
    debugLog('worker init done', { moduleName });
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

export async function restart(moduleName?: string): Promise<void> {
  await ensureInit();
  const targetModule = moduleName ?? initModuleName;
  if (!targetModule) {
    throw new Error('Worker client not initialized. Call init(moduleName) first.');
  }
  await call('restart', targetModule);
}

export async function sendCommand(
  command: string,
  options?: { streamOutput?: boolean; echo?: boolean }
): Promise<string> {
  await ensureInit();
  return call<string>('sendCommand', command, options);
}

export async function go(): Promise<string> {
  return sendCommand('GO', { streamOutput: true });
}

export async function stepInstruction(): Promise<string> {
  return sendCommand('STEP', { streamOutput: true });
}

export async function runScript(path: string): Promise<string> {
  const trimmed = path.trim();
  if (!trimmed) {
    throw new TypeError('Script path must be non-empty');
  }
  const escapedPath = trimmed.includes(' ') ? `"${trimmed.replaceAll('"', '\\"')}"` : trimmed;
  return sendCommand(`DO ${escapedPath}`, { streamOutput: true });
}

export async function setCpuType(cpuType: string): Promise<string> {
  const trimmed = cpuType.trim().toUpperCase();
  if (!trimmed) {
    throw new TypeError('CPU type must be non-empty');
  }
  return sendCommand(`SET CPU ${trimmed}`, { echo: false });
}

export async function setCpuOption(option: string): Promise<string> {
  const trimmed = option.trim().toUpperCase();
  if (!trimmed) {
    throw new TypeError('CPU option must be non-empty');
  }
  return sendCommand(`SET CPU ${trimmed}`, { echo: false });
}

export async function setUnitAttachment(unit: string, path: string): Promise<string> {
  const normalizedUnit = unit.trim().toUpperCase();
  if (!normalizedUnit) {
    throw new TypeError('Unit name must be non-empty');
  }

  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return sendCommand(`DETACH ${normalizedUnit}`, { echo: false });
  }

  const escapedPath = trimmedPath.includes(' ') ? `"${trimmedPath.replaceAll('"', '\\"')}"` : trimmedPath;
  return sendCommand(`ATTACH ${normalizedUnit} ${escapedPath}`, { echo: false });
}

export async function setUnitFormat(unit: string, format: string): Promise<string> {
  const normalizedUnit = unit.trim().toUpperCase();
  if (!normalizedUnit) {
    throw new TypeError('Unit name must be non-empty');
  }
  const normalizedFormat = format.trim().toUpperCase();
  if (!normalizedFormat) {
    throw new TypeError('Format must be non-empty');
  }
  return sendCommand(`SET ${normalizedUnit} FORMAT=${normalizedFormat}`, { echo: false });
}

export async function setUnitWiring(unit: string, wiring: string): Promise<string> {
  const normalizedUnit = unit.trim().toUpperCase();
  if (!normalizedUnit) {
    throw new TypeError('Unit name must be non-empty');
  }
  const normalizedWiring = wiring.trim().toUpperCase();
  if (!normalizedWiring) {
    throw new TypeError('Wiring must be non-empty');
  }
  return sendCommand(`SET ${normalizedUnit} WIRING=${normalizedWiring}`, { echo: false });
}

export async function setUnitOption(
  unit: string,
  option: string,
  value?: string | number
): Promise<string> {
  const normalizedUnit = unit.trim().toUpperCase();
  if (!normalizedUnit) {
    throw new TypeError('Unit name must be non-empty');
  }
  const normalizedOption = option.trim().toUpperCase();
  if (!normalizedOption) {
    throw new TypeError('Unit option must be non-empty');
  }
  if (value === undefined) {
    return sendCommand(`SET ${normalizedUnit} ${normalizedOption}`, { echo: false });
  }
  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    throw new TypeError('Unit option value must be non-empty');
  }
  return sendCommand(`SET ${normalizedUnit} ${normalizedOption}=${normalizedValue}`, { echo: false });
}

export async function getCpuDebugStatus(): Promise<string> {
  return sendCommand('SHOW CPU DEBUG', { echo: false });
}

export async function getSimulatorConfiguration(): Promise<SimulatorConfiguration> {
  const [configOutput, cpuHelpOutput, cpuShowOutput] = await Promise.all([
    sendCommand('SHOW CONFIG', { echo: false }),
    sendCommand('SET CPU ?', { echo: false }).catch(() => ''),
    sendCommand('SHOW CPU', { echo: false }).catch(() => ''),
  ]);

  const parsed = parseShowConfig(configOutput);
  const parsedCpuOptions = parseCpuOptions(cpuHelpOutput);
  const parsedCpuSettings = parseCpuSettings(cpuShowOutput);
  const cpuOptions = Array.from(new Set([parsed.cpu, ...parsedCpuOptions].filter(Boolean)));

  return {
    cpu: parsed.cpu || cpuOptions[0] || '1K',
    cpuOptions: cpuOptions.length > 0 ? cpuOptions : ['1K'],
    cpuSettings: parsedCpuSettings,
    units: parsed.units,
  };
}

export async function examine(
  ref: string,
  options?: { echo?: boolean }
): Promise<Record<string, string>> {
  await ensureInit();
  return call('examine', ref, options);
}

export async function deposit(
  ref: string,
  value: string,
  options?: { echo?: boolean }
): Promise<void> {
  await ensureInit();
  await call('deposit', ref, value, options);
}

export async function readFile(path: string): Promise<string> {
  await ensureInit();
  return call<string>('readFile', path);
}

export async function writeFile(path: string, data: string | Uint8Array): Promise<void> {
  await ensureInit();
  await call('writeFile', path, data);
}

export async function mkdir(path: string): Promise<void> {
  await ensureInit();
  await call('mkdir', path);
}

export async function unlink(path: string): Promise<void> {
  await ensureInit();
  await call('unlink', path);
}

export async function listDirectory(path: string): Promise<FilesystemEntry[]> {
  await ensureInit();
  return call<FilesystemEntry[]>('listDirectory', path);
}

export async function getYieldSteps(): Promise<number> {
  await ensureInit();
  return call('getYieldSteps');
}

export async function setYieldSteps(steps: number): Promise<void> {
  await ensureInit();
  await call('setYieldSteps', steps);
}

export async function getYieldEnabled(): Promise<boolean> {
  await ensureInit();
  return call('getYieldEnabled');
}

export async function setYieldEnabled(enabled: boolean): Promise<void> {
  await ensureInit();
  await call('setYieldEnabled', enabled);
}

export async function enableStateStream(enabled: boolean): Promise<void> {
  await ensureInit();
  await call('stateStreamEnable', enabled);
}

export async function setStateStreamStride(stride: number): Promise<void> {
  await ensureInit();
  await call('stateStreamSetStride', stride);
}

export async function clearStateStream(): Promise<void> {
  await ensureInit();
  await call('stateStreamClear');
}

export async function readStateStream(maxSamples: number): Promise<Array<{
  pr: string;
  ar: string;
  ic: string;
  accLo: string;
  accUp: string;
  dist: string;
  ov: number;
  halfCycle: number;
  op: number;
  opIo: number;
  opInquiry: number;
  opRamac: number;
  opTape: number;
  opAccumulator: number;
  stopReason: number;
  chkProgramRegister: number;
  chkControlUnit: number;
  chkStorageSelection: number;
  chkStorageUnit: number;
  chkDistributor: number;
  chkClocking: number;
  chkAccumulator: number;
  chkErrorSense: number;
}>> {
  await ensureInit();
  return call('stateStreamRead', maxSamples);
}

export async function stop(): Promise<void> {
  await ensureInit();
  await call('stop');
}

export function isRunning(): boolean {
  return running;
}

export async function onOutput(cb: ((text: string) => void) | null): Promise<void> {
  outputCallback = cb;
  await call('setOutput', Boolean(cb));
}

export function onRunState(cb: ((running: boolean) => void) | null): void {
  runStateCallback = cb;
}

export function onStateStream(cb: ((sample: StateStreamMessage['sample']) => void) | null): void {
  stateStreamCallback = cb;
}
