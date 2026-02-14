import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { AppThemeProvider, useAppTheme } from './AppThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const originalMatchMedia = window.matchMedia;
const originalLocalStorage = window.localStorage;
const darkPreference = { matches: false };

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('AppThemeProvider', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    darkPreference.matches = false;
    const storage = new Map<string, string>();

    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key) ?? null : null)),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, String(value));
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        clear: vi.fn(() => {
          storage.clear();
        }),
      } as Storage,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: darkPreference.matches,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: originalLocalStorage,
    });
  });

  it('defaults to light theme when system is light', () => {
    render(
      <AppThemeProvider>
        <div data-testid="child" />
      </AppThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-app-theme')).toBe('white');
  });

  it('defaults to dark theme when system is dark', () => {
    darkPreference.matches = true;

    render(
      <AppThemeProvider>
        <div data-testid="child" />
      </AppThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-app-theme')).toBe('g100');
  });

  it('uses persisted theme when available', () => {
    darkPreference.matches = false;
    window.localStorage.setItem('app-theme', 'g100');

    render(
      <AppThemeProvider>
        <div data-testid="child" />
      </AppThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-app-theme')).toBe('g100');
  });

  it('toggles between white and g100 when toggleTheme is called', () => {
    const Probe = () => {
      const { toggleTheme } = useAppTheme();
      return (
        <button type="button" data-testid="toggle-theme" onClick={() => toggleTheme()}>
          Toggle
        </button>
      );
    };

    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>
    );

    const button = container.querySelector('[data-testid="toggle-theme"]') as HTMLButtonElement;

    expect(document.documentElement.getAttribute('data-app-theme')).toBe('white');

    act(() => {
      button.click();
    });
    expect(document.documentElement.getAttribute('data-app-theme')).toBe('g100');
    expect(window.localStorage.getItem('app-theme')).toBe('g100');

    act(() => {
      button.click();
    });
    expect(document.documentElement.getAttribute('data-app-theme')).toBe('white');
    expect(window.localStorage.getItem('app-theme')).toBe('white');
  });
});
