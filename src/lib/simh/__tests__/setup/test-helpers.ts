/**
 * Shared test utilities and helpers for integration tests.
 */

import { sendCommand } from '../../index';
import { resetModule } from '../../core';

/**
 * Reset the emulator to a clean state.
 * Detaches all devices and resets CPU state.
 * Should be called in beforeEach() hooks.
 */
export function resetEmulator(): void {
  try {
    sendCommand('DETACH ALL');
  } catch {
    // Ignore errors from DETACH if nothing is attached
  }
  sendCommand('RESET');
  sendCommand('SET CPU 1K');
}

/**
 * Cleanup after all tests complete.
 * Should be called in afterAll() hooks.
 */
export function cleanupTests(): void {
  resetModule();
}

/**
 * Execute multiple SIMH commands in sequence.
 *
 * @param commands Array of command strings to execute
 * @returns Array of output strings from each command
 */
export function executeCommands(commands: string[]): string[] {
  return commands.map((cmd) => sendCommand(cmd));
}

/**
 * Run the emulator until it halts or reaches max steps.
 *
 * @param maxSteps Maximum number of steps to execute (default: 100000)
 * @param stepsPerIteration Number of steps to execute per iteration (default: 1000)
 * @returns Final status code
 */
export async function runUntilHalt(
  stepFn: (n: number) => number,
  maxSteps = 100000,
  stepsPerIteration = 1000
): Promise<number> {
  const SCPE_OK = 0;
  const SCPE_STEP = 1;

  let status = SCPE_OK;
  let remaining = maxSteps;

  while ((status === SCPE_OK || status === SCPE_STEP) && remaining > 0) {
    const steps = Math.min(stepsPerIteration, remaining);
    status = stepFn(steps);
    remaining -= steps;
  }

  if (remaining <= 0 && (status === SCPE_OK || status === SCPE_STEP)) {
    throw new Error(`Program did not halt within ${maxSteps} steps`);
  }

  return status;
}
