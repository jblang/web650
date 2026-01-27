import * as pty from 'node-pty';
import type { IPty } from 'node-pty';
import * as path from 'path';

const SIMH_PATH = process.env.SIMH_PATH || '';
const PROMPT = 'sim> ';
const DEFAULT_TIMEOUT_MS = 30000;

class SimhEmulator {
  private process: IPty | null = null;
  private outputBuffer: string = '';
  private pendingResolve: ((output: string) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;
  private pendingTimeout: NodeJS.Timeout | null = null;
  private ready: boolean = false;
  private binaryName: string;

  constructor(binaryName: string) {
    this.binaryName = binaryName;
  }

  start(): Promise<string> {
    if (this.process) {
      return Promise.reject(new Error('Emulator already running'));
    }

    const binaryPath = SIMH_PATH
      ? path.join(SIMH_PATH, this.binaryName)
      : this.binaryName;

    console.log(`Starting SIMH emulator: ${binaryPath}`);

    return new Promise((resolve, reject) => {
      try {
        this.process = pty.spawn(binaryPath, [], {
          name: 'xterm',
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
          env: process.env as Record<string, string>,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        reject(new Error(`Failed to spawn: ${msg}`));
        return;
      }

      const startTimeout = setTimeout(() => {
        reject(new Error('Timeout waiting for initial prompt'));
      }, DEFAULT_TIMEOUT_MS);

      this.process.onData((data: string) => {
        this.outputBuffer += data;

        if (this.outputBuffer.endsWith(PROMPT)) {
          if (!this.ready) {
            this.ready = true;
            clearTimeout(startTimeout);
            const output = this.outputBuffer;
            this.outputBuffer = '';
            console.log(`SIMH emulator ready: ${this.binaryName}`);
            resolve(output);
          } else if (this.pendingResolve) {
            if (this.pendingTimeout) {
              clearTimeout(this.pendingTimeout);
              this.pendingTimeout = null;
            }
            const output = this.outputBuffer;
            this.outputBuffer = '';
            const res = this.pendingResolve;
            this.pendingResolve = null;
            this.pendingReject = null;
            res(output);
          }
        }
      });

      this.process.onExit(({ exitCode }) => {
        if (this.outputBuffer) {
          console.log(`SIMH ${this.binaryName} remaining output: ${this.outputBuffer}`);
        }
        console.log(`SIMH ${this.binaryName} exited with code ${exitCode}`);
        this.outputBuffer = '';
        this.process = null;
        this.ready = false;
        if (this.pendingReject) {
          this.pendingReject(new Error('Process exited'));
          this.pendingResolve = null;
          this.pendingReject = null;
        }
      });
    });
  }

  sendCommand(command: string, timeoutMs: number = DEFAULT_TIMEOUT_MS, expectPrompt: boolean = true, appendCR: boolean = true): Promise<string> {
    if (!this.process || !this.ready) {
      return Promise.reject(new Error('Emulator not running'));
    }

    if (this.pendingResolve) {
      return Promise.reject(new Error('Command already in progress'));
    }

    return new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      if (expectPrompt) {
        this.pendingTimeout = setTimeout(() => {
          this.pendingTimeout = null;
          this.pendingResolve = null;
          this.pendingReject = null;
          const partial = this.outputBuffer;
          this.outputBuffer = '';
          reject(new Error(`Timeout. Partial output: ${partial}`));
        }, timeoutMs);
      }

      this.process!.write(command + (appendCR ? '\r' : ''));

      if (!expectPrompt) {
        this.pendingResolve = null;
        this.pendingReject = null;
        resolve(''); // Resolve immediately if no prompt is expected
      }
    });
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.ready = false;
    }
  }

  isRunning(): boolean {
    return this.process !== null && this.ready;
  }
}

// Singleton on globalThis
const g = globalThis as unknown as { simhEmulator?: SimhEmulator };

export function getEmulator(): SimhEmulator | undefined {
  return g.simhEmulator;
}

export async function initializeEmulator(binaryName: string): Promise<void> {
  if (g.simhEmulator?.isRunning()) {
    return;
  }
  g.simhEmulator = new SimhEmulator(binaryName);
  await g.simhEmulator.start();
}

export { SimhEmulator };
