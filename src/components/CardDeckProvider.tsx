'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface CardDeckContextType {
  cardDeck: string[];
  uploadedFile: File | null;
  setCardDeck: (deck: string[]) => void;
  setUploadedFile: (file: File | null) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement> | { addedFiles: File[] }) => void;
  handleClearDeck: () => void;
}

const CardDeckContext = createContext<CardDeckContextType | undefined>(undefined);

export function useCardDeck() {
  const context = useContext(CardDeckContext);
  if (context === undefined) {
    throw new Error('useCardDeck must be used within a CardDeckProvider');
  }
  return context;
}

export default function CardDeckProvider({ children }: { children: ReactNode }) {
  const [cardDeck, setCardDeck] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | { addedFiles: File[] }) => {
    let file: File | null = null;
    if ('target' in e) { // Regular file input change event
      file = e.target.files ? e.target.files[0] : null;
    } else if ('addedFiles' in e && Array.isArray(e.addedFiles)) { // Carbon FileUploaderDropContainer's onAddFiles event
      file = e.addedFiles[0] || null;
    } else {
      console.error('Unexpected event type for handleFileChange:', e);
      return;
    }

    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const lines = result.split('\n').map((line) => line.trim()).filter(line => line.length > 0);
          setCardDeck(lines);
        } else {
          console.error('FileReader result is not a string:', result);
          setCardDeck([]);
        }
      };
      reader.onerror = () => {
        console.error('Failed to read file:', reader.error);
        setUploadedFile(null);
        setCardDeck([]);
      };
      reader.readAsText(file);
    } else {
      setUploadedFile(null);
      setCardDeck([]);
    }
  }, []);

  const handleClearDeck = useCallback(() => {
    setCardDeck([]);
    setUploadedFile(null);
  }, []);

  const value = useMemo(() => ({
    cardDeck,
    uploadedFile,
    setCardDeck,
    setUploadedFile,
    handleFileChange,
    handleClearDeck,
  }), [cardDeck, uploadedFile, handleFileChange, handleClearDeck]);

  return (
    <CardDeckContext.Provider value={value}>
      {children}
    </CardDeckContext.Provider>
  );
}
