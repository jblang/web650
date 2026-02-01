/**
 * Execution control for the SIMH emulator.
 */

import { getModule, init, resetModule } from './core';
import { SCPE_OK, SCPE_STEP, STEPS_PER_TICK } from './constants';

/* ── Tick-loop state ──────────────────────────────────────────── */

let running = false;
let animFrameId: number | null = null;

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

/** True if the tick loop is currently active. */
export function isRunning(): boolean {
  return running;
}

/**
 * Begin tick-loop execution via requestAnimationFrame.
 *
 * `onTick` is called after each batch of STEPS_PER_TICK instructions,
 * receiving the SIMH status code.  The loop stops automatically on halt,
 * breakpoint, or error (any status other than SCPE_STEP / SCPE_OK).
 */
export function startRunning(onTick: (status: number) => void): void {
  const emModule = getModule();
  if (running) return;

  running = true;

  const tick = () => {
    if (!running) return;

    const status = emModule.ccall(
      'simh_step',
      'number',
      ['number'],
      [STEPS_PER_TICK],
    ) as number;

    if (status !== SCPE_STEP && status !== SCPE_OK) {
      running = false;
    }

    onTick(status);

    if (running) {
      animFrameId = requestAnimationFrame(tick);
    }
  };

  animFrameId = requestAnimationFrame(tick);
}

/** Stop the tick loop and request CPU stop. */
export function stopRunning(): void {
  running = false;
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  stop();
}

/** Reload the WASM module from scratch (full restart). */
export async function restart(moduleName: string): Promise<void> {
  stopRunning();

  const scriptPath = `/${moduleName}.js`;
  const oldScript = document.querySelector(`script[src="${scriptPath}"]`);
  if (oldScript) oldScript.remove();

  const moduleKey = `create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`;
  delete (window as unknown as Record<string, unknown>)[moduleKey];

  resetModule();
  await init(moduleName);
}
