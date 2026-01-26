import React from 'react';
import DecimalKnob from './DecimalKnob';

interface AddressSelectionProps {
  value: number;
  onChange: (newValue: number) => void;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({ value, onChange }) => {
  // Extract 4 least significant digits from the integer
  const absValue = Math.abs(value);
  const paddedString = absValue.toString().padStart(4, '0').slice(-4);
  const digits = paddedString.split('').map(Number);

  // Handler for digit changes
  const handleDigitChange = (index: number) => (newDigit: number) => {
    const newDigits = [...digits];
    newDigits[index] = newDigit;
    onChange(parseInt(newDigits.join(''), 10));
  };

  return (
    <>
      <DecimalKnob value={digits[0]} onChange={handleDigitChange(0)} />
      <DecimalKnob value={digits[1]} onChange={handleDigitChange(1)} />
      <DecimalKnob value={digits[2]} onChange={handleDigitChange(2)} />
      <DecimalKnob value={digits[3]} onChange={handleDigitChange(3)} />
    </>
  );
};

export default AddressSelection;
