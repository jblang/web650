'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Display, Control, Programmed, HalfCycle, Overflow } from './FrontPanel/ConfigSection';
import type { OperatingState } from './FrontPanel/OperatingStatus';
import type { CheckingState } from './FrontPanel/CheckingStatus';
import * as simhWasm from '@/lib/simh-wasm';

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
  onHelpClick: () => void;
  onCheatClick: () => void;
  onEmulatorResetClick: () => Promise<void>;
}

const EmulatorContext = createContext<EmulatorContextType | null>(null);

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

  /* ── WASM-backed operations ─────────────────────────────────── */

  const refreshRegisters = useCallback(async () => {
    const regs = simhWasm.examineState('STATE');
    const getBool = (key: string) => (regs[key]?.trim() ?? '0') === '1';
    setAddressRegisterState(regs.AR ?? '0000');
    setProgramRegisterState(regs.PR ?? '00000');
    setLowerAccumulatorState(regs.ACCLO ?? '0000000000+');
    setUpperAccumulatorState(regs.ACCUP ?? '0000000000+');
    setDistributorState(regs.DIST ?? '0000000000+');
    setConsoleSwitchesState(regs.CSW ?? '0000000000+');
    setProgrammedStopState(getBool('CSWPS'));
    setOverflowStopState(getBool('CSWOS'));
    setHalfCycleState(getBool('HALF'));
  }, []);

  const sendCommand = useCallback(
    async (command: string, _options?: { appendCR?: boolean; expectResponse?: boolean }): Promise<string> => {
      setOutput((prev) => prev + `sim> ${command}\n`);
      const result = simhWasm.sendCommand(command);
      if (result.trim()) {
        setOutput((prev) => prev + result + '\n');
      }
      return result;
    },
    []
  );

  const getDrumLocation = useCallback((address: string): string => {
    const regs = simhWasm.examineState(address);
    const numeric = String(parseInt(address, 10));
    return regs[address] ?? regs[numeric] ?? regs[numeric.padStart(4, '0')] ?? '';
  }, []);

  const setDrumLocation = useCallback((address: string, value: string): void => {
    simhWasm.depositState(address, value);
  }, []);

  const restart = useCallback(async () => {
    setInitialized(false);
    setOutput('');
    setIsRunning(false);

    await simhWasm.restart();
    simhWasm.sendCommand('SET CPU 1K');
    await refreshRegisters();
    setInitialized(true);
  }, [refreshRegisters]);

  /* ── Register setters (deposit + update local state) ────────── */

  const setAddressRegister = useCallback(async (value: string) => {
    simhWasm.depositState('AR', value);
    setAddressRegisterState(value);
  }, []);

  const setProgramRegister = useCallback(async (value: string) => {
    simhWasm.depositState('PR', value);
    setProgramRegisterState(value);
  }, []);

  const setDistributor = useCallback(async (value: string) => {
    simhWasm.depositState('DIST', value);
    setDistributorState(value);
  }, []);

  const setConsoleSwitches = useCallback(async (value: string) => {
    simhWasm.depositState('CSW', value);
    setConsoleSwitchesState(value);
  }, []);

  const setProgrammedStop = useCallback(async (value: boolean) => {
    simhWasm.depositState('CSWPS', value ? '1' : '0');
    setProgrammedStopState(value);
  }, []);

  const setOverflowStop = useCallback(async (value: boolean) => {
    simhWasm.depositState('CSWOS', value ? '1' : '0');
    setOverflowStopState(value);
  }, []);

  const setHalfCycle = useCallback(async (value: boolean) => {
    simhWasm.depositState('HALF', value ? '1' : '0');
    setHalfCycleState(value);
  }, []);

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
      const value = getDrumLocation(targetAddress);
      await setDistributor(value);
    } else if (displaySwitch === Display.READ_IN_STORAGE) {
      await setDistributor(consoleSwitches);
      setDrumLocation(targetAddress, consoleSwitches);
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

  /* ── Program control ────────────────────────────────────────── */

  const handleProgramStart = useCallback(async () => {
    simhWasm.startRunning(() => {
      refreshRegisters();
      if (!simhWasm.isRunning()) {
        setIsRunning(false);
      }
    });
  }, [refreshRegisters]);

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
    simhWasm.stopRunning();
    setIsRunning(false);
    await refreshRegisters();
  }, [refreshRegisters]);

  const onProgramResetClick = useCallback(async () => {
    if (isRunning) {
      simhWasm.stopRunning();
      setIsRunning(false);
    }
    await setProgramRegister('00000');
    const addressValue = controlSwitch === Control.MANUAL_OP ? '0000' : '8000';
    await setAddressRegister(addressValue);
    await refreshRegisters();
  }, [controlSwitch, isRunning, setAddressRegister, setProgramRegister, refreshRegisters]);

  const onComputerResetClick = useCallback(async () => {
    if (isRunning) {
      simhWasm.stopRunning();
      setIsRunning(false);
    }
    simhWasm.sendCommand('RESET');
    setIsRunning(false);
    await refreshRegisters();
  }, [isRunning, refreshRegisters]);

  const onAccumResetClick = useCallback(async () => {
    const zeroWord = '0000000000+';
    simhWasm.depositState('DIST', zeroWord);
    simhWasm.depositState('ACCLO', zeroWord);
    simhWasm.depositState('ACCUP', zeroWord);
    simhWasm.depositState('OV', '0');
    setDistributorState(zeroWord);
    setLowerAccumulatorState(zeroWord);
    setUpperAccumulatorState(zeroWord);
    await refreshRegisters();
  }, [refreshRegisters]);

  const onTransferClick = useCallback(async () => {
    if (controlSwitch === Control.MANUAL_OP) {
      await setAddressRegister(addressSwitches);
    }
  }, [addressSwitches, controlSwitch, setAddressRegister]);

  const onEmulatorResetClick = useCallback(async () => {
    await restart();
    setIsRunning(false);
  }, [restart]);

  const onHelpClick = useCallback(() => {}, []);

  const onCheatClick = useCallback(() => {}, []);

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
      sendCommand,
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
      onHelpClick,
      onCheatClick,
      onEmulatorResetClick,
    }),
    [
      sendCommand,
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
      onHelpClick,
      onCheatClick,
      onEmulatorResetClick,
    ]
  );

  /* ── Initialization ─────────────────────────────────────────── */

  useEffect(() => {
    // Capture tick-loop output (device I/O during program execution)
    simhWasm.onOutput((text) => setOutput((prev) => prev + text));

    const initialize = async () => {
      try {
        await simhWasm.init();
        simhWasm.sendCommand('SET CPU 1K');
        refreshRegisters();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setOutput((prev) => prev + `Error initializing emulator: ${msg}\n`);
      } finally {
        setInitialized(true);
      }
    };
    initialize();

    return () => {
      simhWasm.onOutput(null);
    };
  }, [refreshRegisters]);

  return (
    <EmulatorContext.Provider value={value}>
      {children}
    </EmulatorContext.Provider>
  );
}
