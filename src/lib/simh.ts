import * as pty from 'node-pty';
import type { IPty } from 'node-pty';
import * as path from 'path';
import { EventEmitter } from 'events';

const SIMH_PATH = process.env.SIMH_PATH || '';
const SIMH_DEBUG = (process.env.SIMH_DEBUG || '').toLowerCase() === 'true' || process.env.SIMH_DEBUG === '1';
const PROMPT = 'sim> ';
const DEFAULT_TIMEOUT_MS = 30000;
const CONSOLE_QUEUE_LIMIT = 1000;

type SharedState = {
  consolePartial: string;
  consoleEmitter: EventEmitter;
  pendingLines: string[];
};

const shared: SharedState = (() => {
  const g = globalThis as unknown as { __simhShared?: SharedState };
  if (!g.__simhShared) {
    g.__simhShared = {
      consolePartial: '',
      consoleEmitter: new EventEmitter(),
      pendingLines: [],
    };
    debugLog('created shared simh state');
  }
  return g.__simhShared;
})();

function debugLog(message: string, meta?: Record<string, unknown>) {
  if (!SIMH_DEBUG) return;
  if (meta && Object.keys(meta).length) {
    console.debug(`[simh] ${message}`, meta);
  } else {
    console.debug(`[simh] ${message}`);
  }
}

function parseKeyValues(text: string): Record<string, string> {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: Record<string, string> = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9]+)\s*[:/]\s+(.*)$/i);
    if (!match) {
      // Treat unmatched non-empty lines as emulator error messages; ignore empty noise.
      if (line.length > 0) {
        throw new Error(line);
      }
      continue;
    }

    const key = match[1].toUpperCase();
    let val = match[2].trim();
    // For 5-digit numeric registers (e.g., AR), keep lowest 4 digits.
    // The extra digit comes from AR being stored in a 16-bit int inside the emulator,
    // while the physical register is only 4 decimal digits.
    if (/^\d{5}$/.test(val)) {
      val = val.slice(-4);
    }
    result[key] = val;
  }
  return result;
}

function appendConsoleBuffer(chunk: string) {
  // Normalize newlines, accumulate partial, flush full lines.
  const normalized = chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const combined = shared.consolePartial + normalized;
  const parts = combined.split('\n');
  shared.consolePartial = parts.pop() ?? '';

  debugLog('appendConsoleBuffer', {
    chunkLength: chunk.length,
    normalizedLength: normalized.length,
    combinedLength: combined.length,
    linesParsed: parts.length,
    partialLength: shared.consolePartial.length,
  });

  if (parts.length) {
    parts.forEach((line) => {
      const full = line + '\n';
      debugLog('queue line', { line: full });
      shared.pendingLines.push(full);
      if (shared.pendingLines.length >= CONSOLE_QUEUE_LIMIT) {
        debugLog('console queue limit reached, trimming', {
          before: shared.pendingLines.length,
          limit: CONSOLE_QUEUE_LIMIT,
        });
      }
      if (shared.pendingLines.length > CONSOLE_QUEUE_LIMIT) {
        shared.pendingLines = shared.pendingLines.slice(-CONSOLE_QUEUE_LIMIT);
      }
      shared.consoleEmitter.emit('line', full);
    });
  }
}

