'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Button, Checkbox, TextInput } from '@carbon/react';
import { Play, Stop, ViewNext } from '@carbon/icons-react';
import * as i650Service from '@/lib/i650';
import {
  getNextInputValue,
  isValidDraftValue,
  normalizeDraftForCommit,
  type DraftValueKind,
} from '@/lib/i650/inputValidation';
import { useEmulatorState } from './EmulatorStateProvider';
import { useEmulatorActions } from './EmulatorActionsProvider';

type RegisterMap = Record<string, string>;
type RegisterWriter = (value: string) => Promise<void>;

function parseKeyValues(text: string): RegisterMap {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const result: RegisterMap = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9]+)\s*[:/]\s+(.*)$/i);
    if (!match) continue;
    result[match[1].toUpperCase()] = match[2].trim();
  }
  return result;
}

function parseBoolSwitch(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  return normalized === '1' || normalized === 'TRUE' || normalized === 'ON' || normalized === 'STOP';
}

const REGISTER_WRITERS: Record<string, RegisterWriter> = {
  AR: (value) => i650Service.setAddressRegister(value.trim()),
  PR: (value) => i650Service.setProgramRegister(value.trim()),
  DIST: (value) => i650Service.setDistributor(value.trim()),
  ACCLO: (value) => i650Service.setLowerAccumulator(value.trim()),
  ACCUP: (value) => i650Service.setUpperAccumulator(value.trim()),
  CSW: (value) => i650Service.setConsoleSwitches(value.trim()),
  CSWPS: (value) => i650Service.setProgrammedStop(parseBoolSwitch(value)),
  CSWOS: (value) => i650Service.setOverflowStop(parseBoolSwitch(value)),
  HALF: (value) => i650Service.setHalfCycle(parseBoolSwitch(value)),
};
const REGISTER_EDIT_KINDS: Partial<Record<string, DraftValueKind>> = {
  AR: 'address',
  IC: 'address',
  PR: 'word',
  DIST: 'word',
  ACCLO: 'word',
  ACCUP: 'word',
  CSW: 'word',
};
const BOOLEAN_REGISTERS = new Set(['CSWPS', 'CSWOS', 'HALF', 'OV']);
const FIRST_ROW_KEYS = ['ACCUP', 'ACCLO', 'DIST', 'PR'];
const SECOND_ROW_KEYS = ['IC', 'PROP', 'AR', 'CSW'];
const REGISTER_DESCRIPTIONS: Record<string, string> = {
  ACCUP: 'Upper accumulator',
  ACCLO: 'Lower accumulator',
  DIST: 'Distributor',
  PR: 'Program register',
  IC: 'Instruction counter',
  PROP: 'Operation mnemonic',
  AR: 'Address register',
  CSW: 'Console switches',
  CSWPS: 'Programmed stop switch',
  CSWOS: 'Overflow stop switch',
  HALF: 'Half cycle mode',
  OV: 'Overflow indicator',
  B: 'B register',
  C: 'C register',
  D: 'D register',
  E: 'E register',
  F: 'F register',
  P: 'P register',
  S: 'S register',
  T: 'T register',
  U: 'U register',
  AA: 'Auxiliary register AA',
  BB: 'Auxiliary register BB',
  DD: 'Drum data register',
  TT: 'Timing register',
};

type SimulatorStateTabProps = {
  active: boolean;
};

