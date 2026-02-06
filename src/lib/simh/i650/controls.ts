/**
 * I650-specific control operations and display logic.
 */

import { readMemory, writeMemory } from './memory';
import { ZERO_DATA } from './constants';

/* ── Switch Position Constants ────────────────────────────────── */

/**
 * I650 programmed switch positions.
 */
export const Programmed = {
  STOP: 0,
  RUN: 1,
} as const;

export type ProgrammedPosition = typeof Programmed[keyof typeof Programmed];

/**
 * I650 half cycle switch positions.
 */
export const HalfCycle = {
  HALF: 0,
  RUN: 1,
} as const;

export type HalfCyclePosition = typeof HalfCycle[keyof typeof HalfCycle];

/**
 * I650 control switch positions.
 */
export const Control = {
  ADDRESS_STOP: 0,
  RUN: 1,
  MANUAL_OPERATION: 2,
} as const;

export type ControlPosition = typeof Control[keyof typeof Control];

/**
 * I650 display switch positions.
 * These correspond to the positions on the physical I650 console.
 */
export const Display = {
  LOWER_ACCUM: 0,
  UPPER_ACCUM: 1,
  DISTRIBUTOR: 2,
  PROGRAM_REGISTER: 3,
  READ_OUT_STORAGE: 4,
  READ_IN_STORAGE: 5,
} as const;

export type DisplayPosition = typeof Display[keyof typeof Display];

/**
 * I650 overflow switch positions.
 */
export const Overflow = {
  STOP: 0,
  SENSE: 1,
} as const;

export type OverflowPosition = typeof Overflow[keyof typeof Overflow];

/**
 * I650 error switch positions.
 */
export const ErrorSwitch = {
  STOP: 0,
  SENSE: 1,
} as const;

export type ErrorSwitchPosition = typeof ErrorSwitch[keyof typeof ErrorSwitch];

// Backwards compatibility aliases
export const DisplaySwitch = Display;
export const ControlSwitch = Control;
export type DisplaySwitchPosition = DisplayPosition;
export type ControlSwitchPosition = ControlPosition;

/* ── Display Value Mapping ────────────────────────────────────── */

export interface I650Registers {
  lowerAccumulator: string;
  upperAccumulator: string;
  distributor: string;
  programRegister: string;
}

/**
 * Maps display switch position to the register value shown on the lights.
 *
 * @param displaySwitch - Current display switch position (0-5)
 * @param regs - Current register values
 * @returns The register value to display
 */
export function getDisplayValue(
  displaySwitch: DisplayPosition,
  regs: I650Registers
): string {
  switch (displaySwitch) {
    case DisplaySwitch.LOWER_ACCUM:
      return regs.lowerAccumulator;
    case DisplaySwitch.UPPER_ACCUM:
      return regs.upperAccumulator;
    case DisplaySwitch.DISTRIBUTOR:
      return regs.distributor;
    case DisplaySwitch.PROGRAM_REGISTER:
      return regs.programRegister;
    case DisplaySwitch.READ_OUT_STORAGE:
    case DisplaySwitch.READ_IN_STORAGE:
      return regs.distributor;
    default:
      return ZERO_DATA;
  }
}

/* ── Manual Drum Operations ───────────────────────────────────── */

export type DrumTransferResult =
  | { type: 'read'; value: string | undefined }
  | { type: 'write'; address: string; value: string }
  | { type: 'none' };

/**
 * Performs I650 manual drum transfer operation based on display switch position.
 *
 * In READ_OUT_STORAGE mode, reads from drum memory at the given address.
 * In READ_IN_STORAGE mode, writes console switches value to drum memory.
 *
 * @param displaySwitch - Current display switch position
 * @param address - Target drum address (4 digits)
 * @param consoleSwitches - Current console switches value
 * @returns Transfer result indicating what operation was performed
 */
export function performDrumTransfer(
  displaySwitch: DisplayPosition,
  address: string,
  consoleSwitches: string
): DrumTransferResult {
  if (displaySwitch === DisplaySwitch.READ_OUT_STORAGE) {
    const value = readMemory(address);
    return { type: 'read', value };
  } else if (displaySwitch === DisplaySwitch.READ_IN_STORAGE) {
    writeMemory(address, consoleSwitches);
    return { type: 'write', address, value: consoleSwitches };
  }
  return { type: 'none' };
}

/* ── Control Helper Functions ─────────────────────────────────── */

/**
 * Determines if the control switch is in manual operation mode.
 *
 * @param controlSwitch - Current control switch position
 * @returns true if in manual operation mode
 */
export function isManualOperation(controlSwitch: ControlPosition): boolean {
  return controlSwitch === Control.MANUAL_OPERATION;
}
