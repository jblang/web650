'use client';

import React from 'react';

interface PunchedCardProps {
  text: string;
  style?: React.CSSProperties;
}

// IBM 029 keypunch character encoding
// Each character maps to an array of row punches
// Rows are: 12, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
const PUNCH_ENCODING: Record<string, number[]> = {
  // Digits - just the digit row
  '0': [0],
  '1': [1],
  '2': [2],
  '3': [3],
  '4': [4],
  '5': [5],
  '6': [6],
  '7': [7],
  '8': [8],
  '9': [9],
  // Letters A-I: 12 zone + 1-9
  'A': [12, 1],
  'B': [12, 2],
  'C': [12, 3],
  'D': [12, 4],
  'E': [12, 5],
  'F': [12, 6],
  'G': [12, 7],
  'H': [12, 8],
  'I': [12, 9],
  // Letters J-R: 11 zone + 1-9
  'J': [11, 1],
  'K': [11, 2],
  'L': [11, 3],
  'M': [11, 4],
  'N': [11, 5],
  'O': [11, 6],
  'P': [11, 7],
  'Q': [11, 8],
  'R': [11, 9],
  // Letters S-Z: 0 zone + 2-9
  'S': [0, 2],
  'T': [0, 3],
  'U': [0, 4],
  'V': [0, 5],
  'W': [0, 6],
  'X': [0, 7],
  'Y': [0, 8],
  'Z': [0, 9],
  // Special characters (IBM 029 standard)
  ' ': [],  // blank - no punches
  '&': [12],
  '-': [11],
  '/': [0, 1],
  '+': [12, 8],
  '.': [12, 3, 8],
  '$': [11, 3, 8],
  '*': [11, 4, 8],
  ')': [11, 5, 8],
  ';': [11, 6, 8],
  '\'': [11, 7, 8],  // apostrophe
  ',': [0, 3, 8],
  '(': [0, 4, 8],
  '=': [0, 5, 8],
  '@': [0, 6, 8],
  ':': [0, 7, 8],
  '#': [12, 3, 8],  // same as period on some machines
  '%': [0, 4, 8],   // same as ( on some machines
  '_': [0, 5, 8],   // underscore
  '>': [0, 6, 8],
  '?': [0, 7, 8],
  '!': [11, 2, 8],
  '"': [11, 7, 8],  // same as apostrophe
};

