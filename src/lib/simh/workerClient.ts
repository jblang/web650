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

let worker: Worker | null = null;
let requestId = 1;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (err: Error) => void }>();
let outputCallback: ((text: string) => void) | null = null;
let runStateCallback: ((running: boolean) => void) | null = null;
let running = false;
let initPromise: Promise<void> | null = null;

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
    const err = event instanceof ErrorEvent ? event.error : undefined;
    const message = event instanceof ErrorEvent ? event.message : 'Worker error';
    const error = err instanceof Error ? err : new Error(message);
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
    pending.set(id, { resolve, reject });
    activeWorker.postMessage(payload);
  });
}

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    await init();
    return;
  }
  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

export async function init(): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  initPromise = call('init', baseUrl);
  await initPromise;
}

export async function restart(): Promise<void> {
  await ensureInit();
  await call('restart');
}

export async function sendCommand(
  command: string,
  options?: { streamOutput?: boolean }
): Promise<string> {
  await ensureInit();
  return call<string>('sendCommand', command, options);
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

export async function getRegisterSnapshot(): Promise<{
  addressRegister: string;
  programRegister: string;
  lowerAccumulator: string;
  upperAccumulator: string;
  distributor: string;
  consoleSwitches: string;
  programmedStop: boolean;
  overflowStop: boolean;
  halfCycle: boolean;
}> {
  await ensureInit();
  return call('getRegisterSnapshot');
}

export async function setAddressRegister(value: string): Promise<void> {
  await ensureInit();
  await call('setAddressRegister', value);
}

export async function setProgramRegister(value: string): Promise<void> {
  await ensureInit();
  await call('setProgramRegister', value);
}

export async function setDistributor(value: string): Promise<void> {
  await ensureInit();
  await call('setDistributor', value);
}

export async function setConsoleSwitches(value: string): Promise<void> {
  await ensureInit();
  await call('setConsoleSwitches', value);
}

export async function setProgrammedStop(value: boolean): Promise<void> {
  await ensureInit();
  await call('setProgrammedStop', value);
}

export async function setOverflowStop(value: boolean): Promise<void> {
  await ensureInit();
  await call('setOverflowStop', value);
}

export async function setHalfCycle(value: boolean): Promise<void> {
  await ensureInit();
  await call('setHalfCycle', value);
}

export async function resetAccumulator(): Promise<void> {
  await ensureInit();
  await call('resetAccumulator');
}

export async function reset(): Promise<void> {
  await ensureInit();
  await call('reset');
}

export async function setMemorySize(size: '1K' | '2K' | '4K'): Promise<void> {
  await ensureInit();
  await call('setMemorySize', size);
}

export async function readMemory(address: string): Promise<string> {
  await ensureInit();
  return call('readMemory', address);
}

export async function writeMemory(address: string, value: string): Promise<void> {
  await ensureInit();
  await call('writeMemory', address, value);
}

export async function stopCpu(): Promise<void> {
  await ensureInit();
  await call('stopCpu');
}

export async function getYieldSteps(): Promise<number> {
  await ensureInit();
  return call('getYieldSteps');
}

export async function setYieldSteps(steps: number): Promise<void> {
  await ensureInit();
  await call('setYieldSteps', steps);
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
