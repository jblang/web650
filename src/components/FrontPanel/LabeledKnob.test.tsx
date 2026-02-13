import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import LabeledKnob from './LabeledKnob';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

// Mock Knob component
vi.mock('./Knob', () => ({
  Knob: ({ rotation }: Record<string, unknown>) => (
    <div data-testid="knob" data-rotation={rotation}>
      Knob
    </div>
  ),
}));

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const twoPositions = [
  { label: 'STOP', angle: -30 },
  { label: 'RUN', angle: 30 },
];

const threePositions = [
  { label: 'LEFT', angle: -45 },
  { label: 'CENTER', angle: 0 },
  { label: 'RIGHT', angle: 45 },
];

const sixPositions = [
  { label: 'POS1', angle: -90 },
  { label: 'POS2', angle: -65 },
  { label: 'POS3', angle: -35 },
  { label: 'POS4', angle: 35 },
  { label: 'POS5', angle: 65 },
  { label: 'POS6', angle: 90 },
];

const getPixelStyleValue = (style: string | null, name: string): number => {
  const value = style?.match(new RegExp(`${name}:\\s*([-\\d.]+)px`))?.[1];
  return value ? Number.parseFloat(value) : Number.NaN;
};

describe('LabeledKnob', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders with testId', () => {
    render(<LabeledKnob position={0} positions={twoPositions} testId="test-knob" />);

    const knob = container.querySelector('[data-testid="test-knob"]');
    expect(knob).not.toBeNull();
  });

  it('sets data-position attribute', () => {
    render(<LabeledKnob position={1} positions={twoPositions} testId="test-knob" />);

    const knob = container.querySelector('[data-testid="test-knob"]');
    expect(knob?.getAttribute('data-position')).toBe('1');
  });

  it('sets data-current-label attribute', () => {
    render(<LabeledKnob position={0} positions={twoPositions} testId="test-knob" />);

    const knob = container.querySelector('[data-testid="test-knob"]');
    expect(knob?.getAttribute('data-current-label')).toBe('STOP');
  });

  it('sets correct rotation for current position', () => {
    render(<LabeledKnob position={1} positions={twoPositions} />);

    const knob = container.querySelector('[data-testid="knob"]');
    expect(knob?.getAttribute('data-rotation')).toBe('30');
  });

  it('renders all position labels', () => {
    render(<LabeledKnob position={0} positions={threePositions} />);

    const labels = container.querySelectorAll('span');
    expect(labels.length).toBe(3);
    expect(labels[0].textContent).toBe('LEFT');
    expect(labels[1].textContent).toBe('CENTER');
    expect(labels[2].textContent).toBe('RIGHT');
  });

  it('calls onChange when left area is clicked', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={1} positions={twoPositions} onChange={onChange} />);

    const leftArea = container.querySelector('[title="CCW"]');
    act(() => {
      leftArea?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('calls onChange when right area is clicked', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={twoPositions} onChange={onChange} />);

    const rightArea = container.querySelector('[title="CW"]');
    act(() => {
      rightArea?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('cycles position forward when clicking right from last position', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={1} positions={twoPositions} onChange={onChange} />);

    const rightArea = container.querySelector('[title="CW"]');
    act(() => {
      rightArea?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('cycles position backward when clicking left from first position', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={twoPositions} onChange={onChange} />);

    const leftArea = container.querySelector('[title="CCW"]');
    act(() => {
      leftArea?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange when ArrowRight is pressed', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={threePositions} onChange={onChange} />);

    const knobContainer = container.querySelector('[role="slider"]');
    act(() => {
      knobContainer?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange when ArrowUp is pressed', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={threePositions} onChange={onChange} />);

    const knobContainer = container.querySelector('[role="slider"]');
    act(() => {
      knobContainer?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange when ArrowLeft is pressed', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={1} positions={threePositions} onChange={onChange} />);

    const knobContainer = container.querySelector('[role="slider"]');
    act(() => {
      knobContainer?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('calls onChange when ArrowDown is pressed', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={1} positions={threePositions} onChange={onChange} />);

    const knobContainer = container.querySelector('[role="slider"]');
    act(() => {
      knobContainer?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('calls onChange with 0 when Home is pressed', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={2} positions={threePositions} onChange={onChange} />);

    const knobContainer = container.querySelector('[role="slider"]');
    act(() => {
      knobContainer?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('calls onChange with last position when End is pressed', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={threePositions} onChange={onChange} />);

    const knobContainer = container.querySelector('[role="slider"]');
    act(() => {
      knobContainer?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      );
    });

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not call onChange when onChange is undefined', () => {
    render(<LabeledKnob position={0} positions={twoPositions} />);

    const rightArea = container.querySelector('[title="CW"]');
    act(() => {
      rightArea?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Should not throw
  });

  it('calls onChange when label is clicked', () => {
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={threePositions} onChange={onChange} />);

    const labels = container.querySelectorAll('span');
    act(() => {
      labels[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('renders tickmarks when more than 2 positions', () => {
    render(<LabeledKnob position={0} positions={threePositions} />);

    const tickmarks = container.querySelectorAll('[class*="labeledKnobTickmark"]');
    expect(tickmarks.length).toBe(3);
  });

  it('does not render tickmarks when 2 or fewer positions', () => {
    render(<LabeledKnob position={0} positions={twoPositions} />);

    const tickmarks = container.querySelectorAll('[class*="labeledKnobTickmark"]');
    expect(tickmarks.length).toBe(0);
  });

  it('renders tickmarks with correct rotation', () => {
    render(<LabeledKnob position={0} positions={threePositions} />);

    const tickmarks = container.querySelectorAll('[class*="labeledKnobTickmark"]');
    expect(tickmarks[0].getAttribute('style')).toContain('rotate(-45deg)');
    expect(tickmarks[1].getAttribute('style')).toContain('rotate(0deg)');
    expect(tickmarks[2].getAttribute('style')).toContain('rotate(45deg)');
  });

  it('matches tickmark width and length to groove dimensions at different scales', () => {
    render(<LabeledKnob position={0} positions={threePositions} scaleFactor={1} />);

    let tickmarks = container.querySelectorAll('[class*="labeledKnobTickmark"]');
    let style = tickmarks[0]?.getAttribute('style') ?? '';
    expect(getPixelStyleValue(style, 'width')).toBeCloseTo(1.47, 3);
    expect(getPixelStyleValue(style, 'height')).toBeCloseTo(5.5, 3);

    render(<LabeledKnob position={0} positions={threePositions} scaleFactor={2} />);

    tickmarks = container.querySelectorAll('[class*="labeledKnobTickmark"]');
    style = tickmarks[0]?.getAttribute('style') ?? '';
    expect(getPixelStyleValue(style, 'width')).toBeCloseTo(2.94, 3);
    expect(getPixelStyleValue(style, 'height')).toBeCloseTo(11, 3);
  });

  it('sets accessibility role to slider', () => {
    render(<LabeledKnob position={0} positions={twoPositions} />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob).not.toBeNull();
  });

  it('sets aria-valuenow to current position', () => {
    render(<LabeledKnob position={1} positions={twoPositions} />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('aria-valuenow')).toBe('1');
  });

  it('sets aria-valuemin to 0', () => {
    render(<LabeledKnob position={0} positions={twoPositions} />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('aria-valuemin')).toBe('0');
  });

  it('sets aria-valuemax to positions length minus 1', () => {
    render(<LabeledKnob position={0} positions={threePositions} />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('aria-valuemax')).toBe('2');
  });

  it('sets aria-valuetext to current label', () => {
    render(<LabeledKnob position={1} positions={twoPositions} />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('aria-valuetext')).toBe('RUN');
  });

  it('sets aria-label from label prop', () => {
    render(<LabeledKnob position={0} positions={twoPositions} label="Test Label" />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('aria-label')).toBe('Test Label');
  });

  it('sets aria-label from testId when label not provided', () => {
    render(<LabeledKnob position={0} positions={twoPositions} testId="my-knob" />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('aria-label')).toBe('my-knob');
  });

  it('sets aria-label to Selector when neither label nor testId provided', () => {
    render(<LabeledKnob position={0} positions={twoPositions} />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('aria-label')).toBe('Selector');
  });

  it('is keyboard focusable with tabIndex 0', () => {
    render(<LabeledKnob position={0} positions={twoPositions} />);

    const knob = container.querySelector('[role="slider"]');
    expect(knob?.getAttribute('tabIndex')).toBe('0');
  });

  it('handles 6 positions correctly', () => {
    render(<LabeledKnob position={2} positions={sixPositions} />);

    const labels = container.querySelectorAll('span');
    expect(labels.length).toBe(6);

    const tickmarks = container.querySelectorAll('[class*="labeledKnobTickmark"]');
    expect(tickmarks.length).toBe(6);

    const knob = container.querySelector('[data-testid="knob"]');
    expect(knob?.getAttribute('data-rotation')).toBe('-35');
  });

  it('applies custom className', () => {
    render(<LabeledKnob position={0} positions={twoPositions} className="custom-class" />);

    const knob = container.querySelector('.custom-class');
    expect(knob).not.toBeNull();
  });

  it('handles position out of bounds gracefully', () => {
    render(<LabeledKnob position={5} positions={twoPositions} />);

    const knob = container.querySelector('[data-testid="knob"]');
    expect(knob?.getAttribute('data-rotation')).toBe('0');
  });

  it('scales container dimensions when scaleFactor is provided', () => {
    render(<LabeledKnob position={0} positions={twoPositions} scaleFactor={2} />);

    const innerContainer = container.querySelector('[class*="labeledKnobInnerContainer"]');
    const style = innerContainer?.getAttribute('style') ?? '';
    const width = getPixelStyleValue(style, 'width');
    const height = getPixelStyleValue(style, 'height');
    expect(width).toBeCloseTo(124, 3);
    expect(height).toBeCloseTo(136, 3);
  });

  it('scales knob wrapper transform when scaleFactor is provided', () => {
    render(<LabeledKnob position={0} positions={twoPositions} scaleFactor={2} />);

    const wrapper = container.querySelector('[class*="labeledKnobWrapper"]');
    expect(wrapper?.getAttribute('style')).toContain('width: 96px');
    expect(wrapper?.getAttribute('style')).toContain('height: 96px');
    expect(wrapper?.getAttribute('style')).toContain('translateX(calc(-50% + 0.00px))');
  });

  it('repositions labels proportionally as scaleFactor changes', () => {
    const singlePosition = [{ label: 'TOP', angle: 0 }];
    render(<LabeledKnob position={0} positions={singlePosition} scaleFactor={1} />);
    const baseStyle = container.querySelector('span')?.getAttribute('style') ?? '';
    const baseLeft = getPixelStyleValue(baseStyle, 'left');
    const baseTop = getPixelStyleValue(baseStyle, 'top');

    render(<LabeledKnob position={0} positions={singlePosition} scaleFactor={2} />);
    const scaledStyle = container.querySelector('span')?.getAttribute('style') ?? '';
    const scaledLeft = getPixelStyleValue(scaledStyle, 'left');
    const scaledTop = getPixelStyleValue(scaledStyle, 'top');

    expect(baseLeft).toBeGreaterThan(0);
    expect(Number.isFinite(baseTop)).toBe(true);
    expect(scaledLeft / baseLeft).toBeGreaterThan(1.5);
    expect(Math.abs(scaledTop)).toBeGreaterThanOrEqual(Math.abs(baseTop));
  });

  it('falls back to default scale when scaleFactor is invalid', () => {
    render(<LabeledKnob position={0} positions={twoPositions} scaleFactor={0} />);

    const innerContainer = container.querySelector('[class*="labeledKnobInnerContainer"]');
    const style = innerContainer?.getAttribute('style') ?? '';
    const width = getPixelStyleValue(style, 'width');
    const height = getPixelStyleValue(style, 'height');
    expect(width).toBeCloseTo(103, 3);
    expect(height).toBeCloseTo(102, 3);
  });
});

/* @vitest-environment jsdom */
