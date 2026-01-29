import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PUT, DELETE } from './route';

type EmulatorMock = {
  isRunning: () => boolean;
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<void>;
};

let emulator: EmulatorMock | undefined;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

const makeReq = () =>
  ({
    json: async () => ({}),
  }) as unknown as Request;

describe('/api/command/break/[address]', () => {
  beforeEach(() => {
    emulator = undefined;
  });

  it('PUT returns 503 if emulator not running', async () => {
    emulator = { isRunning: () => false, sendCommand: vi.fn() };
    const res = await PUT(makeReq(), { params: { address: '1234' } });
    expect(res.status).toBe(503);
  });

  it('PUT requires address', async () => {
    emulator = { isRunning: () => true, sendCommand: vi.fn() };
    // empty address
    const res = await PUT(makeReq(), { params: { address: '' } });
    expect(res.status).toBe(400);
  });

  it('PUT sets breakpoint (single or range)', async () => {
    const sendCommand = vi.fn(async () => {});
    emulator = { isRunning: () => true, sendCommand };
    const res = await PUT(makeReq(), { params: { address: '100-200' } });
    expect(res.status).toBe(200);
    expect(sendCommand).toHaveBeenCalledWith('BREAK 100-200', { expectResponse: false });
  });

  it('DELETE returns 503 if emulator not running', async () => {
    emulator = { isRunning: () => false, sendCommand: vi.fn() };
    const res = await DELETE(makeReq(), { params: { address: '1234' } });
    expect(res.status).toBe(503);
  });

  it('DELETE requires address', async () => {
    emulator = { isRunning: () => true, sendCommand: vi.fn() };
    const res = await DELETE(makeReq(), { params: { address: '' } });
    expect(res.status).toBe(400);
  });

  it('DELETE clears specific breakpoint or range', async () => {
    const sendCommand = vi.fn(async () => {});
    emulator = { isRunning: () => true, sendCommand };
    const res = await DELETE(makeReq(), { params: { address: '500-600' } });
    expect(res.status).toBe(200);
    expect(sendCommand).toHaveBeenCalledWith('NOBREAK 500-600', { expectResponse: false });
  });

  it('PUT returns 500 on emulator error', async () => {
    const sendCommand = vi.fn(async () => {
      throw new Error('boom');
    });
    emulator = { isRunning: () => true, sendCommand };
    const res = await PUT(makeReq(), { params: { address: '1234' } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/boom/);
  });

  it('DELETE returns 500 on emulator error', async () => {
    const sendCommand = vi.fn(async () => {
      throw new Error('oops');
    });
    emulator = { isRunning: () => true, sendCommand };
    const res = await DELETE(makeReq(), { params: { address: '1234' } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/oops/);
  });
});
