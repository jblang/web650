# Host I/O Bridge Roadmap (Incremental Plan)

This document is the implementation plan for evolving from the current i650-specific browser bridge into a generic host I/O architecture that can support additional simulators (for example, interactive terminal workloads such as Unix on PDP-11) while remaining pure-browser compatible.

## Why this plan exists

Current behavior works for most i650 use cases, but there are known gaps and scaling limits:

- Interactive prompt input in scripts is disabled in browser mode (for example `SET ENV -P "..."`).
- The front-panel state stream is currently i650-specific.
- Output is mostly a single stream, which limits clean separation of channels (console, device output, debug, printer, etc.).
- Future simulators with richer terminal/mux semantics need a generic host I/O model.

## Goals

- Preserve as much existing SIMH functionality as practical in a pure-browser deployment.
- Keep front-panel/state updates fast (ring-buffer style path for high-rate signals).
- Ship a concrete first vertical slice: punched-card UI wired to live emulator I/O (not standalone UI-only state).
- Add generic, channelized host I/O suitable for:
  - command prompt input/output,
  - interactive terminal sessions,
  - device streams (reader/punch/printer),
  - debug/log streams.
- Keep upstream viability in mind by preferring generic hooks over machine-specific hardcoding.

## Non-goals (for early phases)

- Full emulation of host TCP socket semantics in browser JS.
- Replacing all existing paths at once.
- Supporting every simulator/device from day one.

## Current baseline (as of this doc)

- Browser bridge uses `simh_api.c` exports plus worker RPC (`src/lib/simh/simh.worker.ts`, `src/lib/simh/workerClient.ts`).
- i650 high-rate state uses `simh_state_stream_*` C exports consumed in `src/lib/simh/core.ts`.
- Interactive stdin is intentionally disabled in web contexts (`src/lib/simh/core.ts`).
- `SET ENV -P` path in SIMH reads via `read_line_p(..., stdin)` in `simh/scp.c`.
- i650 reader/punch has concrete hook points in `simh/I650/i650_cdr.c` and `simh/I650/i650_cdp.c`.

## Immediate priority (reordered with latest decisions)

Execution order for near-term work:

1. Hook punched-card workflows to emulator filesystem first.
2. Add punched output streaming second (start with simplest viable mechanism).
3. Keep `SET ENV -P` work optional unless it materially helps shared infrastructure.
4. Continue broader host I/O generalization after the punched-card slice is working end-to-end.

Why this order:

- It delivers user-visible value quickly (`Reader` UI and `PunchedCard` UI become functional with the emulator).
- It uses existing bridge primitives already present in this repo (`readFile`/`writeFile` worker wrappers).
- It avoids premature complexity while still leaving a clean migration path to the generic host I/O bus.

## Concrete implementation notes for Milestones 0A/0B

Recommended file layout in MEMFS (can be adjusted later, but keep it stable per session):

- Input decks: `/decks/<deck-id>.dck`
- Punch output: `/output/cdp1.pch`
- Optional print stream: `/output/cdp0.prt`

Recommended service-level helpers to add in `src/lib/simh/i650/index.ts`:

- `attachReader(deckPath: string, unit = 1)` -> `ATTACH CDR${unit} ${deckPath}`
- `detachReader(unit = 1)` -> `DETACH CDR${unit}`
- `attachPunch(outputPath: string, unit = 1)` -> `ATTACH CDP${unit} ${outputPath}`
- `detachPunch(unit = 1)` -> `DETACH CDP${unit}`

File-tailing strategy for Milestone 0B:

- Poll `readFile('/output/cdp1.pch')` on an interval while simulator is running.
- Track last-processed byte/character offset and only parse appended text.
- Emit complete card records only (buffer partial trailing line until next poll).
- Keep this behind an adapter interface so Milestone 4 can swap in event-bus input without touching UI code.

## Target architecture (end state)

Use two complementary data planes:

- **Plane A: High-rate state stream**
  - ring-buffer based,
  - binary sample payloads,
  - provider model per simulator/machine.

- **Plane B: Host I/O event bus (channelized)**
  - typed events and input queues,
  - separate channels for prompt/console/tty/device/debug/printer,
  - optional blocking input handoff (Asyncify-compatible) for prompt flows.

## Channel model (proposed)

Each event includes:

