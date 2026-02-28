import { normalizeAddress, normalizeWord } from './format';

export type DraftValueKind = 'address' | 'word' | 'text';

export const WORD_EDIT_PATTERN = /^([+-]?\d{0,10}|\d{0,10}[+-]?)$/;
export const ADDRESS_EDIT_PATTERN = /^\d{0,4}$/;

export function getNextInputValue(
  currentValue: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  insertedText: string
): string {
  const start = selectionStart ?? currentValue.length;
  const end = selectionEnd ?? start;
  return `${currentValue.slice(0, start)}${insertedText}${currentValue.slice(end)}`;
}

export function isValidDraftValue(kind: DraftValueKind, value: string): boolean {
  if (kind === 'address') return ADDRESS_EDIT_PATTERN.test(value);
  if (kind === 'word') return WORD_EDIT_PATTERN.test(value);
  return true;
}

export function normalizeAddressForCommit(value: string): string {
  const digits = value.replace(/\D/g, '');
  return normalizeAddress(digits === '' ? '0' : digits);
}

export function normalizeWordForCommit(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    return normalizeWord('0');
  }
  if (/^[+-]$/.test(trimmed)) {
    return normalizeWord(`${trimmed}0`);
  }
  return normalizeWord(trimmed);
}

export function normalizeDraftForCommit(kind: DraftValueKind, value: string): string {
  if (kind === 'address') return normalizeAddressForCommit(value);
  if (kind === 'word') return normalizeWordForCommit(value);
  return value;
}
