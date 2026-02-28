export type SimulatorConfigUnit = {
  device: string;
  unit: string;
  status: string;
  attachment: string;
  format: string;
  wiring: string;
  echo: boolean | null;
  print: boolean | null;
  writeEnabled: boolean | null;
  lengthFeet: number | null;
};

export type SimulatorConfiguration = {
  cpu: string;
  cpuOptions: string[];
  cpuSettings: {
    storageUnitEnabled: boolean;
    controlUnitEnabled: boolean;
    speedMode: 'REALTIME' | 'FAST';
    tleEnabled: boolean;
    oneDiskArmEnabled: boolean;
    mnemonicMode: 'DEFAULTMNE' | 'SOAPMNE';
  };
  units: SimulatorConfigUnit[];
};

type ParsedShowConfig = {
  cpu: string;
  units: SimulatorConfigUnit[];
};

function parseAttachment(status: string): string {
  if (/not attached/i.test(status)) return '';
  const attachedMatch = status.match(/attached(?:\s+to)?\s+(".*?"|[^,]+)/i);
  if (!attachedMatch) return '';
  const rawAttachment = attachedMatch[1].replace(/^"|"$/g, '').trim();
  if (!rawAttachment.startsWith('-')) return rawAttachment;

  const tokens = rawAttachment.split(/\s+/);
  let index = 0;
  while (index < tokens.length && tokens[index].startsWith('-')) {
    const option = tokens[index].toUpperCase();
    index += 1;
    if ((option === '-F' || option === '-B') && index < tokens.length) {
      index += 1;
    }
  }

  return tokens.slice(index).join(' ').trim();
}

function parseFormat(status: string): string {
  const match = status.match(/(?:^|,\s*)([A-Z0-9]+)\s+format\b/i);
  return (match?.[1] ?? '').toUpperCase();
}

function parseWiring(status: string): string {
  const match = status.match(/(?:^|,\s*)([A-Z0-9]+)\s+wiring\b/i);
  return (match?.[1] ?? '').toUpperCase();
}

export function parseShowConfig(text: string): ParsedShowConfig {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let cpu = '';
  let currentDevice = '';
  const units: SimulatorConfigUnit[] = [];
  let lastUnit: SimulatorConfigUnit | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;

    if (/^CPU\b/i.test(line.trim())) {
      const next = lines[index + 1] ?? '';
      const cpuMatch = next.match(/^\s+(\S+)/);
      if (cpuMatch) {
        cpu = cpuMatch[1].trim().toUpperCase();
      }
      continue;
    }

    const deviceHeader = line.match(/^([A-Z0-9]+)\s+\d+\s+units\b/i);
    if (deviceHeader) {
      currentDevice = deviceHeader[1].toUpperCase();
      continue;
    }

    const unitLine = line.match(/^\s+([A-Z0-9]+\d+)\s+(.+)$/);
    if (unitLine && currentDevice) {
      const unit = unitLine[1].toUpperCase();
      const status = unitLine[2].trim();
      const parsedUnit: SimulatorConfigUnit = {
        device: currentDevice,
        unit,
        status,
        attachment: parseAttachment(status),
        format: parseFormat(status),
        wiring: parseWiring(status),
        echo: null,
        print: null,
        writeEnabled: /\bwrite enabled\b/i.test(status),
        lengthFeet: null,
      };
      units.push(parsedUnit);
      lastUnit = parsedUnit;
      continue;
    }

    const continuation = line.match(/^\s+(.+)$/);
    if (!continuation || !lastUnit) continue;
    const detail = continuation[1].trim();
    if (/\bECHO\b/i.test(detail)) {
      lastUnit.echo = !/\bNO\s+ECHO\b/i.test(detail);
    }
    if (/\bPRINT\b/i.test(detail)) {
      lastUnit.print = !/\bNO\s+PRINT\b/i.test(detail);
    }
    if (lastUnit.echo !== null || lastUnit.print !== null) {
      continue;
    }
    const lengthMatch = detail.match(/^length\s+(\d+)\s+foot\b/i);
    if (lengthMatch) {
      lastUnit.lengthFeet = Number.parseInt(lengthMatch[1], 10);
    }
  }

  return { cpu, units };
}

export function parseCpuOptions(text: string): string[] {
  const matches = text.match(/\b\d+K\b/gi) ?? [];
  return Array.from(new Set(matches.map((value) => value.toUpperCase())));
}

export function parseCpuSettings(text: string): SimulatorConfiguration['cpuSettings'] {
  const upper = text.toUpperCase();
  return {
    storageUnitEnabled: /\bSTORAGE UNIT\b/.test(upper),
    controlUnitEnabled: /\bCONTROL UNIT\b/.test(upper),
    speedMode: /\bFAST EXECUTION\b/.test(upper) ? 'FAST' : 'REALTIME',
    tleEnabled: /\bTABLE LOOKUP ON EQUAL\b/.test(upper),
    oneDiskArmEnabled: /\bENABLE 1 ARM RAMAC\b/.test(upper),
    mnemonicMode: /\bUSING SOAP MNEMONICS\b/.test(upper) ? 'SOAPMNE' : 'DEFAULTMNE',
  };
}
