import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Control, Display, ErrorSwitch } from './controls';

const debugMocks = {
  debugLog: vi.fn(),
  errorLog: vi.fn(),
};

const yieldMocks = {
  persistYieldSteps: vi.fn<(steps: number) => void>(),
  readPersistedYieldSteps: vi.fn<() => number | null>(),
};

const simhMocks = {
  init: vi.fn<() => Promise<void>>(),
  restart: vi.fn<() => Promise<void>>(),
  onOutput: vi.fn<(cb: ((text: string) => void) | null) => Promise<void>>(),
  onRunState: vi.fn<(listener: (running: boolean) => void) => void>(),
  sendCommand: vi.fn<(cmd: string, options?: { streamOutput?: boolean; echo?: boolean }) => Promise<string>>(),
  examine: vi.fn<(ref: string, options?: { echo?: boolean }) => Promise<Record<string, string>>>(),
  deposit: vi.fn<(ref: string, value: string, options?: { echo?: boolean }) => Promise<void>>(),
  getYieldSteps: vi.fn<() => Promise<number>>(),
  setYieldSteps: vi.fn<(steps: number) => Promise<void>>(),
  enableStateStream: vi.fn<(enabled: boolean) => Promise<void>>(),
  setStateStreamStride: vi.fn<(stride: number) => Promise<void>>(),
  clearStateStream: vi.fn<() => Promise<void>>(),
  readStateStream: vi.fn<() => Promise<Array<{
    pr: string;
    ar: string;
    ic: string;
    accLo: string;
    accUp: string;
    dist: string;
    ov: number;
  }>>>(),
  onStateStream: vi.fn<(listener: (sample: {
    pr: string;
    ar: string;
    ic: string;
    accLo: string;
    accUp: string;
    dist: string;
    ov: number;
  }) => void) => void>(),
  stop: vi.fn<() => Promise<void>>(),
};

vi.mock('../workerClient', () => simhMocks);
vi.mock('../debug', () => debugMocks);
vi.mock('../yield', () => yieldMocks);

const defaultState: Record<string, string> = {
  AR: '0000',
  PR: '0000000000+',
  ACCLO: '0000000000+',
  ACCUP: '0000000000+',
  DIST: '0000000000+',
  CSW: '0000000000+',
  CSWPS: '0',
  CSWOS: '0',
  HALF: '0',
};

const setupService = async () => {
  vi.resetModules();
  const service = await import('./service');
  return service;
};

