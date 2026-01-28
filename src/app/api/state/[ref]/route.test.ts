import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, PUT } from './route';

let emulator:
  | {
      isRunning: () => boolean;
      examineState: (ref: string) => Promise<Record<string, string>>;
      depositState: (ref: string, value: string) => Promise<void>;
    }
  | undefined;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

const makeReq = <T extends object>(body?: T) =>
  ({
    json: async () => body ?? ({} as T),
  }) as unknown as Request;

describe('/api/state/[ref]', () => {
  beforeEach(() => {
    emulator = undefined;
  });

  it('GET returns 503 when emulator not running', async () => {
    emulator = { isRunning: () => false, examineState: vi.fn(), depositState: vi.fn() };
    const res = await GET(makeReq(), { params: { ref: 'AR' } });
    expect(res.status).toBe(503);
  });

  it('GET returns output from examineState', async () => {
    emulator = {
      isRunning: () => true,
      examineState: vi.fn(async (ref) => ({ [ref.toUpperCase()]: '12345' })),
      depositState: vi.fn(),
    };
    const res = await GET(makeReq(), { params: { ref: 'ar' } });
    const json = await res.json();
    expect(json.registers).toEqual({ AR: '12345' });
  });

  it('GET supports ranges and returns object of addresses', async () => {
    const registers = { '1': '0000000000+', '2': '0000000001+' };
    emulator = {
      isRunning: () => true,
      examineState: vi.fn(async () => registers),
      depositState: vi.fn(),
    };
    const res = await GET(makeReq(), { params: { ref: '1-2' } });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.registers).toEqual(registers);
  });

  it('PUT deposits value', async () => {
    const depositState = vi.fn(async () => {});
    emulator = {
      isRunning: () => true,
      examineState: vi.fn(),
      depositState,
    };
    const res = await PUT(makeReq({ value: '00001' }), { params: { ref: 'AR' } });
    expect(res.status).toBe(200);
    expect(depositState).toHaveBeenCalledWith('AR', '00001');
  });

  it('PUT validates body', async () => {
    emulator = {
      isRunning: () => true,
      examineState: vi.fn(),
      depositState: vi.fn(),
    };
    const res = await PUT(makeReq({}), { params: { ref: 'AR' } });
    expect(res.status).toBe(400);
  });

  it('PUT sets ranges with same value', async () => {
    const depositState = vi.fn(async () => {});
    emulator = {
      isRunning: () => true,
      examineState: vi.fn(),
      depositState,
    };
    const res = await PUT(makeReq({ value: '99999' }), { params: { ref: '1-5' } });
    expect(res.status).toBe(200);
    expect(depositState).toHaveBeenCalledWith('1-5', '99999');
  });
});