- `channel`: stable channel id (`command`, `tty:0`, `device:cdp1`, `printer:cdp0`, `debug`, ...)
- `kind`: `text`, `bytes`, `prompt`, `status`, `device_event`, ...
- `timestamp`: host time or sim time
- `payload`: kind-specific data

Input path:

- JS pushes input messages tagged by channel.
- WASM side dequeues input for the requested channel.
- Prompt/input requests can block cooperatively (via Asyncify-safe bridge) or poll by default.

## Incremental milestones

### Milestone 0A: Punched-card filesystem hookup (first shipped slice)

Deliverables:

- Make emulator MEMFS the source of truth for decks used by the Reader UI.
- Use existing wrappers (`src/lib/simh/workerClient.ts` -> `writeFile`/`readFile`) instead of adding new low-level FS plumbing.
- Add i650 card-device command helpers in TS service code for:
  - `ATTACH CDR1 <deck-path>` and `DETACH CDR1`,
  - output attach path setup (`ATTACH CDP1 <output-path>`, optional `ATTACH CDP0 <print-path>`).
- Update `src/components/CardDeckProvider.tsx` and `src/app/reader/page.tsx` flow:
  - upload file -> write to MEMFS,
  - preview deck from MEMFS contents,
  - attach selected deck path to CDR unit.

Exit criteria:

- A deck uploaded in UI can be attached to `CDR1` and consumed by a simulator run.
- Deck preview and simulator input come from the same MEMFS file.
- No new SIMH C changes are required for this step.

### Milestone 0B: Punched output streaming (easy-first implementation)

Deliverables:

- Implement initial streaming via file tailing (poll + diff) on a MEMFS output file attached to `CDP1`.
- Keep a cursor/offset in JS to emit only newly punched cards.
- Expose a small abstraction (for example `PunchedOutputSource`) so the polling adapter can be replaced by a future generic event channel without UI rewrite.
- Optionally tail `CDP0` printer output into a separate stream if needed for current demos.

Exit criteria:

- `PunchedCard.tsx` receives incremental card output while program is running.
- No duplicate/missing card lines across polling intervals in normal runs.
- Full punched output is still available as a file in MEMFS.

### Milestone 0C (optional): `SET ENV -P` prompt bridge spike

Deliverables:

- Implement only if it helps establish reusable input request/response queues for later terminal channels.
- Keep behavior robust with non-blocking fallback when no input provider is attached.

Exit criteria:

- `set env -P "Press Enter to continue . . . " dummy=cont` can be exercised interactively in browser mode.
- No deadlock when no prompt handler is present.

### Milestone 1: Baseline and instrumentation (no behavior change)

Deliverables:

- Add lightweight metrics hooks in worker/client:
  - command latency,
  - event throughput,
  - dropped messages,
  - run-state responsiveness.
- If needed, add SIMH compile-time macros only for diagnostics/tracing (not runtime behavior gating).

Exit criteria:

- Existing tests pass unchanged.
- Metrics can be logged during existing e2e flows.

### Milestone 2: Generalize state stream core

Deliverables:

- Extract ring-buffer mechanics into generic stream core in SIMH-side code.
- Keep current i650 payload unchanged initially.
- Add provider registration pattern for future machines.

Exit criteria:

- No UI behavior changes for i650.
- State stream tests still pass.

### Milestone 3: Host I/O bus skeleton

Deliverables:

- Add generic C/TS bridge APIs:
  - read event batch,
  - push input,
  - subscribe by channel.
- Start with mirrored command/output channel only (parity with current output callback).

Exit criteria:

- Command output can be consumed via old and new path during development migration.
- No regression in emulator console behavior.

### Milestone 4: Device event adapters (i650 pilot, replacing file-tail path)

Deliverables:

- Emit `device:cdr*` and `device:cdp*` events from i650 reader/punch paths.
- Emit optional `printer:*` channel for CDP0 print stream.
- Replace Milestone 0B polling with event-driven adapters behind the same TS abstraction.
- Add JS helpers for:
  - streaming punched cards to UI,
  - attaching to MEMFS file updates where applicable.

Exit criteria:

- `PunchedCard.tsx` can render from live event stream with no behavior regression from Milestone 0B.
- Existing file-based attach flows still work.

### Milestone 5: Prompt-capable input bridge (generalized)

Deliverables:

- Implement prompt/input request-response path for command channel.
- Support `SET ENV -P` style workflows in browser mode.
- Keep fallback behavior when no input provider is attached.

Exit criteria:

- `i650_demo_all.ini` style pause prompts can advance interactively.
- No deadlocks when no input is provided.

