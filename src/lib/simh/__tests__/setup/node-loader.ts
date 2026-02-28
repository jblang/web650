/**
 * Node.js WASM module loader for integration tests.
 *
 * This module provides Node.js-compatible initialization of the i650 WASM module,
 * replacing the browser-specific loader in core.ts.
 */

import type { EmscriptenModule } from '../../types';
import { setModule as setCoreModule, getModule, sendCommand, setYieldEnabled, handleOutput } from '../../core';
import { createNodeSimhRuntime } from '../../../../../scripts/simh-node-runtime.mjs';

export class OutputCapture {
  private lines: string[] = [];

  print = (text: string): void => {
    this.lines.push(text);
  };

  getOutput(): string {
    return this.lines.join('\n');
  }

  getLines(): string[] {
    return [...this.lines];
  }

  clear(): void {
    this.lines = [];
  }
}

/**
 * Initialize the WASM module for Node.js testing.
 *
 * @returns The initialized Emscripten module
 */
export async function initWasmForNode(): Promise<EmscriptenModule> {
  // Check if already initialized
  try {
    return getModule();
  } catch {
    // Not initialized, continue with init
  }

  const runtime = await createNodeSimhRuntime({ onOutputLine: handleOutput });
  const wasmModule = runtime.wasmModule as EmscriptenModule;

  // Set the module in core.ts so all API functions can access it
  setCoreModule(wasmModule);

  // Disable async yielding for Node tests so command output is captured synchronously
  setYieldEnabled(false);

  // Configure drum memory so EXAMINE/DEPOSIT on addresses work
  sendCommand('SET CPU 1K');

  return wasmModule;
}

/**
 * Execute a SIMH command directly in Node-based tests and return command output.
 *
 * This is useful when building UI controls around SIMH commands and needing
 * real command help/introspection output in tests.
 */
export function runSimhCommand(command: string): string {
  const normalized = command.trim();
  if (!normalized) {
    throw new TypeError('SIMH command must be non-empty');
  }
  return sendCommand(normalized);
}

/**
 * Collect command-reference context for SIMH UI work.
 *
 * By default this runs HELP/SHOW commands that describe available commands
 * and current simulator configuration.
 */
export function getSimhCommandContext(
  commands: string[] = ['HELP', 'SHOW CONFIG']
): Record<string, string> {
  const context: Record<string, string> = {};
  for (const command of commands) {
    context[command] = runSimhCommand(command);
  }
  return context;
}
