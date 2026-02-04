import * as simh from './index';

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

let outputEnabled = false;
let echoEnabled = false;

const ctx = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<RequestMessage>) => void) | null;
};

simh.onOutput((text) => {
  if (!outputEnabled) return;
  ctx.postMessage({ type: 'output', text });
});

const handlers: Record<string, (...args: unknown[]) => unknown> = {
  init: (moduleName?: unknown, baseUrl?: unknown) => {
    if (typeof baseUrl === 'string') {
      simh.setAssetBase(baseUrl);
    }
    return simh.init(String(moduleName));
  },
  restart: (moduleName?: unknown) => simh.restart(String(moduleName)),
  sendCommand: (cmd: unknown, options?: unknown) =>
    simh.sendCommandAsync(String(cmd), {
      ...(options as { streamOutput?: boolean; echo?: boolean } | undefined),
      echo: echoEnabled && (options as { echo?: boolean } | undefined)?.echo !== false,
    }),
  examine: (ref: unknown, options?: unknown) =>
    simh.examineAsync(String(ref), {
      echo: echoEnabled && (options as { echo?: boolean } | undefined)?.echo !== false,
    }),
  deposit: (ref: unknown, value: unknown, options?: unknown) =>
    simh.depositAsync(String(ref), String(value), {
      echo: echoEnabled && (options as { echo?: boolean } | undefined)?.echo !== false,
    }),
  readFile: (path: unknown) => simh.readFile(String(path)),
  writeFile: (path: unknown, data: unknown) => simh.writeFile(String(path), data as string | Uint8Array),
  mkdir: (path: unknown) => simh.mkdir(String(path)),
  unlink: (path: unknown) => simh.unlink(String(path)),
  isCpuRunning: () => simh.isCpuRunning(),
  isEmulatorBusy: () => simh.isEmulatorBusy(),
  getYieldSteps: () => simh.getYieldSteps(),
  setYieldSteps: (steps: unknown) => simh.setYieldSteps(Number(steps)),
  stop: () => simh.stop(),
};

let runStateInterval: ReturnType<typeof setInterval> | null = null;
let lastRunState: boolean | null = null;

function startRunStatePolling(): void {
  if (runStateInterval) return;
  runStateInterval = setInterval(() => {
    const runningState = simh.isEmulatorBusy();
    if (lastRunState === runningState) return;
    lastRunState = runningState;
    ctx.postMessage({ type: 'runstate', running: runningState });
  }, 50);
}

ctx.onmessage = async (event: MessageEvent<RequestMessage>) => {
  const { id, method, args = [] } = event.data;
  let response: ResponseMessage;

  try {
    if (method === 'setOutput') {
      outputEnabled = Boolean(args[0]);
      response = { id, ok: true, result: null };
    } else if (method === 'setEcho') {
      echoEnabled = Boolean(args[0]);
      response = { id, ok: true, result: null };
    } else {
      const handler = handlers[method];
      if (!handler) {
        throw new Error(`Unknown method: ${method}`);
      }
      if (method === 'init') {
        const result = await handler(...args);
        startRunStatePolling();
        response = { id, ok: true, result };
        ctx.postMessage(response);
        return;
      }
      const result = await handler(...args);
      response = { id, ok: true, result };
    }
  } catch (err) {
    response = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  ctx.postMessage(response);
};
