'use client';

import { useCallback, useEffect, useState } from 'react';
import { Checkbox, RadioButton, RadioButtonGroup } from '@carbon/react';
import * as i650Service from '@/lib/i650';
import SimulatorStateTab from './SimulatorStateTab';

type SimulatorDebugTabProps = {
  active: boolean;
};

export default function SimulatorDebugTab({ active }: SimulatorDebugTabProps) {
  const optionRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    columnGap: '1.5rem',
    rowGap: '1rem',
    flexWrap: 'wrap',
  };
  const optionCellStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
  };

  const [mnemonicMode, setMnemonicMode] = useState<'DEFAULTMNE' | 'SOAPMNE'>('DEFAULTMNE');
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugFlags, setDebugFlags] = useState<Record<'CMD' | 'DATA' | 'DETAIL' | 'EXP', boolean>>({
    CMD: false,
    DATA: false,
    DETAIL: false,
    EXP: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDebugStatus = useCallback(async () => {
    setErrorMessage(null);
    try {
      const [status, configuration] = await Promise.all([
        i650Service.getSimulatorCpuDebugStatus(),
        i650Service.getSimulatorConfiguration(),
      ]);
      setDebugEnabled(status.enabled);
      setDebugFlags(status.flags);
      setMnemonicMode(configuration.cpuSettings.mnemonicMode);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read debug status';
      setErrorMessage(message);
    }
  }, []);

  const applyCpuOption = useCallback(async (option: string): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await i650Service.setSimulatorCpuOption(option);
      await loadDebugStatus();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to apply CPU option: ${option}`;
      setErrorMessage(message);
      return false;
    }
  }, [loadDebugStatus]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      void loadDebugStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [active, loadDebugStatus]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {errorMessage && <p style={{ color: 'var(--cds-support-error)' }}>{errorMessage}</p>}
      <section style={{ display: 'grid', gap: 0, marginBottom: '2rem' }}>
        <div style={optionRowStyle}>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-debug-enabled"
              labelText="Enabled"
              checked={debugEnabled}
              onChange={() => {
                const next = !debugEnabled;
                const previous = debugEnabled;
                const previousFlags = debugFlags;
                setDebugEnabled(next);
                void (async () => {
                  const ok = await applyCpuOption(next ? 'DEBUG' : 'NODEBUG');
                  if (!ok) {
                    setDebugEnabled(previous);
                    return;
                  }
                  if (next) {
                    setDebugFlags({ CMD: true, DATA: true, DETAIL: true, EXP: true });
                  } else {
                    setDebugFlags({ CMD: false, DATA: false, DETAIL: false, EXP: false });
                  }
                })().catch(() => {
                  setDebugEnabled(previous);
                  setDebugFlags(previousFlags);
                });
              }}
            />
          </div>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-debug-cmd"
              labelText="Commands"
              checked={debugFlags.CMD}
              disabled={!debugEnabled}
              onChange={() => {
                const next = !debugFlags.CMD;
                const previous = debugFlags.CMD;
                setDebugFlags((current) => ({ ...current, CMD: next }));
                void (async () => {
                  const ok = await applyCpuOption(next ? 'DEBUG=CMD' : 'NODEBUG=CMD');
                  if (!ok) {
                    setDebugFlags((current) => ({ ...current, CMD: previous }));
                  }
                })();
              }}
            />
          </div>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-debug-data"
              labelText="Data values"
              checked={debugFlags.DATA}
              disabled={!debugEnabled}
              onChange={() => {
                const next = !debugFlags.DATA;
                const previous = debugFlags.DATA;
                setDebugFlags((current) => ({ ...current, DATA: next }));
                void (async () => {
                  const ok = await applyCpuOption(next ? 'DEBUG=DATA' : 'NODEBUG=DATA');
                  if (!ok) {
                    setDebugFlags((current) => ({ ...current, DATA: previous }));
                  }
                })();
              }}
            />
          </div>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-debug-detail"
              labelText="Detailed trace"
              checked={debugFlags.DETAIL}
              disabled={!debugEnabled}
              onChange={() => {
                const next = !debugFlags.DETAIL;
                const previous = debugFlags.DETAIL;
                setDebugFlags((current) => ({ ...current, DETAIL: next }));
                void (async () => {
                  const ok = await applyCpuOption(next ? 'DEBUG=DETAIL' : 'NODEBUG=DETAIL');
                  if (!ok) {
                    setDebugFlags((current) => ({ ...current, DETAIL: previous }));
                  }
                })();
              }}
            />
          </div>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-debug-exp"
              labelText="Errors and exceptions"
              checked={debugFlags.EXP}
              disabled={!debugEnabled}
              onChange={() => {
                const next = !debugFlags.EXP;
                const previous = debugFlags.EXP;
                setDebugFlags((current) => ({ ...current, EXP: next }));
                void (async () => {
                  const ok = await applyCpuOption(next ? 'DEBUG=EXP' : 'NODEBUG=EXP');
                  if (!ok) {
                    setDebugFlags((current) => ({ ...current, EXP: previous }));
                  }
                })();
              }}
            />
          </div>
          <div style={{ ...optionCellStyle, marginLeft: '4rem' }}>
            <RadioButtonGroup
              legendText="Mnemonics"
              name="sim-debug-mnemonics"
              valueSelected={mnemonicMode}
              orientation="horizontal"
              onChange={(selection) => {
                if (selection !== 'DEFAULTMNE' && selection !== 'SOAPMNE') return;
                const next = selection;
                const previous = mnemonicMode;
                setMnemonicMode(next);
                void (async () => {
                  const ok = await applyCpuOption(next);
                  if (!ok) {
                    setMnemonicMode(previous);
                  }
                })();
              }}
            >
              <RadioButton id="sim-debug-mnemonics-default" value="DEFAULTMNE" labelText="Default" />
              <RadioButton id="sim-debug-mnemonics-soap" value="SOAPMNE" labelText="SOAP" />
            </RadioButtonGroup>
          </div>
        </div>
      </section>
      <section style={{ display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>State</h3>
        <SimulatorStateTab active={active} />
      </section>
    </div>
  );
}
