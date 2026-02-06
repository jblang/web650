/* ── Emscripten module types ──────────────────────────────────── */

export interface EmscriptenModule {
  ccall: (
    name: string,
    returnType: string,
    argTypes: string[],
    args: unknown[],
  ) => unknown;
  HEAPU8?: Uint8Array;
  FS: {
    writeFile(path: string, data: string | Uint8Array): void;
    readFile(path: string, opts?: { encoding?: string }): string | Uint8Array;
    mkdir(path: string): void;
    unlink(path: string): void;
    stat(path: string): { mode: number };
  };
}

declare global {
  interface Window {
    createI650Module: (
      config: Record<string, unknown>,
    ) => Promise<EmscriptenModule>;
  }
}
