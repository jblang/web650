# AGENTS.md

Guidance for AI coding agents working on this codebase.

## Project Summary

Web-based UI for the Open SIMH IBM 650 simulator. A Next.js app that spawns and manages a SIMH emulator process via `node-pty` pseudo-terminal, exposing control through REST API routes and Server-Sent Events. The frontend renders an interactive front panel simulation with knobs, switches, and indicator lights using IBM Carbon Design System.

## Commands

```bash
npm run dev          # Start dev server (requires SIMH i650 binary in PATH or I650_PATH)
npm run build        # Production build
npm run lint         # ESLint (flat config, strict TypeScript)
npm test             # Run all tests (vitest, watch mode)
npx vitest run       # Run tests once (CI mode)
npx vitest run --coverage  # Tests with coverage report
```

**Environment variables:**
- `I650_PATH` — Full path to the SIMH `i650` binary
- `SIMH_DEBUG=true` — Enable debug logging for emulator PTY communication
- `SIMH_QUIT_TIMEOUT_MS` — Timeout in ms for graceful emulator shutdown (default: 1000)

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes (Next.js route handlers)
│   │   ├── command/        # Emulator commands (go, step, reset, quit, break)
│   │   ├── console/stream/ # SSE endpoint for console output
│   │   ├── escape/         # Send Ctrl-E to interrupt emulator
│   │   ├── restart/        # Restart emulator process
│   │   ├── start/          # Start emulator process
│   │   └── state/          # Read/write emulator register state
│   ├── front-panel/        # Front panel simulator page
│   ├── emulator/           # Console/terminal page
│   ├── programming/        # Programming sheet editor
│   ├── reader/             # Card reader with file upload
│   ├── docs/               # About page (renders Markdown)
│   └── (stubs)             # punch/, printer/, tape/, ramac/ (placeholders)
├── components/
│   ├── EmulatorProvider.tsx # Main state provider (registers, console, controls)
│   ├── EmulatorConsole.tsx  # Console input/output component
│   ├── CardDeckProvider.tsx # Card deck state management
│   ├── PunchedCard.tsx      # Punched card visualization
│   ├── FrontPanel/          # Front panel components (knobs, lights, displays)
│   │   ├── FrontPanel.tsx   # Layout and composition
│   │   ├── DecimalKnob.tsx  # Digit selector knob (0-9)
│   │   ├── LabeledKnob.tsx  # Multi-position labeled knob
│   │   ├── BiQuinaryDigit.tsx # Bi-quinary indicator lights
│   │   ├── useFrontPanelControls.ts # Hook bridging emulator state to panel props
│   │   └── ...              # Display, control, config, status sections
│   ├── Header.tsx           # Navigation header
│   └── Providers.tsx        # Root context composition
├── lib/
│   ├── simh.ts              # Core SIMH emulator class (PTY, command queue, parsing)
│   └── format.ts            # Value formatting (10-digit IBM 650 format with sign)
└── instrumentation.ts       # Next.js hook for auto-starting emulator at boot
```

### Key patterns

- **Emulator singleton** is stored on `globalThis` and accessed via `getEmulator()` from `src/lib/simh.ts`. API routes call `getEmulator()` to interact with the running emulator process.
- **Command queue** in `SimhEmulator` serializes all commands through the PTY. Commands are dispatched one at a time, waiting for the `sim> ` prompt before sending the next.
- **SSE streaming** at `/api/console/stream` uses `ReadableStream` to push emulator console output to the browser in real time.
- **State management** uses React context via `EmulatorProvider`. The provider polls register state and exposes actions (start, stop, step, reset, etc.) to child components.
- **Front panel controls** are connected via `useFrontPanelControls()` hook, which maps between emulator state (register values) and UI state (knob positions, light states).

## Code Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig).
- Path alias: `@/*` maps to `src/*`. Use `@/lib/simh`, `@/components/Header`, etc.
- React components use `React.FC<Props>` pattern with explicit prop interfaces.
- API route handlers export named functions matching HTTP methods: `GET`, `POST`, `PUT`, `DELETE`.

### File naming
- Components: `PascalCase.tsx` (e.g., `EmulatorConsole.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useFrontPanelControls.ts`)
- Libraries: `camelCase.ts` (e.g., `simh.ts`, `format.ts`)
- Tests: colocated as `*.test.ts` or `*.test.tsx` next to the source file
- API routes: `route.ts` inside a directory matching the URL path

### Component conventions
- Client components use `'use client'` directive at the top of the file.
- Pages are thin wrappers that delegate to components and hooks.
- Styles use SCSS files (Carbon Design System) or inline style objects. No CSS modules.
- The project uses IBM Carbon Design System components (`@carbon/react`). Prefer Carbon components over custom HTML where applicable.

### API route pattern
Every API route follows this structure:
```typescript
import { NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

export async function POST() {
  try {
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }
    // ... do work ...
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## Testing

### Framework
- **Vitest** with `jsdom` environment for component tests.
- Tests colocated next to source files (e.g., `route.test.ts` next to `route.ts`).
- Component tests use `react-dom/client` `createRoot` with `act()` wrappers (not `@testing-library/react`).

### Test patterns
- API route tests mock `@/lib/simh` via `vi.mock()` with a module-scoped `let emulator` variable.
- Component tests mock dependencies (Carbon components, context hooks) via `vi.mock()`.
- `node-pty` is always mocked in tests — never spawns a real process.
- The `__resetConsoleBufferForTests()` helper in `simh.ts` clears shared console state between tests.

### Running tests
```bash
npm test                     # Watch mode
npx vitest run               # Single run
npx vitest run src/lib/      # Run tests in a specific directory
npx vitest run --coverage    # With coverage report
```

### Writing new tests
- Place test files next to the source: `src/app/api/foo/route.ts` → `src/app/api/foo/route.test.ts`
- For API routes, test at minimum: 503 when emulator not running, happy path, and 500 on error.
- For components, use `createRoot` + `act()` pattern to match existing tests.
- Use `vi.mock()` for external dependencies. Use `vi.fn()` for function spies.
- Run `npx vitest run` to verify all tests pass before committing.

## Linting

ESLint flat config with Next.js core-web-vitals and TypeScript rules. Unsafe TypeScript operations (`no-unsafe-assignment`, etc.) are set to `warn` in production code and `off` in test files.

```bash
npm run lint     # Run ESLint
```

## Important Notes

- **`node-pty` is a native module** requiring compilation. The `postinstall` script (`scripts/postinstall.js`) fixes spawn-helper permissions. If `npm install` fails, check that build tools (python3, make, gcc/clang) are available.
- **The React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`). It provides automatic memoization. Do not add manual `React.memo`, `useMemo`, or `useCallback` unless there is a measured performance reason — the compiler handles most cases.
- **The emulator auto-starts** via `src/instrumentation.ts` when the Next.js server boots. If the `i650` binary is not found, the server still starts but the emulator must be started manually via `/api/start`.
- **No authentication** exists on API routes. This is a local development tool.
