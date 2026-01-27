import React from 'react';
import DecimalKnob from './DecimalKnob';

interface AddressSelectionProps {
  value: string | number;
  onChange: (newValue: string) => void;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({ value, onChange }) => {
  // Ensure value is a string and pad to 4 digits
  const displayValue = String(Math.abs(Number(value))).padStart(4, '0').slice(-4);
  const digits = displayValue.split('').map(Number);

  // Handler for digit changes
  const handleDigitChange = (index: number) => (newDigit: number) => {
    const newDigits = [...digits];
    newDigits[index] = newDigit;
    onChange(newDigits.join(''));
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
