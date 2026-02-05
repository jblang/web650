import { beforeEach, describe, expect, it, vi } from 'vitest';

const workerClientMocks = vi.hoisted(() => ({
  isEchoEnabled: vi.fn(() => false),
  setEchoEnabled: vi.fn(),
}));

vi.mock('./workerClient', () => workerClientMocks);
vi.mock('./debug', () => ({
  debugLog: vi.fn(),
}));

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function stubLocalStorage(storage: StorageLike): void {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

describe('simh echo', () => {
  beforeEach(() => {
    vi.resetModules();
    workerClientMocks.isEchoEnabled.mockReset();
    workerClientMocks.isEchoEnabled.mockReturnValue(false);
    workerClientMocks.setEchoEnabled.mockReset();
  });

  it('proxies echo enabled state from worker client', async () => {
    workerClientMocks.isEchoEnabled.mockReturnValue(true);
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);

    const echo = await import('./echo');
    expect(echo.isEchoEnabled()).toBe(true);
  });

  it('persists enabled/disabled echo values', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const echo = await import('./echo');

    echo.setEchoEnabled(true);
    expect(workerClientMocks.setEchoEnabled).toHaveBeenCalledWith(true);
    expect(storage.setItem).toHaveBeenCalledWith('__SIMH_ECHO__', 'true');

    echo.setEchoEnabled(false);
    expect(workerClientMocks.setEchoEnabled).toHaveBeenCalledWith(false);
    expect(storage.removeItem).toHaveBeenCalledWith('__SIMH_ECHO__');
  });

  it('bootstraps worker echo from persisted localStorage flag', async () => {
    const storage = {
      getItem: vi.fn((key: string) => (key === '__SIMH_ECHO__' ? 'true' : null)),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);

    await import('./echo');
    expect(workerClientMocks.setEchoEnabled).toHaveBeenCalledWith(true);
  });

});
