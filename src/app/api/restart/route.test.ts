import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

type EmulatorLike = { start: () => Promise<string> };
type ExistingEmulator = { isRunning: () => boolean; quit?: (ms: number) => Promise<void>; kill?: () => void };

const hoisted = vi.hoisted(() => {
  return {
    attachConsoleBuffer: vi.fn(),
    existingRef: { value: undefined as ExistingEmulator | undefined },
    newEmulatorRef: { value: undefined as EmulatorLike | undefined },
  };
});

vi.mock('@/lib/simh', () => {
  const { attachConsoleBuffer, existingRef, newEmulatorRef } = hoisted;
  const SimhEmulator = vi.fn(function SimhEmulatorMock() {
    return newEmulatorRef.value;
  });
  return {
    getEmulator: () => existingRef.value,
    attachConsoleBuffer,
    SimhEmulator,
  };
});

const { attachConsoleBuffer, existingRef, newEmulatorRef } = hoisted;

describe('/api/restart', () => {
  beforeEach(() => {
    existingRef.value = undefined;
    newEmulatorRef.value = {
      start: vi.fn(async () => 'started'),
    };
    attachConsoleBuffer.mockClear();
    delete process.env.SIMH_QUIT_TIMEOUT_MS;
  });

  afterEach(() => {
    delete process.env.SIMH_QUIT_TIMEOUT_MS;
  });

  it('quits running emulator then starts new one', async () => {
    const quit = vi.fn(async () => {});
    existingRef.value = { isRunning: () => true, quit };

    const res = await POST();
    const body = await res.json();

    expect(quit).toHaveBeenCalledWith(1000);
    expect(attachConsoleBuffer).toHaveBeenCalledWith(newEmulatorRef.value);
    expect(newEmulatorRef.value.start).toHaveBeenCalledTimes(1);
    expect(body.output).toBe('started');
    expect(res.status).toBe(200);
  });

  it('kills stale emulator and starts new one', async () => {
    const kill = vi.fn();
    existingRef.value = { isRunning: () => false, kill };

    await POST();

    expect(kill).toHaveBeenCalledTimes(1);
    expect(newEmulatorRef.value.start).toHaveBeenCalledTimes(1);
  });

  it('uses env timeout when quitting', async () => {
    process.env.SIMH_QUIT_TIMEOUT_MS = '2500';
    const quit = vi.fn(async () => {});
    existingRef.value = { isRunning: () => true, quit };

    await POST();

    expect(quit).toHaveBeenCalledWith(2500);
  });
});
