import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { IPty } from 'node-pty';
import {
  SimhEmulator,
  attachConsoleBuffer,
  detachConsoleBuffer,
  onConsoleLine,
  onConsoleExit,
  __resetConsoleBufferForTests,
  initializeEmulator,
  getEmulator,
} from './simh';

// Mocked PTY implementation
type DataHandler = (data: string) => void;
type ExitHandler = (event: { exitCode: number }) => void;

let dataHandler: DataHandler | null = null;
let exitHandler: ExitHandler | null = null;
let writes: string[] = [];
let killed = false;

vi.mock('node-pty', () => ({
  spawn: vi.fn((): IPty => {
    dataHandler = null;
    exitHandler = null;
    writes = [];
    killed = false;
    return {
      onData: (cb: DataHandler) => {
        dataHandler = cb;
      },
      onExit: (cb: ExitHandler) => {
        exitHandler = cb;
      },
      write: (chunk: string) => {
        writes.push(chunk);
      },
      kill: () => {
        killed = true;
      },
    } as unknown as IPty;
  }),
}));

function emitPrompt(output: string) {
  if (!dataHandler) throw new Error('data handler not set');
  dataHandler(output + 'sim> ');
}

describe('SimhEmulator command dispatching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataHandler = null;
    exitHandler = null;
    writes = [];
    __resetConsoleBufferForTests();
  });

  it('queues commands and dispatches them only when at prompt', async () => {
    const emulator = new SimhEmulator('dummy');

    // start waits for initial prompt
    const startPromise = emulator.start();
    emitPrompt('Welcome\n');
    await expect(startPromise).resolves.toContain('sim> ');
    expect(emulator.isAtPrompt()).toBe(true);

    // enqueue two commands back-to-back, first expects response, second does not
    const first = emulator.sendCommand('CMD1', { expectResponse: true });
    const second = emulator.sendCommand('CMD2', { expectResponse: false });

    // first command should be written immediately, second should wait
    expect(writes).toEqual(['CMD1\r']);
    expect(emulator.isAtPrompt()).toBe(false);

    // respond to first command, delivering prompt
    emitPrompt('OUT1\n');
    await expect(first).resolves.toContain('OUT1');

    // second command should dispatch immediately after prompt and resolve once prompt returns
    expect(writes).toEqual(['CMD1\r', 'CMD2\r']);
    emitPrompt('');
    await expect(second).resolves.toBe('');
    expect(emulator.isAtPrompt()).toBe(true);

    // A later prompt should not break anything
    emitPrompt('OUT2\n');
  });

  it('invokes onData callback for incoming data', async () => {
    const emulator = new SimhEmulator('dummy');
    const onData = vi.fn();
    emulator.setOnDataCallback(onData);

    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;

    expect(onData).toHaveBeenCalledWith('sim> ');

    // Send a chunk between prompts
    if (!dataHandler) throw new Error('data handler not set');
    dataHandler('HELLO ');
    expect(onData).toHaveBeenCalledWith('HELLO ');
  });

  it('appends onData chunks to console buffer via attachConsoleBuffer', async () => {
    const emulator = new SimhEmulator('dummy');
    attachConsoleBuffer(emulator);

    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;

    // Clear any startup prompt noise and re-subscribe for the test payload.
    __resetConsoleBufferForTests();
    attachConsoleBuffer(emulator);
    const received: string[] = [];
    const off = onConsoleLine((line) => received.push(line));

    if (!dataHandler) throw new Error('data handler not set');
    dataHandler('A');
    dataHandler('B\nC');
    expect(received.join('')).toBe('AB\n');

    dataHandler('\n');
    expect(received.join('')).toBe('AB\nC\n');

    off();
  });

  it('queues console lines until first subscriber, then flushes', async () => {
    const emulator = new SimhEmulator('dummy');
    attachConsoleBuffer(emulator);

    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;

    if (!dataHandler) throw new Error('data handler not set');
    dataHandler('A\nB\n');

    const received: string[] = [];
    const off = onConsoleLine((line) => received.push(line));

    const all = received.join('');
    expect(all).toContain('sim> ');
    expect(all).toContain('A');
    expect(all).toContain('B');
    off();
  });

  it('emits exit event when emulator process exits', async () => {
    const emulator = new SimhEmulator('dummy');
    attachConsoleBuffer(emulator);
    const exits: number[] = [];
    const offExit = onConsoleExit((code) => exits.push(code));

    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;

    if (!exitHandler) throw new Error('exit handler not set');
    exitHandler({ exitCode: 42 });

    expect(exits).toEqual([42]);
    offExit();
  });

  it('clears stale buffered output before queueing next command', async () => {
    const emulator = new SimhEmulator('dummy');

    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;

    // Simulate a stop message that left buffered output and a prompt, with no pending resolve.
    if (!dataHandler) throw new Error('data handler not set');
    dataHandler('Simulation stopped\nsim> ');
    expect(emulator.isAtPrompt()).toBe(true);

    const cmd = emulator.sendCommand('AFTERSTOP', { expectResponse: true });
    expect(writes).toContain('AFTERSTOP\r');

    // Respond to the command; ensure only fresh output is delivered.
    dataHandler('OK\nsim> ');
    const result = await cmd;
    expect(result).toBe('OK');
  });

});

