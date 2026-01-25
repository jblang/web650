import React from 'react';
import DecimalKnob from './DecimalKnob';

interface AddressSelectionProps {
  addressSelection: number[];
  onAddressChange: (index: number) => (newValue: number) => void;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({ addressSelection, onAddressChange }) => {
  return (
    <>
      <DecimalKnob value={addressSelection[0]} onChange={onAddressChange(0)} />
      <DecimalKnob value={addressSelection[1]} onChange={onAddressChange(1)} />
      <DecimalKnob value={addressSelection[2]} onChange={onAddressChange(2)} />
      <DecimalKnob value={addressSelection[3]} onChange={onAddressChange(3)} />
    </>
  );
};

export default AddressSelection;
