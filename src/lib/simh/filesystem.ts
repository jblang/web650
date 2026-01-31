/**
 * Virtual filesystem operations.
 */

import { getModule } from './core';

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
