import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Control, Display, ErrorSwitch } from './controls';

const debugMocks = {
  debugLog: vi.fn(),
  errorLog: vi.fn(),
};

const simhMocks = {
  init: vi.fn<() => Promise<void>>(),
  restart: vi.fn<() => Promise<void>>(),
  onOutput: vi.fn<(cb: ((text: string) => void) | null) => Promise<void>>(),
  onRunState: vi.fn<(listener: (running: boolean) => void) => void>(),
  sendCommand: vi.fn<(cmd: string, options?: { streamOutput?: boolean; echo?: boolean }) => Promise<string>>(),
  examine: vi.fn<(ref: string, options?: { echo?: boolean }) => Promise<Record<string, string>>>(),
  deposit: vi.fn<(ref: string, value: string, options?: { echo?: boolean }) => Promise<void>>(),
  readFile: vi.fn<(path: string) => Promise<string>>(),
  listDirectory: vi.fn<(path: string) => Promise<Array<{
    name: string;
    path: string;
    isDirectory: boolean;
  }>>>(),
  enableStateStream: vi.fn<(enabled: boolean) => Promise<void>>(),
  setStateStreamStride: vi.fn<(stride: number) => Promise<void>>(),
  getYieldEnabled: vi.fn<() => Promise<boolean>>(),
  setYieldEnabled: vi.fn<(enabled: boolean) => Promise<void>>(),
  clearStateStream: vi.fn<() => Promise<void>>(),
  readStateStream: vi.fn<() => Promise<Array<{
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
  }>>>(),
  onStateStream: vi.fn<(listener: (sample: {
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
  }) => void) => void>(),
  stop: vi.fn<() => Promise<void>>(),
};

vi.mock('../simh/workerClient', () => simhMocks);
vi.mock('../simh/debug', () => debugMocks);

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
  const service = await import('.');
  return service;
};

