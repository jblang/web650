import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./debug', () => ({
  debugLog: vi.fn(),
}));

type RequestMessage = {
  id: number;
  method: string;
  args?: unknown[];
};

class FakeWorker {
  static instances: FakeWorker[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  postedMessages: RequestMessage[] = [];

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: RequestMessage): void {
    this.postedMessages.push(message);
  }

  emitMessage(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  emitError(message: string): void {
    this.onerror?.(new ErrorEvent('error', { message }));
  }

  emitMessageError(): void {
    this.onmessageerror?.(new MessageEvent('messageerror'));
  }
}

const flushMicrotasks = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

function getLastRequest(worker: FakeWorker): RequestMessage {
  const request = worker.postedMessages.at(-1);
  if (!request) throw new Error('No worker request was posted');
  return request;
}

describe('workerClient', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.resetModules();
    vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker);
  });

  it('rejects API calls before init', async () => {
    const workerClient = await import('./workerClient');
    await expect(workerClient.sendCommand('RESET')).rejects.toThrow(
      'Worker client not initialized. Call init(moduleName) first.'
    );
  });

  it('initializes worker and reuses init module name for restart', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    expect(worker).toBeDefined();

    const initReq = getLastRequest(worker);
    expect(initReq.method).toBe('init');
    expect(initReq.args).toEqual(['i650', window.location.origin]);
    worker.emitMessage({ id: initReq.id, ok: true, result: null });
    await initPromise;

    const messageCountBeforeRestart = worker.postedMessages.length;
    const restartPromise = workerClient.restart();
    await flushMicrotasks();
    const restartReq = worker.postedMessages[messageCountBeforeRestart];
    if (!restartReq) {
      throw new Error('Expected restart request to be posted');
    }
    expect(restartReq.method).toBe('restart');
    expect(restartReq.args).toEqual(['i650']);
    worker.emitMessage({ id: restartReq.id, ok: true, result: null });
    await restartPromise;
  });

  it('routes output and runstate messages to callbacks', async () => {
    const workerClient = await import('./workerClient');
    const outputListener = vi.fn();
    const onOutputPromise = workerClient.onOutput(outputListener);
    const worker = FakeWorker.instances[0];
    expect(worker).toBeDefined();
    const setOutputReq = getLastRequest(worker);
    expect(setOutputReq.method).toBe('setOutput');
    worker.emitMessage({ id: setOutputReq.id, ok: true, result: null });
    await onOutputPromise;

    const runStateListener = vi.fn();
    workerClient.onRunState(runStateListener);

    worker.emitMessage({ type: 'output', text: 'line 1\n' });
    worker.emitMessage({ type: 'runstate', running: true });
    worker.emitMessage({ type: 'runstate', running: true });
    worker.emitMessage({ type: 'runstate', running: false });

    expect(outputListener).toHaveBeenCalledWith('line 1\n');
    expect(runStateListener).toHaveBeenCalledTimes(2);
    expect(runStateListener).toHaveBeenNthCalledWith(1, true);
    expect(runStateListener).toHaveBeenNthCalledWith(2, false);
  });

  it('ignores responses for unknown request ids', async () => {
    const workerClient = await import('./workerClient');
    const onOutputPromise = workerClient.onOutput(() => {});
    const worker = FakeWorker.instances[0];
    const setOutputReq = getLastRequest(worker);
    worker.emitMessage({ id: setOutputReq.id, ok: true, result: null });
    await onOutputPromise;

    expect(() => worker.emitMessage({ id: 999, ok: true, result: null })).not.toThrow();
  });

  it('updates running state on runstate messages', async () => {
    const workerClient = await import('./workerClient');
    const onOutputPromise = workerClient.onOutput(() => {});
    const worker = FakeWorker.instances[0];
    const setOutputReq = getLastRequest(worker);
    worker.emitMessage({ id: setOutputReq.id, ok: true, result: null });
    await onOutputPromise;

    expect(workerClient.isRunning()).toBe(false);
    worker.emitMessage({ type: 'runstate', running: true });
    expect(workerClient.isRunning()).toBe(true);
  });

  it('disables output forwarding when onOutput is set to null', async () => {
    const workerClient = await import('./workerClient');
    const outputListener = vi.fn();
    const onOutputPromise = workerClient.onOutput(outputListener);
    const worker = FakeWorker.instances[0];
    const setOutputReq = getLastRequest(worker);
    worker.emitMessage({ id: setOutputReq.id, ok: true, result: null });
    await onOutputPromise;

    const disablePromise = workerClient.onOutput(null);
    const disableReq = getLastRequest(worker);
    expect(disableReq.method).toBe('setOutput');
    expect(disableReq.args).toEqual([false]);
    worker.emitMessage({ id: disableReq.id, ok: true, result: null });
    await disablePromise;

    worker.emitMessage({ type: 'output', text: 'ignored' });
    expect(outputListener).not.toHaveBeenCalledWith('ignored');
  });

  it('rejects pending request when worker returns an error response', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: false, error: 'init failed' });

    await expect(initPromise).rejects.toThrow('init failed');
  });

  it('uses a default error message when worker error is missing', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: false });

    await expect(initPromise).rejects.toThrow('Unknown worker error');
  });

  it('rejects pending requests on worker error and message error', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    worker.emitError('boom');
    await expect(initPromise).rejects.toThrow('boom');

    const retryPromise = workerClient.init('i650');
    const retryReq = getLastRequest(worker);
    expect(retryReq.method).toBe('init');
    worker.emitMessageError();
    await expect(retryPromise).rejects.toThrow('Worker message error');
  });

  it('uses generic worker error when onerror receives a plain Event', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];

    worker.onerror?.(new Event('error'));
    await expect(initPromise).rejects.toThrow('Worker error');
  });

  it('forwards send/examine/deposit calls with options', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: true, result: null });
    await initPromise;

    const sendPromise = workerClient.sendCommand('EXAMINE STATE', { echo: true, streamOutput: true });
    await flushMicrotasks();
    const sendReq = getLastRequest(worker);
    expect(sendReq.method).toBe('sendCommand');
    worker.emitMessage({ id: sendReq.id, ok: true, result: 'OK' });
    await expect(sendPromise).resolves.toBe('OK');

    const examinePromise = workerClient.examine('STATE', { echo: false });
    await flushMicrotasks();
    const examineReq = getLastRequest(worker);
    expect(examineReq.method).toBe('examine');
    worker.emitMessage({ id: examineReq.id, ok: true, result: { AR: '0000' } });
    await expect(examinePromise).resolves.toEqual({ AR: '0000' });

    const depositPromise = workerClient.deposit('AR', '1234', { echo: true });
    await flushMicrotasks();
    const depositReq = getLastRequest(worker);
    expect(depositReq.method).toBe('deposit');
    worker.emitMessage({ id: depositReq.id, ok: true, result: null });
    await depositPromise;
  });

  it('resets init promise when ensureInit sees an init failure', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];

    const sendPromise = workerClient.sendCommand('RESET');
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: false, error: 'init failed' });

    await expect(initPromise).rejects.toThrow('init failed');
    await expect(sendPromise).rejects.toThrow('init failed');

    const retryPromise = workerClient.init('i650');
    const retryReq = getLastRequest(worker);
    worker.emitMessage({ id: retryReq.id, ok: true, result: null });
    await retryPromise;
  });

  it('throws when restart is called with an empty module name', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: true, result: null });
    await initPromise;

    await expect(workerClient.restart('')).rejects.toThrow(
      'Worker client not initialized. Call init(moduleName) first.'
    );
  });

  it('forwards filesystem, yield, and stop calls to the worker', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: true, result: null });
    await initPromise;

    const messageCountBeforeRead = worker.postedMessages.length;
    const readPromise = workerClient.readFile('/tmp/test.txt');
    await flushMicrotasks();
    const readReq = worker.postedMessages[messageCountBeforeRead];
    if (!readReq) {
      throw new Error('Expected readFile request');
    }
    expect(readReq.method).toBe('readFile');
    worker.emitMessage({ id: readReq.id, ok: true, result: 'content' });
    await expect(readPromise).resolves.toBe('content');

    const messageCountBeforeWrite = worker.postedMessages.length;
    const writePromise = workerClient.writeFile('/tmp/test.txt', 'data');
    await flushMicrotasks();
    const writeReq = worker.postedMessages[messageCountBeforeWrite];
    if (!writeReq) {
      throw new Error('Expected writeFile request');
    }
    expect(writeReq.method).toBe('writeFile');
    worker.emitMessage({ id: writeReq.id, ok: true, result: null });
    await writePromise;

    const messageCountBeforeMkdir = worker.postedMessages.length;
    const mkdirPromise = workerClient.mkdir('/tmp/dir');
    await flushMicrotasks();
    const mkdirReq = worker.postedMessages[messageCountBeforeMkdir];
    if (!mkdirReq) {
      throw new Error('Expected mkdir request');
    }
    expect(mkdirReq.method).toBe('mkdir');
    worker.emitMessage({ id: mkdirReq.id, ok: true, result: null });
    await mkdirPromise;

    const messageCountBeforeUnlink = worker.postedMessages.length;
    const unlinkPromise = workerClient.unlink('/tmp/test.txt');
    await flushMicrotasks();
    const unlinkReq = worker.postedMessages[messageCountBeforeUnlink];
    if (!unlinkReq) {
      throw new Error('Expected unlink request');
    }
    expect(unlinkReq.method).toBe('unlink');
    worker.emitMessage({ id: unlinkReq.id, ok: true, result: null });
    await unlinkPromise;

    const messageCountBeforeYield = worker.postedMessages.length;
    const yieldPromise = workerClient.getYieldSteps();
    await flushMicrotasks();
    const yieldReq = worker.postedMessages[messageCountBeforeYield];
    if (!yieldReq) {
      throw new Error('Expected getYieldSteps request');
    }
    expect(yieldReq.method).toBe('getYieldSteps');
    worker.emitMessage({ id: yieldReq.id, ok: true, result: 500 });
    await expect(yieldPromise).resolves.toBe(500);

    const messageCountBeforeSetYield = worker.postedMessages.length;
    const setYieldPromise = workerClient.setYieldSteps(1200);
    await flushMicrotasks();
    const setYieldReq = worker.postedMessages[messageCountBeforeSetYield];
    if (!setYieldReq) {
      throw new Error('Expected setYieldSteps request');
    }
    expect(setYieldReq.method).toBe('setYieldSteps');
    worker.emitMessage({ id: setYieldReq.id, ok: true, result: null });
    await setYieldPromise;

    const messageCountBeforeStop = worker.postedMessages.length;
    const stopPromise = workerClient.stop();
    await flushMicrotasks();
    const stopReq = worker.postedMessages[messageCountBeforeStop];
    if (!stopReq) {
      throw new Error('Expected stop request');
    }
    expect(stopReq.method).toBe('stop');
    worker.emitMessage({ id: stopReq.id, ok: true, result: null });
    await stopPromise;
  });

  it('forwards state stream calls to the worker', async () => {
    const workerClient = await import('./workerClient');
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: true, result: null });
    await initPromise;

    // Test enableStateStream
    const enablePromise = workerClient.enableStateStream(true);
    await flushMicrotasks();
    const enableReq = getLastRequest(worker);
    expect(enableReq.method).toBe('stateStreamEnable');
    expect(enableReq.args).toEqual([true]);
    worker.emitMessage({ id: enableReq.id, ok: true, result: null });
    await enablePromise;

    // Test setStateStreamStride
    const stridePromise = workerClient.setStateStreamStride(10);
    await flushMicrotasks();
    const strideReq = getLastRequest(worker);
    expect(strideReq.method).toBe('stateStreamSetStride');
    expect(strideReq.args).toEqual([10]);
    worker.emitMessage({ id: strideReq.id, ok: true, result: null });
    await stridePromise;

    // Test clearStateStream
    const clearPromise = workerClient.clearStateStream();
    await flushMicrotasks();
    const clearReq = getLastRequest(worker);
    expect(clearReq.method).toBe('stateStreamClear');
    worker.emitMessage({ id: clearReq.id, ok: true, result: null });
    await clearPromise;

    // Test readStateStream
    const sampleData = [
      {
        pr: '0000000001+',
        ar: '0001',
        ic: '0002',
        accLo: '0000000003+',
        accUp: '0000000004+',
        dist: '0000000005+',
        ov: 1,
      },
    ];
    const readPromise = workerClient.readStateStream(64);
    await flushMicrotasks();
    const readReq = getLastRequest(worker);
    expect(readReq.method).toBe('stateStreamRead');
    expect(readReq.args).toEqual([64]);
    worker.emitMessage({ id: readReq.id, ok: true, result: sampleData });
    await expect(readPromise).resolves.toEqual(sampleData);
  });

  it('routes state stream messages to callback', async () => {
    const workerClient = await import('./workerClient');
    const stateStreamListener = vi.fn();
    workerClient.onStateStream(stateStreamListener);

    const onOutputPromise = workerClient.onOutput(() => {});
    const worker = FakeWorker.instances[0];
    const setOutputReq = getLastRequest(worker);
    worker.emitMessage({ id: setOutputReq.id, ok: true, result: null });
    await onOutputPromise;

    const sampleData = {
      pr: '0000000001+',
      ar: '0001',
      ic: '0002',
      accLo: '0000000003+',
      accUp: '0000000004+',
      dist: '0000000005+',
      ov: 1,
    };

    worker.emitMessage({ type: 'state', sample: sampleData });

    expect(stateStreamListener).toHaveBeenCalledWith(sampleData);
  });

  it('handles URL parsing errors in inferBasePathFromScripts gracefully', async () => {
    const workerClient = await import('./workerClient');

    // Create a script with invalid URL
    const script = document.createElement('script');
    script.src = 'invalid:url:with:colons:/_next/static/test.js';
    document.head.appendChild(script);

    // Should not throw even with malformed URL
    const initPromise = workerClient.init('i650');
    const worker = FakeWorker.instances[0];
    const initReq = getLastRequest(worker);
    worker.emitMessage({ id: initReq.id, ok: true, result: null });
    await expect(initPromise).resolves.toBeUndefined();

    script.remove();
  });
});
