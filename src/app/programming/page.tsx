'use client';

import { useState } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  ComboBox,
  TextInput,
  Button,
  Checkbox,
} from '@carbon/react';
import { TrashCan, Draggable } from '@carbon/icons-react';
import {
  I650_DEFAULT_MNEMONICS_BY_OPCODE,
  I650_SOAP_MNEMONICS_BY_OPCODE,
  ZERO_ADDRESS,
} from '@/lib/simh/i650/constants';
import { normalizeAddress, normalizeWord } from '@/lib/simh/i650/format';
import { depositMemory } from '@/lib/simh/i650/service';

type OperationItem = {
  opcode: number;
  label: string;
};

const formatOpcodeLabel = (opcode: number, mnemonic: string) =>
  `${String(opcode).padStart(2, '0')} (${mnemonic})`;

const buildOperationsList = (
  mnemonicsByOpcode: Record<number, string>
): OperationItem[] =>
  Object.entries(mnemonicsByOpcode)
    .map(([opcode, mnemonic]) => ({
      opcode: Number(opcode),
      label: formatOpcodeLabel(Number(opcode), mnemonic),
    }))
    .sort((a, b) => a.opcode - b.opcode);

interface ProgramRow {
  id: string;
  instrNo: string;
  location: string;
  isData: boolean;
  dataWord: string;
  opAbbrv: string;
  opCode: string;
  addrData: string;
  addrInstruction: string;
  remarks: string;
}

const headers = [
  { key: 'instrNo', header: 'Instr. No.' },
  { key: 'location', header: 'Location' },
  { key: 'isData', header: 'Data' },
  { key: 'opCode', header: 'Operation' },
  { key: 'addrData', header: 'Data Address' },
  { key: 'addrInstruction', header: 'Next Address' },
  { key: 'remarks', header: 'Remarks' },
];

const createEmptyRow = (id: number): ProgramRow => ({
  id: String(id),
  instrNo: String(id),
  location: '',
  isData: false,
  dataWord: '',
  opAbbrv: '',
  opCode: '',
  addrData: '',
  addrInstruction: '',
  remarks: '',
});

