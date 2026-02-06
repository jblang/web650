import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCPE_BREAK, SCPE_STOP, SCPE_STEP } from './constants';

function addExistingScript(src: string): void {
  const script = document.createElement('script');
  script.src = resolveScriptSrc(src);
  document.head.appendChild(script);
}

function resolveScriptSrc(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${window.location.origin}${path}`;
}

function createFakeModule(simhInitStatus = 0) {
  return {
    ccall: vi.fn((name: string) => {
      if (name === 'simh_init') return simhInitStatus;
      return 0;
    }),
    FS: {
      stat: vi.fn(() => ({ mode: 16877 })),
    },
  };
}

describe('core init', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    document.head.innerHTML = '';
    delete (globalThis as Record<string, unknown>).createI650Module;
  });

  it('disables global prompt handler when present', async () => {
    const promptSpy = vi.fn(() => 'value');
    vi.stubGlobal('prompt', promptSpy);
    await import('./core');

    const prompt = (globalThis as { prompt?: () => unknown }).prompt;
    expect(prompt).toBeTypeOf('function');
    expect(prompt?.()).toBeNull();
    expect(prompt).not.toBe(promptSpy);
  });

  it('returns early when module is already initialized', async () => {
    const core = await import('./core');
    core.setModule(createFakeModule() as unknown as Parameters<typeof core.setModule>[0]);

    await expect(core.init('i650')).resolves.toBeUndefined();
  });

  it('throws when module factory function is missing', async () => {
    addExistingScript('/i650.js');
    const core = await import('./core');
    await expect(core.init('i650')).rejects.toThrow(
      'createI650Module not found'
    );
  });

  it('loads script and initializes module through the factory', async () => {
    const fakeModule = createFakeModule();
    const createModule = vi.fn(async () => fakeModule);
    (globalThis as Record<string, unknown>).createI650Module = createModule;

    const core = await import('./core');
    const initPromise = core.init('i650');

    const appendedScript = document.querySelector(
      `script[src="${resolveScriptSrc('/i650.js')}"]`
    ) as HTMLScriptElement | null;
    expect(appendedScript).toBeTruthy();
    appendedScript?.onload?.(new Event('load'));

    await initPromise;
    expect(createModule).toHaveBeenCalledTimes(1);
    expect(fakeModule.ccall).toHaveBeenCalledWith('simh_init', 'number', [], []);
  });

  it('passes locateFile using configured asset base', async () => {
    const fakeModule = createFakeModule();
    let moduleConfig: Record<string, unknown> | undefined;
    (globalThis as Record<string, unknown>).createI650Module = vi.fn(async (config: Record<string, unknown>) => {
      moduleConfig = config;
      return fakeModule;
    });

    const core = await import('./core');
    core.setAssetBase('https://cdn.example.com/assets');
    const initPromise = core.init('i650');
    const appendedScript = document.querySelector(
      'script[src="https://cdn.example.com/assets/i650.js"]'
    ) as HTMLScriptElement | null;
    expect(appendedScript).toBeTruthy();
    appendedScript?.onload?.(new Event('load'));
    await initPromise;

    const locateFile = moduleConfig?.locateFile as ((path: string) => string) | undefined;
    expect(locateFile).toBeDefined();
    expect(locateFile?.('i650.wasm')).toBe('https://cdn.example.com/assets/i650.wasm');
    expect(locateFile?.('/i650.wasm')).toBe('https://cdn.example.com/assets/i650.wasm');
    expect(locateFile?.('https://example.org/file.bin')).toBe('https://example.org/file.bin');
  });

  it('routes print handlers to the output callback', async () => {
    addExistingScript('/i650.js');
    const fakeModule = createFakeModule();
    let moduleConfig: Record<string, unknown> | undefined;
    (globalThis as Record<string, unknown>).createI650Module = vi.fn(async (config: Record<string, unknown>) => {
      moduleConfig = config;
      return fakeModule;
    });

    const core = await import('./core');
    const output = vi.fn();
    core.onOutput(output);

    await core.init('i650');

    const print = moduleConfig?.print as ((text: string) => void) | undefined;
    const printErr = moduleConfig?.printErr as ((text: string) => void) | undefined;
    const stdin = moduleConfig?.stdin as (() => unknown) | undefined;

    print?.('line');
    printErr?.('error');

    expect(output).toHaveBeenCalledWith('line\n');
    expect(output).toHaveBeenCalledWith('error\n');
    expect(stdin?.()).toBeNull();
  });

  it('warns when expected filesystem directories are missing', async () => {
    addExistingScript('/i650.js');
    const fakeModule = {
      ccall: vi.fn(() => 0),
      FS: {
        stat: vi.fn(() => {
          throw new Error('missing');
        }),
      },
    };
    (globalThis as Record<string, unknown>).createI650Module = vi.fn(async () => fakeModule);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const core = await import('./core');
    await core.init('i650');

    expect(warnSpy).toHaveBeenCalledWith(
      '[simh] /sw directory not found — preloaded filesystem may not have loaded'
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[simh] /tests directory not found — preloaded filesystem may not have loaded'
    );
    warnSpy.mockRestore();
  });

  it('throws when simh_init returns non-zero', async () => {
    addExistingScript('/i650.js');
    const fakeModule = createFakeModule(7);
    (globalThis as Record<string, unknown>).createI650Module = vi.fn(async () => fakeModule);

    const core = await import('./core');
    await expect(core.init('i650')).rejects.toThrow('simh_init failed with code 7');
  });

  it('rejects when script fails to load', async () => {
    (globalThis as Record<string, unknown>).createI650Module = vi.fn(async () => createFakeModule());

    const core = await import('./core');
    const initPromise = core.init('i650');
    const appendedScript = document.querySelector(
      `script[src="${resolveScriptSrc('/i650.js')}"]`
    ) as HTMLScriptElement | null;
    expect(appendedScript).toBeTruthy();
    appendedScript?.onerror?.(new Event('error'));

    await expect(initPromise).rejects.toThrow('Failed to load /i650.js');
  });
});

describe('core command execution', () => {
  beforeEach(async () => {
    vi.resetModules();
    const core = await import('./core');
    core.resetModule();
    core.onOutput(null);
  });

  it('returns captured output when emscripten throws ExitStatus', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => {
        core.handleOutput('partial output');
        throw { status: 17 };
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    const output = core.sendCommand('GO');
    expect(output).toContain('partial output');
    expect(output).toContain('[SIMH exited with status 17]');
  });

  it('rethrows unexpected emscripten errors', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => {
        throw new Error('boom');
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    expect(() => core.sendCommand('BAD')).toThrow('boom');
  });

  it('returns SIMH output text on command error', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => {
        core.handleOutput('  bad command  ');
        return 5;
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    expect(core.sendCommand('BAD')).toContain('bad command');
  });

  it('returns empty output on command error when output is empty', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => 99),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    expect(core.sendCommand('BAD')).toBe('');
  });

  it('accepts valid statuses even when flag bits are set', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => SCPE_STOP | SCPE_BREAK),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    expect(() => core.sendCommand('STEP')).not.toThrow();
  });

  it('accepts SCPE_STEP as a successful status', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => SCPE_STEP),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    expect(() => core.sendCommand('STEP')).not.toThrow();
  });

  it('echoes prompt and streamed output in stream mode', async () => {
    const core = await import('./core');
    const output = vi.fn();
    core.onOutput(output);
    const fakeModule = {
      ccall: vi.fn(() => {
        core.handleOutput('device line');
        return 0;
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    core.sendCommand('GO', { echo: true, streamOutput: true });
    expect(output).toHaveBeenNthCalledWith(1, 'sim> GO\n');
    expect(output).toHaveBeenNthCalledWith(2, 'device line\n');
  });

  it('echoes prompt and buffered output in non-stream mode', async () => {
    const core = await import('./core');
    const output = vi.fn();
    core.onOutput(output);
    const fakeModule = {
      ccall: vi.fn(() => {
        core.handleOutput('done');
        return 0;
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    core.sendCommand('RUN', { echo: true });
    expect(output).toHaveBeenNthCalledWith(1, 'sim> RUN\n');
    expect(output).toHaveBeenNthCalledWith(2, 'done\n');
  });

  it('does not add extra newline when output already ends with one', async () => {
    const core = await import('./core');
    const output = vi.fn();
    core.onOutput(output);
    const fakeModule = {
      ccall: vi.fn(() => {
        core.handleOutput('done\n');
        return 0;
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    core.sendCommand('RUN', { echo: true });
    expect(output).toHaveBeenNthCalledWith(2, 'done\n');
  });

  it('forwards output directly when not capturing', async () => {
    const core = await import('./core');
    const output = vi.fn();
    core.onOutput(output);

    core.handleOutput('line');
    expect(output).toHaveBeenCalledWith('line\n');
  });

  it('does not emit output when no output callback is set', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => {
        core.handleOutput('done');
        return 0;
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    expect(core.sendCommand('RUN', { echo: true })).toContain('done');
  });

  it('handles async command execution errors and exit status', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(async () => {
        core.handleOutput('before exit');
        throw { status: 3 };
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    const result = await core.sendCommandAsync('RUN');
    expect(result).toContain('before exit');
    expect(result).toContain('[SIMH exited with status 3]');
  });

  it('handles async commands that return a number immediately', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(() => 0),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    await expect(core.sendCommandAsync('RUN')).resolves.toBe('');
  });

  it('echoes streamed output in async mode', async () => {
    const core = await import('./core');
    const output = vi.fn();
    core.onOutput(output);
    const fakeModule = {
      ccall: vi.fn(async () => {
        core.handleOutput('async line');
        return 0;
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    await core.sendCommandAsync('GO', { echo: true, streamOutput: true });
    expect(output).toHaveBeenCalledWith('sim> GO\n');
    expect(output).toHaveBeenCalledWith('async line\n');
  });

  it('rethrows async emscripten errors without status', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(async () => {
        throw new Error('async boom');
      }),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    await expect(core.sendCommandAsync('BAD')).rejects.toThrow('async boom');
  });

  it('resolves async SIMH errors as output for invalid status codes', async () => {
    const core = await import('./core');
    const fakeModule = {
      ccall: vi.fn(async () => 99),
    };
    core.setModule(fakeModule as unknown as Parameters<typeof core.setModule>[0]);

    await expect(core.sendCommandAsync('BAD')).resolves.toBe('');
  });
});

describe('core helpers and wrappers', () => {
  beforeEach(async () => {
    vi.resetModules();
    const core = await import('./core');
    core.resetModule();
  });

  it('parses key-value output formats', async () => {
    const core = await import('./core');
    const parsed = core.parseKeyValues('AR: 0000\nPR/ 0000000000+\nbad line');
    expect(parsed).toEqual({ AR: '0000', PR: '0000000000+' });
  });

  it('wraps examine and deposit helpers with normalized commands', async () => {
    const core = await import('./core');
    const ccall = vi.fn(() => {
      core.handleOutput('AR: 0000');
      return 0;
    });
    core.setModule({ ccall } as unknown as Parameters<typeof core.setModule>[0]);

    const result = core.examine('  ar  ');
    expect(result).toEqual({ AR: '0000' });
    expect(ccall).toHaveBeenCalledWith('simh_cmd', 'number', ['string'], ['EXAMINE AR']);

    core.deposit(' pr ', '123');
    expect(ccall).toHaveBeenCalledWith('simh_cmd', 'number', ['string'], ['DEPOSIT PR 123']);
  });

  it('wraps async examine and deposit helpers', async () => {
    const core = await import('./core');
    const ccall = vi.fn(async () => {
      core.handleOutput('PR: 1111');
      return 0;
    });
    core.setModule({ ccall } as unknown as Parameters<typeof core.setModule>[0]);

    const result = await core.examineAsync('pr', { echo: true });
    expect(result).toEqual({ PR: '1111' });

    await core.depositAsync('ar', '9999', { echo: false });
    expect(ccall).toHaveBeenCalledWith('simh_cmd', 'number', ['string'], ['DEPOSIT AR 9999']);
  });

  it('reports running and yield settings via module calls', async () => {
    const core = await import('./core');
    const ccall = vi.fn((name: string) => {
      if (name === 'simh_is_running') return 1;
      if (name === 'simh_is_busy') return 0;
      if (name === 'simh_get_yield_steps') return 1234;
      if (name === 'simh_get_yield_enabled') return 1;
      return 0;
    });
    core.setModule({ ccall } as unknown as Parameters<typeof core.setModule>[0]);

    expect(core.isCpuRunning()).toBe(true);
    expect(core.isEmulatorBusy()).toBe(false);
    expect(core.getYieldSteps()).toBe(1234);
    expect(core.getYieldEnabled()).toBe(true);

    core.setYieldSteps(2000);
    expect(ccall).toHaveBeenCalledWith('simh_set_yield_steps', 'void', ['number'], [2000]);

    core.setYieldEnabled(false);
    expect(ccall).toHaveBeenCalledWith('simh_set_yield_enabled', 'void', ['number'], [0]);

    core.setYieldEnabled(true);
    expect(ccall).toHaveBeenCalledWith('simh_set_yield_enabled', 'void', ['number'], [1]);
  });
});
