import React from 'react';
import DecimalKnob from './DecimalKnob';
import { normalizeAddress } from '../../lib/simh/i650/format';

interface AddressSelectionProps {
  value: string | number;
  onChange: (newValue: string) => void;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({ value, onChange }) => {
  const digitKnobRefs = React.useRef<Array<HTMLDivElement | null>>(Array.from({ length: 4 }, () => null));
  // Use normalizeAddress for consistent formatting and validation
  const displayValue = normalizeAddress(value);
  const digits = displayValue.split('').map(Number);

  // Handler for digit changes
  const handleDigitChange = (index: number) => (newDigit: number) => {
    const newDigits = [...digits];
    newDigits[index] = newDigit;
    onChange(newDigits.join(''));
  };

  const focusDigitKnob = (index: number) => {
    if (index < 0 || index >= digitKnobRefs.current.length) return;
    digitKnobRefs.current[index]?.focus();
  };

  return (
    <>
      <DecimalKnob
        value={digits[0]}
        onChange={handleDigitChange(0)}
        onNavigateNext={() => focusDigitKnob(1)}
        onNavigatePrevious={() => focusDigitKnob(-1)}
        knobRef={(el) => {
          digitKnobRefs.current[0] = el;
        }}
        testId="address-digit-0"
      />
      <DecimalKnob
        value={digits[1]}
        onChange={handleDigitChange(1)}
        onNavigateNext={() => focusDigitKnob(2)}
        onNavigatePrevious={() => focusDigitKnob(0)}
        knobRef={(el) => {
          digitKnobRefs.current[1] = el;
        }}
        testId="address-digit-1"
      />
      <DecimalKnob
        value={digits[2]}
        onChange={handleDigitChange(2)}
        onNavigateNext={() => focusDigitKnob(3)}
        onNavigatePrevious={() => focusDigitKnob(1)}
        knobRef={(el) => {
          digitKnobRefs.current[2] = el;
        }}
        testId="address-digit-2"
      />
      <DecimalKnob
        value={digits[3]}
        onChange={handleDigitChange(3)}
        onNavigateNext={() => focusDigitKnob(4)}
        onNavigatePrevious={() => focusDigitKnob(2)}
        knobRef={(el) => {
          digitKnobRefs.current[3] = el;
        }}
        testId="address-digit-3"
      />
    </>
  );
};

export default AddressSelection;
