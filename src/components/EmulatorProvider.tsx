'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Programmed, HalfCycle, Overflow } from './FrontPanel/ConfigSection';
import type { OperatingState } from './FrontPanel/OperatingStatus';
import type { CheckingState } from './FrontPanel/CheckingStatus';
import * as simh from '@/lib/simh';
import {
  ZERO_ADDRESS,
  ZERO_DATA,
  ZERO_OPERATION,
  extractOperationCode,
  getDisplayValue,
  performDrumTransfer,
  isManualOperation,
} from '@/lib/simh';
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition } from '@/lib/simh';

// Static state constants - frozen at module level
export const INITIAL_OPERATING_STATE: OperatingState = Object.freeze({
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

export const INITIAL_CHECKING_STATE: CheckingState = Object.freeze({
  programRegister: false,
  controlUnit: false,
  storageSelection: false,
  storageUnit: false,
  distributor: false,
  clocking: false,
  accumulator: false,
  errorSense: false,
});

// Context 1: Console output and commands (changes frequently during execution)
interface EmulatorConsoleContextType {
  output: string;
  sendCommand: (command: string) => Promise<string>;
}

// Context 2: Emulator state (registers, switches, derived values)
interface EmulatorStateContextType {
  initialized: boolean;
  displaySwitch: DisplayPosition;
  controlSwitch: ControlPosition;
  errorSwitch: ErrorSwitchPosition;
  addressSwitches: string;
  addressRegister: string;
  programRegister: string;
  lowerAccumulator: string;
  upperAccumulator: string;
  distributor: string;
  consoleSwitches: string;
  programmedStop: boolean;
  overflowStop: boolean;
  halfCycle: boolean;
  displayValue: string;
  operation: string;
}

// Context 3: Actions and callbacks (stable references)
interface EmulatorActionsContextType {
  refreshRegisters: () => Promise<void>;
  onDisplayChange: (value: DisplayPosition) => void;
  onAddressChange: (value: string) => Promise<void>;
  onProgrammedChange: (value: number) => Promise<void>;
  onHalfCycleChange: (value: number) => Promise<void>;
  onControlChange: (value: ControlPosition) => void;
  onOverflowChange: (value: number) => Promise<void>;
  onErrorChange: (value: ErrorSwitchPosition) => void;
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

const EmulatorConsoleContext = createContext<EmulatorConsoleContextType | null>(null);
const EmulatorStateContext = createContext<EmulatorStateContextType | null>(null);
const EmulatorActionsContext = createContext<EmulatorActionsContextType | null>(null);

export function useEmulatorConsole() {
  const context = useContext(EmulatorConsoleContext);
  if (!context) {
    throw new Error('useEmulatorConsole must be used within an EmulatorProvider');
  }
  return context;
}

export function useEmulatorState() {
  const context = useContext(EmulatorStateContext);
  if (!context) {
    throw new Error('useEmulatorState must be used within an EmulatorProvider');
  }
  return context;
}

export function useEmulatorActions() {
  const context = useContext(EmulatorActionsContext);
  if (!context) {
    throw new Error('useEmulatorActions must be used within an EmulatorProvider');
  }
  return context;
}

export default function EmulatorProvider({ children }: { children: ReactNode }) {
  const [output, setOutput] = useState('');
  const [initialized, setInitialized] = useState(false);
  // Emulator register snapshot (kept in provider so consumers don't fetch on demand)
  const [addressRegister, setAddressRegisterState] = useState<string>(ZERO_ADDRESS);
  const [programRegister, setProgramRegisterState] = useState<string>(ZERO_DATA);
  const [lowerAccumulator, setLowerAccumulatorState] = useState<string>(ZERO_DATA);
  const [upperAccumulator, setUpperAccumulatorState] = useState<string>(ZERO_DATA);
  const [distributor, setDistributorState] = useState<string>(ZERO_DATA);
  const [consoleSwitches, setConsoleSwitchesState] = useState<string>(ZERO_DATA);
  const [programmedStop, setProgrammedStopState] = useState<boolean>(false);
  const [overflowStop, setOverflowStopState] = useState<boolean>(false);
  const [halfCycle, setHalfCycleState] = useState<boolean>(false);
  const [displayValue, setDisplayValue] = useState<string>(ZERO_DATA);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [operation, setOperation] = useState<string>(ZERO_OPERATION);
  // Panel-only switch state (not backed by emulator registers)
  const [displaySwitch, setDisplaySwitch] = useState<DisplayPosition>(0);
  const [controlSwitch, setControlSwitch] = useState<ControlPosition>(0);
  const [errorSwitch, setErrorSwitch] = useState<ErrorSwitchPosition>(0);
  const [addressSwitches, setAddressSwitches] = useState<string>(ZERO_ADDRESS);

  /* ── WASM-backed operations ─────────────────────────────────── */

  const refreshRegisters = useCallback(async () => {
    setAddressRegisterState(simh.getAddressRegister());
    setProgramRegisterState(simh.getProgramRegister());
    setLowerAccumulatorState(simh.getLowerAccumulator());
    setUpperAccumulatorState(simh.getUpperAccumulator());
    setDistributorState(simh.getDistributor());
    setConsoleSwitchesState(simh.getConsoleSwitches());
    setProgrammedStopState(simh.getProgrammedStop());
    setOverflowStopState(simh.getOverflowStop());
    setHalfCycleState(simh.getHalfCycle());
  }, []);

  const sendCommand = useCallback(
    async (command: string): Promise<string> => {
      setOutput((prev) => prev + `sim> ${command}\n`);
      const result = simh.sendCommand(command);
      if (result.trim()) {
        setOutput((prev) => prev + result + '\n');
      }
      return result;
    },
    []
  );


  const restart = useCallback(async () => {
    setInitialized(false);
    setOutput('');
    setIsRunning(false);

    await simh.restart();
    await refreshRegisters();
    setInitialized(true);
  }, [refreshRegisters]);

  /* ── Register setters (deposit + update local state) ────────── */

  const setAddressRegister = useCallback(async (value: string) => {
    simh.setAddressRegister(value);
    setAddressRegisterState(value);
  }, []);

  const setProgramRegister = useCallback(async (value: string) => {
    simh.setProgramRegister(value);
    setProgramRegisterState(value);
  }, []);

  const setDistributor = useCallback(async (value: string) => {
    simh.setDistributor(value);
    setDistributorState(value);
  }, []);

  const setConsoleSwitches = useCallback(async (value: string) => {
    simh.setConsoleSwitches(value);
    setConsoleSwitchesState(value);
  }, []);

  const setProgrammedStop = useCallback(async (value: boolean) => {
    simh.setProgrammedStop(value);
    setProgrammedStopState(value);
  }, []);

  const setOverflowStop = useCallback(async (value: boolean) => {
    simh.setOverflowStop(value);
    setOverflowStopState(value);
  }, []);

  const setHalfCycle = useCallback(async (value: boolean) => {
    simh.setHalfCycle(value);
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
    setOperation(extractOperationCode(programRegister));
  }, [programRegister]);

  const handleDrumTransfer = useCallback(async () => {
    const result = performDrumTransfer(displaySwitch, addressRegister, consoleSwitches);

    if (result.type === 'read') {
      await setDistributor(result.value);
    } else if (result.type === 'write') {
      await setDistributor(result.value);
    }
  }, [addressRegister, displaySwitch, consoleSwitches, setDistributor]);

  const onDisplayChange = useCallback((value: DisplayPosition) => {
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

  const onControlChange = useCallback((value: ControlPosition) => {
    setControlSwitch(value);
  }, []);

  const onOverflowChange = useCallback(
    async (value: number) => {
      const stopSelected = value === Overflow.STOP;
      await setOverflowStop(stopSelected);
    },
    [setOverflowStop]
  );

  const onErrorChange = useCallback((value: ErrorSwitchPosition) => {
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
    simh.startRunning(() => {
      refreshRegisters();
      if (!simh.isRunning()) {
        setIsRunning(false);
      }
    });
  }, [refreshRegisters]);

  const onProgramStartClick = useCallback(async () => {
    if (isRunning) return;
    if (isManualOperation(controlSwitch)) {
      await handleDrumTransfer();
    } else {
      await handleProgramStart();
      setIsRunning(true);
    }
  }, [controlSwitch, handleDrumTransfer, handleProgramStart, isRunning]);

  const onProgramStopClick = useCallback(async () => {
    simh.stopRunning();
    setIsRunning(false);
    await refreshRegisters();
  }, [refreshRegisters]);

  const onProgramResetClick = useCallback(async () => {
    if (isRunning) {
      simh.stopRunning();
      setIsRunning(false);
    }
    await setProgramRegister(ZERO_DATA);
    await setAddressRegister(ZERO_ADDRESS);
    await refreshRegisters();
  }, [isRunning, setAddressRegister, setProgramRegister, refreshRegisters]);

  const onComputerResetClick = useCallback(async () => {
    if (isRunning) {
      simh.stopRunning();
      setIsRunning(false);
    }
    simh.reset();
    setIsRunning(false);
    await refreshRegisters();
  }, [isRunning, refreshRegisters]);

  const onAccumResetClick = useCallback(async () => {
    simh.resetAccumulator();
    setDistributorState(ZERO_DATA);
    setLowerAccumulatorState(ZERO_DATA);
    setUpperAccumulatorState(ZERO_DATA);
    await refreshRegisters();
  }, [refreshRegisters]);

  const onTransferClick = useCallback(async () => {
    if (isManualOperation(controlSwitch)) {
      await setAddressRegister(addressSwitches);
    }
  }, [addressSwitches, controlSwitch, setAddressRegister]);

  const onEmulatorResetClick = useCallback(async () => {
    await restart();
    setIsRunning(false);
  }, [restart]);

  const onHelpClick = useCallback(() => {}, []);

  const onCheatClick = useCallback(() => {}, []);

  // Context 1: Console (changes frequently)
  const consoleValue = useMemo(
    () => ({
      output,
      sendCommand,
    }),
    [output, sendCommand]
  );

  // Context 2: State (changes when registers/switches change)
  const stateValue = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  // Context 3: Actions (stable callbacks)
  const actionsValue = useMemo(
    () => ({
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
    }),
    [
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
    simh.onOutput((text) => setOutput((prev) => prev + text));

    const initialize = async () => {
      try {
        await simh.init();
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
      simh.onOutput(null);
    };
  }, [refreshRegisters]);

  return (
    <EmulatorConsoleContext.Provider value={consoleValue}>
      <EmulatorStateContext.Provider value={stateValue}>
        <EmulatorActionsContext.Provider value={actionsValue}>
          {children}
        </EmulatorActionsContext.Provider>
      </EmulatorStateContext.Provider>
    </EmulatorConsoleContext.Provider>
  );
}
