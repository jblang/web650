/* ── SIMH status codes (from sim_defs.h) ──────────────────────── */

export const SCPE_OK = 0;
export const SCPE_STEP = 36;

/* ── Default state constants ──────────────────────────────────── */

/** Default zero address (4 digits). */
export const ZERO_ADDRESS = '0000';

/** Default zero data word (10 digits + positive sign). */
export const ZERO_DATA = '0000000000+';

/** Default zero operation code (2 digits). */
export const ZERO_OPERATION = '00';

/* ── Control constants ────────────────────────────────────────── */

export const STEPS_PER_TICK = 500;
