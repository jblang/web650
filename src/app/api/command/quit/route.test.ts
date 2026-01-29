import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

type EmulatorMock = {
  isRunning: () => boolean;
  quit: (timeoutMs: number) => Promise<void>;
};

let emulator: EmulatorMock | undefined;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

describe('/api/command/quit', () => {
  beforeEach(() => {
    emulator = undefined;
    delete process.env.SIMH_QUIT_TIMEOUT_MS;
  });

  afterEach(() => {
    delete process.env.SIMH_QUIT_TIMEOUT_MS;
  });

  it('returns 503 if emulator not running', async () => {
    emulator = { isRunning: () => false, quit: vi.fn(async () => {}) };
    const res = await POST();
    expect(res.status).toBe(503);
  });

  it('calls quit with default timeout', async () => {
    const quit = vi.fn(async () => {});
    emulator = { isRunning: () => true, quit };

    const res = await POST();

    expect(quit).toHaveBeenCalledWith(1000);
    expect(res.status).toBe(200);
  });

  it('uses env timeout when provided', async () => {
    process.env.SIMH_QUIT_TIMEOUT_MS = '2500';
    const quit = vi.fn(async () => {});
    emulator = { isRunning: () => true, quit };

    await POST();

    expect(quit).toHaveBeenCalledWith(2500);
  });
});
