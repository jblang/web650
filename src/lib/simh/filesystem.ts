/**
 * Virtual filesystem operations.
 */

import { getModule } from './core';

export type FilesystemEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
};

const S_IFDIR = 0o040000;

function isDirectoryMode(mode: number): boolean {
  return (mode & S_IFDIR) === S_IFDIR;
}

export function writeFile(path: string, data: string | Uint8Array): void {
  const emModule = getModule();
  emModule.FS.writeFile(path, data);
}

export function readFile(path: string): string {
  const emModule = getModule();
  return emModule.FS.readFile(path, { encoding: 'utf8' }) as string;
}

export function mkdir(path: string): void {
  const emModule = getModule();
  emModule.FS.mkdir(path);
}

export function unlink(path: string): void {
  const emModule = getModule();
  emModule.FS.unlink(path);
}

export function listDirectory(path: string): FilesystemEntry[] {
  const emModule = getModule();
  const names = emModule.FS.readdir(path).filter((name) => name !== '.' && name !== '..');
  return names.map((name) => {
    const entryPath = path === '/' ? `/${name}` : `${path}/${name}`;
    const mode = emModule.FS.stat(entryPath).mode;
    return {
      name,
      path: entryPath,
      isDirectory: isDirectoryMode(mode),
    };
  });
}
