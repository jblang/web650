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

// Row labels in order from top to bottom
const ROW_LABELS = ['12', '11', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ROW_VALUES = [12, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Convert character to punch positions
function getColumnPunches(char: string): number[] {
  const upper = char.toUpperCase();
  return PUNCH_ENCODING[upper] || [];
}

const styles = {
  cardContainer: {
    display: 'inline-block',
    backgroundColor: '#f5e6c8', // cream/manila card color
    borderRadius: '4px',
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    position: 'relative' as const,
    overflow: 'hidden',
    clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)', // corner cut
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '2px',
  },
  rowLabels: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    paddingTop: '14px', // align with printed characters
    marginRight: '4px',
  },
  rowLabel: {
    height: '8px',
    fontSize: '6px',
    fontFamily: 'monospace',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '2px',
    width: '12px',
  },
  columnsContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    width: '8px',
  },
  printedChar: {
    fontSize: '7px',
    fontFamily: 'monospace',
    fontWeight: 'bold' as const,
    color: '#333',
    height: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchCell: {
    width: '6px',
    height: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unpunched: {
    width: '4px',
    height: '6px',
    backgroundColor: 'transparent',
    borderRadius: '1px',
  },
  punched: {
    width: '4px',
    height: '6px',
    backgroundColor: '#002244', // dark hole
    borderRadius: '1px',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
  },
  columnNumbers: {
    display: 'flex',
    flexDirection: 'row' as const,
    marginTop: '4px',
    marginLeft: '18px', // offset for row labels
  },
  columnNumber: {
    width: '8px',
    fontSize: '5px',
    fontFamily: 'monospace',
    color: '#888',
    textAlign: 'center' as const,
  },
};

const PunchedCard: React.FC<PunchedCardProps> = ({ text, style }) => {
  // Pad or truncate to 80 characters
  const paddedText = text.slice(0, 80).padEnd(80, ' ');

  // Pre-compute punches for all columns
  const columnPunches = paddedText.split('').map(char => getColumnPunches(char));

  return (
    <div style={{ ...styles.cardContainer, ...style }}>
      {/* Corner cut indicator */}
      <div style={styles.cornerCut} />

      <div style={styles.cardInner}>
        {/* Row labels */}
        <div style={styles.rowLabels}>
          {ROW_LABELS.map((label, i) => (
            <div key={i} style={styles.rowLabel}>{label}</div>
          ))}
        </div>

        {/* Columns */}
        <div style={styles.columnsContainer}>
          {paddedText.split('').map((char, colIndex) => (
            <div key={colIndex} style={styles.column}>
              {/* Printed character at top */}
              <div style={styles.printedChar}>
                {char !== ' ' ? char.toUpperCase() : ''}
              </div>

              {/* Punch positions */}
              {ROW_VALUES.map((rowValue, rowIndex) => {
                const isPunched = columnPunches[colIndex].includes(rowValue);
                return (
                  <div key={rowIndex} style={styles.punchCell}>
                    <div style={isPunched ? styles.punched : styles.unpunched} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Column numbers at bottom (every 10) */}
      <div style={styles.columnNumbers}>
        {Array.from({ length: 80 }, (_, i) => (
          <div key={i} style={styles.columnNumber}>
            {(i + 1) % 10 === 0 ? (i + 1) : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PunchedCard;
