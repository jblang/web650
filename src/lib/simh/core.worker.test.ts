import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ModuleConfig = {
  locateFile?: (path: string) => string;
};

const createFakeModule = () => ({
  ccall: vi.fn(() => 0),
  FS: {
    stat: vi.fn(() => ({ mode: 16877 })),
  },
});

const setGlobal = (key: string, value: unknown) => {
  Object.defineProperty(globalThis, key, { value, configurable: true });
};

const resetGlobal = (key: string, value: unknown) => {
  if (value === undefined) {
    delete (globalThis as Record<string, unknown>)[key];
    return;
  }
  Object.defineProperty(globalThis, key, { value, configurable: true });
};

describe('core worker loader', () => {
  const originalLocation = globalThis.location;
  const originalImportScripts = (globalThis as Record<string, unknown>).importScripts;

  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as Record<string, unknown>).createI650Module;
  });

  afterEach(() => {
    resetGlobal('location', originalLocation);
    resetGlobal('importScripts', originalImportScripts);
    delete (globalThis as Record<string, unknown>).createI650Module;
  });

  it('loads script via importScripts with URL resolution', async () => {
    const importScripts = vi.fn();
    setGlobal('importScripts', importScripts);
    setGlobal('location', { origin: 'null', href: 'https://example.com/worker/index.html' });

    let moduleConfig: ModuleConfig | undefined;
    (globalThis as Record<string, unknown>).createI650Module = vi.fn(async (config: ModuleConfig) => {
      moduleConfig = config;
      return createFakeModule();
    });

    const core = await import('./core');
    await core.init('i650');

    expect(importScripts).toHaveBeenCalledWith('https://example.com/i650.js');
    expect(moduleConfig?.locateFile?.('i650.wasm')).toBe('https://example.com/worker/i650.wasm');
  });

  it('resolves assets against location origin when available', async () => {
    const importScripts = vi.fn();
    setGlobal('importScripts', importScripts);
    setGlobal('location', { origin: 'https://cdn.example.com', href: 'https://cdn.example.com/worker/index.html' });

    let moduleConfig: ModuleConfig | undefined;
    (globalThis as Record<string, unknown>).createI650Module = vi.fn(async (config: ModuleConfig) => {
      moduleConfig = config;
      return createFakeModule();
    });

    const core = await import('./core');
    await core.init('i650');

    expect(moduleConfig?.locateFile?.('/i650.wasm')).toBe('https://cdn.example.com/i650.wasm');
  });

  // keep worker load coverage limited to success paths
});

/* @vitest-environment node */
