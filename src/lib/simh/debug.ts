const DEBUG_FLAG = '__SIMH_DEBUG__';
const DEBUG_STORAGE_KEY = '__SIMH_DEBUG__';

export function isDebugEnabled(): boolean {
  if (typeof globalThis === 'undefined') return false;
  const flag = (globalThis as { [key: string]: unknown })[DEBUG_FLAG];
  return flag === true;
}

export function debugLog(message: string, payload?: unknown): void {
  if (!isDebugEnabled()) return;
  if (payload === undefined) {
    console.log(`[simh] ${message}`);
  } else {
    console.log(`[simh] ${message}`, payload);
  }
}

export function errorLog(message: string, payload?: unknown): void {
  if (payload === undefined) {
    console.error(`[simh] ${message}`);
  } else {
    console.error(`[simh] ${message}`, payload);
  }
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
