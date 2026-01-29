'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo, type Dispatch, type SetStateAction } from 'react';

interface EmulatorContextType {
  initialized: boolean;
  loading: boolean;
  output: string;
  appendOutput: (text: string) => void;
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<string>;
  clearBreakpoints: () => Promise<void>;
  deleteBreakpoint: (address: string) => Promise<void>;
  getAddressRegister: () => Promise<string>;
  getDistributor: () => Promise<string>;
  getConsoleSwitches: () => Promise<string>;
  getHalfCycle: () => Promise<boolean | undefined>;
  getLowerAccumulator: () => Promise<string>;
  getOverflowStop: () => Promise<boolean | undefined>;
  getProgrammedStop: () => Promise<boolean | undefined>;
  getProgramRegister: () => Promise<string>;
  setProgramRegister: (value: string) => Promise<void>;
  setOverflowFlag: (value: string) => Promise<void>;
  setLowerAccumulator: (value: string) => Promise<void>;
  setUpperAccumulator: (value: string) => Promise<void>;
  setDistributor: (value: string) => Promise<void>;
  getDrumLocation: (address: string) => Promise<string>;
  setDrumLocation: (address: string, value: string) => Promise<void>;
  getUpperAccumulator: () => Promise<string>;
  setAddressRegister: (address: string) => Promise<void>;
  getAllRegisters: () => Promise<Record<string, string>>;
  // Panel-only state (not backed by emulator registers)
  displaySwitch: number;
  setDisplaySwitch: Dispatch<SetStateAction<number>>;
  controlSwitch: number;
  setControlSwitch: Dispatch<SetStateAction<number>>;
  errorSwitch: number;
  setErrorSwitch: Dispatch<SetStateAction<number>>;
  addressSwitches: string;
  setAddressSwitches: Dispatch<SetStateAction<string>>;
  setBreakpoint: (address: string) => Promise<void>;
  setConsoleSwitches: (value: string) => Promise<void>;
  setHalfCycle: (value: boolean) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setOverflowStop: (value: boolean) => Promise<void>;
  setProgrammedStop: (value: boolean) => Promise<void>;
  step: () => Promise<void>;
  stop: () => Promise<void>;
  go: () => Promise<void>;
  reset: () => Promise<void>;
}

const EmulatorContext = createContext<EmulatorContextType | null>(null);

type EmulatorApi = Omit<
  EmulatorContextType,
  | 'output'
  | 'loading'
  | 'initialized'
  | 'setLoading'
  | 'displaySwitch'
  | 'setDisplaySwitch'
  | 'controlSwitch'
  | 'setControlSwitch'
  | 'errorSwitch'
  | 'setErrorSwitch'
  | 'addressSwitches'
  | 'setAddressSwitches'
>;

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

  async function getState(): Promise<Record<string, string>>;
  async function getState(reg: string): Promise<string | undefined>;
  async function getState(reg?: string): Promise<string | Record<string, string> | undefined> {
    const path = reg ? `/api/state/${reg}` : '/api/state';
    const res = await request(path, { method: 'GET' });
    if (!res.ok) throw new Error(`State request failed (${res.status})`);
    const data = await parseJson<{ registers?: Record<string, string> }>(res);
    if (!data) throw new Error('Failed to parse state response');
    if (!reg) {
      if (!data.registers) throw new Error('State response missing registers');
      return data.registers;
    }
    const key = reg.trim().toUpperCase();
    const registers = data.registers ?? {};

    let val = registers[key];
    if (val === undefined && /^\d+$/.test(key)) {
      // SimH may echo numeric addresses without leading zeros; try unpadded and 4‑digit padded forms.
      const numeric = String(parseInt(key, 10));
      val = registers[numeric] ?? registers[numeric.padStart(4, '0')];
    }
    if (val === undefined) throw new Error(`State response missing ${key}`);
    return val as string;
  }

  const setState = async (reg: string, value: string): Promise<void> => {
    await request(`/api/state/${reg}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  };

  const getBooleanState = async (reg: string): Promise<boolean | undefined> => {
    const raw = await getState(reg);
    if (raw === undefined) return undefined;
    return raw.trim() === '1';
  };

  const setBooleanState = async (reg: string, value: boolean): Promise<void> => {
    await setState(reg, value ? '1' : '0');
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
    getAllRegisters: async () => (await getState()) as Record<string, string>,
    getAddressRegister: async () => getState('AR') as Promise<string>,
    setBreakpoint: async (address: string) => {
      await request(`/api/command/break/${address}`, { method: 'PUT'});
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
    setAddressRegister: (address: string) => setState('AR', address),
    getLowerAccumulator: () => getState('ACCLO') as Promise<string>,
    setLowerAccumulator: (value: string) => setState('ACCLO', value),
    getUpperAccumulator: () => getState('ACCUP') as Promise<string>,
    setUpperAccumulator: (value: string) => setState('ACCUP', value),
    getDistributor: () => getState('DIST') as Promise<string>,
    setDistributor: (value: string) => setState('DIST', value),
    setOverflowFlag: (value: string) => setState('OV', value),
    getProgramRegister: () => getState('PR') as Promise<string>,
    setProgramRegister: (value: string) => setState('PR', value),
    getDrumLocation: (address: string) => getState(address) as Promise<string>,
    setDrumLocation: (address: string, value: string) => setState(address, value),
    getConsoleSwitches: () => getState('CSW') as Promise<string>,
    setConsoleSwitches: (value: string) => setState('CSW', value),
    getProgrammedStop: () => getBooleanState('CSWPS'),
    setProgrammedStop: (value: boolean) => setBooleanState('CSWPS', value),
    getOverflowStop: () => getBooleanState('CSWOS'),
    setOverflowStop: (value: boolean) => setBooleanState('CSWOS', value),
    getHalfCycle: () => getBooleanState('HALF'),
    setHalfCycle: (value: boolean) => setBooleanState('HALF', value),
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
  // Panel-only switch state (not backed by emulator registers)
  const [displaySwitch, setDisplaySwitch] = useState<number>(0);
  const [controlSwitch, setControlSwitch] = useState<number>(0);
  const [errorSwitch, setErrorSwitch] = useState<number>(0);
  const [addressSwitches, setAddressSwitches] = useState<string>('0000');

  // Command queue to prevent overlapping requests
  const commandQueue = useRef<Promise<void>>(Promise.resolve());

  const api = useMemo(() => createEmulatorApi(commandQueue, setOutput), [setOutput]);

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
      ...api,
    }),
    [output, loading, initialized, displaySwitch, controlSwitch, errorSwitch, addressSwitches, api]
  );

  useEffect(() => {
    const startEmulator = async () => {
      try {
        const response = await request('/api/start', { method: 'POST' });
        const data = response.ok ? await parseJson<{ error?: string }>(response) : undefined;
        if (data && data.error) {
          setOutput((prev) => prev + `Error: ${data.error}\n`);
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
  }, []);

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
  }, [initialized]);

  return (
    <EmulatorContext.Provider value={value}>
      {children}
    </EmulatorContext.Provider>
  );
}
