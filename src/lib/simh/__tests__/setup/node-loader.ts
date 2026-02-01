/**
 * Node.js WASM module loader for integration tests.
 *
 * This module provides Node.js-compatible initialization of the i650 WASM module,
 * replacing the browser-specific loader in core.ts.
 */

import path from 'path';
import type { EmscriptenModule } from '../../types';
import { setModule as setCoreModule, getModule, handleOutput, sendCommand } from '../../core';

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
 * @param outputCapture Optional OutputCapture instance to capture print/printErr output
 * @returns The initialized Emscripten module
 */
export async function initWasmForNode(
  outputCapture?: OutputCapture
): Promise<EmscriptenModule> {
  // Check if already initialized
  try {
    return getModule();
  } catch {
    // Not initialized, continue with init
  }

  // Dynamically import the Emscripten JS loader
  // The public/i650.js file exports createI650Module via module.exports
  const publicDir = path.resolve(__dirname, '../../../../../public');
  const modulePath = path.join(publicDir, 'i650.js');

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createModule = require(modulePath);

  // Create the module with Node.js-specific configuration
  // Use handleOutput from core.ts to ensure output capture works correctly
  const module = (await createModule({
    noInitialRun: true,
    print: (text: string) => handleOutput(text),
    printErr: (text: string) => handleOutput(text),
    stdin: () => null,
    locateFile: (fileName: string) => {
      // Provide absolute paths to WASM and data files in public/ directory
      return path.join(publicDir, fileName);
    },
  })) as EmscriptenModule;

  // Initialize SIMH
  const rc = module.ccall('simh_init', 'number', [], []) as number;
  if (rc !== 0) {
    throw new Error(`simh_init failed with code ${rc}`);
  }

  // Set the module in core.ts so all API functions can access it
  setCoreModule(module);

  // Configure drum memory so EXAMINE/DEPOSIT on addresses work
  sendCommand('SET CPU 1K');

  return module;
}