describe('state primitives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects sendCommand when emulator not running', async () => {
    const emulator = new SimhEmulator('dummy');
    await expect(emulator.sendCommand('NOPE')).rejects.toThrow(/not running/);
  });

  it('rejects escape when emulator not running', async () => {
    const emulator = new SimhEmulator('dummy');
    await expect(emulator.sendEscape()).rejects.toThrow(/not running/);
  });

  it('examineState parses memory output with slash delimiter', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => '03000/ 12345\n');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    const result = await emulator.examineState('03000');

    expect(sendCommand).toHaveBeenCalledWith('EXAMINE 03000', { expectResponse: true });
    // parseKeyValues trims 5-digit numeric values to the lowest 4 digits
    expect(result).toEqual({ '03000': '2345' });
  });

  it('examineState ignores echoed command line', async () => {
    const emulator = new SimhEmulator('dummy');
    // sendCommand now returns only the command's output (stripCommandOutput handles echo removal)
    const sendCommand = vi.fn(async () => '03000/ 00042\n');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    const result = await emulator.examineState('03000');

    expect(sendCommand).toHaveBeenCalledWith('EXAMINE 03000', { expectResponse: true });
    expect(result).toEqual({ '03000': '0042' });
  });

  it('examineState ignores prompt-prefixed echoed command line', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => 'PR:\t 0000000000+\n');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    const result = await emulator.examineState('PR');

    expect(sendCommand).toHaveBeenCalledWith('EXAMINE PR', { expectResponse: true });
    expect(result).toEqual({ PR: '0000000000+' });
  });

  it('examineState surfaces simulation stopped banner as error', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => 'Simulation stopped, IC: 00000 ( 0000000001+   NOOP  0000  0001 )\nACCLO: 00000\nsim> ');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    await expect(emulator.examineState('ACCLO')).rejects.toThrow('Simulation stopped');
    expect(sendCommand).toHaveBeenCalledWith('EXAMINE ACCLO', { expectResponse: true });
  });

  it('depositState sends fire-and-forget command', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => '');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    await emulator.depositState('03000', '99999');

    expect(sendCommand).toHaveBeenCalledWith('DEPOSIT 03000 99999', { expectResponse: false });
  });

  it('examineState accepts address ranges without label matching', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => '1: 00000\n2: 00001\n');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    const result = await emulator.examineState('1-2');

    expect(sendCommand).toHaveBeenCalledWith('EXAMINE 1-2', { expectResponse: true });
    expect(result).toEqual({ '1': '0000', '2': '0001' });
  });

  it('examineState throws when emulator returns an error line', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => 'No such register ARX\n');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    await expect(emulator.examineState('ARX')).rejects.toThrow('No such register ARX');
  });

  it('examineState throws when output cannot be parsed', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => 'BADLINE');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    await expect(emulator.examineState('FOO')).rejects.toThrow('BADLINE');
  });

  it('rejects quit when emulator not running', async () => {
    const emulator = new SimhEmulator('dummy');
    await expect(emulator.quit()).rejects.toThrow(/not running/);
  });

  it('stripCommandOutput removes echo and prompt', () => {
    const emulator = new SimhEmulator('dummy') as unknown as { stripCommandOutput: (cmd: string, raw: string) => string };
    const raw = 'sim> SHOW DEV\nDZ  enabled\nsim> ';
    const payload = emulator.stripCommandOutput('SHOW DEV', raw);
    expect(payload).toBe('DZ  enabled');
  });

  it('quit kills emulator when timeout elapses', async () => {
    vi.useFakeTimers();
    const emulator = new SimhEmulator('dummy');
    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;

    const quitPromise = emulator.quit(10);
    await vi.runAllTimersAsync();
    await quitPromise;

    expect(killed).toBe(true);
    vi.useRealTimers();
  });

  it('attach/detachConsoleBuffer toggles line delivery', async () => {
    const emulator = new SimhEmulator('dummy');
    attachConsoleBuffer(emulator);
    const received: string[] = [];
    const off = onConsoleLine((line) => received.push(line));

    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;

    // emit line -> delivered
    dataHandler?.('HELLO\n');
    expect(received.join('')).toContain('HELLO');

    detachConsoleBuffer(emulator);
    dataHandler?.('WORLD\n');
    expect(received.join('')).not.toContain('WORLD');
    off();
  });

  it('initializeEmulator is a singleton and skips when already running', async () => {
    const runningMock = { isRunning: () => true };
    const globalShim = globalThis as { simhEmulator?: unknown };
    globalShim.simhEmulator = runningMock;
    await initializeEmulator('dummy');
    expect(getEmulator()).toBe(runningMock);
    // reset
    globalShim.simhEmulator = undefined;
  });

  it('sendEscape resolves immediately when already at prompt', async () => {
    const emulator = new SimhEmulator('dummy');
    const startPromise = emulator.start();
    emitPrompt('');
    await startPromise;
    // @ts-expect-error test override: force prompt state
    emulator['atPrompt'] = true;
    const result = await emulator.sendEscape();
    expect(result).toBe('');
  });

  it('getBreakpoints parses show break output', async () => {
    const emulator = new SimhEmulator('dummy');
    const sendCommand = vi.fn(async () => '1000:\tE\n2000:\tE\n');
    // @ts-expect-error test override: inject mock sendCommand
    emulator.sendCommand = sendCommand;

    const breaks = await emulator.getBreakpoints();

    expect(sendCommand).toHaveBeenCalledWith('SHOW BREAK', { expectResponse: true });
    expect(breaks).toEqual({ '1000': 'E', '2000': 'E' });
  });
});
