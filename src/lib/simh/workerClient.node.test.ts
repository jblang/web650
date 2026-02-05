// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

type RequestMessage = {
  id: number;
  method: string;
  args?: unknown[];
};

class FakeWorker {
  static instances: FakeWorker[] = [];
  postedMessages: RequestMessage[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: RequestMessage): void {
    this.postedMessages.push(message);
  }
}

describe('workerClient in node environment', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker);
    FakeWorker.instances = [];
  });

  it('initializes with empty baseUrl when window is undefined', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const activeWorker = FakeWorker.instances[0];
    expect(activeWorker).toBeDefined();

    const initReq = activeWorker.postedMessages[0];
    expect(initReq).toBeDefined();
    expect(initReq.method).toBe('init');
    expect(initReq.args).toEqual(['i650', '']);

    activeWorker.onmessage?.({ data: { id: initReq.id, ok: true, result: null } } as MessageEvent);
    await Promise.resolve();
    const setEchoReq = activeWorker.postedMessages[1];
    expect(setEchoReq).toBeDefined();
    activeWorker.onmessage?.({ data: { id: setEchoReq.id, ok: true, result: null } } as MessageEvent);
    await initPromise;
  });
});
