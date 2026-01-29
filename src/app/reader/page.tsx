'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  FileUploaderDropContainer,
  Button,
  Tag,
} from '@carbon/react';
import PunchedCard from '@/components/PunchedCard';
import { useCardDeck } from '@/components/CardDeckProvider';

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

export default function ReaderPage() {
  const { cardDeck, uploadedFile, handleFileChange, handleClearDeck } = useCardDeck();

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const handleHeadingClick = (index: number, isExpanded: boolean) => {

    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (isExpanded) {
        newExpanded.add(index);
      } else {
        newExpanded.delete(index);
      }

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
                title={
                  <>
                    <Tag type="blue" style={{ marginRight: '8px' }}>{index + 1}</Tag>
                    <code style={{ whiteSpace: 'pre' }}>{cardText}</code>
                  </>
                }
                onHeadingClick={({ isOpen }) => handleHeadingClick(index, isOpen)}
              >

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
