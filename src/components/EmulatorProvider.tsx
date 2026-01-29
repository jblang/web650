'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, useMemo, type Dispatch, type SetStateAction } from 'react';
import { Display, Control, Programmed, HalfCycle, Overflow } from './FrontPanel/ConfigSection';
import type { OperatingState } from './FrontPanel/OperatingStatus';
import type { CheckingState } from './FrontPanel/CheckingStatus';
// Maps display switch position to the register string shown on the lights.
function getDisplayValue(
  displaySwitch: number,
  regs: {
    lowerAccumulator: string;
    upperAccumulator: string;
    distributor: string;
    programRegister: string;
  }
): string {
  switch (displaySwitch) {
    case Display.LOWER_ACCUM:
      return regs.lowerAccumulator;
    case Display.UPPER_ACCUM:
      return regs.upperAccumulator;
    case Display.DISTRIBUTOR:
      return regs.distributor;
    case Display.PROGRAM_REGISTER:
      return regs.programRegister;
    case Display.READ_OUT_STORAGE:
    case Display.READ_IN_STORAGE:
      return regs.distributor;
    default:
      return '0000000000+';
  }
}

interface EmulatorContextType {
  initialized: boolean;
  output: string;
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<string>;
  // Derived display value (kept in provider)
  displayValue: string;
  operation: string;
  operatingState: OperatingState;
  checkingState: CheckingState;
  // Panel-only state (not backed by emulator registers)
  displaySwitch: number;
  controlSwitch: number;
  errorSwitch: number;
  addressSwitches: string;
  // Emulator register snapshot (maintained locally)
  addressRegister: string;
  programRegister: string;
  lowerAccumulator: string;
  upperAccumulator: string;
  distributor: string;
  consoleSwitches: string;
  programmedStop: boolean;
  overflowStop: boolean;
  halfCycle: boolean;
  refreshRegisters: () => Promise<void>;
  // Front panel handlers (business logic)
  onDisplayChange: (value: number) => void;
  onAddressChange: (value: string) => Promise<void>;
  onProgrammedChange: (value: number) => Promise<void>;
  onHalfCycleChange: (value: number) => Promise<void>;
  onControlChange: (value: number) => void;
  onOverflowChange: (value: number) => Promise<void>;
  onErrorChange: (value: number) => void;
  onEntryValueChange: (value: string) => Promise<void>;
  onTransferClick: () => Promise<void>;
  onProgramStartClick: () => Promise<void>;
  onProgramStopClick: () => Promise<void>;
  onProgramResetClick: () => Promise<void>;
  onComputerResetClick: () => Promise<void>;
  onAccumResetClick: () => Promise<void>;
  onErrorResetClick: () => void;
  onErrorSenseResetClick: () => void;
  onRestartClick: () => Promise<void>;
}

const EmulatorContext = createContext<EmulatorContextType | null>(null);

type EmulatorApi = {
  appendOutput: (text: string) => void;
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<string>;
  setProgramRegister: (value: string) => Promise<void>;
  setLowerAccumulator: (value: string) => Promise<void>;
  setUpperAccumulator: (value: string) => Promise<void>;
  setDistributor: (value: string) => Promise<void>;
  setAddressRegister: (address: string) => Promise<void>;
  setConsoleSwitches: (value: string) => Promise<void>;
  setHalfCycle: (value: boolean) => Promise<void>;
  setOverflowStop: (value: boolean) => Promise<void>;
  setProgrammedStop: (value: boolean) => Promise<void>;
};

type CommandQueueRef = { current: Promise<void> };

