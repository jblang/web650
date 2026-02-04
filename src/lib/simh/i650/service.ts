import * as simh from '../workerClient';
import { ZERO_ADDRESS, ZERO_DATA, ZERO_OPERATION } from './constants';
import { getDisplayValue, isManualOperation, DisplaySwitch } from './controls';
import { extractOperationCode, validateAddress, validateWord } from './format';
import { postProcessI650Values } from './memory';
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition } from './controls';
import { debugLog, errorLog } from '../debug';
import { persistYieldSteps, readPersistedYieldSteps } from '../yield';

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
  yieldSteps: 1000,
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
let initPromise: Promise<void> | null = null;
const moduleName = 'i650';
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

async function examineI650(ref: string, options?: { echo?: boolean }): Promise<Record<string, string>> {
  const raw = await simh.examine(ref, options);
  return postProcessI650Values(raw);
}

async function readMemory(address: string): Promise<string> {
  validateAddress(address);
  const result = await examineI650(address);
  const numeric = String(parseInt(address, 10));
  const value = (
    result[address] ??
    result[numeric] ??
    result[numeric.padStart(4, '0')] ??
    ZERO_DATA
  );
  debugLog('i650 readMemory', { address, value });
  return value;
}

async function writeMemory(address: string, value: string): Promise<void> {
  validateAddress(address);
  validateWord(value);
  await simh.deposit(address, value);
}

async function getRegisterSnapshot(): Promise<{
  addressRegister: string;
  programRegister: string;
  lowerAccumulator: string;
  upperAccumulator: string;
  distributor: string;
  consoleSwitches: string;
  programmedStop: boolean;
  overflowStop: boolean;
  halfCycle: boolean;
}> {
  const values = await examineI650('STATE', { echo: false });
  return {
    addressRegister: values.AR ?? ZERO_ADDRESS,
    programRegister: values.PR ?? ZERO_DATA,
    lowerAccumulator: values.ACCLO ?? ZERO_DATA,
    upperAccumulator: values.ACCUP ?? ZERO_DATA,
    distributor: values.DIST ?? ZERO_DATA,
    consoleSwitches: values.CSW ?? ZERO_DATA,
    programmedStop: (values.CSWPS?.trim() ?? '0') === '1',
    overflowStop: (values.CSWOS?.trim() ?? '0') === '1',
    halfCycle: (values.HALF?.trim() ?? '0') === '1',
  };
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
  if (initPromise) return initPromise;
  if (initialized) return;
  initPromise = (async () => {
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

      debugLog('i650 init start');
      await simh.init(moduleName);
      debugLog('i650 init done');
      const postInit = async () => {
        debugLog('i650 postInit start');
        await simh.sendCommand('SET CPU 1K', { echo: false });
        const persistedYieldSteps = readPersistedYieldSteps();
        const initialYieldSteps = persistedYieldSteps ?? 1000;
        await simh.setYieldSteps(initialYieldSteps);
        mergeState({ yieldSteps: initialYieldSteps });
        if (persistedYieldSteps === null) {
          persistYieldSteps(initialYieldSteps);
        }

        await refreshRegisters();
        mergeState({ initialized: true });

        simh.onRunState((runningFlag) => {
          debugLog('i650 runstate', { runningFlag });
          mergeState({ isRunning: runningFlag });
          void refreshRegisters();
        });
        debugLog('i650 postInit done');
      };

      void postInit().catch((err) => {
        errorLog('i650 postInit error', err);
      });
    } catch (err) {
      initialized = false;
      initPromise = null;
      debugLog('i650 init error', err);
      throw err;
    }
  })();

  return initPromise;
}

export async function restart(): Promise<void> {
  await ensureInit();
  mergeState({ initialized: false, isRunning: false });
  await simh.restart(moduleName);
  await simh.sendCommand('SET CPU 1K', { echo: false });
  const persistedYieldSteps = readPersistedYieldSteps();
  if (persistedYieldSteps !== null) {
    await simh.setYieldSteps(persistedYieldSteps);
    mergeState({ yieldSteps: persistedYieldSteps });
  }
  await refreshRegisters();
  mergeState({ initialized: true });
}

async function ensureInit(): Promise<void> {
  if (initialized && initPromise) {
    await initPromise;
    return;
  }
  await init();
}

async function depositAndMerge(
  ref: string,
  value: string,
  patch: Partial<I650EmulatorState>
): Promise<void> {
  const prevState = state;
  mergeState(patch);
  debugLog('i650 deposit start', { ref, value });
  try {
    await ensureInit();
    await simh.deposit(ref, value);
    debugLog('i650 deposit ok', { ref, value });
  } catch (err) {
    try {
      await refreshRegisters();
    } catch {
      mergeState(prevState);
    }
    debugLog('i650 deposit error', err);
    throw err;
  }
}

