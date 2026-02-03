import * as simh from './index';
import { ZERO_ADDRESS, ZERO_DATA } from './i650/constants';

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

const ctx = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<RequestMessage>) => void) | null;
};

simh.onOutput((text) => {
  if (!outputEnabled) return;
  ctx.postMessage({ type: 'output', text });
});

function getRegisterSnapshot() {
  const values = simh.examineAllState();
  return {
    addressRegister: values.AR ?? ZERO_ADDRESS,
    programRegister: values.PR ?? ZERO_DATA,
    lowerAccumulator: values.ACCLO ?? ZERO_DATA,
    upperAccumulator: values.ACCUP ?? ZERO_DATA,
    distributor: values.DIST ?? ZERO_DATA,
    consoleSwitches: values.CSW ?? ZERO_DATA,
    programmedStop: (values.CSWPS?.trim() ?? '0') === '1',
    overflowStop: (values.CSWOS?.trim() ?? '0') === '1',
    halfCycle: (values.HALF?.trim() ?? '0') === '1',
  };
}

const handlers: Record<string, (...args: unknown[]) => unknown> = {
  init: (baseUrl?: unknown) => {
    if (typeof baseUrl === 'string') {
      simh.setAssetBase(baseUrl);
    }
    return simh.init();
  },
  restart: () => simh.restart(),
  sendCommand: (cmd: unknown, options?: unknown) =>
    simh.sendCommand(String(cmd), options as { streamOutput?: boolean } | undefined),
  examineState: (ref: unknown) => simh.examineState(String(ref)),
  depositState: (ref: unknown, value: unknown) => simh.depositState(String(ref), String(value)),
  readFile: (path: unknown) => simh.readFile(String(path)),
  writeFile: (path: unknown, data: unknown) => simh.writeFile(String(path), data as string | Uint8Array),
  mkdir: (path: unknown) => simh.mkdir(String(path)),
  unlink: (path: unknown) => simh.unlink(String(path)),
  getRegisterSnapshot,
  getAddressRegister: () => simh.getAddressRegister(),
  setAddressRegister: (value: unknown) => simh.setAddressRegister(String(value)),
  getProgramRegister: () => simh.getProgramRegister(),
  setProgramRegister: (value: unknown) => simh.setProgramRegister(String(value)),
  getDistributor: () => simh.getDistributor(),
  setDistributor: (value: unknown) => simh.setDistributor(String(value)),
  getLowerAccumulator: () => simh.getLowerAccumulator(),
  setLowerAccumulator: (value: unknown) => simh.setLowerAccumulator(String(value)),
  getUpperAccumulator: () => simh.getUpperAccumulator(),
  setUpperAccumulator: (value: unknown) => simh.setUpperAccumulator(String(value)),
  getConsoleSwitches: () => simh.getConsoleSwitches(),
  setConsoleSwitches: (value: unknown) => simh.setConsoleSwitches(String(value)),
  getProgrammedStop: () => simh.getProgrammedStop(),
  setProgrammedStop: (value: unknown) => simh.setProgrammedStop(Boolean(value)),
  getOverflowStop: () => simh.getOverflowStop(),
  setOverflowStop: (value: unknown) => simh.setOverflowStop(Boolean(value)),
  getHalfCycle: () => simh.getHalfCycle(),
  setHalfCycle: (value: unknown) => simh.setHalfCycle(Boolean(value)),
  getOverflow: () => simh.getOverflow(),
  setOverflow: (value: unknown) => simh.setOverflow(Boolean(value)),
  resetAccumulator: () => simh.resetAccumulator(),
  reset: () => simh.reset(),
  setMemorySize: (size: unknown) => simh.setMemorySize(size as '1K' | '2K' | '4K'),
  readMemory: (address: unknown) => simh.readMemory(String(address)),
  writeMemory: (address: unknown, value: unknown) => simh.writeMemory(String(address), String(value)),
  isCpuRunning: () => simh.isCpuRunning(),
  isEmulatorBusy: () => simh.isEmulatorBusy(),
  getYieldSteps: () => simh.getYieldSteps(),
  setYieldSteps: (steps: unknown) => simh.setYieldSteps(Number(steps)),
  stopCpu: () => simh.stop(),
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
      if (method === 'sendCommand') {
        const cmd = String(args[0] ?? '');
        const verb = cmd.trim().split(/\s+/)[0]?.toUpperCase();
        const result = await handler(...args);
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
