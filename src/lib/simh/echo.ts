import { isEchoEnabled as isWorkerEchoEnabled, setEchoEnabled as setWorkerEchoEnabled } from './workerClient';
import { debugLog } from './debug';

const ECHO_STORAGE_KEY = '__SIMH_ECHO__';

function readPersistedFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ECHO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isEchoEnabled(): boolean {
  return isWorkerEchoEnabled();
}

export function setEchoEnabled(enabled: boolean): void {
  setWorkerEchoEnabled(enabled);
  debugLog('simh echo enabled', { enabled });
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(ECHO_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(ECHO_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (private browsing, disabled storage, etc.)
  }
}

if (readPersistedFlag()) {
  setWorkerEchoEnabled(true);
}
