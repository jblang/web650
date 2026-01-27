export const normalizeValue = (value: string | number): string => {
  let sign = '+';
  let numericPart = '';

  if (typeof value === 'number') {
    if (value < 0) {
      sign = '-';
    }
    numericPart = String(Math.abs(value));
  } else { // typeof value === 'string'
    if (value.startsWith('+') || value.startsWith('-')) {
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

  return sign + paddedNumericPart;
};
