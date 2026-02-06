'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import type { OperatingState } from './FrontPanel/OperatingStatus';
import type { CheckingState } from './FrontPanel/CheckingStatus';
import * as i650Service from '@/lib/simh/i650/service';
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition } from '@/lib/simh/i650/controls';
import type { I650EmulatorState } from '@/lib/simh/i650/service';

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

interface EmulatorStateContextType {
  initialized: boolean;
  isRunning: boolean;
  yieldSteps: number;
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
  stateStreamTick: number;
}

const EmulatorStateContext = createContext<EmulatorStateContextType | null>(null);

export function useEmulatorState() {
  const context = useContext(EmulatorStateContext);
  if (!context) {
    throw new Error('useEmulatorState must be used within EmulatorStateProvider');
  }
  return context;
}

export function EmulatorStateProvider({ children }: { children: ReactNode }) {
  const [emuState, setEmuState] = useState<I650EmulatorState>(() => i650Service.getState());

  useEffect(() => i650Service.subscribe(setEmuState), []);

  const stateValue = useMemo(
    () => ({
      initialized: emuState.initialized,
      isRunning: emuState.isRunning,
      yieldSteps: emuState.yieldSteps,
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
      stateStreamTick: emuState.stateStreamTick,
    }),
    [emuState]
  );

  return <EmulatorStateContext.Provider value={stateValue}>{children}</EmulatorStateContext.Provider>;
}
