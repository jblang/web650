import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

type EmulatorMock = {
  isRunning: () => boolean;
  sendEscape: () => Promise<string>;
};

let emulator: EmulatorMock | undefined;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

describe('/api/control/escape', () => {
  beforeEach(() => {
    emulator = undefined;
  });

  it('returns 503 if emulator not running', async () => {
    emulator = { isRunning: () => false, sendEscape: vi.fn(async () => '') };
    const res = await POST();
    expect(res.status).toBe(503);
  });

  it('sends ctrl-e stop', async () => {
    const sendEscape = vi.fn(async () => 'Simulation stopped');
    emulator = { isRunning: () => true, sendEscape };
    const res = await POST();
    expect(sendEscape).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});
