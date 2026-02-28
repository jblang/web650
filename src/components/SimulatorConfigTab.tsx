'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Button, Checkbox, RadioButton, RadioButtonGroup, Select, SelectItem, TextInput } from '@carbon/react';
import { TreeViewAlt } from '@carbon/icons-react';
import * as i650Service from '@/lib/i650';
import FilesystemBrowser from './FilesystemBrowser';

type UnitConfig = i650Service.I650SimulatorConfigUnit;

const DEVICE_FORMAT_OPTIONS: Record<string, string[]> = {
  CDR: ['AUTO', 'BIN', 'TEXT', 'BCD', 'CBN', 'EBCDIC'],
  CDP: ['AUTO', 'BIN', 'TEXT', 'BCD', 'CBN', 'EBCDIC'],
  MT: ['SIMH', 'E11', 'TPC', 'P7B'],
};

const DEVICE_WIRING_OPTIONS: Record<string, string[]> = {
  CDR: ['8WORD', 'RA', 'FDS', 'SOAP', 'SOAPA', 'SUPERSOAP', 'IS', 'IT', 'FORTRANSIT'],
  CDP: ['8WORD', 'RA', 'FDS', 'SOAP', 'SOAPA', 'SUPERSOAP', 'IS', 'IT', 'FORTRANSIT'],
};

function attachmentFilters(device: string): string[] {
  if (device === 'CDR' || device === 'CDP') return ['.dck', '.txt', '.crd'];
  if (device === 'MT') return ['.tap'];
  if (device === 'DSK') return ['.dsk'];
  return [];
}

function getDeviceLabel(device: string): string {
  if (device === 'CDR') return 'Card Reader';
  if (device === 'CDP') return 'Card Punch';
  if (device === 'MT') return 'Magnetic Tape';
  if (device === 'DSK') return 'Disk';
  return device;
}

type SimulatorConfigTabProps = {
  active: boolean;
};

