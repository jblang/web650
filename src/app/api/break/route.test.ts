import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, DELETE } from './route';

type EmulatorMock = {
  isRunning: () => boolean;
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<void>;
  getBreakpoints: () => Promise<Record<string, string>>;
};

let emulator: EmulatorMock | undefined;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

const makeReq = <T extends object>(body?: T) =>
  ({
    json: async () => body ?? ({} as T),
  }) as unknown as Request;

describe('/api/break', () => {
  beforeEach(() => {
    emulator = undefined;
  });

  it('GET returns 503 if emulator not running', async () => {
    emulator = { isRunning: () => false, sendCommand: vi.fn(), getBreakpoints: vi.fn() };
    const res = await GET();
    expect(res.status).toBe(503);
  });

  it('GET returns breakpoints', async () => {
    const breaks = { '1000': 'E', '2000': 'E' };
    const getBreakpoints = vi.fn(async () => breaks);
    emulator = { isRunning: () => true, sendCommand: vi.fn(), getBreakpoints };
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.breakpoints).toEqual(breaks);
    expect(getBreakpoints).toHaveBeenCalled();
  });

  it('DELETE returns 503 if emulator not running', async () => {
    emulator = { isRunning: () => false, sendCommand: vi.fn(), getBreakpoints: vi.fn() };
    const res = await DELETE(makeReq());
    expect(res.status).toBe(503);
  });

  it('DELETE clears all when no address provided', async () => {
    const sendCommand = vi.fn(async () => {});
    emulator = { isRunning: () => true, sendCommand, getBreakpoints: vi.fn() };
    const res = await DELETE(makeReq());
    expect(res.status).toBe(200);
    expect(sendCommand).toHaveBeenCalledWith('NOBREAK 0-9999', { expectResponse: false });
  });
});
