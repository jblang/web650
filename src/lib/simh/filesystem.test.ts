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
      readdir: vi.fn(() => ['.', '..', 'dir', 'deck.dck']),
      mkdir: vi.fn(),
      unlink: vi.fn(),
      stat: vi.fn((path: string) => ({ mode: path.endsWith('/dir') ? 0o040777 : 0o100644 })),
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

    const entries = filesystem.listDirectory('/tmp');
    expect(FS.readdir).toHaveBeenCalledWith('/tmp');
    expect(FS.stat).toHaveBeenCalledWith('/tmp/dir');
    expect(FS.stat).toHaveBeenCalledWith('/tmp/deck.dck');
    expect(entries).toEqual([
      { name: 'dir', path: '/tmp/dir', isDirectory: true },
      { name: 'deck.dck', path: '/tmp/deck.dck', isDirectory: false },
    ]);
  });
});
