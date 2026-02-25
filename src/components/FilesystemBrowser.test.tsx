import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import FilesystemBrowser from './FilesystemBrowser';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const fsMocks = vi.hoisted(() => ({
  listFilesystemDirectory: vi.fn<(path: string) => Promise<Array<{ name: string; path: string; isDirectory: boolean }>>>(),
}));

vi.mock('@/lib/simh/i650', () => fsMocks);

vi.mock('@carbon/react', () => {
  let treeSelect:
    | ((event: unknown, payload: { id?: string; label?: React.ReactNode; value?: string }) => void)
    | undefined;
  let selectedIds: Array<string | number> = [];

  return {
    Modal: ({
      open,
      modalHeading,
      primaryButtonText,
      secondaryButtonText,
      primaryButtonDisabled,
      onRequestSubmit,
      onRequestClose,
      children,
    }: {
      open?: boolean;
      modalHeading?: React.ReactNode;
      primaryButtonText?: React.ReactNode;
      secondaryButtonText?: React.ReactNode;
      primaryButtonDisabled?: boolean;
      onRequestSubmit?: () => void;
      onRequestClose?: () => void;
      children?: React.ReactNode;
    }) => {
      if (!open) return null;
      return (
        <div data-testid="modal">
          <h2>{modalHeading}</h2>
          <button type="button" data-testid="modal-primary" disabled={Boolean(primaryButtonDisabled)} onClick={onRequestSubmit}>
            {primaryButtonText}
          </button>
          <button type="button" data-testid="modal-secondary" onClick={onRequestClose}>
            {secondaryButtonText}
          </button>
          {children}
        </div>
      );
    },
    TreeView: ({
      children,
      onSelect,
      selected,
    }: {
      children?: React.ReactNode;
      onSelect?: (event: unknown, payload: { id?: string; label?: React.ReactNode; value?: string }) => void;
      selected?: Array<string | number>;
    }) => {
      treeSelect = onSelect;
      selectedIds = selected ?? [];
      return <ul role="tree">{children}</ul>;
    },
    TreeNode: ({
      id,
      label,
      value,
      disabled,
      onToggle,
      children,
    }: {
      id?: string;
      label: React.ReactNode;
      value?: string;
      disabled?: boolean;
      onToggle?: (event: unknown, node: { id?: string; label?: React.ReactNode; value?: string; isExpanded?: boolean }) => void;
      children?: React.ReactNode;
    }) => {
      return (
        <li
          role="treeitem"
          aria-selected={String(Boolean(selectedIds.includes(id ?? '')))}
          data-node-id={id ?? ''}
          data-disabled={String(Boolean(disabled))}
        >
          <button
            type="button"
            data-testid={`node:${id}`}
            disabled={Boolean(disabled)}
            onClick={(event) => treeSelect?.(event, { id, label, value })}
          >
            {label}
          </button>
          <button
            type="button"
            data-testid={`toggle:${id}`}
            onClick={(event) => onToggle?.(event, { id, label, value, isExpanded: undefined })}
          >
            toggle
          </button>
          {children ? <ul>{children}</ul> : null}
        </li>
      );
    },
    InlineLoading: ({ description }: { description?: string }) => <div>{description ?? 'loading'}</div>,
  };
});

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const clickByTestId = (id: string) => {
  const el = container.querySelector(`[data-testid="${id}"]`) as HTMLButtonElement | null;
  if (!el) {
    throw new Error(`Element not found: ${id}`);
  }
  act(() => {
    el.click();
  });
};

describe('FilesystemBrowser', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    fsMocks.listFilesystemDirectory.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('uses "Choose file" as the default title', () => {
    render(
      <FilesystemBrowser
        open
        onRequestClose={() => {}}
        onChoose={() => {}}
      />
    );

    expect(container.textContent).toContain('Choose file');
  });

  it('keeps roots collapsed by default and loads directories when expanded', async () => {
    fsMocks.listFilesystemDirectory.mockResolvedValueOnce([]);

    render(
      <FilesystemBrowser
        open
        onRequestClose={() => {}}
        onChoose={() => {}}
        rootPaths={['/sw']}
      />
    );

    expect(fsMocks.listFilesystemDirectory).not.toHaveBeenCalled();

    clickByTestId('node:/sw');
    await flush();

    expect(fsMocks.listFilesystemDirectory).toHaveBeenCalledWith('/sw');
  });

  it('enables submit for a supported file and passes its path to onChoose', async () => {
    fsMocks.listFilesystemDirectory.mockResolvedValueOnce([
      { name: 'deck.dck', path: '/sw/deck.dck', isDirectory: false },
      { name: 'script.ini', path: '/sw/script.ini', isDirectory: false },
    ]);

    const onChoose = vi.fn(async () => {});
    const onRequestClose = vi.fn();

    render(
      <FilesystemBrowser
        open
        onRequestClose={onRequestClose}
        onChoose={onChoose}
        rootPaths={['/sw']}
        acceptExtensions={['.dck']}
      />
    );

    clickByTestId('node:/sw');
    await flush();

    clickByTestId('node:/sw/deck.dck');
    const submit = container.querySelector('[data-testid="modal-primary"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);

    clickByTestId('modal-primary');
    await flush();

    expect(onChoose).toHaveBeenCalledWith('/sw/deck.dck');
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('keeps unsupported files disabled', async () => {
    fsMocks.listFilesystemDirectory.mockResolvedValueOnce([
      { name: 'script.ini', path: '/sw/script.ini', isDirectory: false },
    ]);

    render(
      <FilesystemBrowser
        open
        onRequestClose={() => {}}
        onChoose={() => {}}
        rootPaths={['/sw']}
        acceptExtensions={['.dck']}
      />
    );

    clickByTestId('node:/sw');
    await flush();

    const unsupported = container.querySelector('[data-testid="node:/sw/script.ini"]') as HTMLButtonElement;
    expect(unsupported.disabled).toBe(true);
    const submit = container.querySelector('[data-testid="modal-primary"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('clears selection when collapsing parent of selected file', async () => {
    fsMocks.listFilesystemDirectory
      .mockResolvedValueOnce([
        { name: 'decks', path: '/sw/decks', isDirectory: true },
      ])
      .mockResolvedValueOnce([
        { name: 'one.dck', path: '/sw/decks/one.dck', isDirectory: false },
      ]);

    render(
      <FilesystemBrowser
        open
        onRequestClose={() => {}}
        onChoose={() => {}}
        rootPaths={['/sw']}
        acceptExtensions={['.dck']}
      />
    );

    clickByTestId('node:/sw');
    await flush();

    clickByTestId('node:/sw/decks');
    await flush();

    clickByTestId('node:/sw/decks/one.dck');
    const submitBeforeCollapse = container.querySelector('[data-testid="modal-primary"]') as HTMLButtonElement;
    expect(submitBeforeCollapse.disabled).toBe(false);

    clickByTestId('node:/sw/decks');

    const submitAfterCollapse = container.querySelector('[data-testid="modal-primary"]') as HTMLButtonElement;
    expect(submitAfterCollapse.disabled).toBe(true);
  });
});