export default function ProgrammingPage() {
  const [rows, setRows] = useState<ProgramRow[]>(() => [createEmptyRow(1)]);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [useSoapMnemonics, setUseSoapMnemonics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mnemonicsByOpcode = useSoapMnemonics
    ? I650_SOAP_MNEMONICS_BY_OPCODE
    : I650_DEFAULT_MNEMONICS_BY_OPCODE;
  const operations = buildOperationsList(mnemonicsByOpcode);

  const isRowEmpty = (row: ProgramRow) => {
    if (row.isData) {
      return !row.location && !row.dataWord && !row.remarks;
    }
    return !row.location && !row.opCode &&
      !row.addrData && !row.addrInstruction && !row.remarks;
  };

  const handleDragStart = (e: React.DragEvent, rowId: string) => {
    setDraggedRowId(rowId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetRowId: string) => {
    e.preventDefault();
    if (!draggedRowId || draggedRowId === targetRowId) return;

    // Don't allow dropping onto the last row or dragging the last row
    const lastRowId = rows[rows.length - 1].id;
    if (targetRowId === lastRowId || draggedRowId === lastRowId) return;

    setRows((prevRows) => {
      const draggedIndex = prevRows.findIndex((r) => r.id === draggedRowId);
      const targetIndex = prevRows.findIndex((r) => r.id === targetRowId);

      const newRows = [...prevRows];
      const [draggedRow] = newRows.splice(draggedIndex, 1);
      newRows.splice(targetIndex, 0, draggedRow);

      return newRows.map((row, index) => ({
        ...row,
        id: String(index + 1),
        instrNo: String(index + 1),
      }));
    });
    setDraggedRowId(null);
  };

  const handleDragEnd = () => {
    setDraggedRowId(null);
  };

  const deleteRow = (rowId: string) => {
    setRows((prevRows) => {
      if (prevRows.length <= 1) return prevRows;
      const filtered = prevRows.filter((row) => row.id !== rowId);
      return filtered.map((row, index) => ({
        ...row,
        id: String(index + 1),
        instrNo: String(index + 1),
      }));
    });
  };

  const updateCell = <K extends keyof ProgramRow>(
    rowId: string,
    key: K,
    value: ProgramRow[K]
  ) => {
    setRows((prevRows) => {
      const lastRow = prevRows[prevRows.length - 1];
      const isEditingLastRow = rowId === lastRow.id;
      const wasLastRowEmpty = isRowEmpty(lastRow);

      const updatedRows = prevRows.map((row) => {
        if (row.id !== rowId) return row;

        if (key === 'isData') {
          const nextIsData = Boolean(value);
          if (nextIsData === row.isData) {
            return { ...row, [key]: value };
          }

          if (nextIsData) {
            if (row.dataWord) {
              return { ...row, isData: true };
            }
            if (row.opCode) {
              const opcode = row.opCode.padStart(2, '0');
              const dataAddress = normalizeAddress(row.addrData || ZERO_ADDRESS);
              const instructionAddress = normalizeAddress(row.addrInstruction || ZERO_ADDRESS);
              const dataWord = `${opcode}${dataAddress}${instructionAddress}+`;
              return { ...row, isData: true, dataWord };
            }
            return { ...row, isData: true };
          }

          if (row.dataWord) {
            try {
              const normalized = normalizeWord(row.dataWord);
              return {
                ...row,
                isData: false,
                opCode: normalized.slice(0, 2),
                addrData: normalized.slice(2, 6),
                addrInstruction: normalized.slice(6, 10),
              };
            } catch {
              return { ...row, isData: false };
            }
          }

          return { ...row, isData: false };
        }

        return { ...row, [key]: value };
      });

      const shouldAppend =
        isEditingLastRow &&
        wasLastRowEmpty &&
        typeof value === 'string' &&
        value.length > 0;

      if (shouldAppend) {
        return [...updatedRows, createEmptyRow(prevRows.length + 1)];
      }

      return updatedRows;
    });
  };

  const handleMnemonicToggle = (checked: boolean) => {
    setUseSoapMnemonics(checked);
  };

  const handleLoadToMemory = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const rowsToLoad = rows.filter(
        (row) =>
          row.location &&
          (row.isData ? row.dataWord : row.opCode) &&
          !isRowEmpty(row)
      );

      for (const row of rowsToLoad) {
        const location = normalizeAddress(row.location);
        if (row.isData) {
          const word = normalizeWord(row.dataWord);
          await depositMemory(location, word);
          continue;
        }
        if (!/^\d{1,2}$/.test(row.opCode)) {
          throw new Error(`Invalid opcode "${row.opCode}" at instruction ${row.instrNo}`);
        }
        const dataAddress = normalizeAddress(row.addrData || ZERO_ADDRESS);
        const instructionAddress = normalizeAddress(row.addrInstruction || ZERO_ADDRESS);
        const opcode = row.opCode.padStart(2, '0');
        const word = `${opcode}${dataAddress}${instructionAddress}+`;
        await depositMemory(location, word);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load programming sheet.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', overflow: 'visible', paddingBottom: '250px' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Checkbox
          id="soap-mnemonics"
          labelText="Use SOAP mnemonics"
          checked={useSoapMnemonics}
          onChange={(e) =>
            handleMnemonicToggle((e.target as HTMLInputElement).checked)
          }
        />
        <Button
          size="sm"
          kind="primary"
          onClick={handleLoadToMemory}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load to Memory'}
        </Button>
      </div>
      {loadError ? (
        <div style={{ marginBottom: '1rem', color: '#da1e28' }}>{loadError}</div>
      ) : null}
      <DataTable rows={rows} headers={headers}>
        {({ rows: tableRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps }) => (
          <div style={{ overflow: 'visible' }}>
          <Table {...getTableProps()} size="sm">
            <TableHead>
              <TableRow>
                <TableHeader style={{ width: '1%' }} />
                <TableHeader style={{ width: '1%' }} />
                {tableHeaders.map((header) => (
                  <TableHeader
                    {...getHeaderProps({ header })}
                    key={header.key}
                    style={header.key !== 'remarks' ? { width: '1%', whiteSpace: 'nowrap' } : undefined}
                  >
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => {
                const sourceRow = rows.find((r) => r.id === row.id);
                if (!sourceRow) return null;
                const isLastRow = row.id === rows[rows.length - 1].id;
                const cellMap = new Map(
                  row.cells.map((cell) => [String(cell.info.header), cell])
                );
                return (
                <TableRow
                  {...getRowProps({ row })}
                  key={row.id}
                  draggable={!isLastRow}
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, row.id)}
                  onDragEnd={handleDragEnd}
                  style={{ cursor: isLastRow ? 'default' : 'grab' }}
                >
                  <TableCell key={`${row.id}-drag`}>
                    <Draggable
                      style={{
                        cursor: isLastRow ? 'default' : 'grab',
                        opacity: isLastRow ? 0.3 : 1,
                      }}
                    />
                  </TableCell>
                  <TableCell key={`${row.id}-delete`}>
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Delete row"
                      onClick={() => deleteRow(row.id)}
                      disabled={isLastRow}
                    />
                  </TableCell>
                  {(() => {
                    const rendered: React.ReactNode[] = [];
                    for (let i = 0; i < tableHeaders.length; i += 1) {
                      const header = tableHeaders[i].key;
                      const cell = cellMap.get(header);
                      const cellValue = typeof cell?.value === 'string' ? cell.value : '';
                      const isInstrNo = header === 'instrNo';
                      const isOpCode = header === 'opCode';
                      const isAddressField = ['location', 'addrData', 'addrInstruction'].includes(header);

                      if (isOpCode && sourceRow.isData) {
                        rendered.push(
                          <TableCell key={`${row.id}-dataWord`} colSpan={3}>
                            <TextInput
                              id={`dataWord-${row.id}`}
                              value={sourceRow.dataWord}
                              onChange={(e) =>
                                updateCell(row.id, 'dataWord', e.target.value)
                              }
                              placeholder="Word (10 digits + sign)"
                              size="sm"
                              labelText=""
                            />
                          </TableCell>
                        );
                        i += 2;
                        continue;
                      }

                      if (header === 'isData') {
                        rendered.push(
                          <TableCell key={`${row.id}-isData`}>
                            <Checkbox
                              id={`isData-${row.id}`}
                              labelText=""
                              checked={sourceRow.isData}
                              onChange={(e) =>
                                updateCell(
                                  row.id,
                                  'isData',
                                  (e.target as HTMLInputElement).checked
                                )
                              }
                            />
                          </TableCell>
                        );
                        continue;
                      }

                      rendered.push(
                        <TableCell key={cell?.id ?? `${row.id}-${header}`}>
                          {isInstrNo ? (
                            cellValue
                          ) : isOpCode ? (
                            <div style={{ width: '9rem' }}>
                              <ComboBox
                                id={`op-${row.id}`}
                                items={operations}
                                itemToString={(item) => (item ? item.label : '')}
                                selectedItem={
                                  sourceRow.opCode
                                    ? operations.find(
                                        (item) => item.opcode === Number(sourceRow.opCode)
                                      ) ?? null
                                    : null
                                }
                                onChange={({ selectedItem }) => {
                                  if (!selectedItem) {
                                    updateCell(row.id, 'opCode', '');
                                    return;
                                  }
                                  const nextOpcode = String(selectedItem.opcode).padStart(2, '0');
                                  updateCell(row.id, 'opCode', nextOpcode);
                                }}
                                placeholder=""
                                size="sm"
                                titleText=""
                              />
                            </div>
                          ) : (
                            <div style={isAddressField ? { width: '4.25rem' } : undefined}>
                              <TextInput
                                id={`${header}-${row.id}`}
                                value={cellValue}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  if (isAddressField) {
                                    value = value.replace(/\D/g, '').slice(0, 4);
                                  }
                                  // Type guard: ensure header is a valid key of ProgramRow
                                  if (header in sourceRow) {
                                    updateCell(row.id, header as keyof ProgramRow, value);
                                  }
                                }}
                                maxLength={isAddressField ? 4 : undefined}
                                size="sm"
                                labelText=""
                              />
                            </div>
                          )}
                        </TableCell>
                      );
                    }
                    return rendered;
                  })()}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </DataTable>
    </div>
  );
}
