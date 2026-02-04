/**
 * Generic SIMH constants.
 */

/* ── SIMH status codes (from sim_defs.h) ──────────────────────── */

export const SCPE_OK = 0;
export const SCPE_STEP = 36;
export const SCPE_STOP = 77;
export const SCPE_EXIT = 78;
export const SCPE_EXPECT = 108;

export const SCPE_KFLAG = 0x10000000;
export const SCPE_BREAK = 0x20000000;
export const SCPE_NOMESSAGE = 0x40000000;

/* ── Control constants ────────────────────────────────────────── */

export const STEPS_PER_TICK = 500;
