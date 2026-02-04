const YIELD_STORAGE_KEY = '__SIMH_YIELD_STEPS__';

function normalizeYieldSteps(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(1, Math.min(100000, Math.round(value)));
}

export function readPersistedYieldSteps(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(YIELD_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = Number(raw);
    return normalizeYieldSteps(parsed);
  } catch {
    return null;
  }
}

export function persistYieldSteps(steps: number): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeYieldSteps(steps);
    if (normalized === null) return;
    window.localStorage.setItem(YIELD_STORAGE_KEY, String(normalized));
  } catch {
    // Ignore storage errors (private browsing, disabled storage, etc.)
  }
}
