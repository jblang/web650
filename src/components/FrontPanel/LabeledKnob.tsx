import React from 'react';
import { Knob } from './Knob';
import styles from './Knob.module.scss';
import cn from 'classnames';

interface KnobPosition {
  label: string;
  angle: number;
}

interface LabeledKnobProps {
  position: number; // The index of the current position
  positions: KnobPosition[];
  onChange?: (position: number) => void;
  className?: string;
  labelRadius?: number;
}

const LabeledKnob: React.FC<LabeledKnobProps> = ({ position, positions, onChange, className, labelRadius }) => {
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
    <div className={cn(styles.knobContainer, className)}>
      <div className={styles.labeledKnobInnerContainer} style={{ width: `${scaledContainerWidth}px`, height: `${scaledContainerHeight}px` }}>
        {positions.map((p, i) => {
          const angleRad = (p.angle - 90) * (Math.PI / 180);
          const x = Math.round(centerX + currentRadius * Math.cos(angleRad));
          const y = Math.round(knobCenterY + currentRadius * Math.sin(angleRad));

          return (
            <span
              key={i}
              className={styles.labeledKnobLabel}
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
              className={styles.labeledKnobTickmark}
              style={{
                top: `${y.toFixed(2)}px`,
                left: `${x.toFixed(2)}px`,
                transform: `translate(-50%, -50%) rotate(${p.angle}deg)`,
              }}
            />
          );
        })}
        <div className={cn(styles.knobWrapper, styles.labeledKnobWrapper)}>
          <Knob rotation={rotation} />
          <div
            className={cn(styles.knobHalf, styles.knobHalfLeft, styles.labeledCcwCursor)}
            onClick={handleLeftClick}
            title="CCW"
          />
          <div
            className={cn(styles.knobHalf, styles.knobHalfRight, styles.labeledCwCursor)}
            onClick={handleRightClick}
            title="CW"
          />
        </div>
      </div>
    </div>
  );
};

export default LabeledKnob;