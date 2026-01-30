import React from 'react';
import { Knob } from './Knob';
import './Knob.scss';

interface KnobPosition {
  label: string;
  angle: number;
}

interface LabeledKnobProps {
  position: number; // The index of the current position
  positions: KnobPosition[];
  onChange?: (position: number) => void;
  style?: React.CSSProperties;
  labelRadius?: number;
}

// SVG cursors for clockwise and counter-clockwise rotation
const cwCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M18 12 A6 6 0 0 1 12 18 A6 6 0 0 1 6 12 A6 6 0 0 1 12 6 M12 3.17 L16.86 6 L12 8.83 Z' stroke='black' stroke-width='5' fill='none'/%3E%3Cpath d='M18 12 A6 6 0 0 1 12 18 A6 6 0 0 1 6 12 A6 6 0 0 1 12 6 M12 3.17 L16.86 6 L12 8.83 Z' stroke='white' stroke-width='3' fill='none'/%3E%3C/svg%3E") 12 12, pointer`;
const ccwCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 12 A6 6 0 0 0 12 18 A6 6 0 0 0 18 12 A6 6 0 0 0 12 6 M12 8.83 L7.14 6 L12 3.17 Z' stroke='black' stroke-width='5' fill='none'/%3E%3Cpath d='M6 12 A6 6 0 0 0 12 18 A6 6 0 0 0 18 12 A6 6 0 0 0 12 6 M12 8.83 L7.14 6 L12 3.17 Z' stroke='white' stroke-width='3' fill='none'/%3E%3C/svg%3E") 12 12, pointer`;

const LabeledKnob: React.FC<LabeledKnobProps> = ({ position, positions, onChange, style, labelRadius }) => {
  const rotation = positions[position]?.angle ?? 0;

  const handleLeftClick = () => {
    onChange?.((position + positions.length - 1) % positions.length);
  };

  const handleRightClick = () => {
    onChange?.((position + 1) % positions.length);
  };

  const scale = 1.1;
  const baseKnobContainerWidth = 82.34;
  const baseKnobContainerHeight = 68;
  const baseTickOffset = 2;

  const scaledContainerWidth = baseKnobContainerWidth * scale;
  const scaledContainerHeight = baseKnobContainerHeight * scale;
  const baseKnobHeight = 48; // Base height of the knob SVG
  const scaledKnobHeight = baseKnobHeight * scale; // Scaled height of the knob SVG

  const currentRadius = (labelRadius ?? 40) * scale;
  const tickRadius = 29 * scale;
  const centerX = scaledContainerWidth / 2;
  const knobCenterY = scaledContainerHeight - (scaledKnobHeight / 2) + 5;
  const showTickmarks = positions.length > 2;

  return (
    <div className="knob-container labeled-knob" style={style}>
      <div className="knob-inner-container" style={{ width: `${scaledContainerWidth}px`, height: `${scaledContainerHeight}px` }}>
        {positions.map((p, i) => {
          const angleRad = (p.angle - 90) * (Math.PI / 180);
          const x = Math.round(centerX + currentRadius * Math.cos(angleRad));
          const y = Math.round(knobCenterY + currentRadius * Math.sin(angleRad));

          return (
            <span
              key={i}
              className="label"
              style={{ top: `${y}px`, left: `${x}px` }}
              onClick={() => onChange?.(i)}
            >
              {p.label}
            </span>
          );
        })}
        {showTickmarks && positions.map((p, i) => {
          const angleRad = (p.angle - 90) * (Math.PI / 180);
          const x = centerX + tickRadius * Math.cos(angleRad);
          const y = knobCenterY + tickRadius * Math.sin(angleRad) - (baseTickOffset * scale);

          return (
            <div
              key={`tick-${i}`}
              className="tickmark"
              style={{
                top: `${y.toFixed(2)}px`,
                left: `${x.toFixed(2)}px`,
                transform: `translate(-50%, -50%) rotate(${p.angle}deg)`,
              }}
            />
          );
        })}
        <div className="knob-wrapper">
          <Knob rotation={rotation} />
          <div
            className="knob-half"
            style={{ left: 0, cursor: ccwCursor }}
            onClick={handleLeftClick}
            title="CCW"
          />
          <div
            className="knob-half"
            style={{ right: 0, cursor: cwCursor }}
            onClick={handleRightClick}
            title="CW"
          />
        </div>
      </div>
    </div>
  );
};

export default LabeledKnob;