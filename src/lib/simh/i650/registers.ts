/**
 * I650 register operations.
 */

import { depositState, sendCommand } from '../core';
import { examineI650State } from './memory';
import { validateWord, validateAddress } from './format';
import { ZERO_ADDRESS, ZERO_DATA } from './constants';

/* ── I650 Register Operations ─────────────────────────────────── */

/**
 * Examine all emulator state registers.
 * Returns parsed key-value pairs for all registers.
 */
export function examineAllState(): Record<string, string> {
  return examineI650State('STATE');
}

/**
 * Get the Address Register (AR) value.
 * Returns a 4-digit string (0000-9999).
 */
export function getAddressRegister(): string {
  const result = examineI650State('AR');
  return result.AR ?? ZERO_ADDRESS;
}

/**
 * Set the Address Register (AR) value.
 * @param value - 4-digit address (0000-9999)
 */
export function setAddressRegister(value: string): void {
  validateAddress(value);
  depositState('AR', value);
}

/**
 * Get the Program Register (PR) value.
 * Returns a 10-digit word with sign (e.g., "0000000000+").
 */
export function getProgramRegister(): string {
  const result = examineI650State('PR');
  return result.PR ?? ZERO_DATA;
}

/**
 * Set the Program Register (PR) value.
 * @param value - 10-digit word with sign (e.g., "0000000000+")
 */
export function setProgramRegister(value: string): void {
  validateWord(value);
  depositState('PR', value);
}

/**
 * Get the Distributor (DIST) value.
 * Returns a 10-digit word with sign.
 */
export function getDistributor(): string {
  const result = examineI650State('DIST');
  return result.DIST ?? ZERO_DATA;
}

/**
 * Set the Distributor (DIST) value.
 * @param value - 10-digit word with sign
 */
export function setDistributor(value: string): void {
  validateWord(value);
  depositState('DIST', value);
}

/**
 * Get the Lower Accumulator (ACCLO) value.
 * Returns a 10-digit word with sign.
 */
export function getLowerAccumulator(): string {
  const result = examineI650State('ACCLO');
  return result.ACCLO ?? ZERO_DATA;
}

/**
 * Set the Lower Accumulator (ACCLO) value.
 * @param value - 10-digit word with sign
 */
export function setLowerAccumulator(value: string): void {
  validateWord(value);
  depositState('ACCLO', value);
}

/**
 * Get the Upper Accumulator (ACCUP) value.
 * Returns a 10-digit word with sign.
 */
export function getUpperAccumulator(): string {
  const result = examineI650State('ACCUP');
  return result.ACCUP ?? ZERO_DATA;
}

/**
 * Set the Upper Accumulator (ACCUP) value.
 * @param value - 10-digit word with sign
 */
export function setUpperAccumulator(value: string): void {
  validateWord(value);
  depositState('ACCUP', value);
}

/**
 * Get the Console Switches (CSW) value.
 * Returns a 10-digit word with sign.
 */
export function getConsoleSwitches(): string {
  const result = examineI650State('CSW');
  return result.CSW ?? ZERO_DATA;
}

/**
 * Set the Console Switches (CSW) value.
 * @param value - 10-digit word with sign
 */
export function setConsoleSwitches(value: string): void {
  validateWord(value);
  depositState('CSW', value);
}

/**
 * Get the Programmed Stop (CSWPS) flag.
 * Returns true if programmed stop is enabled.
 */
export function getProgrammedStop(): boolean {
  const result = examineI650State('CSWPS');
  return (result.CSWPS?.trim() ?? '0') === '1';
}

/**
 * Set the Programmed Stop (CSWPS) flag.
 * @param value - true to enable, false to disable
 */
export function setProgrammedStop(value: boolean): void {
  depositState('CSWPS', value ? '1' : '0');
}

/**
 * Get the Overflow Stop (CSWOS) flag.
 * Returns true if overflow stop is enabled.
 */
export function getOverflowStop(): boolean {
  const result = examineI650State('CSWOS');
  return (result.CSWOS?.trim() ?? '0') === '1';
}

/**
 * Set the Overflow Stop (CSWOS) flag.
 * @param value - true to enable, false to disable
 */
export function setOverflowStop(value: boolean): void {
  depositState('CSWOS', value ? '1' : '0');
}

/**
 * Get the Half Cycle (HALF) flag.
 * Returns true if half cycle mode is enabled.
 */
export function getHalfCycle(): boolean {
  const result = examineI650State('HALF');
  return (result.HALF?.trim() ?? '0') === '1';
}

/**
 * Set the Half Cycle (HALF) flag.
 * @param value - true to enable, false to disable
 */
export function setHalfCycle(value: boolean): void {
  depositState('HALF', value ? '1' : '0');
}

/**
 * Get the Overflow (OV) flag.
 * Returns true if overflow is set.
 */
export function getOverflow(): boolean {
  const result = examineI650State('OV');
  return (result.OV?.trim() ?? '0') === '1';
}

/**
 * Set the Overflow (OV) flag.
 * @param value - true to set, false to clear
 */
export function setOverflow(value: boolean): void {
  depositState('OV', value ? '1' : '0');
}

/**
 * Reset the accumulator registers to zero.
 * Clears DIST, ACCLO, ACCUP, and OV.
 */
export function resetAccumulator(): void {
  setDistributor(ZERO_DATA);
  setLowerAccumulator(ZERO_DATA);
  setUpperAccumulator(ZERO_DATA);
  setOverflow(false);
}

/**
 * Reset the emulator (RESET command).
 * Clears all registers and resets the CPU state.
 */
export function reset(): void {
  sendCommand('RESET');
}

/**
 * Set the CPU memory size.
 * @param size - Memory size ('1K', '2K', or '4K')
 */
export function setMemorySize(size: '1K' | '2K' | '4K'): void {
  sendCommand(`SET CPU ${size}`);
}