export default function SimulatorStateTab({ active }: SimulatorStateTabProps) {
  const { initialized, isRunning } = useEmulatorState();
  const { onProgramGoClick, onProgramStopClick, onProgramStepClick } = useEmulatorActions();
  const [registers, setRegisters] = useState<RegisterMap>({});
  const [drafts, setDrafts] = useState<RegisterMap>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const readOnly = isRunning;

  const loadState = useCallback(async () => {
    if (!initialized) return;
    setErrorMessage(null);
    try {
      const output = await i650Service.executeCommand('EXAMINE STATE', { echo: false });
      const parsed = parseKeyValues(output);
      const normalized = { ...parsed };
      for (const [key, kind] of Object.entries(REGISTER_EDIT_KINDS)) {
        if (kind !== 'address') continue;
        if (!normalized[key]) continue;
        normalized[key] = normalizeDraftForCommit('address', normalized[key]);
      }
      setRegisters(normalized);
      setDrafts(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read simulator state';
      setErrorMessage(message);
    }
  }, [initialized]);

  useEffect(() => {
    if (!active) return;
    const refreshTimer = window.setTimeout(() => {
      void loadState();
    }, 0);
    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, [active, loadState]);

  useEffect(() => {
    if (!active) return;

    const handleWindowFocus = () => {
      void loadState();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadState();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [active, loadState]);

  const remainingKeys = useMemo(
    () => {
      const keys = Object.keys(drafts).filter(
        (key) => !FIRST_ROW_KEYS.includes(key) && !SECOND_ROW_KEYS.includes(key)
      );
      const ovIndex = keys.indexOf('OV');
      if (ovIndex !== -1) {
        const [ov] = keys.splice(ovIndex, 1);
        keys.push(ov);
      }
      return keys;
    },
    [drafts]
  );

  const renderRegisterControl = (key: string) => {
    const writable = Object.prototype.hasOwnProperty.call(REGISTER_WRITERS, key);
    const isBoolean = BOOLEAN_REGISTERS.has(key);
    if (isBoolean) {
      return (
        <div key={key}>
          <Checkbox
            id={`sim-state-${key}`}
            labelText={key}
            helperText={REGISTER_DESCRIPTIONS[key] ?? 'State register value'}
            checked={parseBoolSwitch(drafts[key] ?? '0')}
            disabled={!writable || readOnly}
            onChange={(event) => {
              const checked = (event.target as HTMLInputElement).checked;
              const nextValue = checked ? '1' : '0';
              setDrafts((current) => ({ ...current, [key]: nextValue }));
              void commitRegister(key, nextValue);
            }}
          />
        </div>
      );
    }

    return (
      <TextInput
        key={key}
        id={`sim-state-${key}`}
        labelText={key}
        value={drafts[key] ?? ''}
        helperText={REGISTER_DESCRIPTIONS[key] ?? 'State register value'}
        readOnly={!writable || readOnly}
        onChange={(event) => {
          const value = event.currentTarget.value;
          const kind = REGISTER_EDIT_KINDS[key] ?? 'text';
          if (!isValidDraftValue(kind, value)) return;
          setDrafts((current) => ({ ...current, [key]: value }));
        }}
        onBeforeInput={(event) => {
          if (!writable || readOnly) return;
          if (!event.data) return;
          const input = event.currentTarget as HTMLInputElement;
          const kind = REGISTER_EDIT_KINDS[key] ?? 'text';
          const nextValue = getNextInputValue(
            input.value,
            input.selectionStart,
            input.selectionEnd,
            event.data
          );
          if (!isValidDraftValue(kind, nextValue)) {
            event.preventDefault();
          }
        }}
        onPaste={(event) => {
          if (!writable || readOnly) return;
          const input = event.currentTarget as HTMLInputElement;
          const kind = REGISTER_EDIT_KINDS[key] ?? 'text';
          const pastedText = event.clipboardData.getData('text');
          const nextValue = getNextInputValue(
            input.value,
            input.selectionStart,
            input.selectionEnd,
            pastedText
          );
          if (!isValidDraftValue(kind, nextValue)) {
            event.preventDefault();
          }
        }}
        onBlur={() => {
          void commitRegister(key);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void commitRegister(key);
          }
        }}
      />
    );
  };

  const commitRegister = useCallback(async (key: string, overrideValue?: string) => {
    const writer = REGISTER_WRITERS[key];
    if (!writer || readOnly) return;
    const rawValue = overrideValue ?? drafts[key] ?? '';
    const kind = REGISTER_EDIT_KINDS[key] ?? 'text';
    const nextValue = normalizeDraftForCommit(kind, rawValue);
    const prevValue = registers[key] ?? '';
    if (nextValue === prevValue) {
      if (rawValue !== nextValue) {
        setDrafts((current) => ({ ...current, [key]: nextValue }));
      }
      return;
    }

    setErrorMessage(null);
    try {
      await writer(nextValue);
      await loadState();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to write ${key}`;
      setErrorMessage(message);
      setDrafts((current) => ({ ...current, [key]: prevValue }));
    }
  }, [drafts, loadState, readOnly, registers]);

  if (!initialized) {
    return <p>Initialize the simulator to view state registers.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', minHeight: 0 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: '1rem' }}>
        {errorMessage && <p style={{ color: 'var(--cds-support-error)' }}>{errorMessage}</p>}
        <div style={{ display: 'grid', rowGap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
            {SECOND_ROW_KEYS.map((key) => renderRegisterControl(key))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
            {FIRST_ROW_KEYS.map((key) => renderRegisterControl(key))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '0.75rem' }}>
            {remainingKeys.map((key) => renderRegisterControl(key))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
        {isRunning ? (
          <Button
            onClick={() => void onProgramStopClick()}
            size="sm"
            kind="danger"
            hasIconOnly
            renderIcon={Stop}
            iconDescription="Stop"
            tooltipPosition="left"
            aria-label="Stop"
          />
        ) : (
          <Button
            onClick={() => void onProgramGoClick()}
            size="sm"
            kind="primary"
            className="emulator-console__go"
            hasIconOnly
            renderIcon={Play}
            iconDescription="Go"
            tooltipPosition="left"
            aria-label="Go"
          />
        )}
        <Button
          onClick={() => void onProgramStepClick()}
          disabled={isRunning}
          size="sm"
          kind="primary"
          hasIconOnly
          renderIcon={ViewNext}
          iconDescription="Step"
          tooltipPosition="left"
          aria-label="Step"
        />
      </div>
    </div>
  );
}
