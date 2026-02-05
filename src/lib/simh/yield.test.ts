import { beforeEach, describe, expect, it, vi } from 'vitest';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function stubLocalStorage(storage: StorageLike): void {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

describe('simh yield persistence', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns null when no value is persisted', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const yieldState = await import('./yield');

    expect(yieldState.readPersistedYieldSteps()).toBeNull();
  });

  it('normalizes persisted values to configured bounds', async () => {
    const storage = {
      getItem: vi.fn(() => '1000000'),
      setItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const yieldState = await import('./yield');

    expect(yieldState.readPersistedYieldSteps()).toBe(100000);
  });

  it('returns null for non-numeric persisted values', async () => {
    const storage = {
      getItem: vi.fn(() => 'abc'),
      setItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const yieldState = await import('./yield');

    expect(yieldState.readPersistedYieldSteps()).toBeNull();
  });

  it('persists normalized yield steps', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const yieldState = await import('./yield');

    yieldState.persistYieldSteps(0.3);
    expect(storage.setItem).toHaveBeenCalledWith('__SIMH_YIELD_STEPS__', '1');
  });

  it('does not persist when normalization yields null', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const yieldState = await import('./yield');

    yieldState.persistYieldSteps(Number.NaN);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('returns null for undefined values during normalization', async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    stubLocalStorage(storage);
    const yieldState = await import('./yield');

    yieldState.persistYieldSteps(undefined as unknown as number);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
