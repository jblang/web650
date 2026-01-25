'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  FileUploaderDropContainer,
  Button,
} from '@carbon/react';
import PunchedCard from '@/components/PunchedCard';
import { useCardDeck } from '@/components/CardDeckProvider'; // Import useCardDeck

const styles = {
  inputSection: {
    maxWidth: '800px',
  },
  cardSection: {
    marginTop: '24px',
  },
  fileUploader: {
    marginBottom: '16px',
  },
};

export default function PunchPage() {
  const { cardDeck, uploadedFile, handleFileChange, handleClearDeck } = useCardDeck(); // Use hook

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const handleHeadingClick = (index: number, isExpanded: boolean) => {
    console.log(`handleHeadingClick - index: ${index}, isExpanded: ${isExpanded}`);
    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (isExpanded) {
        newExpanded.add(index);
      } else {
        newExpanded.delete(index);
      }
      console.log('handleHeadingClick - newExpanded:', newExpanded);
      return newExpanded;
    });
  };

  return (
    <div>
      <div style={styles.inputSection}>
        <div style={styles.fileUploader}>
          <FileUploaderDropContainer
            labelText="Drag and drop a text file here or click to upload"
            accept={['.txt', '.dck']}
            onAddFiles={(event, content) => {
              handleFileChange({ addedFiles: content.addedFiles });
            }}
          />
          {uploadedFile && (
            <p>File loaded: {uploadedFile.name} ({cardDeck.length} cards)</p>
          )}
        </div>

        {cardDeck.length > 0 && (
          <Button kind="danger" onClick={handleClearDeck}>
            Clear Deck
          </Button>
        )}
      </div>

      <div style={styles.cardSection}>
        {cardDeck.length > 0 ? (
          <Accordion>
            {cardDeck.map((cardText, index) => (
              <AccordionItem
                key={index}
                title={<><span>{index + 1}: </span><span style={{ fontFamily: 'monospace' }}>{cardText}</span></>}
                onHeadingClick={({ isExpanded }) => handleHeadingClick(index, isExpanded)}
              >
                {console.log(`AccordionItem - index: ${index}, expandedItems.has(${index}): ${expandedItems.has(index)}`)}
                {expandedItems.has(index) && <PunchedCard text={cardText} />}
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p>Upload a text file to see the card deck.</p>
        )}
      </div>
    </div>
  );
}