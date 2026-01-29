import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Minimal NextRequest mock
const makeRequest = <T>(body: T) =>
  ({
    json: async () => body,
  });

// Helpers to capture emulator mocks
type EmulatorMock = {
  sendCommand: (command: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => Promise<string>;
  isRunning: () => boolean;
};

let emulator: EmulatorMock;

vi.mock('@/lib/simh', () => ({
  getEmulator: () => emulator,
}));

describe('command route sendCommand compatibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls sendCommand with options', async () => {
    const sendCommand = vi.fn(async (_cmd: string, options?: { appendCR?: boolean; expectResponse?: boolean }) => {
      return `appendCR:${options?.appendCR ?? true} expect:${options?.expectResponse ?? false}`;
    });
    emulator = {
      sendCommand,
      isRunning: () => true,
    };

    const res = await POST(makeRequest({ command: 'EXAMINE AR', appendCR: false, expectResponse: true }));
    const json = await res.json();

    expect(sendCommand).toHaveBeenCalledWith('EXAMINE AR', { appendCR: false, expectResponse: true });
    expect(json.output).toBe('appendCR:false expect:true');
  });

  it('returns 503 when emulator not running', async () => {
    emulator = {
      sendCommand: vi.fn(),
      isRunning: () => false,
    };

    const res = await POST(makeRequest({ command: 'EXAMINE AR' }));
    expect(res.status).toBe(503);
  });

  it('rejects non-string command', async () => {
    emulator = {
      sendCommand: vi.fn(),
      isRunning: () => true,
    };

    const res = await POST(makeRequest({ command: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing/invalid body', async () => {
    emulator = {
      sendCommand: vi.fn(),
      isRunning: () => true,
    };
    const res = await POST(makeRequest(undefined as unknown as object));
    expect(res.status).toBe(400);
  });

  it('returns 500 when sendCommand throws', async () => {
    const sendCommand = vi.fn(async () => {
      throw new Error('boom');
    });
    emulator = { sendCommand, isRunning: () => true };

    const res = await POST(makeRequest({ command: 'EXAMINE AR' }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/boom/);
  });
});
