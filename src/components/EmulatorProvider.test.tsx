import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import EmulatorProvider, { useEmulator } from './EmulatorProvider';
import { Display } from './FrontPanel/ConfigSection';

type JsonResponseBody = Record<string, unknown>;

const jsonResponse = (body: JsonResponseBody) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: { get: (key: string) => (key.toLowerCase() === 'content-type' ? 'application/json' : null) },
  json: async () => body,
});

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

    // Minimal EventSource stub
    global.EventSource = class {
      onmessage: ((ev: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      url: string;
      constructor(url: string) {
        this.url = url;
      }
      addEventListener() {}
      close() {}
    } as unknown as typeof EventSource;

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
  });

  afterEach(() => {
    root.unmount();
    container.remove();
    vi.restoreAllMocks();
    // @ts-expect-error: cleanup stub
    delete global.EventSource;
  });

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('exposes register snapshot and derived display/operation', async () => {
    await flush(); // allow effects + fetch promises to resolve
    await flush();

    expect(current).not.toBeNull();
    expect(current?.initialized).toBe(true);
    expect(current?.addressRegister).toBe('1234');
    expect(current?.programRegister).toBe('56789');
    expect(current?.displayValue).toBe('LOWVAL'); // Display defaults to LOWER_ACCUM
    expect(current?.operation).toBe('56'); // first two digits of PR
    expect(current?.programmedStop).toBe(true);
    expect(current?.halfCycle).toBe(true);
  });

  it('updates displayValue when display switch changes', async () => {
    await flush();
    expect(current).not.toBeNull();
    act(() => {
      current?.onDisplayChange(Display.DISTRIBUTOR);
    });
    await flush();
    await flush();
    expect(current?.displayValue).toBe('DISTVAL');
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

  it('program stop triggers a refresh', async () => {
    await flush();
    const fetchMock = setupActionFetchMock();

    act(() => {
      current?.onProgramStopClick();
    });
    await flush();

    const stateCalls = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/state')).length;
    expect(stateCalls).toBe(1);
  });

  it('program reset triggers a refresh', async () => {
    await flush();
    const fetchMock = setupActionFetchMock();

    act(() => {
      current?.onProgramResetClick();
    });
    await flush();

    const stateCalls = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/state')).length;
    expect(stateCalls).toBeGreaterThanOrEqual(1);
  });

  it('computer reset triggers a refresh', async () => {
    await flush();
    const fetchMock = setupActionFetchMock();

    act(() => {
      current?.onComputerResetClick();
    });
    await flush();

    const stateCalls = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/state')).length;
    expect(stateCalls).toBeGreaterThanOrEqual(1);
  });

  it('accumulator reset triggers a refresh', async () => {
    await flush();
    const fetchMock = setupActionFetchMock();

    act(() => {
      current?.onAccumResetClick();
    });
    await flush();

    const stateCalls = fetchMock.mock.calls.filter((c) => c[0].toString().includes('/api/state')).length;
    expect(stateCalls).toBeGreaterThanOrEqual(1);
  });
});
/* @vitest-environment jsdom */
