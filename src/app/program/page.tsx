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
} from '@carbon/react';
import { TrashCan, Draggable } from '@carbon/icons-react';

const operations = [
  '00 (NOP)', '01 (HLT)', '02 (UFA)', '03 (RTC)', '04 (RTN)', '05 (RTA)',
  '06 (WTN)', '07 (WTA)', '08 (LIB)', '09 (LDI)', '10 (AUP)', '11 (SUP)',
  '14 (DIV)', '15 (ALO)', '16 (SLO)', '17 (AML)', '18 (SML)', '19 (MPY)',
  '20 (STL)', '21 (STU)', '22 (SDA)', '23 (SIA)', '24 (STD)', '25 (NTS)',
  '26 (BIN)', '27 (SET)', '28 (SIB)', '29 (STI)', '30 (SRT)', '31 (SRD)',
  '32 (FAD)', '33 (FSB)', '34 (FDV)', '35 (SLT)', '36 (SCT)', '37 (FAM)',
  '38 (FSM)', '39 (FMP)', '40 (NZA)', '41 (BMA)', '42 (NZB)', '43 (BMB)',
  '44 (NZU)', '45 (NZE)', '46 (BMI)', '47 (BOV)', '48 (NZC)', '49 (BMC)',
  '50 (AXA)', '51 (SXA)', '52 (AXB)', '53 (SXB)', '54 (NEF)', '55 (RWD)',
  '56 (WTM)', '57 (BST)', '58 (AXC)', '59 (SXC)', '60 (RAU)', '61 (RSU)',
  '64 (DVR)', '65 (RAL)', '66 (RSL)', '67 (RAM)', '68 (RSM)', '69 (LDD)',
  '70 (RD1)', '71 (WR1)', '72 (RC1)', '73 (RD2)', '74 (WR2)', '75 (RC2)',
  '76 (RD3)', '77 (WR3)', '78 (RC3)', '79 (RPY)', '80 (RAA)', '81 (RSA)',
  '82 (RAB)', '83 (RSB)', '84 (TLU)', '85 (SDS)', '86 (RDS)', '87 (WDS)',
  '88 (RAC)', '89 (RSC)', '90 (BDO)', '91 (BD1)', '92 (BD2)', '93 (BD3)',
  '94 (BD4)', '95 (BD5)', '96 (BD6)', '97 (BD7)', '98 (BD8)', '99 (BD9)',
];

interface ProgramRow {
  id: string;
  instrNo: string;
  location: string;
  opAbbrv: string;
  opCode: string;
  addrData: string;
  addrInstruction: string;
  remarks: string;
}

const headers = [
  { key: 'instrNo', header: 'Instr. No.' },
  { key: 'location', header: 'Location' },
  { key: 'opCode', header: 'Operation' },
  { key: 'addrData', header: 'Data Address' },
  { key: 'addrInstruction', header: 'Next Address' },
  { key: 'remarks', header: 'Remarks' },
];

const createEmptyRow = (id: number): ProgramRow => ({
  id: String(id),
  instrNo: String(id),
  location: '',
  opAbbrv: '',
  opCode: '',
  addrData: '',
  addrInstruction: '',
  remarks: '',
});

export default function ProgramPage() {
  const [rows, setRows] = useState<ProgramRow[]>(() => [createEmptyRow(1)]);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);

  const isRowEmpty = (row: ProgramRow) =>
    !row.location && !row.opCode &&
    !row.addrData && !row.addrInstruction && !row.remarks;

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

  const updateCell = (rowId: string, key: keyof ProgramRow, value: string) => {
    setRows((prevRows) => {
      const lastRow = prevRows[prevRows.length - 1];
      const isEditingLastRow = rowId === lastRow.id;
      const wasLastRowEmpty = isRowEmpty(lastRow);

      const updatedRows = prevRows.map((row) =>
        row.id === rowId ? { ...row, [key]: value } : row
      );

      if (isEditingLastRow && wasLastRowEmpty && value) {
        return [...updatedRows, createEmptyRow(prevRows.length + 1)];
      }

      return updatedRows;
    });
  };

  return (
    <div style={{ width: '100%', overflow: 'visible', paddingBottom: '250px' }}>
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
                const isLastRow = row.id === rows[rows.length - 1].id;
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
                  {row.cells.map((cell) => {
                    const isInstrNo = cell.info.header === 'instrNo';
                    const isOpCode = cell.info.header === 'opCode';
                    const isAddressField = ['location', 'addrData', 'addrInstruction'].includes(cell.info.header);
                    return (
                      <TableCell key={cell.id}>
                        {isInstrNo ? (
                          cell.value
                        ) : isOpCode ? (
                          <div style={{ width: '9rem' }}>
                            <ComboBox
                              id={`op-${row.id}`}
                              items={operations}
                              selectedItem={cell.value || null}
                              onChange={({ selectedItem }) =>
                                updateCell(row.id, 'opCode', selectedItem || '')
                              }
                              placeholder=""
                              size="sm"
                              titleText=""
                            />
                          </div>
                        ) : (
                          <div style={isAddressField ? { width: '4.25rem' } : undefined}>
                            <TextInput
                              id={`${cell.info.header}-${row.id}`}
                              value={cell.value || ''}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (isAddressField) {
                                  value = value.replace(/\D/g, '').slice(0, 4);
                                }
                                updateCell(row.id, cell.info.header as keyof ProgramRow, value);
                              }}
                              maxLength={isAddressField ? 4 : undefined}
                              size="sm"
                              labelText=""
                            />
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
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
