const DEBUG_FLAG = '__SIMH_DEBUG__';
const DEBUG_STORAGE_KEY = '__SIMH_DEBUG__';
const DEBUG_CONSOLE_API_KEY = '__SIMH_DEBUG_API__';

function formatPayload(payload: unknown): string {
  if (payload instanceof Error) return payload.stack ?? payload.message;
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

export function isDebugEnabled(): boolean {
  if (typeof globalThis === 'undefined') return false;
  const flag = (globalThis as { [key: string]: unknown })[DEBUG_FLAG];
  return flag === true;
}

export function debugLog(message: string, payload?: unknown): void {
  if (!isDebugEnabled()) return;
  if (payload === undefined) {
    console.log(`[simh] ${message}`);
    return;
  }
  console.log(`[simh] ${message}`, formatPayload(payload));
}

export function errorLog(message: string, payload?: unknown): void {
  if (payload === undefined) {
    console.error(`[simh] ${message}`);
    return;
  }
  console.error(`[simh] ${message}`, formatPayload(payload));
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

function installConsoleApi(): void {
  if (typeof globalThis === 'undefined') return;
  const api = {
    setEnabled: setDebugEnabled,
    isEnabled: isDebugEnabled,
  };
  (globalThis as { [key: string]: unknown })[DEBUG_CONSOLE_API_KEY] = api;
  (globalThis as { [key: string]: unknown }).simhDebug = api;
}

if (typeof globalThis !== 'undefined') {
  if (readPersistedFlag()) {
    (globalThis as { [key: string]: unknown })[DEBUG_FLAG] = true;
  }
  installConsoleApi();
}
