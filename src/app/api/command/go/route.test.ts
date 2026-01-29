import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

type EmulatorMock = {
  isRunning: () => boolean;
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<void>;
};

let emulator: EmulatorMock | undefined;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

describe('/api/command/go', () => {
  beforeEach(() => {
    emulator = undefined;
  });

  it('returns 503 if emulator not running', async () => {
    emulator = { isRunning: () => false, sendCommand: vi.fn() };
    const res = await POST();
    expect(res.status).toBe(503);
  });

  it('invokes GO command', async () => {
    const sendCommand = vi.fn(async () => {});
    emulator = { isRunning: () => true, sendCommand };
    const res = await POST();
    expect(sendCommand).toHaveBeenCalledWith('GO', { expectResponse: false });
    expect(res.status).toBe(200);
  });
});
