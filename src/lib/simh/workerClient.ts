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

type AnyMessage = ResponseMessage | OutputMessage | RunStateMessage;

import { debugLog } from './debug';

let worker: Worker | null = null;
let requestId = 1;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (err: Error) => void }>();
let outputCallback: ((text: string) => void) | null = null;
let runStateCallback: ((running: boolean) => void) | null = null;
let running = false;
let initPromise: Promise<void> | null = null;
let initModuleName: string | null = null;
let echoEnabled = false;

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
    const message = event instanceof ErrorEvent ? event.message : 'Worker error';
    const error = new Error(message);
    for (const { reject } of pending.values()) {
      reject(error);
    }
    pending.clear();
  };
  worker.onmessageerror = () => {
    const error = new Error('Worker message error');
    for (const { reject } of pending.values()) {
      reject(error);
    }
    pending.clear();
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
    await call('setEcho', echoEnabled);
    debugLog('worker init done', { moduleName, echoEnabled });
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

export async function getYieldSteps(): Promise<number> {
  await ensureInit();
  return call('getYieldSteps');
}

export async function setYieldSteps(steps: number): Promise<void> {
  await ensureInit();
  await call('setYieldSteps', steps);
}

export function isEchoEnabled(): boolean {
  return echoEnabled;
}

export function setEchoEnabled(enabled: boolean): void {
  echoEnabled = enabled;
  debugLog('worker echo set', { enabled });
  if (worker) {
    void call('setEcho', enabled);
  }
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
