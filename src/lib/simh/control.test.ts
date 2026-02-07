import { beforeEach, describe, expect, it, vi } from 'vitest';

const coreMocks = vi.hoisted(() => ({
  getModule: vi.fn(),
  init: vi.fn(),
  resetModule: vi.fn(),
}));

vi.mock('./core', () => coreMocks);

function resolveScriptSrc(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${window.location.origin}${path}`;
}

describe('simh control', () => {
  beforeEach(() => {
    vi.resetModules();
    coreMocks.getModule.mockReset();
    coreMocks.init.mockReset();
    coreMocks.resetModule.mockReset();
    document.head.innerHTML = '';
    delete (globalThis as Record<string, unknown>).createI650Module;
  });

  it('steps emulator via simh_step', async () => {
    const ccall = vi.fn(() => 36);
    coreMocks.getModule.mockReturnValue({ ccall });
    const control = await import('./control');

    const status = control.step(500);
    expect(status).toBe(36);
    expect(ccall).toHaveBeenCalledWith('simh_step', 'number', ['number'], [500]);
  });

  it('stops emulator via simh_stop', async () => {
    const ccall = vi.fn();
    coreMocks.getModule.mockReturnValue({ ccall });
    const control = await import('./control');

    control.stop();
    expect(ccall).toHaveBeenCalledWith('simh_stop', 'void', [], []);
  });

  it('restart removes existing script and reinitializes module', async () => {
    const ccall = vi.fn();
    coreMocks.getModule.mockReturnValue({ ccall });
    coreMocks.init.mockResolvedValue(undefined);
    (globalThis as Record<string, unknown>).createI650Module = vi.fn();
    const existingScript = document.createElement('script');
    existingScript.src = resolveScriptSrc('/i650.js');
    document.head.appendChild(existingScript);
    expect(document.querySelector(`script[src="${resolveScriptSrc('/i650.js')}"]`)).toBeTruthy();

    const control = await import('./control');
    await control.restart('i650');

    expect(coreMocks.resetModule).toHaveBeenCalledTimes(1);
    expect(coreMocks.init).toHaveBeenCalledWith('i650');
    expect(document.querySelector(`script[src="${resolveScriptSrc('/i650.js')}"]`)).toBeNull();
    expect((globalThis as Record<string, unknown>).createI650Module).toBeUndefined();
  });

  it('restart skips removing script when none is present', async () => {
    coreMocks.init.mockResolvedValue(undefined);
    coreMocks.getModule.mockReturnValue({ ccall: vi.fn() });
    (globalThis as Record<string, unknown>).createI650Module = vi.fn();

    const control = await import('./control');
    await control.restart('i650');

    expect(coreMocks.resetModule).toHaveBeenCalledTimes(1);
    expect(coreMocks.init).toHaveBeenCalledWith('i650');
  });

  it('restart works when document is undefined (Node environment)', async () => {
    coreMocks.init.mockResolvedValue(undefined);
    coreMocks.getModule.mockReturnValue({ ccall: vi.fn() });
    (globalThis as Record<string, unknown>).createI650Module = vi.fn();

    // Save original document
    const originalDocument = global.document;

    // Delete document to simulate Node.js environment
    // @ts-expect-error - intentionally testing undefined document
    delete global.document;

    const control = await import('./control');
    await control.restart('i650');

    expect(coreMocks.resetModule).toHaveBeenCalledTimes(1);
    expect(coreMocks.init).toHaveBeenCalledWith('i650');
    expect((globalThis as Record<string, unknown>).createI650Module).toBeUndefined();

    // Restore document
    global.document = originalDocument;
  });
});
