# Code Review: IBM 650 Simulator UI

Comprehensive review at commit 8df57ec. Updated at commit c981aa5.

## Project Overview

A web-based UI for the Open SIMH IBM 650 simulator, a historic vacuum-tube computer from 1954. Built with Next.js 16.1.4, React 19.2.3, TypeScript (strict mode), and IBM Carbon Design System. The simulator runs entirely in the browser via WebAssembly, compiled from Open SIMH using Emscripten. A Web Worker (`simh.worker.ts`) hosts the WASM module, and a typed RPC layer (`workerClient.ts`) bridges the main thread. The I650-specific service layer (`src/lib/simh/i650/index.ts`) manages all emulator state via a pub/sub model, with three React context providers subscribing to it.

**Stats:** ~55 TypeScript/TSX source files, 40 unit test files with 468 tests, 1 Playwright E2E suite (19 tests). v0.1.0 (WIP).

**Test Coverage (unit tests):** 97.78% statements | 91.54% branches | 99.12% functions | 98.61% lines

**Current state:** All 468 unit tests pass. ESLint reports zero warnings or errors.

---

## Summary Priority Matrix

| # | Severity | Issue | Section |
|---|----------|-------|---------|
| 1 | **Medium** | Unbounded console output buffer | [1](#1-unbounded-console-output-buffer-medium) |
| 2 | **Low** | `BiQuinaryNumber` wasted decay computation and className bug | [2](#2-biquinarynumber-wasted-decay-computation-and-classname-bug-low) |
| 3 | **Low** | Run-state race window in `executeCommand` | [3](#3-run-state-race-window-in-executecommand-low) |
| 4 | **Low** | Fire-and-forget `postInit` in service `init()` | [4](#4-fire-and-forget-postinit-in-service-init-low) |
| 5 | **Low** | No error boundary | [5](#5-no-error-boundary-low) |
| 6 | **Low** | Docs page hardcoded asset URL | [6](#6-docs-page-hardcoded-asset-url-low) |
| 7 | **Low** | Styling concerns | [7](#7-styling-concerns-low) |
| 8 | **Low** | Minor code quality issues | [8](#8-minor-code-quality-issues-low) |

---

## Detailed Findings

### 1. Unbounded Console Output Buffer (Medium)

`EmulatorConsoleProvider.tsx` accumulates all emulator output into a single React state string:

```tsx
// line 37-38
const [output, setOutput] = useState('');
const outputBufferRef = useRef('');
```

Output is appended indefinitely via `enqueueOutput` and flushed every 50ms. A long-running program (e.g., a test suite, or the CPU running with debug logging enabled) can produce megabytes of text, causing:
- Growing memory usage
- Increasingly expensive string concatenation
- Slow re-renders of the `TextArea` component

**Recommendation:** Cap the output buffer to a reasonable limit (e.g., last 100KB or last N lines), trimming from the front when the limit is exceeded.

---

### 2. `BiQuinaryNumber` Wasted Decay Computation and className Bug (Low)

**Wasted computation:** `BiQuinaryNumber.tsx` line 46 always calls `useDigitDecay(digits.join(''), tick)` even when `providedIntensity` is supplied. The computed result is discarded when external intensity exists, but the hook still runs its `requestAnimationFrame` loop and triggers state updates every frame. This doubles the animation work for `DisplaySection`, which provides pre-computed intensity for all its digit groups.

**className bug:** Line 51: `{title && <div className={title ? 'title' : styles.title}>...}` — when a title is present, it uses the bare CSS class string `'title'` instead of `styles.title`. This is likely unintentional; the bare class name won't match any CSS module class and the element will be unstyled.

---

### 3. Run-State Race Window in `executeCommand` (Low)

`index.ts` lines 396-409:

```typescript
if (isRunCommand && !state.isRunning) {
  runRequestedUntil = Date.now() + 1500;
  mergeState({ isRunning: true });
}
try {
  const result = await simh.sendCommand(command, options);
  ...
} finally {
  if (isRunCommand) {
    runRequestedUntil = 0;
    mergeState({ isRunning: false });  // <-- always sets false
  }
}
```

When a `GO` command is sent, the service optimistically sets `isRunning: true`, then unconditionally sets it back to `false` in the `finally` block when the command returns. If the CPU is still running asynchronously (which is normal — `GO` returns when the emulator yields, not when it stops), there's a brief flash where `isRunning` is incorrectly false before the runstate polling (every 50ms in the worker) corrects it. The `runRequestedUntil` guard at line 293 partially mitigates this by suppressing a false "not running" signal for 1.5s, but the guard is cleared in the `finally` block (line 406) before the polling can fire.

---

### 4. Fire-and-Forget `postInit` in Service `init()` (Low)

`index.ts` lines 273-307: After `simh.init()` resolves, the `postInit` function (which sets CPU memory size, yield steps, refreshes registers, starts the state stream, and registers the runstate callback) is launched with `void postInit().catch(...)`. The `init()` promise resolves immediately, before any of this setup completes.

This means callers that `await init()` may start interacting with the service before yield steps are configured, registers are loaded, or the state stream is active. In practice this works because the UI renders before the user can interact, but it's a latent ordering issue.

---

### 5. No Error Boundary (Low)

`layout.tsx` wraps the entire app in `<Providers>` (which nests 4 context providers and triggers async initialization). Any unhandled error in a provider or child component will crash the entire React tree with no recovery path and no user-visible error message.

Additionally, `suppressHydrationWarning` on both `<html>` and `<body>` (lines 18-19) may mask legitimate hydration mismatches during development.

---

### 6. Docs Page Hardcoded Asset URL (Low)

`docs/page.tsx` line 13: `fetch('/assets/about.md')` uses an absolute path that ignores `NEXT_PUBLIC_BASE_PATH`. When the app is deployed under a subpath (e.g., `/ibm650/`), this fetch will 404.

---

### 7. Styling Concerns (Low)

| File | Issue |
|------|-------|
| `globals.scss` | 5 uses of `!important` to override Carbon DataTable overflow. `z-index: 9999 !important` on `.cds--list-box__menu` will stack above modals/overlays. |
| `docs.scss` | Hardcoded colors (`#444`, `#333`, `#e0e0e0`, `#e8e8e8`) assume a specific theme. Should use Carbon design tokens for theme compatibility. |
| `Knob.module.scss` | Hardcoded dark colors (`#1a1a1a`, `#2a2a2a`, `#333`, `#444`) — appropriate for the dark knob aesthetic but won't adapt to themes. |
| `Knob.tsx` | SVG inline colors (`#0a0a0a`, `#1a1a1a`, `#2a2a2a`, etc.) are baked into the SVG gradients. Acceptable for a skeuomorphic control. |
| `programming/page.tsx:259` | `paddingBottom: '250px'` magic number — workaround for ComboBox dropdown clipping. |
| `EmulatorConsole.tsx` | Extensive inline styles (lines 94-153) instead of SCSS modules. Inconsistent with the rest of the codebase. |
| `PunchedCard.tsx` | ~200 lines of inline style objects. Creates new objects every render. |

---

### 8. Minor Code Quality Issues (Low)

| File:Line | Issue |
|-----------|-------|
| `CardDeckProvider.tsx:76` | Context value exposes raw `setCardDeck` and `setUploadedFile` state setters alongside handler functions, breaking encapsulation. |
| `ControlSection.tsx:8-9` | "HELP" and "CHEAT" buttons are rendered but have no handler mapping in `handlerMap` (lines 24-32) — clicking them silently does nothing. |
| `EmulatorConsole.tsx:75` | `handleKeyDown` calls `handleSend()` without `await`. Unhandled rejections from the async function will surface as uncaught promise errors. |
| `package.json` | Inconsistent version pinning: `next`, `react`, `react-dom`, `react-test-renderer`, `babel-plugin-react-compiler` are pinned exact; all other deps use carets. |
| `vitest.config.ts:30` | `as unknown as { [key: string]: unknown }` type assertion to work around Vitest config types. |
| `printer/page.tsx` | Missing `'use client'` directive (exports a component using JSX). Works because Next.js infers it, but inconsistent with sibling pages. |

---

## Strengths

1. **Client-side WASM architecture with Web Worker isolation.** The emulator runs in a dedicated Web Worker (`simh.worker.ts`), keeping the main thread responsive. The typed RPC layer (`workerClient.ts`) provides clean async APIs with comprehensive error handling — worker errors, message deserialization errors, and pending-request rejection on failure are all properly handled. The `ensureInit` / `initPromise` pattern prevents use-before-init errors.

2. **Clean separation of concerns.** The codebase is organized into four distinct layers: (1) generic SIMH framework (`core.ts`, `control.ts`, `filesystem.ts`), (2) I650-specific domain logic (`index.ts`, `format.ts`, `controls.ts`), (3) React state management (three focused context providers), and (4) presentation components. The service layer uses a pub/sub model that decouples the emulator lifecycle from React rendering.

3. **Comprehensive and well-structured test suite.** 479 tests across 42 files achieve 97.45% statement coverage and 98.57% line coverage. The test suite includes unit tests with mocked dependencies, WASM integration tests (running the real SIMH module against the official I650 test suite in Node.js), RAF-mocking for animation hooks, and 19 Playwright E2E tests. Each handler is tested individually to prevent failure masking. Coverage thresholds are enforced in CI.

4. **Accessible front panel.** All indicator bulbs use `role="img"` with descriptive `aria-label` (e.g., `"OVERFLOW: lit"`). Labeled knobs use `role="slider"` with `aria-valuenow`/`aria-valuetext` and full keyboard navigation (arrow keys, Home/End). Decimal knobs use `role="spinbutton"` with arrow key and digit key input. Status panels use `role="group"` with `aria-label`. Control buttons have `type="button"` and `:focus-visible` styles.

5. **Live front panel with decay effects.** The state stream + decay system (`useDisplayDecay`, `useDigitDecay`) provides realistic phosphor-persistence "blinkenlights" behavior using exponential decay with `requestAnimationFrame`. State is streamed from the worker at configurable stride intervals, and the intensity-based rendering through `Bulb` components creates a convincing analog feel.

6. **React Compiler enabled.** Automatic memoization via `babel-plugin-react-compiler` compensates for the absence of manual `React.memo` wrappers. Context values are explicitly `useMemo`'d in all providers, and callbacks use `useCallback` — this combination ensures stable references and minimal unnecessary re-renders.

7. **Thorough I650 validation.** `format.ts` provides input validation (`validateWord`, `validateAddress`) and normalization (`normalizeWord`, `normalizeAddress`) with 32 unit tests covering boundary conditions. All user-facing inputs (programming sheet, entry knobs, console commands) pass through validation before reaching the emulator.

8. **Consolidated bi-quinary display components.** `BiQuinaryNumber` provides a single, well-tested implementation for all bi-quinary encoded digit displays (operation codes, addresses, and data words), supporting both CSS Grid subgrid and `display: contents` layouts. This eliminated ~60 lines of duplicated rendering logic.

9. **Robust worker RPC.** The `workerClient.ts` implementation handles the full lifecycle: lazy worker initialization, request ID tracking, pending-request rejection on worker errors, runstate change detection with deduplication, and state stream sample forwarding. The `call<T>` generic preserves type safety through the RPC boundary.

10. **Punched card visualization.** `PunchedCard.tsx` faithfully reproduces IBM 029 keypunch encoding with real-world card dimensions (7.375" x 3.25") scaled proportionally. The encoding table covers all standard characters and the visual includes the corner cut, printed character row, column numbers, and proper hole dimensions.
