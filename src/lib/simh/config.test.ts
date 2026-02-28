import { describe, expect, it } from 'vitest';
import { parseCpuOptions, parseCpuSettings, parseShowConfig } from './config';

describe('simh config helpers', () => {
  it('parses show config output into cpu and unit entries', () => {
    const output = `IBM 650 simulator configuration

CPU
        1K
CDR     4 units
  CDR0  not attached, AUTO format, 8WORD wiring
MT      6 units
  MT0   attached to /sw/demo.tap, write enabled, SIMH format
DSK     4 units
  DSK1  0MB, attached to /tmp/ramac.dsk`;

    expect(parseShowConfig(output)).toEqual({
      cpu: '1K',
      units: [
        {
          device: 'CDR',
          unit: 'CDR0',
          status: 'not attached, AUTO format, 8WORD wiring',
          attachment: '',
          format: 'AUTO',
          wiring: '8WORD',
          echo: null,
          print: null,
          writeEnabled: false,
          lengthFeet: null,
        },
        {
          device: 'MT',
          unit: 'MT0',
          status: 'attached to /sw/demo.tap, write enabled, SIMH format',
          attachment: '/sw/demo.tap',
          format: 'SIMH',
          wiring: '',
          echo: null,
          print: null,
          writeEnabled: true,
          lengthFeet: null,
        },
        {
          device: 'DSK',
          unit: 'DSK1',
          status: '0MB, attached to /tmp/ramac.dsk',
          attachment: '/tmp/ramac.dsk',
          format: '',
          wiring: '',
          echo: null,
          print: null,
          writeEnabled: false,
          lengthFeet: null,
        },
      ],
    });
  });

  it('strips attach format switches from parsed attachment paths', () => {
    const output = `IBM 650 simulator configuration

CPU
        1K
CDR     4 units
  CDR0  attached to -F AUTO /sw/run_it.ini, AUTO format, 8WORD wiring`;

    const parsed = parseShowConfig(output);
    expect(parsed.units[0]?.attachment).toBe('/sw/run_it.ini');
  });

  it('extracts unique cpu options from help output', () => {
    expect(parseCpuOptions('CPU type: 1k 2K 4K 2k')).toEqual(['1K', '2K', '4K']);
  });

  it('parses cpu settings from SHOW CPU output', () => {
    const output = `CPU
        4K
        Storage Unit
        Control Unit
        Using SOAP Mnemonics
        Fast Execution
        Table Lookup on Equal
        Enable 1 ARM RAMAC`;
    expect(parseCpuSettings(output)).toEqual({
      storageUnitEnabled: true,
      controlUnitEnabled: true,
      speedMode: 'FAST',
      tleEnabled: true,
      oneDiskArmEnabled: true,
      mnemonicMode: 'SOAPMNE',
    });
  });

  it('parses continuation lines for cdp and tape unit details', () => {
    const output = `IBM 650 simulator configuration

CPU
        1K
CDP     4 units
  CDP1  not attached, AUTO format, 8WORD wiring
        ECHO, PRINT
MT      6 units
  MT0   not attached, write enabled, SIMH format
        length 2400 foot`;

    const parsed = parseShowConfig(output);
    expect(parsed.units.find((unit) => unit.unit === 'CDP1')).toMatchObject({
      echo: true,
      print: true,
      wiring: '8WORD',
      format: 'AUTO',
    });
    expect(parsed.units.find((unit) => unit.unit === 'MT0')).toMatchObject({
      writeEnabled: true,
      lengthFeet: 2400,
      format: 'SIMH',
    });
  });
});
