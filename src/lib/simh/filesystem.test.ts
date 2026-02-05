import { beforeEach, describe, expect, it, vi } from 'vitest';

const coreMocks = vi.hoisted(() => ({
  getModule: vi.fn(),
}));

vi.mock('./core', () => coreMocks);

describe('simh filesystem', () => {
  beforeEach(() => {
    vi.resetModules();
    coreMocks.getModule.mockReset();
  });

  it('forwards read/write/mkdir/unlink to module FS', async () => {
    const FS = {
      writeFile: vi.fn(),
      readFile: vi.fn(() => 'content'),
      mkdir: vi.fn(),
      unlink: vi.fn(),
    };
    coreMocks.getModule.mockReturnValue({ FS });
    const filesystem = await import('./filesystem');

    filesystem.writeFile('/tmp/test.txt', 'abc');
    expect(FS.writeFile).toHaveBeenCalledWith('/tmp/test.txt', 'abc');

    const content = filesystem.readFile('/tmp/test.txt');
    expect(content).toBe('content');
    expect(FS.readFile).toHaveBeenCalledWith('/tmp/test.txt', { encoding: 'utf8' });

    filesystem.mkdir('/tmp/newdir');
    expect(FS.mkdir).toHaveBeenCalledWith('/tmp/newdir');

    filesystem.unlink('/tmp/test.txt');
    expect(FS.unlink).toHaveBeenCalledWith('/tmp/test.txt');
  });
});
