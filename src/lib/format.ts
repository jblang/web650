export const normalizeValue = (value: string | number | null | undefined): string => {
  let sign = '+';
  let numericPart = '';

  if (value === null || value === undefined) {
    numericPart = '0';
  } else if (typeof value === 'number') {
    if (value < 0) {
      sign = '-';
    }
    numericPart = String(Math.abs(value));
  } else { // typeof value === 'string'
    // Check for sign at the end (emulator format: 0000000000+)
    if (value.endsWith('+') || value.endsWith('-')) {
      sign = value[value.length - 1];
      numericPart = value.substring(0, value.length - 1);
    // Also accept sign at the beginning for backwards compatibility
    } else if (value.startsWith('+') || value.startsWith('-')) {
      sign = value[0];
      numericPart = value.substring(1);
    } else {
      numericPart = value;
    }
  }

  // Pad the numeric part to 10 digits from the right
  // If numericPart is '123', and needs to be 10 digits, it becomes '0000000123'
  // If the number is less than 10 digits, pad with '0' from the left
  const paddedNumericPart = numericPart.padStart(10, '0');

  // Return with sign at end (emulator format)
  return paddedNumericPart + sign;
};
