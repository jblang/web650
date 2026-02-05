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
  init,
  sendCommand,
  sendCommandAsync,
  examine,
  examineAsync,
  deposit,
  depositAsync,
  onOutput,
  parseKeyValues,
  setAssetBase,
  isCpuRunning,
  isEmulatorBusy,
  getYieldSteps,
  setYieldSteps,
  getYieldEnabled,
  setYieldEnabled,
} from './core';

// Generic SIMH Control
export {
  step,
  stop,
  restart,
} from './control';

// Generic SIMH Filesystem
export {
  writeFile,
  readFile,
  mkdir,
  unlink,
} from './filesystem';

// Generic init/restart are exported from core/control above.
