'use client';

import React, { useState } from 'react';
import { TextInput } from '@carbon/react';
import PunchedCard from '@/components/PunchedCard';

const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  header: {
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold' as const,
  },
  inputSection: {
    maxWidth: '800px',
  },
  cardSection: {
    overflowX: 'auto' as const,
    paddingBottom: '16px',
  },
  characterCount: {
    color: '#888',
    fontSize: '12px',
    marginTop: '4px',
  },
};

export default function PunchPage() {
  const [text, setText] = useState('HELLO WORLD');

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit to 80 characters and convert to uppercase for display
    const newText = e.target.value.slice(0, 80);
    setText(newText);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Card Reader / Punch</h1>

      <div style={styles.inputSection}>
        <TextInput
          id="card-text-input"
          labelText="Card Text (up to 80 characters)"
          placeholder="Enter text to punch on card..."
          value={text}
          onChange={handleTextChange}
          maxLength={80}
        />
        <div style={styles.characterCount}>
          {text.length} / 80 characters
        </div>
      </div>

      <div style={styles.cardSection}>
        <PunchedCard text={text} />
      </div>
    </div>
  );
}
