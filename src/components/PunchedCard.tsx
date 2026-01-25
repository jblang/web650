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

// Define new constants for font and physical card dimensions
const CARBON_MONO_FONT_FAMILY = "'IBM Plex Mono', monospace";
const BASE_PRINTED_CHAR_FONT_SIZE = 10; // px
const CHAR_WIDTH_TO_FONT_SIZE_RATIO = 0.6; // Approximate for monospaced fonts
const CHAR_HEIGHT_TO_FONT_SIZE_RATIO = 1.0; // Line height relative to font size

const REAL_CARD_WIDTH_INCHES = 7.375;
const REAL_CARD_HEIGHT_INCHES = 3.25;
const REAL_HOLE_WIDTH_INCHES = 0.055;
const REAL_HOLE_HEIGHT_INCHES = 0.125;

const targetAspectRatio = REAL_CARD_WIDTH_INCHES / REAL_CARD_HEIGHT_INCHES; // Use real card aspect ratio

const styles = {
  cardContainer: {
    display: 'inline-block',
    backgroundColor: '#f5e6c8', // cream/manila card color
    borderRadius: '4px',
    position: 'relative' as const,
    overflow: 'hidden',
    clipPath: 'polygon(23px 0, 100% 0, 100% 100%, 0 100%, 0 40px)', // corner cut with 60 degree angle, 40px down vertical edge
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
    // paddingTop and marginRight will be set dynamically
  },
  rowLabel: {
    // height, fontSize, fontFamily, width will be set dynamically
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '2px',
  },
  columnsContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    // width will be set dynamically
  },
  printedChar: {
    // fontSize, fontFamily, height will be set dynamically
    fontWeight: 'bold' as const,
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchCell: {
    // width, height will be set dynamically
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unpunched: {
    // width, height will be set dynamically
    backgroundColor: 'transparent',
    borderRadius: '1px',
  },
  punched: {
    // width, height will be set dynamically
    backgroundColor: '#002244', // dark hole
    borderRadius: '1px',
  },
  columnNumbers: {
    display: 'flex',
    flexDirection: 'row' as const,
    // marginTop and marginLeft will be set dynamically
  },
  columnNumber: {
    // width, fontSize, fontFamily will be set dynamically
    color: '#888',
    textAlign: 'center' as const,
  },
  cornerCut: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '23px',
    height: '40px',
    backgroundColor: '#002244', // Dark color for the cut corner
    clipPath: 'polygon(0 0, 100% 0, 0 100%)', // Triangle cut
  }
};

