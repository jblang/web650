import React, { act, useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import EmulatorProvider, { useEmulator } from './EmulatorProvider';
import { Display } from './FrontPanel/ConfigSection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type JsonResponseBody = Record<string, unknown>;

const jsonResponse = (body: JsonResponseBody) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: { get: (key: string) => (key.toLowerCase() === 'content-type' ? 'application/json' : null) },
  json: async () => body,
});

class MockEventSource {
  url: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  private listeners: Record<string, (ev: MessageEvent) => void> = {};
  closed = false;
  constructor(url: string) {
    this.url = url;
    MockEventSource.lastInstance = this;
  }
  addEventListener(type: string, cb: (ev: MessageEvent) => void) {
    this.listeners[type] = cb;
  }
  close() {
    this.closed = true;
  }
  emit(type: string, data: string) {
    if (type === 'message' && this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    } else if (this.listeners[type]) {
      this.listeners[type]({ data } as MessageEvent);
    }
  }
  static lastInstance: MockEventSource | null = null;
}

describe('EmulatorProvider', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let current: ReturnType<typeof useEmulator> | null;

  const registers = {
    AR: '1234',
    PR: '56789',
    ACCLO: 'LOWVAL',
    ACCUP: 'UPPVAL',
    DIST: 'DISTVAL',
    CSW: 'SWITCHES',
    CSWPS: '1',
    CSWOS: '0',
    HALF: '1',
  };

  const renderProvider = () => {
    const Probe = () => {
      const ctx = useEmulator();
      useEffect(() => {
        current = ctx;
      }, [ctx]);
      return null;
    };

    act(() => {
      root.render(
        <EmulatorProvider>
          <Probe />
        </EmulatorProvider>
      );
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    current = null;

    // Mock fetch sequence: /api/start, /api/command (set cpu 1k), /api/state
    const responses = [
      jsonResponse({}),
      jsonResponse({ output: '' }),
      jsonResponse({ registers }),
    ];

    global.fetch = vi.fn().mockImplementation(() => {
      const resp = responses.shift() ?? jsonResponse({});
      return Promise.resolve(resp);
    });

    global.EventSource = MockEventSource as unknown as typeof EventSource;

    renderProvider();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    // @ts-expect-error cleanup
    delete global.EventSource;
  });

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('exposes register snapshot and derived display/operation', async () => {
    await flush();
    await flush();

    expect(current).not.toBeNull();
    expect(current?.initialized).toBe(true);
    expect(current?.addressRegister).toBe('1234');
    expect(current?.programRegister).toBe('56789');
    expect(current?.displayValue).toBe('LOWVAL'); // default display is LOWER_ACCUM
    expect(current?.operation).toBe('56');
    expect(current?.programmedStop).toBe(true);
    expect(current?.halfCycle).toBe(true);
  });

  it('updates displayValue when display switch changes', async () => {
    await flush();
    act(() => current?.onDisplayChange(Display.DISTRIBUTOR));
    await flush();
    expect(current?.displayValue).toBe('DISTVAL');
  });

  it('adds streamed console output via SSE', async () => {
    await flush(); // init
    const sse = MockEventSource.lastInstance;
    expect(sse).not.toBeNull();

    act(() => {
      sse?.emit('message', JSON.stringify('LINE1\n'));
      sse?.emit('exit', JSON.stringify({ code: 0 }));
    });

    expect(current?.output).toContain('LINE1');
    expect(current?.output).toContain('[emulator exited');
  });

  it('restart triggers /api/restart and refresh', async () => {
    await flush();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('/api/restart')) return Promise.resolve(jsonResponse({}));
      if (url.includes('/api/command')) return Promise.resolve(jsonResponse({}));
      if (url.includes('/api/state')) return Promise.resolve(jsonResponse({ registers }));
      return Promise.resolve(jsonResponse({}));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await act(async () => {
      await current?.onRestartClick();
    });

    const restartCalls = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/restart')).length;
    const stateCalls = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/state')).length;
    expect(restartCalls).toBe(1);
    expect(stateCalls).toBeGreaterThanOrEqual(1);
  });

  it('records start errors into output', async () => {
    // Re-render with failing /api/start but valid follow-ups
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('/api/start')) return Promise.resolve(jsonResponse({ error: 'boom' }));
      if (url.includes('/api/state')) return Promise.resolve(jsonResponse({ registers }));
      return Promise.resolve(jsonResponse({}));
    }) as unknown as typeof fetch;

    renderProvider();
    await flush();
    expect(current?.output).toContain('Error: boom');
  });

  const setupActionFetchMock = () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('/api/state')) {
        return Promise.resolve(jsonResponse({ registers }));
      }
      return Promise.resolve(jsonResponse({}));
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  };

  it('control actions refresh state (stop/reset/accum)', async () => {
    await flush();
    const fetchMock = setupActionFetchMock();

    await act(async () => {
      await current?.onProgramStopClick();
      await current?.onProgramResetClick();
      await current?.onComputerResetClick();
      await current?.onAccumResetClick();
    });
    await flush();

    const stateCalls = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/state')).length;
    expect(stateCalls).toBeGreaterThanOrEqual(4);
  });

  it('manual program start performs drum read-out', async () => {
    await flush();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('/api/state/0000') && method === 'GET') {
        return Promise.resolve(jsonResponse({ registers: { '0000': 'DATA' } }));
      }
      if (url.includes('/api/state/DIST') && method === 'PUT') {
        return Promise.resolve(jsonResponse({}));
      }
      if (url.includes('/api/state') && method === 'GET') {
        return Promise.resolve(jsonResponse({ registers }));
      }
      return Promise.resolve(jsonResponse({}));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    act(() => {
      current?.onControlChange(2); // MANUAL_OP
      current?.onDisplayChange(Display.READ_OUT_STORAGE);
      current?.onAddressChange('0000');
    });
    await act(async () => {
      await current?.onProgramStartClick();
    });

    const puts = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/state/DIST'));
    expect(puts.length).toBeGreaterThanOrEqual(1);
  });

  it('manual program start performs drum write-in', async () => {
    await flush();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('/api/state/0001') && method === 'PUT') {
        return Promise.resolve(jsonResponse({}));
      }
      if (url.includes('/api/state/DIST') && method === 'PUT') {
        return Promise.resolve(jsonResponse({}));
      }
      if (url.includes('/api/state') && method === 'GET') {
        return Promise.resolve(jsonResponse({ registers }));
      }
      return Promise.resolve(jsonResponse({}));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    act(() => {
      current?.onControlChange(2); // MANUAL_OP
      current?.onDisplayChange(Display.READ_IN_STORAGE);
      current?.onAddressChange('0001');
      current?.onEntryValueChange('1111');
    });
    await flush();
    await act(async () => {
      await current?.onTransferClick(); // copy addressSwitches to addressRegister
      await current?.onProgramStartClick();
    });

    const drumWrites = fetchMock.mock.calls.filter((c) => {
      const init = c[1] as RequestInit | undefined;
      return init?.method === 'PUT' && c[0].toString().includes('/api/state/') && !c[0].toString().includes('/api/state/DIST');
    });
    expect(drumWrites.length).toBeGreaterThanOrEqual(1);
  });

  it('program reset escapes when running', async () => {
    await flush();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('/api/command/go')) return Promise.resolve(jsonResponse({}));
      if (url.includes('/api/escape')) return Promise.resolve(jsonResponse({}));
      if (url.includes('/api/state') && method === 'GET') return Promise.resolve(jsonResponse({ registers }));
      if (url.includes('/api/state/AR') && method === 'PUT') return Promise.resolve(jsonResponse({}));
      if (url.includes('/api/state/PR') && method === 'PUT') return Promise.resolve(jsonResponse({}));
      return Promise.resolve(jsonResponse({}));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await act(async () => {
      await current?.onProgramStartClick(); // enter running state
    });
    await act(async () => {
      await current?.onProgramResetClick(); // should escape first branch
    });

    const escapes = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/escape'));
    expect(escapes.length).toBeGreaterThanOrEqual(1);
  });
});
/* @vitest-environment jsdom */