// Row values in order from top to bottom (12, 11, 0, 1-9)
const ROW_VALUES = [12, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Convert character to punch positions
function getColumnPunches(char: string): number[] {
  const upper = char.toUpperCase();
  return PUNCH_ENCODING[upper] || [];
}

// Carbon Design System monospace font CSS variables
const CARBON_MONO_FONT = "var(--cds-code-01-font-family, 'IBM Plex Mono', monospace)";
const CARBON_CODE_01_FONT_SIZE = "var(--cds-code-01-font-size, 0.75rem)";
const CARBON_CODE_02_FONT_SIZE = "var(--cds-code-02-font-size, 0.875rem)";
const CARBON_MONO_FONT_WEIGHT = "var(--cds-code-01-font-weight, 400)";
const COLUMN_NUMBER_FONT_SIZE = '7px'; // Small enough for 2 digits to fit in column width

// Real IBM punched card dimensions (inches)
const REAL_CARD_WIDTH_INCHES = 7.375;
const REAL_CARD_HEIGHT_INCHES = 3.25;
const REAL_MARGIN_TO_COL1_CENTER_INCHES = 0.2865;
const REAL_TOP_MARGIN_TO_ROW12_CENTER_INCHES = 0.250;
const REAL_BOTTOM_MARGIN_TO_ROW9_CENTER_INCHES = 0.250;
const REAL_COLUMN_PITCH_INCHES = 0.087;
const REAL_ROW_PITCH_INCHES = 0.250;
const REAL_HOLE_WIDTH_INCHES = 0.055;
const REAL_HOLE_HEIGHT_INCHES = 0.125;

// Column width = 1em of code-02 font (14px / 0.875rem)
const COLUMN_WIDTH_PX = 14;

// Scale factor: column width represents one column pitch
const SCALE_FACTOR = COLUMN_WIDTH_PX / REAL_COLUMN_PITCH_INCHES;

// Card dimensions scaled from real measurements
const CARD_WIDTH = REAL_CARD_WIDTH_INCHES * SCALE_FACTOR;
const CARD_HEIGHT = REAL_CARD_HEIGHT_INCHES * SCALE_FACTOR;

// Row dimensions scaled from real measurements
const ROW_HEIGHT_PX = REAL_ROW_PITCH_INCHES * SCALE_FACTOR;
const COLUMN_HEIGHT_PX = ROW_HEIGHT_PX;

// Margins scaled from real measurements
const CARD_MARGIN_LEFT_RIGHT_PX = (REAL_MARGIN_TO_COL1_CENTER_INCHES * SCALE_FACTOR) - (COLUMN_WIDTH_PX / 2);
const CARD_MARGIN_TOP_PX = (REAL_TOP_MARGIN_TO_ROW12_CENTER_INCHES * SCALE_FACTOR) - (ROW_HEIGHT_PX / 2);
const CARD_MARGIN_BOTTOM_PX = (REAL_BOTTOM_MARGIN_TO_ROW9_CENTER_INCHES * SCALE_FACTOR) - (ROW_HEIGHT_PX / 2);

// Hole dimensions scaled from real measurements
const HOLE_WIDTH_PX = REAL_HOLE_WIDTH_INCHES * SCALE_FACTOR;
const HOLE_HEIGHT_PX = REAL_HOLE_HEIGHT_INCHES * SCALE_FACTOR;

const styles = {
  cardContainer: {
    display: 'inline-block',
    boxSizing: 'border-box' as const,
    backgroundColor: '#f5e6c8', // cream/manila card color
    borderRadius: '4px',
    position: 'relative' as const,
    overflow: 'hidden',
    clipPath: 'polygon(23px 0, 100% 0, 100% 100%, 0 100%, 0 40px)',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'row' as const,
  },
  columnsContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  printedCharRow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'row' as const,
  },
  printedChar: {
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unpunched: {
    backgroundColor: 'transparent',
    borderRadius: '1px',
  },
  punched: {
    backgroundColor: '#002244',
    borderRadius: '1px',
  },
  rowDigit: {
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnNumber: {
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: CARBON_MONO_FONT,
    fontSize: COLUMN_NUMBER_FONT_SIZE,
    fontWeight: CARBON_MONO_FONT_WEIGHT,
    lineHeight: 1,
  },
  cornerCut: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '23px',
    height: '40px',
    backgroundColor: '#002244',
    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
  }
};

const PunchedCard: React.FC<PunchedCardProps> = ({ text, style }) => {
  // Pad or truncate to 80 characters
  const paddedText = text.slice(0, 80).padEnd(80, ' ');

  // Pre-compute punches for all columns
  const columnPunches = paddedText.split('').map(char => getColumnPunches(char));

  return (
    <div role="img" aria-label={`Punched card: ${text.trim() || 'blank'}`} style={{
      ...styles.cardContainer,
      ...style,
      width: `${CARD_WIDTH}px`,
      height: `${CARD_HEIGHT}px`,
      paddingLeft: `${CARD_MARGIN_LEFT_RIGHT_PX}px`,
      paddingRight: `${CARD_MARGIN_LEFT_RIGHT_PX}px`,
      paddingTop: `${CARD_MARGIN_TOP_PX}px`,
      paddingBottom: `${CARD_MARGIN_BOTTOM_PX}px`,
    }}>
      {/* Corner cut indicator */}
      <div style={styles.cornerCut} />

      {/* Printed characters at top - absolutely positioned */}
      <div style={{
        ...styles.printedCharRow,
        left: `${CARD_MARGIN_LEFT_RIGHT_PX}px`,
        height: `${CARD_MARGIN_TOP_PX}px`,
      }}>
        {paddedText.split('').map((char, colIndex) => (
          <div key={colIndex} data-testid={`printed-char-${colIndex}`} style={{
            ...styles.printedChar,
            width: `${COLUMN_WIDTH_PX}px`,
            height: `${CARD_MARGIN_TOP_PX}px`,
            fontFamily: CARBON_MONO_FONT,
            fontSize: CARBON_CODE_02_FONT_SIZE,
            fontWeight: CARBON_MONO_FONT_WEIGHT,
          }}>
            {char !== ' ' ? char.toUpperCase() : ''}
          </div>
        ))}
      </div>

      <div style={styles.cardInner}>
        {/* Columns */}
        <div style={styles.columnsContainer}>
          {paddedText.split('').map((_, colIndex) => {
            const colNumber = colIndex + 1;
            return (
              <div
                key={colIndex}
                data-testid={`card-column-${colNumber}`}
                style={{ ...styles.column, width: `${COLUMN_WIDTH_PX}px`, position: 'relative' as const }}
              >
                {/* Column number between row 0 and 1 - absolutely positioned */}
                <div style={{
                  ...styles.columnNumber,
                  position: 'absolute' as const,
                  top: `${3 * COLUMN_HEIGHT_PX - 4}px`, // After rows 12, 11, 0
                  width: `${COLUMN_WIDTH_PX}px`,
                }}>
                  {colNumber}
                </div>
                {/* Column number after row 9 - absolutely positioned */}
                <div style={{
                  ...styles.columnNumber,
                  position: 'absolute' as const,
                  top: `${12 * COLUMN_HEIGHT_PX - 4}px`, // After all 12 rows
                  width: `${COLUMN_WIDTH_PX}px`,
                }}>
                  {colNumber}
                </div>
                {/* Punch positions */}
                {ROW_VALUES.map((rowValue, rowIndex) => {
                  const isPunched = columnPunches[colIndex].includes(rowValue);
                  const showDigit = rowValue >= 0 && rowValue <= 9;
                  return (
                    <div
                      key={rowIndex}
                      data-row-value={rowValue}
                      data-col-index={colNumber}
                      style={{
                        ...styles.punchCell,
                        height: `${COLUMN_HEIGHT_PX}px`,
                        width: `${COLUMN_WIDTH_PX}px`,
                      }}>
                      {isPunched ? (
                        <div style={{
                          ...styles.punched,
                          height: `${HOLE_HEIGHT_PX}px`,
                          width: `${HOLE_WIDTH_PX}px`,
                        }} />
                      ) : showDigit ? (
                        <div style={{
                          ...styles.rowDigit,
                          fontFamily: CARBON_MONO_FONT,
                          fontSize: CARBON_CODE_01_FONT_SIZE,
                          fontWeight: CARBON_MONO_FONT_WEIGHT,
                        }}>
                          {rowValue}
                        </div>
                      ) : (
                        <div style={{
                          ...styles.unpunched,
                          height: `${HOLE_HEIGHT_PX}px`,
                          width: `${HOLE_WIDTH_PX}px`,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PunchedCard;
