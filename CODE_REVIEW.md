# Code Review: IBM 650 Simulator UI

Comprehensive review at commit `ee4f34c` (reviewed February 25, 2026).

## Project Overview

Web-based UI for the Open SIMH IBM 650 simulator. Built with Next.js 16.1.4, React 19.2.3, TypeScript (strict mode), and IBM Carbon Design System. The simulator runs in-browser via WebAssembly and is hosted in a dedicated Web Worker (`src/lib/simh/simh.worker.ts`). The IBM 650 service layer (`src/lib/simh/i650/index.ts`) is the app-facing source of truth for emulator state.

## Current Snapshot

- Source files (`.ts`/`.tsx`, excluding tests): **58**
- Unit/integration test files (`*.test.*`): **40**
- Unit/integration tests (Vitest): **450 passing**
- Playwright E2E tests: **20** (across `e2e/front-panel.spec.ts` and `e2e/cards.spec.ts`)

### Verification Run

- `npm run lint`: **pass**
- `npx vitest run`: **40 files, 450 tests passing**
- `npx vitest run --coverage`: **pass**

Coverage (Vitest V8, all instrumented files):
- Statements: **88.04%**
- Branches: **79.38%**
- Functions: **85.98%**
- Lines: **89.91%**

---

## Summary Priority Matrix

| # | Severity | Issue | Section |
|---|----------|-------|---------|
| 1 | **Medium** | Unbounded console output buffer | [1](#1-unbounded-console-output-buffer-medium) |
| 2 | **Medium** | State stream lifecycle mismatch (always enabled, never explicitly disabled) | [2](#2-state-stream-lifecycle-mismatch-always-enabled-never-explicitly-disabled-medium) |
| 3 | **Low** | Run-state race window in `executeCommand` | [3](#3-run-state-race-window-in-executecommand-low) |
| 4 | **Low** | Fire-and-forget `postInit` in service `init()` | [4](#4-fire-and-forget-postinit-in-service-init-low) |
| 5 | **Low** | No app-level error boundary; hydration warnings globally suppressed | [5](#5-no-app-level-error-boundary-hydration-warnings-globally-suppressed-low) |
| 6 | **Low** | File upload race in card deck provider | [6](#6-file-upload-race-in-card-deck-provider-low) |

---

## Detailed Findings

### 1. Unbounded Console Output Buffer (Medium)

`src/components/EmulatorConsoleProvider.tsx:40` and `src/components/EmulatorConsoleProvider.tsx:53` keep appending output forever (`prev + chunk`) with no cap.

Impact:
- Memory growth over long sessions
- Increasing string concatenation cost
- Slower `TextArea` updates and scroll behavior over time

Recommendation:
- Cap output by size or line count (for example, keep last 100KB or last 2,000 lines).
- Trim from the front before `setOutput`.

---

### 2. State Stream Lifecycle Mismatch (Always Enabled, Never Explicitly Disabled) (Medium)

`src/lib/simh/i650/index.ts:327` starts the state stream during `init()` regardless of whether UI streaming is active. `setStateStreamActive(false)` in `src/lib/simh/i650/index.ts:168-179` only flips a local flag and does not call `simh.enableStateStream(false)`.

Impact:
- Worker state polling can continue even when the front panel is not active
- Unnecessary interval/message activity and wasted CPU/battery

Recommendation:
- Tie worker stream enable/disable directly to `setStateStreamActive(active)`.
- Add a deactivation assertion in `src/lib/simh/i650/index.test.ts` that verifies `enableStateStream(false)` is sent.

---

### 3. Run-State Race Window in `executeCommand` (Low)

`src/lib/simh/i650/index.ts:489-502` optimistically sets `isRunning=true` for `GO/CONT/RUN`, then unconditionally sets `isRunning=false` in `finally`.

If the CPU is still running asynchronously, UI can briefly show not-running before the worker `onRunState` callback updates state.

Recommendation:
- Do not force `isRunning=false` in `finally` for run commands.
- Let `onRunState` own the authoritative run-state transitions.

---

### 4. Fire-and-Forget `postInit` in Service `init()` (Low)

`src/lib/simh/i650/index.ts:321-348` launches `postInit()` with `void ...catch(...)` and resolves `init()` before post-init steps finish.

Impact:
- `await init()` does not guarantee registers are loaded or run-state listeners are fully attached
- Early callers can observe partially initialized state

Recommendation:
- Await `postInit()` before resolving `initPromise`, or split APIs into explicit phased initialization semantics.

---

### 5. No App-Level Error Boundary; Hydration Warnings Globally Suppressed (Low)

`src/app/layout.tsx:46` and `src/app/layout.tsx:56` suppress hydration warnings on both `<html>` and `<body>`. There is no app-level `error.tsx`/`global-error.tsx` fallback route.

Impact:
- Legitimate hydration mismatch warnings are masked
- Unhandled provider/layout errors can fail without a controlled user-facing recovery path

Recommendation:
- Add an app-level error boundary (`src/app/error.tsx` or `src/app/global-error.tsx`).
- Narrow hydration suppression to the smallest necessary subtree.

---

### 6. File Upload Race in Card Deck Provider (Low)

`src/components/CardDeckProvider.tsx:46-63` starts a new `FileReader` per selection but does not guard against out-of-order `onload` completion.

Scenario:
- User selects file A, then quickly selects file B.
- File A finishes later and overwrites B’s deck.

Recommendation:
- Track a monotonically increasing request token or active-file id and ignore stale callbacks.

---

## Resolved Since Previous Review

These prior findings are no longer applicable in current `HEAD`:

- "HELP" and "CHEAT" buttons are dead controls (handlers are now wired and tested).
- Yield-steps field commits transient invalid input (the yield-steps input path is no longer present in the console UI).

---

## Strengths

1. Clear architecture boundaries between generic SIMH worker/client APIs and IBM 650-specific state/control logic.
2. Worker isolation keeps emulator execution off the main thread and preserves UI responsiveness.
3. Robust automated testing: 450 passing Vitest tests with both mock-heavy unit coverage and real WASM integration coverage.
4. Front panel component suite has strong behavioral test coverage, including help/cheat interactions and control wiring.
5. i650 formatting and validation code (`format.ts`) remains comprehensive and fully covered.
