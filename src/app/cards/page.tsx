'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  ButtonSet,
  Tag,
} from '@carbon/react';
import { TreeViewAlt, Clean } from '@carbon/icons-react';
import PunchedCard from '@/components/PunchedCard';
import { useCardDeck } from '@/components/CardDeckProvider';
import FilesystemBrowser from '@/components/FilesystemBrowser';
import * as i650Service from '@/lib/simh/i650';

const SPACING = '1.25rem';

const styles = {
  page: {
    width: '100%',
    display: 'grid',
    rowGap: SPACING,
  },
  controls: {
    display: 'grid',
    rowGap: SPACING,
  },
  statusMessage: {
    margin: 0,
  },
  results: {
    width: '100%',
  },
  accordionWrapper: {
    width: '100%',
  },
};

export default function ReaderPage() {
  const { cardDeck, uploadedFile, loadDeckFromText, handleClearDeck } = useCardDeck();

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [browserOpen, setBrowserOpen] = useState(false);

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

  const handleChooseFilesystemFile = async (path: string) => {
    const content = await i650Service.readFilesystemFile(path);
    loadDeckFromText(path.split('/').at(-1) ?? path, content);
  };

  return (
    <div style={styles.page}>
      <div style={styles.controls}>
        <ButtonSet style={{ columnGap: SPACING }}>
          <Button kind="primary" renderIcon={TreeViewAlt} onClick={() => setBrowserOpen(true)}>
            Browse files
          </Button>
          {cardDeck.length > 0 && (
            <Button kind="danger" renderIcon={Clean} onClick={handleClearDeck}>
              Clear deck
            </Button>
          )}
        </ButtonSet>
        <FilesystemBrowser
          open={browserOpen}
          onRequestClose={() => setBrowserOpen(false)}
          onChoose={handleChooseFilesystemFile}
          modalHeading="Choose card deck"
          rootPaths={['/sw', '/tests', '/tmp']}
          acceptExtensions={['.dck', '.txt']}
        />
        {uploadedFile && (
          <p style={styles.statusMessage}>File loaded: {uploadedFile.name} ({cardDeck.length} cards)</p>
        )}
      </div>

      <div style={styles.results}>
        {cardDeck.length > 0 ? (
          <div style={styles.accordionWrapper}>
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
          </div>
        ) : (
          <p style={styles.statusMessage}>Choose a file from the emulator filesystem to see the card deck.</p>
        )}
      </div>
    </div>
  );
}
