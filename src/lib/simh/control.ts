/**
 * Execution control for the SIMH emulator.
 */

import { getModule, init, resetModule } from './core';

/* ── Control functions ────────────────────────────────────────── */

/** Execute n CPU instructions.  Returns the SIMH status code. */
export function step(n: number): number {
  const emModule = getModule();
  return emModule.ccall('simh_step', 'number', ['number'], [n]) as number;
}

/** Request the CPU to stop (sets stop_cpu flag). */
export function stop(): void {
  const emModule = getModule();
  emModule.ccall('simh_stop', 'void', [], []);
}

/** Reload the WASM module from scratch (full restart). */
export async function restart(moduleName: string): Promise<void> {
  stop();

  const scriptPath = `/${moduleName}.js`;
  const oldScript = document.querySelector(`script[src="${scriptPath}"]`);
  if (oldScript) oldScript.remove();

  const moduleKey = `create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`;
  delete (window as unknown as Record<string, unknown>)[moduleKey];

  resetModule();
  await init(moduleName);
}
