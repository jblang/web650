import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import ButtonSection from './ButtonSection';
import controlStyles from './ButtonSection.module.scss';

let container: HTMLDivElement;
let root: Root;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const click = (el: Element | null) => {
  if (!el) throw new Error('element not found');
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

describe('FrontPanel controls', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('wires control buttons to their handlers', () => {
    const handlers = {
      onTransferClick: vi.fn(),
      onProgramStartClick: vi.fn(),
      onProgramStopClick: vi.fn(),
      onProgramResetClick: vi.fn(),
      onComputerResetClick: vi.fn(),
      onAccumResetClick: vi.fn(),
      onHelpClick: vi.fn(),
      onCheatClick: vi.fn(),
      onEmulatorResetClick: vi.fn(),
    };

    render(<ButtonSection {...handlers} />);

    const clickByLabel = (label: string) => {
      const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === label);
      click(btn ?? null);
    };

    clickByLabel('PROGRAM START');
    clickByLabel('PROGRAM STOP');
    clickByLabel('PROGRAM RESET');
    clickByLabel('COMPUTER RESET');
    clickByLabel('ACCUM RESET');
    clickByLabel('HELP');
    clickByLabel('CHEAT');
    clickByLabel('EMULATOR RESET');
    clickByLabel('TRANSFER');

    expect(handlers.onProgramStartClick).toHaveBeenCalledTimes(1);
    expect(handlers.onProgramStopClick).toHaveBeenCalledTimes(1);
    expect(handlers.onProgramResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onComputerResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onAccumResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onHelpClick).toHaveBeenCalledTimes(1);
    expect(handlers.onCheatClick).toHaveBeenCalledTimes(1);
    expect(handlers.onEmulatorResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onTransferClick).toHaveBeenCalledTimes(1);
  });

  it('shows active styling when help mode is enabled', () => {
    render(<ButtonSection helpEnabled />);

    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'HELP');
    if (!button) throw new Error('button not found');

    expect(button.classList.contains(controlStyles.active)).toBe(true);
  });

  it('updates HELP button hover tooltip based on help mode', () => {
    render(<ButtonSection helpEnabled={false} />);
    const helpOn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'HELP');
    expect(helpOn?.getAttribute('title')).toBe('Toggle help mode on');

    render(<ButtonSection helpEnabled />);
    const helpOff = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'HELP');
    expect(helpOff?.getAttribute('title')).toBe('Toggle help mode off');
  });

  it('shows active styling when cheat mode is enabled', () => {
    render(<ButtonSection cheatEnabled />);

    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'CHEAT');
    if (!button) throw new Error('button not found');

    expect(button.classList.contains(controlStyles.active)).toBe(true);
  });

  it('shows pressed state while holding a control button', () => {
    render(<ButtonSection />);

    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'TRANSFER');
    if (!button) throw new Error('button not found');

    act(() => {
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(button.classList.contains(controlStyles.pressed)).toBe(true);

    act(() => {
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    expect(button.classList.contains(controlStyles.pressed)).toBe(false);

    act(() => {
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    });
    expect(button.classList.contains(controlStyles.pressed)).toBe(false);
  });

  it('ButtonSection buttons have type="button"', () => {
    render(<ButtonSection />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('type')).toBe('button');
    });
  });
});

/* @vitest-environment jsdom */
