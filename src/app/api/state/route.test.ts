import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './route';

let emulator:
  | {
      isRunning: () => boolean;
      examineState: (ref: string) => Promise<Record<string, string>>;
    }
  | undefined;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

const makeReq = () =>
  ({
    json: async () => ({}),
  }) as unknown as Request;

describe('/api/state', () => {
  beforeEach(() => {
    emulator = undefined;
  });

  it('GET returns 503 when emulator not running', async () => {
    emulator = { isRunning: () => false, examineState: vi.fn() };
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
  });

  it('GET returns full state registers', async () => {
    const registers = { AR: '00000', PR: '00000' };
    const examineState = vi.fn(async () => registers);
    emulator = {
      isRunning: () => true,
      examineState,
    };
    const res = await GET(makeReq());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.registers).toEqual(registers);
    expect(examineState).toHaveBeenCalledWith('STATE');
  });

  it('GET returns 500 on errors', async () => {
    emulator = {
      isRunning: () => true,
      examineState: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/boom/);
  });
});
