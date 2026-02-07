/**
 * I650-specific control operations and display logic.
 */

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