class SimhEmulator {
  private process: IPty | null = null;
  private outputBuffer: string = '';
  private pendingCommand: string | null = null;
  private pendingResolve: ((output: string) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;
  private stopPending: boolean = false;
  private stopResolve: ((output: string) => void) | null = null;
  private stopBuffer: string = '';
  private pendingAppendCR: boolean = false;
  private pendingExpectResponse: boolean = false;
  private ready: boolean = false;
  private atPrompt: boolean = false;
  private onDataCallback: ((data: string) => void) | null = null;
  private commandQueue: Array<{
    command: string;
    appendCR: boolean;
    expectResponse: boolean;
    resolve: (output: string) => void;
    reject: (error: Error) => void;
  }> = [];
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
    debugLog('spawn options', {
      binaryPath,
      cwd: process.cwd(),
      envSimhPath: SIMH_PATH,
    });

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

      this.atPrompt = false;

      const startTimeout = setTimeout(() => {
        reject(new Error('Timeout waiting for initial prompt'));
      }, DEFAULT_TIMEOUT_MS);

      this.process.onData((data: string) => {
        debugLog('process data', {
          chunkLength: data.length,
          atPrompt: this.atPrompt,
          ready: this.ready,
          pendingResolve: Boolean(this.pendingResolve),
          stopPending: this.stopPending,
        });
        if (this.onDataCallback) {
          this.onDataCallback(data);
        }

        // If we're waiting on a STOP (Ctrl-E), capture its output separately so it
        // doesn't contaminate other command responses.
        if (this.stopPending) {
          this.stopBuffer += data;
          if (this.stopBuffer.endsWith(PROMPT)) {
            const out = this.stopBuffer;
            this.stopBuffer = '';
            this.stopPending = false;
            this.atPrompt = true;
            const res = this.stopResolve;
            this.stopResolve = null;
            if (res) res(out);
            this.dispatchQueue();
          }
          return;
        }

        this.outputBuffer += data;

        if (this.outputBuffer.endsWith(PROMPT)) {
          this.atPrompt = true;
          if (!this.ready) {
            this.ready = true;
            clearTimeout(startTimeout);
            const output = this.outputBuffer;
            this.outputBuffer = '';
            console.log(`SIMH emulator ready: ${this.binaryName}`);
            resolve(output);
            this.dispatchQueue();
          } else if (this.pendingResolve) {
            const output = this.outputBuffer;
            this.outputBuffer = '';
            const res = this.pendingResolve;
            const cmd = this.pendingCommand;
            debugLog('command resolved', {
              command: cmd,
              rawLength: output.length,
              rawPreview: output.slice(0, 120),
            });
            this.pendingResolve = null;
            this.pendingReject = null;
            this.pendingCommand = null;
            this.pendingAppendCR = false;
            this.pendingExpectResponse = false;
            res(cmd ? this.stripCommandOutput(cmd, output) : output);
            this.dispatchQueue();
          }
        } else if (this.atPrompt && this.pendingResolve === null) {
          // Spurious prompt (e.g., after STOP). Try to send next queued command.
          debugLog('spurious prompt detected, dispatching queue');
          this.dispatchQueue();
        }
      });

      this.process.onExit(({ exitCode }) => {
        if (this.outputBuffer) {
          console.log(`SIMH ${this.binaryName} remaining output: ${this.outputBuffer}`);
        }
        console.log(`SIMH ${this.binaryName} exited with code ${exitCode}`);
        shared.consoleEmitter.emit('exit', exitCode);
        this.outputBuffer = '';
        this.process = null;
        this.ready = false;
        this.atPrompt = false;
        this.commandQueue.forEach(({ reject }) => reject(new Error('Process exited')));
        this.commandQueue = [];
        if (this.pendingReject) {
          this.pendingReject(new Error('Process exited'));
          this.pendingResolve = null;
          this.pendingReject = null;
        }
      });
    });
  }

  sendCommand(command: string, options?: { appendCR?: boolean; expectResponse?: boolean }): Promise<string> {
    const appendCR = options?.appendCR ?? true;
    const expectResponse = options?.expectResponse ?? false;
    if (!this.process || !this.ready) {
      return Promise.reject(new Error('Emulator not running'));
    }

    return new Promise((resolve, reject) => {
      // If we're already at a prompt with leftover buffered output (e.g., from STOP),
      // discard it so the next command's response starts clean.
      if (this.atPrompt && this.pendingResolve === null && this.outputBuffer) {
        debugLog('clearing stale output before queueing command', {
          outputLength: this.outputBuffer.length,
        });
        this.outputBuffer = '';
      }

      this.commandQueue.push({ command, appendCR, expectResponse, resolve, reject });
      debugLog('queue command', {
        command,
        appendCR,
        expectResponse,
        queueDepth: this.commandQueue.length,
        pendingResolve: Boolean(this.pendingResolve),
        atPrompt: this.atPrompt,
      });
      this.dispatchQueue();
    });
  }

  /**
   * Sends Ctrl-E (SIMH escape) immediately, capturing its output separately.
   * Interrupts any in-flight command, rejecting it so subsequent commands
   * don't inherit the escape banner.
   */
  sendEscape(): Promise<string> {
    if (!this.process || !this.ready) {
      return Promise.reject(new Error('Emulator not running'));
    }

    // If a command is in-flight, park it back on the front of the queue so it runs after simulation stops.
    if (this.pendingResolve && this.pendingCommand) {
      this.commandQueue.unshift({
        command: this.pendingCommand,
        appendCR: this.pendingAppendCR,
        expectResponse: this.pendingExpectResponse,
        resolve: this.pendingResolve,
        reject: this.pendingReject ?? (() => {}),
      });
      this.pendingResolve = null;
      this.pendingReject = null;
      this.pendingCommand = null;
      this.pendingAppendCR = false;
      this.pendingExpectResponse = false;
      this.outputBuffer = '';
    }

    debugLog('sending simulation escape (Ctrl-E)');
    this.atPrompt = false;
    this.outputBuffer = '';
    this.stopPending = true;
    this.stopBuffer = '';

    return new Promise((resolve) => {
      this.stopResolve = resolve;
      this.process?.write('\x05');
    });
  }

  async examineState(target: string): Promise<Record<string, string>> {
    const ref = target.trim().toUpperCase();
    const rawOutput = await this.sendCommand(`EXAMINE ${ref}`, { expectResponse: true });

    if (!rawOutput.trim()) {
      throw new Error(`EXAMINE ${ref} returned no data`);
    }

    try {
      return parseKeyValues(rawOutput);
    } catch (err) {
      debugLog('examineState parse error', {
        ref,
        rawLength: rawOutput.length,
        rawPreview: rawOutput.slice(0, 200),
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async depositState(target: string, value: string): Promise<void> {
    const ref = target.trim().toUpperCase();
    await this.sendCommand(`DEPOSIT ${ref} ${value}`, { expectResponse: false });
  }

  async getBreakpoints(): Promise<Record<string, string>> {
    const output = await this.sendCommand('SHOW BREAK', { expectResponse: true });
    const lines = output
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const result: Record<string, string> = {};
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const addr = match[1].trim();
        const state = match[2].trim();
        result[addr] = state;
      }
    }
    return result;
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

  isAtPrompt(): boolean {
    return this.atPrompt;
  }

  setOnDataCallback(cb: ((data: string) => void) | null): void {
    this.onDataCallback = cb;
  }

  private dispatchQueue(): void {
    if (!this.process || !this.atPrompt) {
      debugLog('dispatch skipped', {
        hasProcess: Boolean(this.process),
        atPrompt: this.atPrompt,
      });
      return;
    }

    if (this.pendingResolve || this.commandQueue.length === 0) {
      debugLog('dispatch waiting', {
        pendingResolve: Boolean(this.pendingResolve),
        queueDepth: this.commandQueue.length,
      });
      return;
    }

    const next = this.commandQueue.shift();
    if (!next) return;

    debugLog('dispatching command', {
      command: next.command,
      appendCR: next.appendCR,
      expectResponse: next.expectResponse,
      remainingQueue: this.commandQueue.length,
    });

    if (next.expectResponse) {
      this.pendingResolve = next.resolve;
      this.pendingReject = next.reject;
      this.pendingCommand = next.command;
      this.pendingAppendCR = next.appendCR;
      this.pendingExpectResponse = next.expectResponse;
      this.atPrompt = false;
      this.outputBuffer = '';
      this.process.write(next.command + (next.appendCR ? '\r' : ''));
    } else {
      // Fire-and-forget: write, resolve immediately, and keep prompt available.
      this.process.write(next.command + (next.appendCR ? '\r' : ''));
      next.resolve('');
      this.atPrompt = true;
      this.pendingResolve = null;
      this.pendingReject = null;
      this.dispatchQueue();
    }
  }

  private stripCommandOutput(command: string, raw: string): string {
    // Normalize and split into lines.
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    const cmdUpper = command.toUpperCase();
    const promptUpper = PROMPT.trim().toUpperCase();

    // Drop trailing prompt line if present.
    if (lines.length && lines[lines.length - 1].trim().toUpperCase() === promptUpper) {
      lines.pop();
    }

    // Find the command echo (plain or prompt-prefixed) and slice everything before it.
    let start = 0;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const upper = trimmed.toUpperCase();
      if (upper === cmdUpper || upper === `${promptUpper} ${cmdUpper}`) {
        start = i + 1;
        break;
      }
    }

    const payload = lines.slice(start).filter((line) => line.trim().length > 0);
    return payload.join('\n');
  }
}

// Singleton on globalThis
const g = globalThis as unknown as { simhEmulator?: SimhEmulator };

export function attachConsoleBuffer(emulator: SimhEmulator): void {
  shared.consolePartial = '';
  debugLog('attachConsoleBuffer: wiring emulator output to queue');
  emulator.setOnDataCallback((chunk) => appendConsoleBuffer(chunk));
}

export function detachConsoleBuffer(emulator: SimhEmulator): void {
  debugLog('detachConsoleBuffer: removing emulator output wiring');
  emulator.setOnDataCallback(null);
  shared.consolePartial = '';
}

export function onConsoleLine(cb: (line: string) => void): () => void {
  debugLog('onConsoleLine: new subscriber', {
    pendingLines: shared.pendingLines.length,
    currentListeners: shared.consoleEmitter.listenerCount('line'),
  });
  // Flush any queued lines to the new subscriber (keep queue for future listeners)
  if (shared.pendingLines.length) {
    shared.pendingLines.forEach((line) => {
      debugLog('deliver queued line to subscriber', { line });
      cb(line);
    });
  }

  const wrapped = (line: string) => {
    debugLog('deliver live line to subscriber', { line });
    cb(line);
  };

  shared.consoleEmitter.on('line', wrapped);
  return () => shared.consoleEmitter.off('line', wrapped);
}

export function onConsoleExit(cb: (code: number) => void): () => void {
  shared.consoleEmitter.on('exit', cb);
  return () => shared.consoleEmitter.off('exit', cb);
}

// Test-only helper to clear shared console state and listeners.
export function __resetConsoleBufferForTests(): void {
  shared.consolePartial = '';
  shared.pendingLines = [];
  shared.consoleEmitter.removeAllListeners('line');
  shared.consoleEmitter.removeAllListeners('exit');
}

export function getEmulator(): SimhEmulator | undefined {
  return g.simhEmulator;
}

export async function initializeEmulator(binaryName: string): Promise<void> {
  if (g.simhEmulator?.isRunning()) {
    return;
  }
  g.simhEmulator = new SimhEmulator(binaryName);
  attachConsoleBuffer(g.simhEmulator); // capture early output for console streaming
  await g.simhEmulator.start();
}

export { SimhEmulator };
