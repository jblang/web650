# Plan: Split Monolithic EmulatorProvider Context

## Problem
`EmulatorProvider.tsx` uses a single context for all emulator state. When `output` changes (every command, every tick during execution), the entire front panel re-renders. When registers change (60fps during execution), the console re-renders despite not using register data.

Two consumers exist:
- `EmulatorConsole.tsx` — uses only `output` + `sendCommand`
- `useFrontPanelControls.ts` — uses registers, switches, actions, operating/checking state (32 fields)

Additionally, `operatingState` and `checkingState` are `useState` with no setter calls — they're static but `Object.freeze({ ...operatingState })` creates new references each render.

## Approach
Split the single context into three, all provided by the same `EmulatorProvider` component (no need for separate provider components since the logic is interconnected). Each context gets its own `useMemo` so only the relevant slice invalidates on changes.

### Context Split

**1. `EmulatorConsoleContext`** — changes on every command/output
- `output`, `sendCommand`

**2. `EmulatorStateContext`** — changes when registers/switches change
- `initialized`, `displaySwitch`, `controlSwitch`, `errorSwitch`, `addressSwitches`
- `addressRegister`, `programRegister`, `lowerAccumulator`, `upperAccumulator`, `distributor`, `consoleSwitches`
- `programmedStop`, `overflowStop`, `halfCycle`
- `displayValue`, `operation`

**3. `EmulatorActionsContext`** — stable callback references
- `refreshRegisters`
- All `on*` handlers (`onDisplayChange`, `onAddressChange`, etc.)

### Static Constants
Move `operatingState` and `checkingState` out of `useState` to module-level frozen constants exported directly:
```ts
export const INITIAL_OPERATING_STATE: OperatingState = Object.freeze({ ... });
export const INITIAL_CHECKING_STATE: CheckingState = Object.freeze({ ... });
```

### New Hooks
- `useEmulatorConsole()` — returns `EmulatorConsoleContext`
- `useEmulatorState()` — returns `EmulatorStateContext`
- `useEmulatorActions()` — returns `EmulatorActionsContext`

Remove the old `useEmulator()` hook entirely to avoid accidentally using the monolithic version.

## Files to Modify

1. **`src/components/EmulatorProvider.tsx`**
   - Create 3 context objects + 3 hooks
   - Move `operatingState`/`checkingState` to module-level constants
   - Split single `useMemo` into 3 separate `useMemo` calls
   - Nest 3 providers in the render
   - Remove old `EmulatorContext` and `useEmulator`

2. **`src/components/EmulatorConsole.tsx`**
   - Change `useEmulator()` → `useEmulatorConsole()`

3. **`src/components/FrontPanel/useFrontPanelControls.ts`**
   - Change `useEmulator()` → `useEmulatorState()` + `useEmulatorActions()`
   - Import `INITIAL_OPERATING_STATE`/`INITIAL_CHECKING_STATE` directly
   - Remove `operatingState`/`checkingState` from context destructure

## Verification
- `npm run build` — ensure no type errors
- `npm test` — ensure existing tests pass (EmulatorConsole and FrontPanelControls tests)
- Manual: verify the front panel and console still function correctly
