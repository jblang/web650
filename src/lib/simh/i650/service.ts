import * as simh from '../workerClient';
import { ZERO_ADDRESS, ZERO_DATA, ZERO_OPERATION } from './constants';
import { getDisplayValue, isManualOperation, DisplaySwitch } from './controls';
import { extractOperationCode } from './format';
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition } from './controls';

export type I650EmulatorState = {
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
};

type StateListener = (state: I650EmulatorState) => void;
type OutputListener = (text: string) => void;

const listeners = new Set<StateListener>();
const outputListeners = new Set<OutputListener>();

let state: I650EmulatorState = {
  initialized: false,
  isRunning: false,
  yieldSteps: 100,
  displaySwitch: 0,
  controlSwitch: 0,
  errorSwitch: 0,
  addressSwitches: ZERO_ADDRESS,
  addressRegister: ZERO_ADDRESS,
  programRegister: ZERO_DATA,
  lowerAccumulator: ZERO_DATA,
  upperAccumulator: ZERO_DATA,
  distributor: ZERO_DATA,
  consoleSwitches: ZERO_DATA,
  programmedStop: false,
  overflowStop: false,
  halfCycle: false,
  displayValue: ZERO_DATA,
  operation: ZERO_OPERATION,
};

let initialized = false;
let outputInitialized = false;

function computeDerived(next: I650EmulatorState): I650EmulatorState {
  const displayValue = getDisplayValue(next.displaySwitch, {
    lowerAccumulator: next.lowerAccumulator,
    upperAccumulator: next.upperAccumulator,
    distributor: next.distributor,
    programRegister: next.programRegister,
  });
  const operation = extractOperationCode(next.programRegister);
  return { ...next, displayValue, operation };
}

function emit(next: I650EmulatorState): void {
  state = computeDerived(next);
  for (const listener of listeners) {
    listener(state);
  }
}

function mergeState(patch: Partial<I650EmulatorState>): void {
  emit({ ...state, ...patch });
}

export function getState(): I650EmulatorState {
  return state;
}

export function subscribe(listener: StateListener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    if (!outputInitialized) {
      outputInitialized = true;
      await simh.onOutput((text) => {
        for (const listener of outputListeners) {
          listener(text);
        }
      });
    }

    await simh.init();
    const initialYieldSteps = await simh.getYieldSteps();
    mergeState({ yieldSteps: initialYieldSteps });

    await refreshRegisters();
    mergeState({ initialized: true });

    simh.onRunState((runningFlag) => {
      mergeState({ isRunning: runningFlag });
      void refreshRegisters();
    });
  } catch (err) {
    initialized = false;
    throw err;
  }
}

export async function restart(): Promise<void> {
  mergeState({ initialized: false, isRunning: false });
  await simh.restart();
  await refreshRegisters();
  mergeState({ initialized: true });
}

export function subscribeOutput(listener: OutputListener): () => void {
  outputListeners.add(listener);
  return () => {
    outputListeners.delete(listener);
  };
}

export async function refreshRegisters(): Promise<void> {
  const snapshot = await simh.getRegisterSnapshot();
  mergeState({
    addressRegister: snapshot.addressRegister,
    programRegister: snapshot.programRegister,
    lowerAccumulator: snapshot.lowerAccumulator,
    upperAccumulator: snapshot.upperAccumulator,
    distributor: snapshot.distributor,
    consoleSwitches: snapshot.consoleSwitches,
    programmedStop: snapshot.programmedStop,
    overflowStop: snapshot.overflowStop,
    halfCycle: snapshot.halfCycle,
  });
}

export async function executeCommand(
  command: string,
  options?: { streamOutput?: boolean }
): Promise<string> {
  const result = await simh.sendCommand(command, options);
  await refreshRegisters();
  return result;
}

export async function setYieldSteps(steps: number): Promise<void> {
  const next = Number.isFinite(steps) ? Math.max(1, Math.min(100000, Math.round(steps))) : 100;
  await simh.setYieldSteps(next);
  mergeState({ yieldSteps: next });
}

export function setDisplaySwitch(value: DisplayPosition): void {
  mergeState({ displaySwitch: value });
}

export function setControlSwitch(value: ControlPosition): void {
  mergeState({ controlSwitch: value });
}

export function setErrorSwitch(value: ErrorSwitchPosition): void {
  mergeState({ errorSwitch: value });
}

export function setAddressSwitches(value: string): void {
  mergeState({ addressSwitches: value });
}

export async function setAddressRegister(value: string): Promise<void> {
  await simh.setAddressRegister(value);
  mergeState({ addressRegister: value });
}

export async function setProgramRegister(value: string): Promise<void> {
  await simh.setProgramRegister(value);
  mergeState({ programRegister: value });
}

export async function setDistributor(value: string): Promise<void> {
  await simh.setDistributor(value);
  mergeState({ distributor: value });
}

export async function setConsoleSwitches(value: string): Promise<void> {
  await simh.setConsoleSwitches(value);
  mergeState({ consoleSwitches: value });
}

export async function setProgrammedStop(value: boolean): Promise<void> {
  await simh.setProgrammedStop(value);
  mergeState({ programmedStop: value });
}

export async function setOverflowStop(value: boolean): Promise<void> {
  await simh.setOverflowStop(value);
  mergeState({ overflowStop: value });
}

export async function setHalfCycle(value: boolean): Promise<void> {
  await simh.setHalfCycle(value);
  mergeState({ halfCycle: value });
}

export async function resetAccumulator(): Promise<void> {
  await simh.resetAccumulator();
  mergeState({
    distributor: ZERO_DATA,
    lowerAccumulator: ZERO_DATA,
    upperAccumulator: ZERO_DATA,
  });
  await refreshRegisters();
}

export async function reset(): Promise<void> {
  await simh.reset();
  await refreshRegisters();
}

export async function handleDrumTransfer(): Promise<void> {
  if (state.displaySwitch === DisplaySwitch.READ_OUT_STORAGE) {
    const value = await simh.readMemory(state.addressRegister);
    await setDistributor(value);
    return;
  }

  if (state.displaySwitch === DisplaySwitch.READ_IN_STORAGE) {
    await simh.writeMemory(state.addressRegister, state.consoleSwitches);
    await setDistributor(state.consoleSwitches);
  }
}

export async function startProgram(): Promise<void> {
  await simh.sendCommand('GO', { streamOutput: true });
}

export async function startProgramOrTransfer(): Promise<void> {
  if (state.isRunning) return;
  if (isManualOperation(state.controlSwitch)) {
    await handleDrumTransfer();
    return;
  }
  await startProgram();
}

export async function stopProgram(): Promise<void> {
  await simh.stopCpu();
  await refreshRegisters();
}

export async function resetProgram(): Promise<void> {
  if (state.isRunning) {
    await simh.stopCpu();
  }
  await setProgramRegister(ZERO_DATA);
  await setAddressRegister(ZERO_ADDRESS);
  await refreshRegisters();
}

export async function resetComputer(): Promise<void> {
  if (state.isRunning) {
    await simh.stopCpu();
  }
  await simh.reset();
  await refreshRegisters();
}

export async function transferAddress(): Promise<void> {
  if (isManualOperation(state.controlSwitch)) {
    await setAddressRegister(state.addressSwitches);
  }
}
