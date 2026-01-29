'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, useMemo, type Dispatch, type SetStateAction } from 'react';

interface EmulatorContextType {
  initialized: boolean;
  loading: boolean;
  output: string;
  appendOutput: (text: string) => void;
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<string>;
  clearBreakpoints: () => Promise<void>;
  deleteBreakpoint: (address: string) => Promise<void>;
  setBreakpoint: (address: string) => Promise<void>;
  getDrumLocation: (address: string) => Promise<string>;
  setDrumLocation: (address: string, value: string) => Promise<void>;
  setProgramRegister: (value: string) => Promise<void>;
  setOverflowFlag: (value: string) => Promise<void>;
  setLowerAccumulator: (value: string) => Promise<void>;
  setUpperAccumulator: (value: string) => Promise<void>;
  setDistributor: (value: string) => Promise<void>;
  setAddressRegister: (address: string) => Promise<void>;
  setConsoleSwitches: (value: string) => Promise<void>;
  setHalfCycle: (value: boolean) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setOverflowStop: (value: boolean) => Promise<void>;
  setProgrammedStop: (value: boolean) => Promise<void>;
  restart: () => Promise<void>;
  step: () => Promise<void>;
  stop: () => Promise<void>;
  go: () => Promise<void>;
  reset: () => Promise<void>;
  // Panel-only state (not backed by emulator registers)
  displaySwitch: number;
  setDisplaySwitch: Dispatch<SetStateAction<number>>;
  controlSwitch: number;
  setControlSwitch: Dispatch<SetStateAction<number>>;
  errorSwitch: number;
  setErrorSwitch: Dispatch<SetStateAction<number>>;
  addressSwitches: string;
  setAddressSwitches: Dispatch<SetStateAction<string>>;
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
}

const EmulatorContext = createContext<EmulatorContextType | null>(null);

type EmulatorApi = {
  appendOutput: EmulatorContextType['appendOutput'];
  sendCommand: EmulatorContextType['sendCommand'];
  clearBreakpoints: EmulatorContextType['clearBreakpoints'];
  deleteBreakpoint: EmulatorContextType['deleteBreakpoint'];
  setBreakpoint: EmulatorContextType['setBreakpoint'];
  getDrumLocation: EmulatorContextType['getDrumLocation'];
  setDrumLocation: EmulatorContextType['setDrumLocation'];
  setProgramRegister: EmulatorContextType['setProgramRegister'];
  setOverflowFlag: EmulatorContextType['setOverflowFlag'];
  setLowerAccumulator: EmulatorContextType['setLowerAccumulator'];
  setUpperAccumulator: EmulatorContextType['setUpperAccumulator'];
  setDistributor: EmulatorContextType['setDistributor'];
  setAddressRegister: EmulatorContextType['setAddressRegister'];
  setConsoleSwitches: EmulatorContextType['setConsoleSwitches'];
  setHalfCycle: EmulatorContextType['setHalfCycle'];
  setOverflowStop: EmulatorContextType['setOverflowStop'];
  setProgrammedStop: EmulatorContextType['setProgrammedStop'];
  step: EmulatorContextType['step'];
  go: EmulatorContextType['go'];
  stop: EmulatorContextType['stop'];
  reset: EmulatorContextType['reset'];
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

  type CommandAction = 'step' | 'go' | 'reset';
  const command = async (action: CommandAction): Promise<void> => {
    const res = await request(`/api/command/${action}`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Control ${action} failed (${res.status})`);
    }
  };

  return {
    appendOutput,
    sendCommand,
    setBreakpoint: async (address: string) => {
      await request(`/api/command/break/${address}`, { method: 'PUT' });
    },
    deleteBreakpoint: async (address: string) => {
      await request(`/api/command/break/${address}`, { method: 'DELETE' });
    },
    clearBreakpoints: async () => {
      await request('/api/command/break', { method: 'DELETE' });
    },
    step: () => command('step'),
    go: () => command('go'),
    stop: async () => {
      const res = await request('/api/escape', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Escape failed (${res.status})`);
      }
    },
    reset: () => command('reset'),
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
    setOverflowFlag: async (value: string) => {
      await request(`/api/state/OV`, {
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
    getDrumLocation: async (address: string) => {
      const res = await request(`/api/state/${address}`, { method: 'GET' });
      if (!res.ok) throw new Error(`State request failed (${res.status})`);
      const data = await parseJson<{ registers?: Record<string, string> }>(res);
      const registers = data?.registers ?? {};
      const numeric = String(parseInt(address, 10));
      return registers[address] ?? registers[numeric] ?? registers[numeric.padStart(4, '0')] ?? '';
    },
    setDrumLocation: async (address: string, value: string) => {
      await request(`/api/state/${address}`, {
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
  const [loading, setLoading] = useState(true);
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

  const restart = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
      setInitialized(true);
    }
  }, [api, refreshRegisters]);

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

  const value = useMemo(
    () => ({
      output,
      loading,
      initialized,
      setLoading,
      displaySwitch,
      setDisplaySwitch,
      controlSwitch,
      setControlSwitch,
      errorSwitch,
      setErrorSwitch,
      addressSwitches,
      setAddressSwitches,
      addressRegister,
      programRegister,
      lowerAccumulator,
      upperAccumulator,
      distributor,
      consoleSwitches,
      programmedStop,
      overflowStop,
      halfCycle,
      refreshRegisters,
      // API actions (wrapped to keep local state in sync)
      appendOutput: api.appendOutput,
      sendCommand: api.sendCommand,
      clearBreakpoints: api.clearBreakpoints,
      deleteBreakpoint: api.deleteBreakpoint,
      setBreakpoint: api.setBreakpoint,
      getDrumLocation: api.getDrumLocation,
      setDrumLocation: api.setDrumLocation,
      setProgramRegister,
      setOverflowFlag: api.setOverflowFlag,
      setLowerAccumulator,
      setUpperAccumulator,
      setDistributor,
      setAddressRegister,
      setConsoleSwitches,
      setHalfCycle,
      setOverflowStop,
      setProgrammedStop,
      step: api.step,
      go: api.go,
      stop: api.stop,
      reset: api.reset,
      restart,
    }),
    [
      output,
      loading,
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
      refreshRegisters,
      api,
      setProgramRegister,
      setLowerAccumulator,
      setUpperAccumulator,
      setDistributor,
      setAddressRegister,
      setConsoleSwitches,
      setHalfCycle,
      setOverflowStop,
      setProgrammedStop,
      restart,
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
        setLoading(false);
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