### Milestone 6: Terminal channel readiness for non-650 simulators

Deliverables:

- Define `tty:n` channel contract.
- Add minimal adapter path for simulator console/terminal I/O.
- Validate with one terminal-centric simulator target in a prototype branch.

Exit criteria:

- Interactive terminal loop works through channelized bridge.
- Architecture proves reusable beyond i650.

### Milestone 7: Consolidation and upstream packaging

Deliverables:

- Reduce/retire transitional code paths.
- Prepare upstream-friendly patches:
  - generic core hooks first,
  - machine-specific adapters isolated.
- Document extension process for adding new machine providers/adapters.

Exit criteria:

- Clear split between generally useful SIMH changes and local web integration glue.

## Asyncify policy

Use Asyncify selectively, not as a universal mechanism:

- Use it where cooperative blocking is genuinely needed (prompt/input handoff).
- Avoid expanding Asyncify-driven control flow into high-frequency hot paths.
- Keep hot-path streams ring-buffer/poll based.

## WebSocket / pseudo-socket policy

Treat pseudo-socket support as optional and later-phase:

- Not required for core host I/O bus.
- Evaluate only if needed for specific simulator features that cannot be expressed through channelized host I/O events.
- Defer until after the punched-card vertical slice (Milestones 0A/0B) and host I/O baseline milestones are stable.

## Compatibility and rollout strategy

- Use short-lived phase branches and merge only when a milestone is fully working.
- Keep old and new paths in parallel only inside development branches during migration.
- Do adapter-by-adapter migration, not a big-bang rewrite.
- Prefer deleting transitional code at milestone completion rather than carrying long-lived toggles.
- Use compile-time SIMH macros only when needed for upstream-safe diagnostics or portability.

## Validation strategy

Functional:

- Existing vitest suite.
- Existing Playwright front-panel and console tests.
- New tests for:
  - deck upload writes expected bytes to MEMFS and round-trips via `readFile`,
  - attach/detach command helpers issue expected SIMH commands for CDR/CDP units,
  - punched output tailing emits incremental lines without duplication,
  - prompt roundtrip (`SET ENV -P`) in the prompt-bridge milestone branch,
  - card reader/punch event emission,
  - multi-channel subscriptions.

Performance:

- Track before/after metrics:
  - state samples/sec,
  - command latency p50/p95,
  - run-state stop latency,
  - event queue depth and drop counts.

## Risks and mitigations

- **Risk:** event bus adds overhead.
  - **Mitigation:** keep high-rate state on dedicated ring stream.

- **Risk:** prompt/input deadlocks.
  - **Mitigation:** default timeout/fallback path, explicit state machine, test no-input path.

- **Risk:** polling-based output tailing adds latency or overhead.
  - **Mitigation:** bound poll interval, cap buffered events, and replace with event adapter in Milestone 4.

- **Risk:** architecture drift from upstream SIMH expectations.
  - **Mitigation:** isolate generic changes first; keep machine-specific glue out of generic core where possible.

- **Risk:** too many parallel transitional paths.
  - **Mitigation:** enforce per-milestone deprecation/removal checklist.

## "Resume later" checklist

Use this checklist when picking up work without prior chat context:

1. Read this document fully.
2. Confirm current milestone status in git history/branch notes.
3. Verify branch is scoped to one milestone and completion criteria are explicit.
4. Run baseline tests:
   - `npx vitest run`
   - `npm run lint`
5. If working on Milestone 0A:
   - verify deck upload -> MEMFS write -> CDR attach -> successful read path.
6. If working on Milestone 0B:
   - verify CDP output file tail stream emits incremental cards and preserves file output.
7. Run a manual sanity flow:
   - initialize emulator,
   - run/stop program,
   - check state updates,
   - check console output path.
8. If working on prompt bridge:
   - test `SET ENV -P` behavior in browser build.
9. If working on card streams:
   - test attach/read/punch flows and verify both file output and live events.

## Immediate next tasks (recommended order)

1. Implement Milestone 0A: wire `CardDeckProvider`/Reader UI to MEMFS-backed deck files and CDR attach/detach commands.
2. Implement Milestone 0B: add punched-card streaming via CDP output file tailing.
3. Optionally implement Milestone 0C only if it directly helps shared request/response input plumbing.
4. After 0A/0B are stable, continue with Milestone 1 metrics and then Milestones 2-3 genericization work.
