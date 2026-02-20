const DEBUG_FLAG = '__SIMH_DEBUG__';
const DEBUG_STORAGE_KEY = '__SIMH_DEBUG__';
type DebugOutputListener = (text: string) => void;
const debugOutputListeners = new Set<DebugOutputListener>();

function formatPayload(payload: unknown): string {
  if (payload instanceof Error) return payload.stack ?? payload.message;
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function emitDebugOutput(message: string, payload?: unknown): void {
  const line =
    payload === undefined
      ? `[simh] ${message}\n`
      : `[simh] ${message} ${formatPayload(payload)}\n`;
  for (const listener of debugOutputListeners) {
    listener(line);
  }
}

export function isDebugEnabled(): boolean {
  if (typeof globalThis === 'undefined') return false;
  const flag = (globalThis as { [key: string]: unknown })[DEBUG_FLAG];
  return flag === true;
}

export function debugLog(message: string, payload?: unknown): void {
  if (!isDebugEnabled()) return;
  emitDebugOutput(message, payload);
}

export function errorLog(message: string, payload?: unknown): void {
  emitDebugOutput(message, payload);
}

export function subscribeDebugOutput(listener: DebugOutputListener): () => void {
  debugOutputListeners.add(listener);
  return () => {
    debugOutputListeners.delete(listener);
  };
}

function readPersistedFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDebugEnabled(enabled: boolean): void {
  if (typeof globalThis === 'undefined') return;
  (globalThis as { [key: string]: unknown })[DEBUG_FLAG] = enabled;
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(DEBUG_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (private browsing, disabled storage, etc.)
  }
}

if (readPersistedFlag() && typeof globalThis !== 'undefined') {
  (globalThis as { [key: string]: unknown })[DEBUG_FLAG] = true;
}
