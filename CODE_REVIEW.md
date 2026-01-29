# Code Review: simh-ui (IBM 650 Simulator UI)

Updated Jan 29, 2026 on commit 0559aa2.

## Project Overview

Web UI for the Open SIMH IBM 650 emulator using Next.js 16.1.4, React 19, TypeScript, and the Carbon Design System. Vitest is configured and used for simulator/API unit tests.

**Stats:** 64 TypeScript/TSX files, ~5,581 LOC, v0.1.0 (WIP)
**Tests:** Vitest in place; ~86% line / 81% statement / 66% branch coverage as of Jan 29, 2026. Broad coverage for emulator API routes, front-panel controls, EmulatorProvider, simh core, PunchedCard, and CardDeckProvider.

---

## Major Areas for Improvement

### 1. Remaining Test Gaps (Medium)

- Current coverage is high overall, but no integration/e2e tests exercise full user flows (front-panel page + emulator backend). `src/app/programming/page.tsx` still lacks tests.
- **Recommendation:** Add one or two RTL-driven integration tests for the front-panel page and a lightweight contract test around the programming grid; consider smoke tests that spin the emulator mock end-to-end.

---

### 2. Status Indicators Never Update (High)

- `operatingState` and `checkingState` are initialized but never updated (`src/components/EmulatorProvider.tsx:247-268`), so the "Operating" and "Checking" lights stay off regardless of emulator state.
- **Recommendation:** Map `/api/state` register payloads to these booleans (or remove the lights until data exists) and cover with tests.

---

### 3. Accessibility Gaps (High)

- Custom controls lack semantics/keyboard support: front-panel buttons and knobs are plain elements without `aria-label`, `aria-pressed`, or keyboard handlers (`src/components/FrontPanel/ControlSection.tsx`, `src/components/FrontPanel/DecimalKnob.tsx`, `src/components/FrontPanel/LabeledKnob.tsx`).
- Drag-and-drop in `src/app/programming/page.tsx` is mouse-only with no focus states or keyboard reordering.
- **Recommendation:** Add aria labels, pressed state, and keyboard interaction for knobs/buttons; provide accessible reordering for the programming grid.

---

### 4. Global Type Safety & Env Validation (Medium)

- Still using `globalThis as unknown as …` to cache the emulator (`src/lib/simh.ts`, `src/app/api/start/route.ts`, `src/app/api/restart/route.ts`) and passing `process.env as Record<string,string>` to `pty.spawn` (`src/lib/simh.ts`).
- **Recommendation:** Declare a typed global (`declare global { var simhEmulator?: SimhEmulator; }`) and add an env loader that validates `SIMH_PATH`, `SIMH_DEBUG`, `SIMH_QUIT_TIMEOUT_MS`.

---

### 5. Silent Failure in State Mutations (Medium)

- Setter helpers fire network calls but ignore HTTP failures; `request` only logs and callers immediately update local state (`src/components/EmulatorProvider.tsx:184-218`, `357-373`).
- **Recommendation:** Throw or return an error result for non-OK responses and surface feedback in the UI so panel state stays consistent with the emulator.

---

### 6. Unbounded Console Output in UI (Medium)

- Emulator output is concatenated into a single string with no cap (`setOutput(prev => prev + text)` in `src/components/EmulatorProvider.tsx:120-137`, SSE handler around lines 407-444). Long sessions will bloat React state/TextArea and hurt performance.
- **Recommendation:** Keep a ring buffer (e.g., last N lines/KB) and expose a "clear console" control.

---

### 7. Separation of Concerns / State Weight (Medium)

- `src/app/programming/page.tsx` combines drag/drop, row management, and rendering in one 230+ line component.
- `src/components/CardDeckProvider.tsx` still performs file parsing inside the provider.
- **Recommendation:** Extract hooks/utilities (`useProgramTable`, `parseCardDeck`) and keep providers lean.

---

### 8. Code Duplication (Low)

- Cursor SVG/data and knob rendering logic are duplicated between `src/components/FrontPanel/DecimalKnob.tsx` and `src/components/FrontPanel/LabeledKnob.tsx`.
- **Recommendation:** Share a `KnobBase` component or hook for cursors/gradients.

---

### 9. Missing Documentation (Low)

- Public APIs and complex flows still lack JSDoc or API docs (e.g., `src/lib/simh.ts`, API routes). Comments improved but not enough for new contributors.

---

### 10. Missing/Dead Infrastructure (Low)

- `npm run parse-ini` points to `scripts/parse-ini.js`, which is absent.
- `src/components/UIShell.tsx` remains a pass-through wrapper; remove it or give it layout responsibility.

---

## Summary Priority Matrix

| Priority | Issue | Action |
|----------|-------|--------|
| High | Partial test coverage | Add UI/integration tests |
| High | Panel status lights | Wire emulator state to indicators |
| High | Accessibility | Add aria + keyboard support |
| Medium | Global typing & env validation | Define globals, validate env |
| Medium | Silent state mutations | Bubble errors + user feedback |
| Medium | Console output growth | Add log ring buffer / clear action |
| Medium | Separation of concerns | Extract hooks/utilities |
| Low | Duplication | Share knob base |
| Low | Documentation | Add JSDoc/API docs |
| Low | Missing scripts | Remove or add `scripts/parse-ini.js` |

---

## Files to Prioritize for Improvement

1. `src/components/EmulatorProvider.tsx` – status lights wiring, output buffer, network error surfacing.
2. `src/components/FrontPanel/*` – accessibility and shared knob base.
3. `src/app/programming/page.tsx` – extract drag/drop + table logic into hooks.
4. `src/lib/simh.ts` and `src/app/api/start|restart/route.ts` – global typing and env validation.
5. `scripts/parse-ini.js` (add or drop) and `src/components/UIShell.tsx`.
