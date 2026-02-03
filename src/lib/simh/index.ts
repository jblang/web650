/**
 * SIMH I650 emulator WASM wrapper.
 *
 * Provides a clean API for interacting with the Emscripten-compiled
 * SIMH I650 emulator.
 */

// Types
export type { EmscriptenModule } from './types';

// Generic SIMH Constants
export {
  SCPE_OK,
  SCPE_STEP,
  STEPS_PER_TICK,
} from './constants';

// Generic SIMH Core
export {
  sendCommand,
  examineState,
  depositState,
  onOutput,
  parseKeyValues,
  setAssetBase,
  isCpuRunning,
  isEmulatorBusy,
  getYieldSteps,
  setYieldSteps,
} from './core';

// Generic SIMH Control
export {
  step,
  stop,
} from './control';

// Generic SIMH Filesystem
export {
  writeFile,
  readFile,
  mkdir,
  unlink,
} from './filesystem';

// I650-specific exports (re-export from i650 submodule)
export {
  // Constants
  ZERO_ADDRESS,
  ZERO_DATA,
  ZERO_OPERATION,
  // Memory operations
  readMemory,
  writeMemory,
  validateWord,
  validateAddress,
  // Register operations
  examineAllState,
  getAddressRegister,
  setAddressRegister,
  getProgramRegister,
  setProgramRegister,
  getDistributor,
  setDistributor,
  getLowerAccumulator,
  setLowerAccumulator,
  getUpperAccumulator,
  setUpperAccumulator,
  getConsoleSwitches,
  setConsoleSwitches,
  getProgrammedStop,
  setProgrammedStop,
  getOverflowStop,
  setOverflowStop,
  getHalfCycle,
  setHalfCycle,
  getOverflow,
  setOverflow,
  resetAccumulator,
  reset,
  setMemorySize,
  // Control operations and switch positions
  Programmed,
  HalfCycle,
  Control,
  Display,
  Overflow,
  ErrorSwitch,
  DisplaySwitch,
  ControlSwitch,
  getDisplayValue,
  performDrumTransfer,
  isManualOperation,
  // Formatting and extraction functions
  normalizeWord,
  normalizeAddress,
  extractOperationCode,
  extractDataAddress,
  extractInstructionAddress,
} from './i650';

// Re-export types
export type {
  ProgrammedPosition,
  HalfCyclePosition,
  ControlPosition,
  DisplayPosition,
  OverflowPosition,
  ErrorSwitchPosition,
  DisplaySwitchPosition,
  ControlSwitchPosition,
  I650Registers,
} from './i650/controls';

// I650-specific wrappers for init and restart (with hardcoded module name and configuration)
import { init as coreInit } from './core';
import { restart as coreRestart } from './control';
import { setMemorySize } from './i650';

export async function init(): Promise<void> {
  await coreInit('i650');
  setMemorySize('1K');
}

export async function restart(): Promise<void> {
  await coreRestart('i650');
  setMemorySize('1K');
}