const request = async (path: string, init: RequestInit) => {
  const res = await fetch(path, init);
  if (!res.ok) {
    console.error(`${init.method ?? 'GET'} ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res;
};

async function parseJson<T>(res: Response): Promise<T | undefined> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('json')) return undefined;
  try {
    return (await res.json()) as T;
  } catch (err) {
    console.error('Failed to parse JSON response', err);
    return undefined;
  }
}

function createEmulatorApi(
  commandQueue: CommandQueueRef,
  setOutput: Dispatch<SetStateAction<string>>
): EmulatorApi {
  const appendOutput = (text: string) => {
    setOutput((prev) => prev + text);
  };

  const sendCommand = async (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }): Promise<string> => {
    const result = commandQueue.current.then(async () => {
      try {
        const response = await request('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, appendCR: options?.appendCR ?? true, expectResponse: options?.expectResponse ?? false }),
        });
        if (!response.ok) return '';
        const data = await parseJson<{ output?: string; error?: string }>(response);
        if (!data) return '';
        if (data.output) {
          appendOutput(data.output);
          return data.output;
        }
        if (data.error) {
          console.error('Command error:', data.error);
          return '';
        }
      } catch (err) {
        console.error('Command failed:', err);
      }
      return '';
    });

    commandQueue.current = result.then(() => undefined).catch(() => {});
    return result;
  };

  return {
    appendOutput,
    sendCommand,
    setAddressRegister: async (address: string) => {
      await request(`/api/state/AR`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: address }),
      });
    },
    setLowerAccumulator: async (value: string) => {
      await request(`/api/state/ACCLO`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    },
    setUpperAccumulator: async (value: string) => {
      await request(`/api/state/ACCUP`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    },
    setDistributor: async (value: string) => {
      await request(`/api/state/DIST`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    },
    setProgramRegister: async (value: string) => {
      await request(`/api/state/PR`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    },
    setConsoleSwitches: async (value: string) => {
      await request(`/api/state/CSW`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    },
    setProgrammedStop: async (value: boolean) => {
      await request(`/api/state/CSWPS`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value ? '1' : '0' }),
      });
    },
    setOverflowStop: async (value: boolean) => {
      await request(`/api/state/CSWOS`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value ? '1' : '0' }),
      });
    },
    setHalfCycle: async (value: boolean) => {
      await request(`/api/state/HALF`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value ? '1' : '0' }),
      });
    },
  };
}

export function useEmulator() {
  const context = useContext(EmulatorContext);
  if (!context) {
    throw new Error('useEmulator must be used within an EmulatorProvider');
  }
  return context;
}

export default function EmulatorProvider({ children }: { children: ReactNode }) {
  const [output, setOutput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [consoleStreamVersion, setConsoleStreamVersion] = useState(0);
  // Emulator register snapshot (kept in provider so consumers don't fetch on demand)
  const [addressRegister, setAddressRegisterState] = useState<string>('0000');
  const [programRegister, setProgramRegisterState] = useState<string>('00000');
  const [lowerAccumulator, setLowerAccumulatorState] = useState<string>('0000000000+');
  const [upperAccumulator, setUpperAccumulatorState] = useState<string>('0000000000+');
  const [distributor, setDistributorState] = useState<string>('0000000000+');
  const [consoleSwitches, setConsoleSwitchesState] = useState<string>('0000000000+');
  const [programmedStop, setProgrammedStopState] = useState<boolean>(false);
  const [overflowStop, setOverflowStopState] = useState<boolean>(false);
  const [halfCycle, setHalfCycleState] = useState<boolean>(false);
  const [displayValue, setDisplayValue] = useState<string>('0000000000+');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [operation, setOperation] = useState<string>('00');
  const [operatingState] = useState<OperatingState>({
    dataAddress: false,
    program: false,
    inputOutput: false,
    inquiry: false,
    ramac: false,
    magneticTape: false,
    instAddress: false,
    accumulator: false,
    overflow: false,
  });
  const [checkingState] = useState<CheckingState>({
    programRegister: false,
    controlUnit: false,
    storageSelection: false,
    storageUnit: false,
    distributor: false,
    clocking: false,
    accumulator: false,
    errorSense: false,
  });
  // Panel-only switch state (not backed by emulator registers)
  const [displaySwitch, setDisplaySwitch] = useState<number>(0);
  const [controlSwitch, setControlSwitch] = useState<number>(0);
  const [errorSwitch, setErrorSwitch] = useState<number>(0);
  const [addressSwitches, setAddressSwitches] = useState<string>('0000');

  // Command queue to prevent overlapping requests
  const commandQueue = useRef<Promise<void>>(Promise.resolve());

  const api = useMemo(() => createEmulatorApi(commandQueue, setOutput), [setOutput]);

  const refreshRegisters = useCallback(async () => {
    const res = await request('/api/state', { method: 'GET' });
    if (!res.ok) throw new Error(`State request failed (${res.status})`);
    const data = await parseJson<{ registers?: Record<string, string> }>(res);
    if (!data?.registers) throw new Error('State response missing registers');
    const regs = data.registers;
    const getBool = (key: string) => (regs[key]?.trim() ?? '0') === '1';
    setAddressRegisterState(regs.AR ?? addressRegister);
    setProgramRegisterState(regs.PR ?? programRegister);
    setLowerAccumulatorState(regs.ACCLO ?? lowerAccumulator);
    setUpperAccumulatorState(regs.ACCUP ?? upperAccumulator);
    setDistributorState(regs.DIST ?? distributor);
    setConsoleSwitchesState(regs.CSW ?? consoleSwitches);
    setProgrammedStopState(getBool('CSWPS'));
    setOverflowStopState(getBool('CSWOS'));
    setHalfCycleState(getBool('HALF'));
  }, [addressRegister, programRegister, lowerAccumulator, upperAccumulator, distributor, consoleSwitches]);

  const getDrumLocation = useCallback(async (address: string): Promise<string> => {
    const res = await request(`/api/state/${address}`, { method: 'GET' });
    if (!res.ok) throw new Error(`State request failed (${res.status})`);
    const data = await parseJson<{ registers?: Record<string, string> }>(res);
    const registers = data?.registers ?? {};
    const numeric = String(parseInt(address, 10));
    return registers[address] ?? registers[numeric] ?? registers[numeric.padStart(4, '0')] ?? '';
  }, []);

  const setDrumLocation = useCallback(async (address: string, value: string): Promise<void> => {
    await request(`/api/state/${address}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  }, []);

  const restart = useCallback(async () => {
    setInitialized(false);
    setOutput('');

    // Reset queue and schedule console reconnect immediately
    commandQueue.current = Promise.resolve();
    setConsoleStreamVersion((v) => v + 1);

    try {
      const res = await request('/api/restart', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Restart failed (${res.status})`);
      }

      // Reapply expected CPU speed
      await api.sendCommand('set cpu 1k', { appendCR: true, expectResponse: false });
      await refreshRegisters();
    } finally {
      setInitialized(true);
    }
  }, [api, refreshRegisters]);

  const goCommand = useCallback(async () => {
    const res = await request(`/api/command/go`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Control go failed (${res.status})`);
    }
  }, []);

  const escape = useCallback(async () => {
    const res = await request('/api/escape', { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Escape failed (${res.status})`);
    }
  }, []);

  const resetCommand = useCallback(async () => {
    const res = await request(`/api/command/reset`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Control reset failed (${res.status})`);
    }
  }, []);

  const setAddressRegister = useCallback(
    async (value: string) => {
      await api.setAddressRegister(value);
      setAddressRegisterState(value);
    },
    [api]
  );

  const setProgramRegister = useCallback(
    async (value: string) => {
      await api.setProgramRegister(value);
      setProgramRegisterState(value);
    },
    [api]
  );

  const setLowerAccumulator = useCallback(
    async (value: string) => {
      await api.setLowerAccumulator(value);
      setLowerAccumulatorState(value);
    },
    [api]
  );

  const setUpperAccumulator = useCallback(
    async (value: string) => {
      await api.setUpperAccumulator(value);
      setUpperAccumulatorState(value);
    },
    [api]
  );

  const setDistributor = useCallback(
    async (value: string) => {
      await api.setDistributor(value);
      setDistributorState(value);
    },
    [api]
  );

  const setConsoleSwitches = useCallback(
    async (value: string) => {
      await api.setConsoleSwitches(value);
      setConsoleSwitchesState(value);
    },
    [api]
  );

  const setProgrammedStop = useCallback(
    async (value: boolean) => {
      await api.setProgrammedStop(value);
      setProgrammedStopState(value);
    },
    [api]
  );

  const setOverflowStop = useCallback(
    async (value: boolean) => {
      await api.setOverflowStop(value);
      setOverflowStopState(value);
    },
    [api]
  );

  const setHalfCycle = useCallback(
    async (value: boolean) => {
      await api.setHalfCycle(value);
      setHalfCycleState(value);
    },
    [api]
  );

  // Derived display value mirrors current knob and register snapshot.
  useEffect(() => {
    if (!initialized) return;
    setDisplayValue(
      getDisplayValue(displaySwitch, {
        lowerAccumulator,
        upperAccumulator,
        distributor,
        programRegister,
      })
    );
  }, [initialized, displaySwitch, lowerAccumulator, upperAccumulator, distributor, programRegister]);

  // Derive operation register display (first two digits of PR numeric portion).
  useEffect(() => {
    setOperation(programRegister.slice(0, 2));
  }, [programRegister]);

  const handleDrumTransfer = useCallback(async () => {
    const targetAddress = addressRegister;

    if (displaySwitch === Display.READ_OUT_STORAGE) {
      const value = await getDrumLocation(targetAddress);
      await setDistributor(value);
    } else if (displaySwitch === Display.READ_IN_STORAGE) {
      await setDistributor(consoleSwitches);
      await setDrumLocation(targetAddress, consoleSwitches);
    }
  }, [addressRegister, displaySwitch, consoleSwitches, setDistributor, getDrumLocation, setDrumLocation]);

  const onDisplayChange = useCallback((value: number) => {
    setDisplaySwitch(value);
  }, []);

  const onAddressChange = useCallback(
    async (value: string) => {
      setAddressSwitches(value);
    },
    []
  );

  const onProgrammedChange = useCallback(
    async (value: number) => {
      const stopSelected = value === Programmed.STOP;
      await setProgrammedStop(stopSelected);
    },
    [setProgrammedStop]
  );

  const onHalfCycleChange = useCallback(
    async (value: number) => {
      const halfSelected = value === HalfCycle.HALF;
      await setHalfCycle(halfSelected);
    },
    [setHalfCycle]
  );

  const onControlChange = useCallback((value: number) => {
    setControlSwitch(value);
  }, []);

  const onOverflowChange = useCallback(
    async (value: number) => {
      const stopSelected = value === Overflow.STOP;
      await setOverflowStop(stopSelected);
    },
    [setOverflowStop]
  );

  const onErrorChange = useCallback((value: number) => {
    setErrorSwitch(value);
  }, []);

  const onEntryValueChange = useCallback(
    async (value: string) => {
      await setConsoleSwitches(value);
    },
    [setConsoleSwitches]
  );

  const handleProgramStart = useCallback(async () => {
    await goCommand();
  }, [goCommand]);

  const onProgramStartClick = useCallback(async () => {
    if (isRunning) return;
    if (controlSwitch === Control.MANUAL_OP) {
      await handleDrumTransfer();
    } else {
      await handleProgramStart();
      setIsRunning(true);
    }
  }, [controlSwitch, handleDrumTransfer, handleProgramStart, isRunning]);

  const onProgramStopClick = useCallback(async () => {
    await escape();
    setIsRunning(false);
    await refreshRegisters();
  }, [escape, refreshRegisters]);

  const onProgramResetClick = useCallback(async () => {
    if (isRunning) {
      await escape();
      setIsRunning(false);
    }
    await setProgramRegister('00000');
    const addressValue = controlSwitch === Control.MANUAL_OP ? '0000' : '8000';
    await setAddressRegister(addressValue);
    await refreshRegisters();
  }, [escape, controlSwitch, isRunning, setAddressRegister, setProgramRegister, refreshRegisters]);

  const onComputerResetClick = useCallback(async () => {
    if (isRunning) {
      await escape();
      setIsRunning(false);
    }
    await resetCommand();
    setIsRunning(false);
    await refreshRegisters();
  }, [isRunning, resetCommand, escape, refreshRegisters]);

  const onAccumResetClick = useCallback(async () => {
    const zeroWord = '0000000000+';
    await Promise.all([
      setDistributor(zeroWord),
      setLowerAccumulator(zeroWord),
      setUpperAccumulator(zeroWord),
      request(`/api/state/OV`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: '0' }),
      }),
    ]);
    await refreshRegisters();
  }, [setDistributor, setLowerAccumulator, setUpperAccumulator, refreshRegisters]);

  const onTransferClick = useCallback(async () => {
    if (controlSwitch === Control.MANUAL_OP) {
      await setAddressRegister(addressSwitches);
    }
  }, [addressSwitches, controlSwitch, setAddressRegister]);

  const onRestartClick = useCallback(async () => {
    await restart();
    setIsRunning(false);
  }, [restart]);

  const onErrorResetClick = useCallback(() => {}, []);

  const onErrorSenseResetClick = useCallback(() => {}, []);

  const value = useMemo(
    () => ({
      output,
      initialized,
      displaySwitch,
      controlSwitch,
      errorSwitch,
      addressSwitches,
      addressRegister,
      programRegister,
      lowerAccumulator,
      upperAccumulator,
      distributor,
      consoleSwitches,
      programmedStop,
      overflowStop,
      halfCycle,
      displayValue,
      operation,
      // expose frozen copies so consumers can't mutate internal state objects
      operatingState: Object.freeze({ ...operatingState }),
      checkingState: Object.freeze({ ...checkingState }),
      refreshRegisters,
      // API actions (wrapped to keep local state in sync)
      sendCommand: api.sendCommand,
      onDisplayChange,
      onAddressChange,
      onProgrammedChange,
      onHalfCycleChange,
      onControlChange,
      onOverflowChange,
      onErrorChange,
      onEntryValueChange,
      onTransferClick,
      onProgramStartClick,
      onProgramStopClick,
      onProgramResetClick,
      onComputerResetClick,
      onAccumResetClick,
      onErrorResetClick,
      onErrorSenseResetClick,
      onRestartClick,
    }),
    [
      api.sendCommand,
      output,
      initialized,
      displaySwitch,
      controlSwitch,
      errorSwitch,
      addressSwitches,
      addressRegister,
      programRegister,
      lowerAccumulator,
      upperAccumulator,
      distributor,
      consoleSwitches,
      programmedStop,
      overflowStop,
      halfCycle,
      displayValue,
      operation,
      operatingState,
      checkingState,
      refreshRegisters,
      onDisplayChange,
      onAddressChange,
      onProgrammedChange,
      onHalfCycleChange,
      onControlChange,
      onOverflowChange,
      onErrorChange,
      onEntryValueChange,
      onTransferClick,
      onProgramStartClick,
      onProgramStopClick,
      onProgramResetClick,
      onComputerResetClick,
      onAccumResetClick,
      onErrorResetClick,
      onErrorSenseResetClick,
      onRestartClick,
    ]
  );

  useEffect(() => {
    const startEmulator = async () => {
      try {
        const response = await request('/api/start', { method: 'POST' });
        const data = response.ok ? await parseJson<{ error?: string }>(response) : undefined;
        if (data && data.error) {
          setOutput((prev) => prev + `Error: ${data.error}\n`);
        } else {
          // Set storage size to 1k; memory access fails without this
          await api.sendCommand('SET CPU 1K', { appendCR: true, expectResponse: false });
          await refreshRegisters();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setOutput((prev) => prev + `Error initializing emulator: ${msg}\n`);
      } finally {
        setInitialized(true);
      }
    };
    startEmulator();
  }, [api, refreshRegisters]);

  // Subscribe to streaming emulator output via SSE
  useEffect(() => {
    if (!initialized) return;

    let source: EventSource | null = null;
    let retryTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      source = new EventSource('/api/console/stream');
      source.onmessage = (event) => {
        try {
          const line = JSON.parse(event.data) as string;
          setOutput((prev) => prev + line);
        } catch (err) {
          console.error('Failed to parse console stream', err);
        }
      };
      source.addEventListener('exit', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { code: number };
          setOutput((prev) => prev + `\n[emulator exited with code ${payload.code}]\n`);
        } catch {
          setOutput((prev) => prev + `\n[emulator exited]\n`);
        }
        source?.close();
      });
      source.onerror = () => {
        console.warn('[SSE client] error, reconnecting');
        // Retry with small backoff; suppress noisy empty errors.
        source?.close();
        retryTimer = setTimeout(connect, 1000);
      };
    };

    connect();

    return () => {
      source?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [initialized, consoleStreamVersion]);

  return (
    <EmulatorContext.Provider value={value}>
      {children}
    </EmulatorContext.Provider>
  );
}