const PunchedCard: React.FC<PunchedCardProps> = ({ text, style }) => {
  // Pad or truncate to 80 characters
  const paddedText = text.slice(0, 80).padEnd(80, ' ');

  // Pre-compute punches for all columns
  const columnPunches = paddedText.split('').map(char => getColumnPunches(char));

  // --- Calculate new dimensions based on font and real card specs ---
  // Core character/row dimensions
  const newColumnWidth = BASE_PRINTED_CHAR_FONT_SIZE * CHAR_WIDTH_TO_FONT_SIZE_RATIO; // e.g., 6px
  const newPrintedCharHeight = BASE_PRINTED_CHAR_FONT_SIZE * CHAR_HEIGHT_TO_FONT_SIZE_RATIO; // e.g., 10px

  // Fixed dimensions (unchanged from previous calculations, or adjusted if needed)
  const columnGap = 2;
  const rowLabelsWidth = 12; // Width for "12" or "11" label
  const rowLabelsMarginRight = 4;
  const cardPaddingHorizontal = 12 * 2; // Left + Right
  const cardPaddingVertical = 8 * 2;     // Top + Bottom
  const columnNumbersMarginTop = 4;
  const columnNumberHeight = 5; // Assuming font size of column numbers makes this height

  // Recalculate total card width based on new columnWidth
  const calculatedContentWidth = rowLabelsWidth + rowLabelsMarginRight + (80 * newColumnWidth) + (79 * columnGap);
  const newCardWidth = calculatedContentWidth + cardPaddingHorizontal;

  // Recalculate total card height based on newCardWidth and targetAspectRatio
  const newCardHeight = newCardWidth / targetAspectRatio;

  // Calculate scaled hole dimensions
  const scaledHoleWidth = (REAL_HOLE_WIDTH_INCHES / REAL_CARD_WIDTH_INCHES) * newCardWidth;
  const scaledHoleHeight = (REAL_HOLE_HEIGHT_INCHES / REAL_CARD_HEIGHT_INCHES) * newCardHeight;

  // Determine newPunchCellHeight to distribute newCardHeight
  const remainingVerticalSpaceForPunches = newCardHeight - cardPaddingVertical - newPrintedCharHeight - columnNumbersMarginTop - columnNumberHeight;
  const newPunchCellHeight = remainingVerticalSpaceForPunches / 12; // 12 punch rows

  // Adjust font sizes for other text elements proportionally or based on new BASE_PRINTED_CHAR_FONT_SIZE
  const printedCharFontSize = BASE_PRINTED_CHAR_FONT_SIZE;
  const rowLabelFontSize = BASE_PRINTED_CHAR_FONT_SIZE * (6 / 10); // Maintain original relative size to printed char
  const columnNumberFontSize = BASE_PRINTED_CHAR_FONT_SIZE * (5 / 10); // Maintain original relative size to printed char

  // Adjust padding for row labels to align with printed characters
  // Align the top of row labels with the top of the printed character
  const rowLabelsPaddingTop = newPrintedCharHeight;

  return (
    <div style={{
      ...styles.cardContainer,
      ...style,
      width: `${newCardWidth}px`,
      height: `${newCardHeight}px`,
      padding: `${cardPaddingVertical / 2}px ${cardPaddingHorizontal / 2}px`,
        }}>
          {/* Corner cut indicator */}
          <div style={styles.cornerCut} />
    
          <div style={styles.cardInner}>
        {/* Row labels */}
        <div style={{ ...styles.rowLabels, paddingTop: `${rowLabelsPaddingTop}px`, marginRight: `${rowLabelsMarginRight}px` }}>
          {ROW_LABELS.map((label, i) => (
            <div key={i} style={{
              ...styles.rowLabel,
              height: `${newPunchCellHeight}px`, // Each row label should correspond to a punch cell row
              fontSize: `${rowLabelFontSize}px`,
              fontFamily: CARBON_MONO_FONT_FAMILY,
              width: `${rowLabelsWidth}px`,
            }}>{label}</div>
          ))}
        </div>

        {/* Columns */}
        <div style={styles.columnsContainer}>
          {paddedText.split('').map((char, colIndex) => (
            <div key={colIndex} style={{ ...styles.column, width: `${newColumnWidth}px` }}>
              {/* Printed character at top */}
              <div style={{ ...styles.printedChar, height: `${newPrintedCharHeight}px`, fontSize: `${printedCharFontSize}px`, fontFamily: CARBON_MONO_FONT_FAMILY }}>
                {char !== ' ' ? char.toUpperCase() : ''}
              </div>

              {/* Punch positions */}
              {ROW_VALUES.map((rowValue, rowIndex) => {
                const isPunched = columnPunches[colIndex].includes(rowValue);
                return (
                  <div key={rowIndex} style={{ ...styles.punchCell, height: `${newPunchCellHeight}px`, width: `${newColumnWidth}px` }}>
                    <div style={isPunched ? {
                      ...styles.punched,
                      height: `${scaledHoleHeight}px`,
                      width: `${scaledHoleWidth}px`,
                    } : {
                      ...styles.unpunched,
                      height: `${scaledHoleHeight}px`,
                      width: `${scaledHoleWidth}px`,
                    }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Column numbers at bottom (every 10) */}
      <div style={{ ...styles.columnNumbers, marginTop: `${columnNumbersMarginTop}px`, marginLeft: `${rowLabelsWidth + rowLabelsMarginRight}px` }}>
        {Array.from({ length: 80 }, (_, i) => (
          <div key={i} style={{ ...styles.columnNumber, width: `${newColumnWidth}px`, fontSize: `${columnNumberFontSize}px`, fontFamily: CARBON_MONO_FONT_FAMILY }}>
            {(i + 1) % 10 === 0 ? (i + 1) : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PunchedCard;