const flushPromises = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('i650 service', () => {
  let runStateListener: ((running: boolean) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    runStateListener = null;
    debugMocks.debugLog.mockReset();
    debugMocks.errorLog.mockReset();
    yieldMocks.persistYieldSteps.mockReset();
    yieldMocks.readPersistedYieldSteps.mockReset();
    yieldMocks.readPersistedYieldSteps.mockReturnValue(null);
    simhMocks.init.mockResolvedValue(undefined);
    simhMocks.restart.mockResolvedValue(undefined);
    simhMocks.onOutput.mockResolvedValue(undefined);
    simhMocks.onRunState.mockImplementation((listener) => {
      runStateListener = listener;
    });
    simhMocks.sendCommand.mockResolvedValue('');
    simhMocks.examine.mockResolvedValue({ ...defaultState });
    simhMocks.deposit.mockResolvedValue(undefined);
    simhMocks.getYieldSteps.mockResolvedValue(100);
    simhMocks.setYieldSteps.mockResolvedValue(undefined);
    simhMocks.stop.mockResolvedValue(undefined);
  });

  it('updates display switch without touching SIMH', async () => {
    const service = await setupService();
    service.setDisplaySwitch(Display.READ_OUT_STORAGE);
    expect(service.getState().displaySwitch).toBe(Display.READ_OUT_STORAGE);
    expect(simhMocks.sendCommand).not.toHaveBeenCalled();
  });

  it('sets console switches and updates state', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.setConsoleSwitches('1111111111+');
    expect(simhMocks.deposit).toHaveBeenCalledWith('CSW', '1111111111+');
    expect(service.getState().consoleSwitches).toBe('1111111111+');
  });

  it('subscribes and unsubscribes state listeners', async () => {
    const service = await setupService();
    const listener = vi.fn();

    const unsubscribe = service.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    service.setDisplaySwitch(Display.PROGRAM_REGISTER);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    service.setDisplaySwitch(Display.DISTRIBUTOR);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('subscribes and unsubscribes output listeners', async () => {
    const service = await setupService();
    const outputListener = vi.fn();
    await service.init();
    await flushPromises();

    const unsubscribe = service.subscribeOutput(outputListener);
    const onOutputHandler = simhMocks.onOutput.mock.calls.at(0)?.[0];
    onOutputHandler?.('line one');
    expect(outputListener).toHaveBeenCalledWith('line one');

    unsubscribe();
    onOutputHandler?.('line two');
    expect(outputListener).toHaveBeenCalledTimes(1);
  });

  it('reverts state on failed deposit', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    simhMocks.deposit.mockRejectedValueOnce(new Error('fail'));
    simhMocks.examine.mockResolvedValueOnce({
      ...defaultState,
      CSW: '2222222222+',
    });

    await expect(service.setConsoleSwitches('9999999999+')).rejects.toThrow('fail');
    expect(service.getState().consoleSwitches).toBe('2222222222+');
  });

  it('reverts to previous state when deposit and refresh both fail', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();
    await service.setConsoleSwitches('3333333333+');

    simhMocks.deposit.mockRejectedValueOnce(new Error('fail'));
    simhMocks.examine.mockRejectedValueOnce(new Error('refresh failed'));

    await expect(service.setConsoleSwitches('9999999999+')).rejects.toThrow('fail');
    expect(service.getState().consoleSwitches).toBe('3333333333+');
  });

  it('manual read-out storage transfers to distributor', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    simhMocks.examine.mockImplementation(async (ref: string) => {
      if (ref === 'STATE') return { ...defaultState };
      if (ref === '8000') return { '8000': '1234567890+' };
      return {};
    });

    service.setControlSwitch(Control.MANUAL_OPERATION);
    service.setDisplaySwitch(Display.READ_OUT_STORAGE);
    await service.setAddressRegister('8000');

    await service.startProgramOrTransfer();

    expect(simhMocks.deposit).toHaveBeenCalledWith('DIST', '1234567890+');
    expect(simhMocks.sendCommand).not.toHaveBeenCalledWith('GO', { streamOutput: true });
  });

  it('manual read-out falls back to numeric key and zero default', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    simhMocks.examine.mockImplementation(async (ref: string) => {
      if (ref === 'STATE') return { ...defaultState };
      if (ref === '0007') return { '7': '7654321098+' };
      if (ref === '0008') return {};
      return {};
    });

    service.setControlSwitch(Control.MANUAL_OPERATION);
    service.setDisplaySwitch(Display.READ_OUT_STORAGE);

    await service.setAddressRegister('0007');
    await service.startProgramOrTransfer();
    expect(simhMocks.deposit).toHaveBeenCalledWith('DIST', '7654321098+');

    await service.setAddressRegister('0008');
    await service.startProgramOrTransfer();
    expect(simhMocks.deposit).toHaveBeenCalledWith('DIST', '0000000000+');
  });

  it('starts program when not in manual mode', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    service.setControlSwitch(Control.RUN);
    await service.startProgramOrTransfer();

    expect(simhMocks.sendCommand).toHaveBeenCalledWith('GO', { streamOutput: true });
  });

  it('manual mode with non-transfer display performs no drum action', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    service.setControlSwitch(Control.MANUAL_OPERATION);
    service.setDisplaySwitch(Display.DISTRIBUTOR);
    await service.startProgramOrTransfer();

    const depositCalls = simhMocks.deposit.mock.calls.filter(([ref]) => ref === 'DIST');
    expect(depositCalls.length).toBe(0);
    expect(simhMocks.sendCommand).not.toHaveBeenCalledWith('GO', { streamOutput: true });
  });

  it('restarts simulator and reapplies startup configuration', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.restart();

    expect(simhMocks.restart).toHaveBeenCalledWith('i650');
    expect(simhMocks.sendCommand).toHaveBeenCalledWith('SET CPU 1K', { echo: false });
  });

  it('avoids duplicate init calls when already initializing', async () => {
    let resolveInit!: () => void;
    simhMocks.init.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        })
    );

    const service = await setupService();
    const first = service.init();
    const second = service.init();

    await flushPromises();
    expect(simhMocks.init).toHaveBeenCalledTimes(1);

    resolveInit();
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
  });

  it('restarts and restores persisted yield steps when present', async () => {
    yieldMocks.readPersistedYieldSteps.mockReturnValue(2500);
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.restart();

    expect(simhMocks.setYieldSteps).toHaveBeenCalledWith(2500);
    expect(service.getState().yieldSteps).toBe(2500);
  });

  it('transfers address only in manual mode', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    service.setAddressSwitches('1234');
    service.setControlSwitch(Control.RUN);
    await service.transferAddress();
    expect(simhMocks.deposit).not.toHaveBeenCalledWith('AR', '1234');

    service.setControlSwitch(Control.MANUAL_OPERATION);
    await service.transferAddress();
    expect(simhMocks.deposit).toHaveBeenCalledWith('AR', '1234');
  });

  it('sets error switch without calling SIMH', async () => {
    const service = await setupService();
    service.setErrorSwitch(ErrorSwitch.SENSE);
    expect(service.getState().errorSwitch).toBe(ErrorSwitch.SENSE);
    expect(simhMocks.sendCommand).not.toHaveBeenCalled();
  });

  it('initializes lazily when setting programmed/overflow/half cycle flags', async () => {
    const service = await setupService();

    await service.setProgrammedStop(true);
    await service.setOverflowStop(true);
    await service.setHalfCycle(true);

    expect(simhMocks.init).toHaveBeenCalled();
    expect(simhMocks.deposit).toHaveBeenCalledWith('CSWPS', '1');
    expect(simhMocks.deposit).toHaveBeenCalledWith('CSWOS', '1');
    expect(simhMocks.deposit).toHaveBeenCalledWith('HALF', '1');
  });

  it('manual read-in transfer writes memory and distributor', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    service.setControlSwitch(Control.MANUAL_OPERATION);
    service.setDisplaySwitch(Display.READ_IN_STORAGE);
    await service.setAddressRegister('8001');
    await service.setConsoleSwitches('8888888888+');

    await service.startProgramOrTransfer();

    expect(simhMocks.deposit).toHaveBeenCalledWith('8001', '8888888888+');
    expect(simhMocks.deposit).toHaveBeenCalledWith('DIST', '8888888888+');
    expect(simhMocks.sendCommand).not.toHaveBeenCalledWith('GO', { streamOutput: true });
  });

  it('resetProgram stops running emulator and zeroes program/address registers', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    runStateListener = simhMocks.onRunState.mock.calls.at(-1)?.[0] ?? null;
    runStateListener?.(true);
    await service.resetProgram();

    expect(simhMocks.stop).toHaveBeenCalled();
    expect(simhMocks.deposit).toHaveBeenCalledWith('PR', '0000000000+');
    expect(simhMocks.deposit).toHaveBeenCalledWith('AR', '0000');
  });

  it('stopProgram stops emulator and refreshes registers', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.stopProgram();

    expect(simhMocks.stop).toHaveBeenCalledTimes(1);
    expect(simhMocks.examine).toHaveBeenCalledWith('STATE', { echo: false });
  });

  it('resetAccumulator clears accumulator registers and overflow', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.resetAccumulator();

    expect(simhMocks.deposit).toHaveBeenCalledWith('DIST', '0000000000+');
    expect(simhMocks.deposit).toHaveBeenCalledWith('ACCLO', '0000000000+');
    expect(simhMocks.deposit).toHaveBeenCalledWith('ACCUP', '0000000000+');
    expect(simhMocks.deposit).toHaveBeenCalledWith('OV', '0');
  });

  it('reset issues RESET command through executeCommand', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.reset();

    expect(simhMocks.sendCommand).toHaveBeenCalledWith('RESET', undefined);
  });

  it('executeCommand returns output and refreshes registers', async () => {
    simhMocks.sendCommand.mockImplementation(async (cmd) => (cmd === 'EXAMINE STATE' ? 'OK' : ''));
    const service = await setupService();
    await service.init();
    await flushPromises();

    const output = await service.executeCommand('EXAMINE STATE');

    expect(output).toBe('OK');
    expect(simhMocks.sendCommand).toHaveBeenCalledWith('EXAMINE STATE', undefined);
    expect(simhMocks.examine).toHaveBeenCalledWith('STATE', { echo: false });
  });

  it('setYieldSteps clamps values and persists normalized setting', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.setYieldSteps(0.4);
    expect(simhMocks.setYieldSteps).toHaveBeenLastCalledWith(0);
    expect(yieldMocks.persistYieldSteps).toHaveBeenCalledWith(0);

    await service.setYieldSteps(200000);
    expect(simhMocks.setYieldSteps).toHaveBeenLastCalledWith(100000);

    await service.setYieldSteps(Number.NaN);
    expect(simhMocks.setYieldSteps).toHaveBeenLastCalledWith(1000);
  });

  it('maps register snapshot booleans from trimmed values', async () => {
    simhMocks.examine.mockResolvedValue({
      ...defaultState,
      CSWPS: ' 1 ',
      CSWOS: '1',
      HALF: ' 1',
    });

    const service = await setupService();
    await service.init();
    await flushPromises();
    await service.refreshRegisters();

    expect(service.getState().programmedStop).toBe(true);
    expect(service.getState().overflowStop).toBe(true);
    expect(service.getState().halfCycle).toBe(true);
  });

  it('falls back to default register values when snapshot keys are missing', async () => {
    simhMocks.examine.mockResolvedValue({});

    const service = await setupService();
    await service.init();
    await flushPromises();
    await service.refreshRegisters();

    expect(service.getState().addressRegister).toBe('0000');
    expect(service.getState().programRegister).toBe('0000000000+');
    expect(service.getState().lowerAccumulator).toBe('0000000000+');
    expect(service.getState().upperAccumulator).toBe('0000000000+');
    expect(service.getState().distributor).toBe('0000000000+');
    expect(service.getState().consoleSwitches).toBe('0000000000+');
    expect(service.getState().programmedStop).toBe(false);
    expect(service.getState().overflowStop).toBe(false);
    expect(service.getState().halfCycle).toBe(false);
  });

  it('resetComputer stops running emulator and issues RESET command', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    runStateListener = simhMocks.onRunState.mock.calls.at(-1)?.[0] ?? null;
    runStateListener?.(true);
    await service.resetComputer();

    expect(simhMocks.stop).toHaveBeenCalled();
    expect(simhMocks.sendCommand).toHaveBeenCalledWith('RESET', undefined);
  });

  it('resetProgram does not stop when emulator is not running', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.resetProgram();

    expect(simhMocks.stop).not.toHaveBeenCalled();
  });

  it('resetComputer does not stop when emulator is not running', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.resetComputer();

    expect(simhMocks.stop).not.toHaveBeenCalled();
  });

  it('writes zero values when toggling programmed/overflow/half cycle off', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.setProgrammedStop(false);
    await service.setOverflowStop(false);
    await service.setHalfCycle(false);

    expect(simhMocks.deposit).toHaveBeenCalledWith('CSWPS', '0');
    expect(simhMocks.deposit).toHaveBeenCalledWith('CSWOS', '0');
    expect(simhMocks.deposit).toHaveBeenCalledWith('HALF', '0');
  });

  it('does not start program when already running in non-manual mode', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    service.setControlSwitch(Control.RUN);
    runStateListener = simhMocks.onRunState.mock.calls.at(-1)?.[0] ?? null;
    runStateListener?.(true);
    await service.startProgramOrTransfer();

    const goCalls = simhMocks.sendCommand.mock.calls.filter(([cmd]) => cmd === 'GO');
    expect(goCalls.length).toBe(0);
  });

  it('resets init state when init fails and can be retried', async () => {
    simhMocks.init.mockRejectedValueOnce(new Error('init fail'));
    const service = await setupService();

    await expect(service.init()).rejects.toThrow('init fail');

    simhMocks.init.mockResolvedValueOnce(undefined);
    await expect(service.init()).resolves.toBeUndefined();
  });

  it('logs post-init errors from deferred setup', async () => {
    simhMocks.sendCommand.mockRejectedValueOnce(new Error('post-init failed'));
    const service = await setupService();

    await service.init();
    await flushPromises();

    expect(debugMocks.errorLog).toHaveBeenCalledWith('i650 postInit error', expect.any(Error));
  });
});
