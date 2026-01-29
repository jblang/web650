import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import CardDeckProvider, { useCardDeck } from './CardDeckProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('CardDeckProvider', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('parses uploaded card deck lines and trims blanks', async () => {
    const state: { deck?: string[]; file?: File | null; handleFileChange?: (e: React.ChangeEvent<HTMLInputElement> | { addedFiles: File[] }) => void } = {};

    const Probe = () => {
      const ctx = useCardDeck();
      React.useEffect(() => {
        state.deck = ctx.cardDeck;
        state.file = ctx.uploadedFile;
        state.handleFileChange = ctx.handleFileChange;
      }, [ctx]);
      return null;
    };

    render(
      <CardDeckProvider>
        <Probe />
      </CardDeckProvider>
    );

    const file = new File(['LINE1\n\nLINE2   \n'], 'deck.txt', { type: 'text/plain' });

    // Mock FileReader to immediately return text
    const onloadSpy = vi.fn();
    const OriginalFileReader = global.FileReader;
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      readAsText() {
        this.result = 'LINE1\n\nLINE2   \n';
        onloadSpy();
        this.onload?.({ target: { result: this.result } } as ProgressEvent<FileReader>);
      }
    }
    // @ts-expect-error override global
    global.FileReader = MockFileReader;

    await act(async () => {
      state.handleFileChange?.({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    // restore FileReader
    global.FileReader = OriginalFileReader;

    expect(onloadSpy).toHaveBeenCalled();
    expect(state.deck).toEqual(['LINE1', 'LINE2']);
    expect(state.file?.name).toBe('deck.txt');
  });

  it('handles Carbon onAddFiles path', async () => {
    const state: { deck?: string[]; handleFileChange?: (e: React.ChangeEvent<HTMLInputElement> | { addedFiles: File[] }) => void } = {};
    const Probe = () => {
      const ctx = useCardDeck();
      React.useEffect(() => {
        state.handleFileChange = ctx.handleFileChange;
        state.deck = ctx.cardDeck;
      }, [ctx]);
      return null;
    };
    render(
      <CardDeckProvider>
        <Probe />
      </CardDeckProvider>
    );

    const file = new File(['A\nB\n'], 'deck.txt', { type: 'text/plain' });
    // Mock FileReader for this code path
    const OriginalFileReader = global.FileReader;
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      readAsText() {
        this.result = 'A\nB\n';
        this.onload?.({ target: { result: this.result } } as ProgressEvent<FileReader>);
      }
    }
    // @ts-expect-error override
    global.FileReader = MockFileReader;

    await act(async () => {
      state.handleFileChange?.({ addedFiles: [file] });
    });

    expect(state.deck).toEqual(['A', 'B']);
    global.FileReader = OriginalFileReader;
  });

  it('clears deck when no file provided', async () => {
    const state: { deck?: string[]; handleFileChange?: (e: React.ChangeEvent<HTMLInputElement> | { addedFiles: File[] }) => void } = {};
    const Probe = () => {
      const ctx = useCardDeck();
      React.useEffect(() => {
        state.handleFileChange = ctx.handleFileChange;
        state.deck = ctx.cardDeck;
      }, [ctx]);
      return null;
    };
    render(
      <CardDeckProvider>
        <Probe />
      </CardDeckProvider>
    );

    await act(async () => {
      state.handleFileChange?.({ target: { files: null } } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(state.deck).toEqual([]);
  });

  it('handleClearDeck resets deck and file', () => {
    const state: { deck?: string[]; file?: File | null } = {};
    const captured = { handleClear: undefined as (() => void) | undefined, setDeck: undefined as ((d: string[]) => void) | undefined, setFile: undefined as ((f: File | null) => void) | undefined };

    const Probe = () => {
      const ctx = useCardDeck();
      React.useEffect(() => {
        state.deck = ctx.cardDeck;
        state.file = ctx.uploadedFile;
        captured.handleClear = ctx.handleClearDeck;
        captured.setDeck = ctx.setCardDeck;
        captured.setFile = ctx.setUploadedFile;
      }, [ctx]);
      return null;
    };

    render(
      <CardDeckProvider>
        <Probe />
      </CardDeckProvider>
    );

    act(() => {
      captured.setDeck?.(['A', 'B']);
      captured.setFile?.(new File(['A'], 'deck.txt'));
    });

    act(() => captured.handleClear?.());

    expect(state.deck).toEqual([]);
    expect(state.file).toBeNull();
  });
});

/* @vitest-environment jsdom */