export default function SimulatorConfigTab({ active }: SimulatorConfigTabProps) {
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
  const [cpuOptions] = useState<string[]>(['1K', '2K', '4K']);
  const [cpu, setCpu] = useState('1K');
  const [appliedCpu, setAppliedCpu] = useState('1K');
  const [units, setUnits] = useState<UnitConfig[]>([]);
  const [attachments, setAttachments] = useState<Record<string, string>>({});
  const [appliedAttachments, setAppliedAttachments] = useState<Record<string, string>>({});
  const [formats, setFormats] = useState<Record<string, string>>({});
  const [appliedFormats, setAppliedFormats] = useState<Record<string, string>>({});
  const [wirings, setWirings] = useState<Record<string, string>>({});
  const [appliedWirings, setAppliedWirings] = useState<Record<string, string>>({});
  const [echoes, setEchoes] = useState<Record<string, boolean>>({});
  const [appliedEchoes, setAppliedEchoes] = useState<Record<string, boolean>>({});
  const [prints, setPrints] = useState<Record<string, boolean>>({});
  const [appliedPrints, setAppliedPrints] = useState<Record<string, boolean>>({});
  const [writeEnabled, setWriteEnabled] = useState<Record<string, boolean>>({});
  const [appliedWriteEnabled, setAppliedWriteEnabled] = useState<Record<string, boolean>>({});
  const [lengths, setLengths] = useState<Record<string, string>>({});
  const [appliedLengths, setAppliedLengths] = useState<Record<string, string>>({});
  const [browserTarget, setBrowserTarget] = useState<UnitConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storageUnitEnabled, setStorageUnitEnabled] = useState(true);
  const [controlUnitEnabled, setControlUnitEnabled] = useState(true);
  const [speedMode, setSpeedMode] = useState<'REALTIME' | 'FAST'>('FAST');
  const [tleEnabled, setTleEnabled] = useState(false);
  const [oneDiskArmEnabled, setOneDiskArmEnabled] = useState(false);

  const loadConfig = useCallback(async () => {
    setErrorMessage(null);
    try {
      const configuration = await i650Service.getSimulatorConfiguration();
      setCpu(configuration.cpu);
      setAppliedCpu(configuration.cpu);
      setStorageUnitEnabled(configuration.cpuSettings.storageUnitEnabled);
      setControlUnitEnabled(configuration.cpuSettings.controlUnitEnabled);
      setSpeedMode(configuration.cpuSettings.speedMode);
      setTleEnabled(configuration.cpuSettings.tleEnabled);
      setOneDiskArmEnabled(configuration.cpuSettings.oneDiskArmEnabled);
      setUnits(configuration.units);
      const nextAttachments = configuration.units.reduce<Record<string, string>>((acc, unit) => {
        acc[unit.unit] = unit.attachment;
        return acc;
      }, {});
      const nextFormats = configuration.units.reduce<Record<string, string>>((acc, unit) => {
        acc[unit.unit] = unit.format;
        return acc;
      }, {});
      const nextWirings = configuration.units.reduce<Record<string, string>>((acc, unit) => {
        acc[unit.unit] = unit.wiring;
        return acc;
      }, {});
      const nextEchoes = configuration.units.reduce<Record<string, boolean>>((acc, unit) => {
        acc[unit.unit] = unit.echo ?? false;
        return acc;
      }, {});
      const nextPrints = configuration.units.reduce<Record<string, boolean>>((acc, unit) => {
        acc[unit.unit] = unit.print ?? false;
        return acc;
      }, {});
      const nextWriteEnabled = configuration.units.reduce<Record<string, boolean>>((acc, unit) => {
        acc[unit.unit] = unit.writeEnabled ?? true;
        return acc;
      }, {});
      const nextLengths = configuration.units.reduce<Record<string, string>>((acc, unit) => {
        acc[unit.unit] = unit.lengthFeet === null ? '' : String(unit.lengthFeet);
        return acc;
      }, {});
      setAttachments(nextAttachments);
      setAppliedAttachments(nextAttachments);
      setFormats(nextFormats);
      setAppliedFormats(nextFormats);
      setWirings(nextWirings);
      setAppliedWirings(nextWirings);
      setEchoes(nextEchoes);
      setAppliedEchoes(nextEchoes);
      setPrints(nextPrints);
      setAppliedPrints(nextPrints);
      setWriteEnabled(nextWriteEnabled);
      setAppliedWriteEnabled(nextWriteEnabled);
      setLengths(nextLengths);
      setAppliedLengths(nextLengths);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read simulator configuration';
      setErrorMessage(message);
    }
  }, []);

  const applyCpu = useCallback(async (nextCpu: string) => {
    const normalized = nextCpu.trim().toUpperCase();
    if (!normalized) return;

    setCpu(normalized);
    if (normalized === appliedCpu) return;

    setErrorMessage(null);
    try {
      await i650Service.setSimulatorCpuType(normalized);
      setAppliedCpu(normalized);
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update CPU type';
      setErrorMessage(message);
      setCpu(appliedCpu);
    }
  }, [appliedCpu, loadConfig]);

  const applyCpuOption = useCallback(async (option: string): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await i650Service.setSimulatorCpuOption(option);
      await loadConfig();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to apply CPU option: ${option}`;
      setErrorMessage(message);
      return false;
    }
  }, [loadConfig]);

  const commitAttachment = useCallback(async (unit: string, overrideValue?: string) => {
    const rawValue = overrideValue ?? attachments[unit] ?? '';
    const normalizedValue = rawValue.trim();
    const previousValue = appliedAttachments[unit] ?? '';

    if (normalizedValue === previousValue) {
      if (rawValue !== normalizedValue) {
        setAttachments((current) => ({ ...current, [unit]: normalizedValue }));
      }
      return;
    }

    setErrorMessage(null);
    setAttachments((current) => ({ ...current, [unit]: normalizedValue }));
    try {
      await i650Service.setSimulatorUnitAttachment(unit, normalizedValue);
      setAppliedAttachments((current) => ({ ...current, [unit]: normalizedValue }));
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${unit} attachment`;
      setErrorMessage(message);
      setAttachments((current) => ({ ...current, [unit]: previousValue }));
    }
  }, [appliedAttachments, attachments, loadConfig]);

  const commitFormat = useCallback(async (unit: string, overrideValue?: string) => {
    const rawValue = overrideValue ?? formats[unit] ?? '';
    const normalizedValue = rawValue.trim().toUpperCase();
    const previousValue = appliedFormats[unit] ?? '';

    if (normalizedValue === previousValue) {
      if (rawValue !== normalizedValue) {
        setFormats((current) => ({ ...current, [unit]: normalizedValue }));
      }
      return;
    }

    setErrorMessage(null);
    setFormats((current) => ({ ...current, [unit]: normalizedValue }));
    try {
      await i650Service.setSimulatorUnitFormat(unit, normalizedValue);
      setAppliedFormats((current) => ({ ...current, [unit]: normalizedValue }));
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${unit} format`;
      setErrorMessage(message);
      setFormats((current) => ({ ...current, [unit]: previousValue }));
    }
  }, [appliedFormats, formats, loadConfig]);

  const commitWiring = useCallback(async (unit: string, overrideValue?: string) => {
    const rawValue = overrideValue ?? wirings[unit] ?? '';
    const normalizedValue = rawValue.trim().toUpperCase();
    const previousValue = appliedWirings[unit] ?? '';

    if (normalizedValue === previousValue) {
      if (rawValue !== normalizedValue) {
        setWirings((current) => ({ ...current, [unit]: normalizedValue }));
      }
      return;
    }

    setErrorMessage(null);
    setWirings((current) => ({ ...current, [unit]: normalizedValue }));
    try {
      await i650Service.setSimulatorUnitWiring(unit, normalizedValue);
      setAppliedWirings((current) => ({ ...current, [unit]: normalizedValue }));
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${unit} wiring`;
      setErrorMessage(message);
      setWirings((current) => ({ ...current, [unit]: previousValue }));
    }
  }, [appliedWirings, loadConfig, wirings]);

  const commitEcho = useCallback(async (unit: string, nextValue: boolean) => {
    const previousValue = appliedEchoes[unit] ?? false;
    if (nextValue === previousValue) return;

    setErrorMessage(null);
    setEchoes((current) => ({ ...current, [unit]: nextValue }));
    try {
      await i650Service.setSimulatorUnitOption(unit, 'ECHO', nextValue ? '1' : '0');
      setAppliedEchoes((current) => ({ ...current, [unit]: nextValue }));
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${unit} echo`;
      setErrorMessage(message);
      setEchoes((current) => ({ ...current, [unit]: previousValue }));
    }
  }, [appliedEchoes, loadConfig]);

  const commitPrint = useCallback(async (unit: string, nextValue: boolean) => {
    const previousValue = appliedPrints[unit] ?? false;
    if (nextValue === previousValue) return;

    setErrorMessage(null);
    setPrints((current) => ({ ...current, [unit]: nextValue }));
    try {
      await i650Service.setSimulatorUnitOption(unit, 'PRINT', nextValue ? '1' : '0');
      setAppliedPrints((current) => ({ ...current, [unit]: nextValue }));
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${unit} print`;
      setErrorMessage(message);
      setPrints((current) => ({ ...current, [unit]: previousValue }));
    }
  }, [appliedPrints, loadConfig]);

  const commitWriteEnabled = useCallback(async (unit: string, nextValue: boolean) => {
    const previousValue = appliedWriteEnabled[unit] ?? true;
    if (nextValue === previousValue) return;

    setErrorMessage(null);
    setWriteEnabled((current) => ({ ...current, [unit]: nextValue }));
    try {
      await i650Service.setSimulatorUnitOption(unit, nextValue ? 'WRITEENABLED' : 'LOCKED');
      setAppliedWriteEnabled((current) => ({ ...current, [unit]: nextValue }));
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${unit} write mode`;
      setErrorMessage(message);
      setWriteEnabled((current) => ({ ...current, [unit]: previousValue }));
    }
  }, [appliedWriteEnabled, loadConfig]);

  const commitLength = useCallback(async (unit: string, overrideValue?: string) => {
    const rawValue = overrideValue ?? lengths[unit] ?? '';
    const normalizedValue = rawValue.trim();
    const previousValue = appliedLengths[unit] ?? '';

    if (normalizedValue === previousValue) {
      if (rawValue !== normalizedValue) {
        setLengths((current) => ({ ...current, [unit]: normalizedValue }));
      }
      return;
    }

    if (!/^\d+$/.test(normalizedValue)) {
      setErrorMessage(`Invalid tape length for ${unit}`);
      setLengths((current) => ({ ...current, [unit]: previousValue }));
      return;
    }
    const numericValue = Number.parseInt(normalizedValue, 10);
    if (numericValue < 50 || numericValue > 10000) {
      setErrorMessage(`Tape length for ${unit} must be between 50 and 10000`);
      setLengths((current) => ({ ...current, [unit]: previousValue }));
      return;
    }

    setErrorMessage(null);
    setLengths((current) => ({ ...current, [unit]: String(numericValue) }));
    try {
      await i650Service.setSimulatorUnitOption(unit, 'LENGTH', String(numericValue));
      setAppliedLengths((current) => ({ ...current, [unit]: String(numericValue) }));
      await loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${unit} length`;
      setErrorMessage(message);
      setLengths((current) => ({ ...current, [unit]: previousValue }));
    }
  }, [appliedLengths, lengths, loadConfig]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      void loadConfig();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [active, loadConfig]);

  useEffect(() => {
    if (!active) return;
    const onFocus = () => {
      void loadConfig();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadConfig();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active, loadConfig]);

  const groupedUnits = useMemo(() => {
    return units.reduce<Record<string, UnitConfig[]>>((acc, unit) => {
      const key = unit.device;
      acc[key] = [...(acc[key] ?? []), unit];
      return acc;
    }, {});
  }, [units]);

  const getOptions = useCallback((base: string[], current: string): string[] => {
    const normalizedCurrent = current.trim().toUpperCase();
    if (!normalizedCurrent) return base;
    if (base.includes(normalizedCurrent)) return base;
    return [...base, normalizedCurrent];
  }, []);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {errorMessage && <p style={{ color: 'var(--cds-support-error)' }}>{errorMessage}</p>}
      <section style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>System</h3>
        <div style={optionRowStyle}>
          <div style={{ ...optionCellStyle, marginRight: '4rem' }}>
            <RadioButtonGroup
              legendText="Memory"
              name="sim-config-cpu-memory"
              valueSelected={cpu}
              orientation="horizontal"
              onChange={(selection) => {
                if (typeof selection !== 'string') return;
                const nextValue = selection;
                void applyCpu(nextValue);
              }}
            >
              {cpuOptions.map((option) => (
                <RadioButton key={option} id={`sim-config-cpu-memory-${option}`} value={option} labelText={option} />
              ))}
            </RadioButtonGroup>
          </div>
          <div style={{ ...optionCellStyle, marginRight: '4rem' }}>
            <RadioButtonGroup
              legendText="Speed"
              name="sim-config-cpu-speed"
              valueSelected={speedMode}
              orientation="horizontal"
              onChange={(selection) => {
                if (selection !== 'REALTIME' && selection !== 'FAST') return;
                const next = selection;
                const previous = speedMode;
                setSpeedMode(next);
                void (async () => {
                  const ok = await applyCpuOption(next);
                  if (!ok) {
                    setSpeedMode(previous);
                  }
                })();
              }}
            >
              <RadioButton id="sim-config-cpu-speed-realtime" value="REALTIME" labelText="Real-time" />
              <RadioButton id="sim-config-cpu-speed-fast" value="FAST" labelText="Fast" />
            </RadioButtonGroup>
          </div>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-config-storageunit"
              labelText="Storage unit"
              checked={storageUnitEnabled}
              onChange={() => {
                const next = !storageUnitEnabled;
                setStorageUnitEnabled(next);
                void (async () => {
                  const ok = await applyCpuOption(next ? 'STORAGEUNIT' : 'NOSTORAGEUNIT');
                  if (!ok) setStorageUnitEnabled(!next);
                })();
              }}
            />
          </div>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-config-cntrlunit"
              labelText="Control unit"
              checked={controlUnitEnabled}
              onChange={() => {
                const next = !controlUnitEnabled;
                setControlUnitEnabled(next);
                void (async () => {
                  const ok = await applyCpuOption(next ? 'CNTRLUNIT' : 'NOCNTRLUNIT');
                  if (!ok) setControlUnitEnabled(!next);
                })();
              }}
            />
          </div>
          <div style={optionCellStyle}>
            <Checkbox
              id="sim-config-tle"
              labelText="Table lookup on equal"
              checked={tleEnabled}
              onChange={() => {
                const next = !tleEnabled;
                setTleEnabled(next);
                void (async () => {
                  const ok = await applyCpuOption(next ? 'TLE' : 'NOTLE');
                  if (!ok) setTleEnabled(!next);
                })();
              }}
            />
          </div>
        </div>
      </section>

      {Object.entries(groupedUnits).map(([device, deviceUnits]) => (
        <section key={device} style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0 }}>{getDeviceLabel(device)}</h3>
          {device === 'DSK' && (
            <div style={{ ...optionCellStyle, width: 'fit-content' }}>
              <Checkbox
                id="sim-config-1dskarm"
                labelText="Single-arm disk"
                checked={oneDiskArmEnabled}
                onChange={() => {
                  const next = !oneDiskArmEnabled;
                  setOneDiskArmEnabled(next);
                  void (async () => {
                    const ok = await applyCpuOption(next ? '1DSKARM' : 'NO1DSKARM');
                    if (!ok) setOneDiskArmEnabled(!next);
                  })();
                }}
              />
            </div>
          )}
          {deviceUnits.map((unit) => (
            <div
              key={unit.unit}
              style={{
                display: 'grid',
                gridTemplateColumns: [
                  '7rem',
                  device !== 'DSK' ? '10rem' : null,
                  device !== 'DSK' && device !== 'MT' ? '10rem' : null,
                  device === 'CDP' ? 'max-content' : null,
                  device === 'CDP' ? 'max-content' : null,
                  device === 'MT' ? 'max-content' : null,
                  device === 'MT' ? '8rem' : null,
                  'minmax(0, 1fr)',
                  'max-content',
                ].filter(Boolean).join(' '),
                gap: '2rem',
                alignItems: 'end',
              }}
            >
              <span style={{ alignSelf: 'center' }}>{unit.unit}</span>
              {device !== 'DSK' && (
                <Select
                  id={`sim-config-format-${unit.unit}`}
                  labelText="Format"
                  value={formats[unit.unit] ?? ''}
                  disabled={device !== 'CDR' && device !== 'CDP' && device !== 'MT'}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setFormats((current) => ({ ...current, [unit.unit]: value }));
                    void commitFormat(unit.unit, value);
                  }}
                >
                  {(getOptions(DEVICE_FORMAT_OPTIONS[device] ?? [], formats[unit.unit] ?? '').length === 0)
                    ? <SelectItem value="" text="N/A" />
                    : getOptions(DEVICE_FORMAT_OPTIONS[device] ?? [], formats[unit.unit] ?? '').map((option) => (
                      <SelectItem key={`${unit.unit}-format-${option}`} value={option} text={option} />
                    ))}
                </Select>
              )}
              {device !== 'DSK' && device !== 'MT' && (
                <Select
                  id={`sim-config-wiring-${unit.unit}`}
                  labelText="Wiring"
                  value={wirings[unit.unit] ?? ''}
                  disabled={device !== 'CDR' && device !== 'CDP'}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setWirings((current) => ({ ...current, [unit.unit]: value }));
                    void commitWiring(unit.unit, value);
                  }}
                >
                  {(getOptions(DEVICE_WIRING_OPTIONS[device] ?? [], wirings[unit.unit] ?? '').length === 0)
                    ? <SelectItem value="" text="N/A" />
                    : getOptions(DEVICE_WIRING_OPTIONS[device] ?? [], wirings[unit.unit] ?? '').map((option) => (
                      <SelectItem key={`${unit.unit}-wiring-${option}`} value={option} text={option} />
                    ))}
                </Select>
              )}
              {device === 'CDP' && (
                <Checkbox
                  id={`sim-config-echo-${unit.unit}`}
                  labelText="Echo"
                  checked={echoes[unit.unit] ?? false}
                  disabled={unit.unit === 'CDP0'}
                  onChange={() => {
                    const next = !(echoes[unit.unit] ?? false);
                    setEchoes((current) => ({ ...current, [unit.unit]: next }));
                    void commitEcho(unit.unit, next);
                  }}
                />
              )}
              {device === 'CDP' && (
                <Checkbox
                  id={`sim-config-print-${unit.unit}`}
                  labelText="Print"
                  checked={prints[unit.unit] ?? false}
                  disabled={unit.unit === 'CDP0'}
                  onChange={() => {
                    const next = !(prints[unit.unit] ?? false);
                    setPrints((current) => ({ ...current, [unit.unit]: next }));
                    void commitPrint(unit.unit, next);
                  }}
                />
              )}
              {device === 'MT' && (
                <TextInput
                  id={`sim-config-length-${unit.unit}`}
                  labelText="Length"
                  value={lengths[unit.unit] ?? ''}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setLengths((current) => ({ ...current, [unit.unit]: value }));
                  }}
                  onBlur={() => {
                    void commitLength(unit.unit);
                  }}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void commitLength(unit.unit);
                    }
                  }}
                />
              )}
              {device === 'MT' && (
                <Checkbox
                  id={`sim-config-readonly-${unit.unit}`}
                  labelText="Read only"
                  checked={!(writeEnabled[unit.unit] ?? true)}
                  onChange={() => {
                    const currentReadOnly = !(writeEnabled[unit.unit] ?? true);
                    const nextReadOnly = !currentReadOnly;
                    const nextWriteEnabled = !nextReadOnly;
                    setWriteEnabled((current) => ({ ...current, [unit.unit]: nextWriteEnabled }));
                    void commitWriteEnabled(unit.unit, nextWriteEnabled);
                  }}
                />
              )}
              <TextInput
                id={`sim-config-attachment-${unit.unit}`}
                labelText="Filename"
                value={attachments[unit.unit] ?? ''}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setAttachments((current) => ({ ...current, [unit.unit]: value }));
                }}
                onBlur={() => {
                  void commitAttachment(unit.unit);
                }}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void commitAttachment(unit.unit);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                kind="primary"
                style={{ width: '2.5rem', minWidth: '2.5rem', minHeight: '2.5rem', padding: 0 }}
                hasIconOnly
                renderIcon={TreeViewAlt}
                iconDescription="Browse"
                tooltipPosition="left"
                aria-label="Browse"
                onClick={() => setBrowserTarget(unit)}
              />
            </div>
          ))}
        </section>
      ))}

      <FilesystemBrowser
        open={browserTarget !== null}
        onRequestClose={() => setBrowserTarget(null)}
        onChoose={async (path) => {
          if (!browserTarget) return;
          const targetUnit = browserTarget.unit;
          setBrowserTarget(null);
          setAttachments((current) => ({ ...current, [targetUnit]: path }));
          await commitAttachment(targetUnit, path);
        }}
        modalHeading={browserTarget ? `Choose attachment for ${browserTarget.unit}` : 'Choose attachment'}
        rootPaths={['/sw', '/tests', '/tmp']}
        acceptExtensions={attachmentFilters(browserTarget?.device ?? '')}
      />
    </div>
  );
}
