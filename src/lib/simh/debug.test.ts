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
    delete (globalThis as Record<string, unknown>).__SIMH_DEBUG_API__;
    delete (globalThis as Record<string, unknown>).simhDebug;
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

  it('emits debug and error messages to browser console', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const debug = await import('./debug');
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    debug.setDebugEnabled(true);
    debug.debugLog('hello');
    debug.debugLog('payload', { value: 1 });
    debug.errorLog('oops');
    debug.errorLog('payload', { value: 2 });

    expect(consoleLogSpy).toHaveBeenCalledWith('[simh] hello');
    expect(consoleLogSpy).toHaveBeenCalledWith('[simh] payload', '{"value":1}');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[simh] oops');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[simh] payload', '{"value":2}');

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('suppresses debug logs when debug flag is disabled', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const debug = await import('./debug');
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    debug.setDebugEnabled(false);
    debug.debugLog('hello');

    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('installs a global console API to set and read debug status', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    stubLocalStorage(storage);
    await import('./debug');

    const api = (globalThis as Record<string, unknown>).__SIMH_DEBUG_API__ as
      | { setEnabled: (enabled: boolean) => void; isEnabled: () => boolean }
      | undefined;
    const namedApi = (globalThis as Record<string, unknown>).simhDebug as
      | { setEnabled: (enabled: boolean) => void; isEnabled: () => boolean }
      | undefined;

    expect(api).toBeDefined();
    expect(namedApi).toBe(api);
    api?.setEnabled(true);
    expect(api?.isEnabled()).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('__SIMH_DEBUG__', 'true');
  });
});