export function subscribeOutput(listener: OutputListener): () => void {
  outputListeners.add(listener);
  return () => {
    outputListeners.delete(listener);
  };
}

export async function refreshRegisters(): Promise<void> {
  await ensureInit();
  const snapshot = await getRegisterSnapshot();
  debugLog('i650 refreshRegisters', snapshot);
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
  options?: { streamOutput?: boolean; echo?: boolean }
): Promise<string> {
  await ensureInit();
  const result = await simh.sendCommand(command, options);
  await refreshRegisters();
  return result;
}

export async function setYieldSteps(steps: number): Promise<void> {
  await ensureInit();
  const next = Number.isFinite(steps) ? Math.max(1, Math.min(100000, Math.round(steps))) : 1000;
  await simh.setYieldSteps(next);
  mergeState({ yieldSteps: next });
  persistYieldSteps(next);
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
  validateAddress(value);
  await depositAndMerge('AR', value, { addressRegister: value });
}

export async function setProgramRegister(value: string): Promise<void> {
  validateWord(value);
  await depositAndMerge('PR', value, { programRegister: value });
}

export async function setDistributor(value: string): Promise<void> {
  validateWord(value);
  await depositAndMerge('DIST', value, { distributor: value });
}

export async function setConsoleSwitches(value: string): Promise<void> {
  validateWord(value);
  await depositAndMerge('CSW', value, { consoleSwitches: value });
}

export async function setProgrammedStop(value: boolean): Promise<void> {
  await depositAndMerge('CSWPS', value ? '1' : '0', { programmedStop: value });
}

export async function setOverflowStop(value: boolean): Promise<void> {
  await depositAndMerge('CSWOS', value ? '1' : '0', { overflowStop: value });
}

export async function setHalfCycle(value: boolean): Promise<void> {
  await depositAndMerge('HALF', value ? '1' : '0', { halfCycle: value });
}

export async function resetAccumulator(): Promise<void> {
  await ensureInit();
  await simh.deposit('DIST', ZERO_DATA);
  await simh.deposit('ACCLO', ZERO_DATA);
  await simh.deposit('ACCUP', ZERO_DATA);
  await simh.deposit('OV', '0');
  mergeState({
    distributor: ZERO_DATA,
    lowerAccumulator: ZERO_DATA,
    upperAccumulator: ZERO_DATA,
  });
  await refreshRegisters();
}

export async function reset(): Promise<void> {
  await ensureInit();
  await executeCommand('RESET');
}

export async function handleDrumTransfer(): Promise<void> {
  debugLog('i650 handleDrumTransfer start', {
    displaySwitch: state.displaySwitch,
    addressRegister: state.addressRegister,
    consoleSwitches: state.consoleSwitches,
  });
  await ensureInit();
  debugLog('i650 handleDrumTransfer ready', {
    displaySwitch: state.displaySwitch,
    addressRegister: state.addressRegister,
    consoleSwitches: state.consoleSwitches,
  });
  if (state.displaySwitch === DisplaySwitch.READ_OUT_STORAGE) {
    const value = await readMemory(state.addressRegister);
    await setDistributor(value);
    return;
  }

  if (state.displaySwitch === DisplaySwitch.READ_IN_STORAGE) {
    await writeMemory(state.addressRegister, state.consoleSwitches);
    await setDistributor(state.consoleSwitches);
  }
}

export async function startProgram(): Promise<void> {
  await ensureInit();
  await simh.sendCommand('GO', { streamOutput: true });
}

export async function startProgramOrTransfer(): Promise<void> {
  const manual = isManualOperation(state.controlSwitch);
  debugLog('i650 startProgramOrTransfer', {
    isRunning: state.isRunning,
    controlSwitch: state.controlSwitch,
    displaySwitch: state.displaySwitch,
    addressRegister: state.addressRegister,
    manual,
  });
  if (manual) {
    await handleDrumTransfer();
    return;
  }
  if (state.isRunning) return;
  await startProgram();
}

export async function stopProgram(): Promise<void> {
  await ensureInit();
  await simh.stop();
  await refreshRegisters();
}

export async function resetProgram(): Promise<void> {
  await ensureInit();
  if (state.isRunning) {
    await simh.stop();
  }
  await setProgramRegister(ZERO_DATA);
  await setAddressRegister(ZERO_ADDRESS);
  await refreshRegisters();
}

export async function resetComputer(): Promise<void> {
  await ensureInit();
  if (state.isRunning) {
    await simh.stop();
  }
  await executeCommand('RESET');
}

export async function transferAddress(): Promise<void> {
  if (isManualOperation(state.controlSwitch)) {
    await setAddressRegister(state.addressSwitches);
  }
}