const flushPromises = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('i650', () => {
  let runStateListener: ((running: boolean) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    runStateListener = null;
    debugMocks.debugLog.mockReset();
    debugMocks.errorLog.mockReset();
    simhMocks.init.mockResolvedValue(undefined);
    simhMocks.restart.mockResolvedValue(undefined);
    simhMocks.onOutput.mockResolvedValue(undefined);
    simhMocks.onRunState.mockImplementation((listener) => {
      runStateListener = listener;
    });
    simhMocks.sendCommand.mockResolvedValue('');
    simhMocks.examine.mockResolvedValue({ ...defaultState });
    simhMocks.deposit.mockResolvedValue(undefined);
    simhMocks.getYieldEnabled.mockResolvedValue(true);
    simhMocks.setYieldEnabled.mockResolvedValue(undefined);
    simhMocks.readFile.mockResolvedValue('');
    simhMocks.listDirectory.mockResolvedValue([]);
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

  it('lists and reads filesystem entries through worker client', async () => {
    const service = await setupService();
    await service.init();

    simhMocks.listDirectory.mockResolvedValueOnce([
      { name: 'soap4.dck', path: '/sw/soap4.dck', isDirectory: false },
    ]);
    simhMocks.readFile.mockResolvedValueOnce('CARD1\nCARD2\n');

    await expect(service.listFilesystemDirectory('/sw')).resolves.toEqual([
      { name: 'soap4.dck', path: '/sw/soap4.dck', isDirectory: false },
    ]);
    await expect(service.readFilesystemFile('/sw/soap4.dck')).resolves.toBe('CARD1\nCARD2\n');
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

  it('restart reinitializes active state stream and output forwarding', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.setStateStreamActive(true);
    simhMocks.clearStateStream.mockClear();
    simhMocks.enableStateStream.mockClear();
    simhMocks.setStateStreamStride.mockClear();
    simhMocks.onStateStream.mockClear();
    simhMocks.onOutput.mockClear();

    await service.restart();

    expect(simhMocks.onOutput).toHaveBeenCalledTimes(1);
    expect(simhMocks.clearStateStream).toHaveBeenCalledTimes(1);
    expect(simhMocks.enableStateStream).toHaveBeenCalledWith(true);
    expect(simhMocks.setStateStreamStride).toHaveBeenCalledTimes(1);
    expect(simhMocks.onStateStream).toHaveBeenCalledTimes(1);
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

  it('updates operation when setting program register directly', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.setProgramRegister('6912345678+');

    expect(simhMocks.deposit).toHaveBeenCalledWith('PR', '6912345678+');
    expect(service.getState().programRegister).toBe('6912345678+');
    expect(service.getState().operation).toBe('69');
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
    expect(simhMocks.getYieldEnabled).toHaveBeenCalled();
    expect(simhMocks.setYieldEnabled).toHaveBeenCalledWith(false);
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

  it('treats HALF=2 snapshot value as half-cycle mode active', async () => {
    simhMocks.examine.mockResolvedValue({
      ...defaultState,
      HALF: '2',
    });

    const service = await setupService();
    await service.init();
    await flushPromises();
    await service.refreshRegisters();

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

  it('restores yield mode when leaving half-cycle mode', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    simhMocks.getYieldEnabled.mockResolvedValueOnce(true);
    await service.setHalfCycle(true);
    await service.setHalfCycle(false);

    expect(simhMocks.setYieldEnabled).toHaveBeenNthCalledWith(1, false);
    expect(simhMocks.setYieldEnabled).toHaveBeenNthCalledWith(2, true);
    expect(simhMocks.deposit).toHaveBeenCalledWith('HALF', '1');
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

  it('ignores non-debug lines in output handler', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    const onOutputHandler = simhMocks.onOutput.mock.calls.at(0)?.[0];
    const listener = vi.fn();
    service.subscribe(listener);
    const callsBefore = listener.mock.calls.length;

    // Send output that doesn't contain 'DBG('
    onOutputHandler?.('Some regular output line\n');
    onOutputHandler?.('Another line without debug marker\n');

    // State should not have changed (no debug patch applied)
    expect(listener.mock.calls.length).toBe(callsBefore);
  });

  it('parses CPU DETAIL debug lines and updates accumulators', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    const onOutputHandler = simhMocks.onOutput.mock.calls.at(0)?.[0];
    const listener = vi.fn();
    service.subscribe(listener);

    // Send CPU DETAIL debug line
    onOutputHandler?.('DBG(CPU DETAIL) ACC: 1234567890 9876543210+, OV: 1\n');

    // Wait for the debounced update (DEBUG_STREAM_THROTTLE_MS = 50ms)
    await new Promise((resolve) => setTimeout(resolve, 100));
    await flushPromises();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        upperAccumulator: '1234567890+',
        lowerAccumulator: '9876543210+',
      })
    );
  });

  it('parses CPU CMD Exec debug lines and updates program register', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    const onOutputHandler = simhMocks.onOutput.mock.calls.at(0)?.[0];

    // Send CPU CMD Exec debug line (format: CPU CMD: Exec {addr}: {op} {name} {data_addr} {inst_addr})
    onOutputHandler?.('DBG(CPU CMD: Exec 1000: 69 RAU 8000 1001)\n');

    // Wait for the debounced update (DEBUG_STREAM_THROTTLE_MS = 50ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(service.getState().programRegister).toBe('6980001001+');
  });

  it('depositMemory validates and writes to memory', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.depositMemory('1234', '1111111111+');

    expect(simhMocks.deposit).toHaveBeenCalledWith('1234', '1111111111+');
  });

  it('executeCommand with RUN command manages running state', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    // Initially not running
    expect(service.getState().isRunning).toBe(false);

    // Start a RUN command - this sets runRequestedUntil and mergeState({ isRunning: true })
    simhMocks.sendCommand.mockImplementation(async () => {
      // Simulate a delay in command execution
      await new Promise((resolve) => setTimeout(resolve, 10));
      return '';
    });

    const runPromise = service.executeCommand('RUN', { streamOutput: true });
    await flushPromises();

    // State should be set to running after mergeState call
    expect(service.getState().isRunning).toBe(true);

    // Complete the command
    await runPromise;

    // State should be reset to not running after command completes
    expect(service.getState().isRunning).toBe(false);
  });

  it('setStateStreamActive initializes state stream when activated', async () => {
    // Mock state stream functions
    simhMocks.enableStateStream.mockResolvedValue(undefined);
    simhMocks.setStateStreamStride.mockResolvedValue(undefined);
    simhMocks.clearStateStream.mockResolvedValue(undefined);

    const service = await setupService();
    await service.init();
    await flushPromises();

    // Activate state stream
    await service.setStateStreamActive(true);

    // Verify that state stream was initialized
    expect(simhMocks.clearStateStream).toHaveBeenCalled();
    expect(simhMocks.enableStateStream).toHaveBeenCalledWith(true);
    expect(simhMocks.setStateStreamStride).toHaveBeenCalled();
    expect(simhMocks.onStateStream).toHaveBeenCalled();
  });

  it('maps streamed light fields into emulator state', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();
    await service.setStateStreamActive(true);

    const stateStreamListener = simhMocks.onStateStream.mock.calls.at(-1)?.[0];
    stateStreamListener?.({
      pr: '6980001001+',
      ar: '1000',
      ic: '1000',
      accLo: '1234567890+',
      accUp: '0000000000+',
      dist: '1111111111+',
      ov: 1,
      halfCycle: 2,
      op: 69,
      opIo: 1,
      opInquiry: 0,
      opRamac: 1,
      opTape: 0,
      opAccumulator: 1,
      stopReason: 8,
      chkProgramRegister: 0,
      chkControlUnit: 0,
      chkStorageSelection: 1,
      chkStorageUnit: 0,
      chkDistributor: 0,
      chkClocking: 0,
      chkAccumulator: 0,
      chkErrorSense: 0,
    });

    const next = service.getState();
    expect(next.operatingLights.dataAddress).toBe(true);
    expect(next.operatingLights.inputOutput).toBe(true);
    expect(next.operatingLights.ramac).toBe(true);
    expect(next.operatingLights.accumulator).toBe(true);
    expect(next.operatingLights.overflow).toBe(true);
    expect(next.operatingLights.program).toBe(true);
    expect(next.checkingLights.programRegister).toBe(false);
    expect(next.checkingLights.storageSelection).toBe(true);
    expect(next.checkingLights.distributor).toBe(false);
    expect(next.checkingLights.accumulator).toBe(false);
  });
});
