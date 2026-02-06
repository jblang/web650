import React from 'react';
import DecimalKnob from './DecimalKnob';
import { normalizeAddress } from '../../lib/simh/i650/format';

interface AddressSelectionProps {
  value: string | number;
  onChange: (newValue: string) => void;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({ value, onChange }) => {
  // Use normalizeAddress for consistent formatting and validation
  const displayValue = normalizeAddress(value);
  const digits = displayValue.split('').map(Number);

  // Handler for digit changes
  const handleDigitChange = (index: number) => (newDigit: number) => {
    const newDigits = [...digits];
    newDigits[index] = newDigit;
    onChange(newDigits.join(''));
  };

  return (
    <>
      <DecimalKnob value={digits[0]} onChange={handleDigitChange(0)} testId="address-digit-0" />
      <DecimalKnob value={digits[1]} onChange={handleDigitChange(1)} testId="address-digit-1" />
      <DecimalKnob value={digits[2]} onChange={handleDigitChange(2)} testId="address-digit-2" />
      <DecimalKnob value={digits[3]} onChange={handleDigitChange(3)} testId="address-digit-3" />
    </>
  );
};

export default AddressSelection;
