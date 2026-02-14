# Code Review: IBM 650 Simulator UI

Comprehensive review at commit `cc07d6a` (February 14, 2026).

## Project Overview

Web-based UI for the Open SIMH IBM 650 simulator. Built with Next.js 16.1.4, React 19.2.3, TypeScript (strict mode), and IBM Carbon Design System. The simulator runs in-browser via WebAssembly and is hosted in a dedicated Web Worker (`src/lib/simh/simh.worker.ts`). The IBM 650 service layer (`src/lib/simh/i650/index.ts`) is the app-facing source of truth for emulator state.

## Current Snapshot

- Source files (`.ts`/`.tsx`, excluding tests): **55**
- Unit/integration test files (`*.test.*`): **39**
- Unit/integration tests (Vitest): **431 passing**
- Playwright E2E tests: **19** (in `e2e/front-panel.spec.ts`)

### Verification Run

- `npm run lint`: **pass**
- `npx vitest run`: **39 files, 431 tests passing**
- `npx vitest run --coverage`: **pass**

Coverage (Vitest V8):
- Statements: **97.20%**
- Branches: **93.19%**
- Functions: **99.18%**
- Lines: **97.98%**

---

## Summary Priority Matrix

| # | Severity | Issue | Section |
|---|----------|-------|---------|
| 1 | **Medium** | Unbounded console output buffer | [1](#1-unbounded-console-output-buffer-medium) |
| 2 | **Medium** | State stream is never disabled after front panel unmount | [2](#2-state-stream-is-never-disabled-after-front-panel-unmount-medium) |
| 3 | **Low** | Run-state race window in `executeCommand` | [3](#3-run-state-race-window-in-executecommand-low) |
| 4 | **Low** | Fire-and-forget `postInit` in service `init()` | [4](#4-fire-and-forget-postinit-in-service-init-low) |
| 5 | **Low** | No app-level error boundary; hydration warnings globally suppressed | [5](#5-no-app-level-error-boundary-hydration-warnings-globally-suppressed-low) |
| 6 | **Low** | "HELP" and "CHEAT" buttons are dead controls | [6](#6-help-and-cheat-buttons-are-dead-controls-low) |
| 7 | **Low** | File upload race in card deck provider | [7](#7-file-upload-race-in-card-deck-provider-low) |
| 8 | **Low** | Yield-steps field commits on every keystroke (including transient invalid input) | [8](#8-yield-steps-field-commits-on-every-keystroke-including-transient-invalid-input-low) |

---

## Detailed Findings

### 1. Unbounded Console Output Buffer (Medium)

`src/components/EmulatorConsoleProvider.tsx:37` and `src/components/EmulatorConsoleProvider.tsx:54` keep appending output forever (`prev + chunk`) with no cap.

Impact:
- Memory growth over long sessions
- Increasing string concat cost
- Slower `TextArea` updates and scroll behavior

Recommendation:
- Cap by size or lines (for example, keep last 100KB or last 2,000 lines).
- Trim from the front before calling `setOutput`.

---

### 2. State Stream Is Never Disabled After Front Panel Unmount (Medium)

`src/app/front-panel/page.tsx:12-15` toggles stream active on mount/unmount. But `src/lib/simh/i650/index.ts:153-164` does nothing when `active` is `false` beyond flipping a local flag.

`startStateStream()` enables worker polling (`src/lib/simh/i650/index.ts:139-145`), and worker polling keeps running until explicit disable (`src/lib/simh/simh.worker.ts:71-83`). Because disable is never sent, state polling can continue after leaving the front panel page.

Impact:
- Ongoing worker interval activity and message traffic when page no longer needs stream
- Wasted CPU/battery

Recommendation:
- In `setStateStreamActive(false)`, call `simh.enableStateStream(false)` and keep listener behavior aligned with active state.
- Add a deactivation test in `src/lib/simh/i650/index.test.ts`.

---

### 3. Run-State Race Window in `executeCommand` (Low)

`src/lib/simh/i650/index.ts:455-467` optimistically sets `isRunning=true` for `GO/CONT/RUN`, then unconditionally sets `isRunning=false` in `finally`.

If CPU is still running asynchronously, UI can briefly show not-running before worker runstate updates arrive.

Recommendation:
- Do not force `isRunning=false` in `finally` for run commands.
- Let `onRunState` own the authoritative running flag.

---

### 4. Fire-and-Forget `postInit` in Service `init()` (Low)

`src/lib/simh/i650/index.ts:305-339` launches `postInit()` with `void ...catch(...)` and returns from `init()` before post-init steps complete.

Impact:
- `await init()` does not guarantee registers loaded, stream setup done, or runstate callback attached.

Recommendation:
- Await `postInit()` before resolving `initPromise`, or split API into explicit `initCore()`/`warmup()` semantics.

---

### 5. No App-Level Error Boundary; Hydration Warnings Globally Suppressed (Low)

`src/app/layout.tsx:18-19` suppresses hydration warnings on `<html>` and `<body>`, and there is no app-level error boundary for provider failures.

Impact:
- Harder to detect legitimate hydration mismatches
- Unhandled errors can blank the full UI without a controlled fallback

Recommendation:
- Add an app-level boundary (or route-level error boundary) with a minimal recovery UI.
- Narrow or remove blanket hydration suppression.

---

### 6. "HELP" and "CHEAT" Buttons Are Dead Controls (Low)

Buttons exist in `src/components/FrontPanel/ButtonSection.tsx:9` but have no entries in handler map (`src/components/FrontPanel/ButtonSection.tsx:24-32`).

Impact:
- Clicks silently no-op
- Confusing UX on a control panel that otherwise behaves realistically

Recommendation:
- Either wire handlers (open docs/cheat sheet panel) or remove/disable with explicit "Not implemented" feedback.

---

### 7. File Upload Race in Card Deck Provider (Low)

`src/components/CardDeckProvider.tsx:39-57` starts a new `FileReader` per selection but does not guard against out-of-order `onload` completions.

Scenario:
- User selects file A, then quickly file B.
- File A finishes later and overwrites B’s deck.

Recommendation:
- Track a monotonically increasing request ID or active file token and ignore stale callbacks.

---

### 8. Yield-Steps Field Commits on Every Keystroke (Including Transient Invalid Input) (Low)

`src/components/EmulatorConsole.tsx:164` immediately persists `Number(e.target.value)` on each input change.

Impact:
- Transient edits (empty string, partial values) can produce unintended `0` writes
- Extra simulator/localStorage churn while typing

Recommendation:
- Keep a local input string and commit on blur/Enter, with explicit validation and clamp before calling `setYieldSteps`.

---

## Resolved Since Previous Review

These prior items no longer reproduce in current `HEAD`:

- `BiQuinaryNumber` title class wiring bug and decay-related overhead claim
- Docs page hardcoded markdown URL (now base-path aware)
- "Missing `'use client'` in `printer/page.tsx`" (not an issue for a server component)

---

## Strengths

1. Strong architecture boundaries: generic SIMH layer, IBM 650 service layer, React providers, UI components.
2. Worker isolation is robust and keeps emulator execution off the main thread.
3. High test quality and coverage with both mocked unit tests and real WASM integration tests.
4. Accessibility is broadly solid across knobs, status indicators, and controls.
5. Input normalization/validation in `format.ts` is well-covered and consistently used.
6. Typed worker client API is clear and resilient for request/response flow.
