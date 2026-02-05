import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('simh debug', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    delete (globalThis as Record<string, unknown>).__SIMH_DEBUG__;
  });

  it('toggles debug flag and persists to localStorage', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const debug = await import('./debug');

    debug.setDebugEnabled(true);
    expect(debug.isDebugEnabled()).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('__SIMH_DEBUG__', 'true');

    debug.setDebugEnabled(false);
    expect(debug.isDebugEnabled()).toBe(false);
    expect(storage.removeItem).toHaveBeenCalledWith('__SIMH_DEBUG__');
  });

  it('bootstraps debug flag from persisted localStorage value', async () => {
    const storage = {
      getItem: vi.fn((key: string) => (key === '__SIMH_DEBUG__' ? 'true' : null)),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);

    const debug = await import('./debug');
    expect(debug.isDebugEnabled()).toBe(true);
  });

  it('logs debug and error messages when enabled', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debug = await import('./debug');

    debug.setDebugEnabled(true);
    debug.debugLog('hello');
    debug.debugLog('payload', { value: 1 });
    debug.errorLog('oops');
    debug.errorLog('payload', { value: 2 });

    expect(logSpy).toHaveBeenCalledWith('[simh] hello');
    expect(logSpy).toHaveBeenCalledWith('[simh] payload', { value: 1 });
    expect(errorSpy).toHaveBeenCalledWith('[simh] oops');
    expect(errorSpy).toHaveBeenCalledWith('[simh] payload', { value: 2 });

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
