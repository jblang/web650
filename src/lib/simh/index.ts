/**
 * SIMH I650 emulator WASM wrapper.
 *
 * Provides a clean API for interacting with the Emscripten-compiled
 * SIMH I650 emulator.
 */

// Types
export type { EmscriptenModule } from './types';

// Constants
export {
  SCPE_OK,
  SCPE_STEP,
  ZERO_ADDRESS,
  ZERO_DATA,
  ZERO_OPERATION,
  STEPS_PER_TICK,
} from './constants';

// Core
export {
  init,
  sendCommand,
  examineState,
  depositState,
  onOutput,
} from './core';

// Memory
export {
  readMemory,
  writeMemory,
  extractOperationCode,
  validateWord,
  validateAddress,
} from './memory';

// Registers
export {
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
} from './registers';

// Control
export {
  step,
  stop,
  isRunning,
  startRunning,
  stopRunning,
  restart,
} from './control';

// Filesystem
export {
  writeFile,
  readFile,
  mkdir,
  unlink,
} from './filesystem';
