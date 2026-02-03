'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { Programmed, HalfCycle, Overflow } from './FrontPanel/ConfigSection';
import type { OperatingState } from './FrontPanel/OperatingStatus';
import type { CheckingState } from './FrontPanel/CheckingStatus';
import { i650Service } from '@/lib/simh/client';
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition, I650EmulatorState } from '@/lib/simh/client';

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
  isRunning: boolean;
  yieldSteps: number;
  setYieldSteps: (steps: number) => void;
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
  const [emuState, setEmuState] = useState<I650EmulatorState>(() => i650Service.getState());
  const outputBufferRef = useRef('');

  const enqueueOutput = useCallback((text: string) => {
    outputBufferRef.current += text;
  }, []);

  useEffect(() => {
    const flush = () => {
      const chunk = outputBufferRef.current;
      if (!chunk) return;
      outputBufferRef.current = '';
      setOutput((prev) => prev + chunk);
    };

    const id = setInterval(flush, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => i650Service.subscribe(setEmuState), []);
  useEffect(() => i650Service.subscribeOutput(enqueueOutput), [enqueueOutput]);

  const sendCommand = useCallback(
    async (command: string): Promise<string> => {
      const trimmed = command.trim();
      if (!trimmed) return '';

      enqueueOutput(`sim> ${trimmed}\n`);

      const result = await i650Service.executeCommand(trimmed, { streamOutput: true });
      return result;
    },
    [enqueueOutput]
  );

  const setYieldSteps = useCallback((steps: number) => {
    void i650Service.setYieldSteps(steps);
  }, []);

  const refreshRegisters = useCallback(() => i650Service.refreshRegisters(), []);

  const onDisplayChange = useCallback((value: DisplayPosition) => {
    i650Service.setDisplaySwitch(value);
  }, []);

  const onAddressChange = useCallback(
    async (value: string) => {
      i650Service.setAddressSwitches(value);
    },
    []
  );

  const onProgrammedChange = useCallback(
    async (value: number) => {
      const stopSelected = value === Programmed.STOP;
      await i650Service.setProgrammedStop(stopSelected);
    },
    []
  );

  const onHalfCycleChange = useCallback(
    async (value: number) => {
      const halfSelected = value === HalfCycle.HALF;
      await i650Service.setHalfCycle(halfSelected);
    },
    []
  );

  const onControlChange = useCallback((value: ControlPosition) => {
    i650Service.setControlSwitch(value);
  }, []);

  const onOverflowChange = useCallback(
    async (value: number) => {
      const stopSelected = value === Overflow.STOP;
      await i650Service.setOverflowStop(stopSelected);
    },
    []
  );

  const onErrorChange = useCallback((value: ErrorSwitchPosition) => {
    i650Service.setErrorSwitch(value);
  }, []);

  const onEntryValueChange = useCallback(
    async (value: string) => {
      await i650Service.setConsoleSwitches(value);
    },
    []
  );

  /* ── Program control ────────────────────────────────────────── */
  const onProgramStartClick = useCallback(async () => {
    await i650Service.startProgramOrTransfer();
  }, []);

  const onProgramStopClick = useCallback(async () => {
    await i650Service.stopProgram();
  }, []);

  const onProgramResetClick = useCallback(async () => {
    await i650Service.resetProgram();
  }, []);

  const onComputerResetClick = useCallback(async () => {
    await i650Service.resetComputer();
  }, []);

  const onAccumResetClick = useCallback(async () => {
    await i650Service.resetAccumulator();
  }, []);

  const onTransferClick = useCallback(async () => {
    await i650Service.transferAddress();
  }, []);

  const onEmulatorResetClick = useCallback(async () => {
    setOutput('');
    await i650Service.restart();
  }, []);

  const onHelpClick = useCallback(() => {}, []);

  const onCheatClick = useCallback(() => {}, []);

  // Context 1: Console (changes frequently)
  const consoleValue = useMemo(
    () => ({
      output,
      sendCommand,
      isRunning: emuState.isRunning,
      yieldSteps: emuState.yieldSteps,
      setYieldSteps,
    }),
    [output, sendCommand, emuState.isRunning, emuState.yieldSteps, setYieldSteps]
  );

  // Context 2: State (changes when registers/switches change)
  const stateValue = useMemo(
    () => ({
      initialized: emuState.initialized,
      displaySwitch: emuState.displaySwitch,
      controlSwitch: emuState.controlSwitch,
      errorSwitch: emuState.errorSwitch,
      addressSwitches: emuState.addressSwitches,
      addressRegister: emuState.addressRegister,
      programRegister: emuState.programRegister,
      lowerAccumulator: emuState.lowerAccumulator,
      upperAccumulator: emuState.upperAccumulator,
      distributor: emuState.distributor,
      consoleSwitches: emuState.consoleSwitches,
      programmedStop: emuState.programmedStop,
      overflowStop: emuState.overflowStop,
      halfCycle: emuState.halfCycle,
      displayValue: emuState.displayValue,
      operation: emuState.operation,
    }),
    [emuState]
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
    const initialize = async () => {
      try {
        await i650Service.init();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        enqueueOutput(`Error initializing emulator: ${msg}\n`);
      }
    };
    initialize();
  }, [enqueueOutput]);

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
