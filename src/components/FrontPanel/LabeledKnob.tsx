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
  matchTwoPositionWidth?: boolean;
  scaleFactor?: number;
  testId?: string;
  label?: string;
}

const LAYOUT = {
  defaultScale: 1.5,
  baseContainerWidth: 82.34,
  baseContainerHeight: 68,
  baseKnobSize: 48,
  baseLabelRadius: 40,
  baseLabelMinWidth: 20,
  baseLabelMaxWidth: 60,
  baseLabelCharWidth: 7,
  baseContainerHorizontalPadding: 6,
  contentAwareWidthMinPositions: 4,
  labelRadiusMultiplier: {
    two: 1.05,
    three: 1.08,
    many: 1.2,
  },
  twoPositionLabel: {
    verticalGapFromKnob: 4,
    decimalDisplayHeight: 22,
    yNudge: 0,
  },
  tick: {
    baseRadius: 29,
    radiusScale: 0.85,
    sizeScale: 0.75,
  },
  gripGroove: {
    baseWidth: 1.47,
    baseHeight: 5.5,
    viewBoxSize: 48,
  },
  knobCenter: {
    xOffset: 0,
    yOffsetAtDefaultScale: 0,
  },
} as const;

const estimateLabelWidth = (label: string): number => {
  const estimatedWidth = label.length * LAYOUT.baseLabelCharWidth;
  return Math.min(LAYOUT.baseLabelMaxWidth, Math.max(LAYOUT.baseLabelMinWidth, estimatedWidth));
};

const getAutoLabelRadiusMultiplier = (positionCount: number): number => {
  if (positionCount <= 2) return LAYOUT.labelRadiusMultiplier.two;
  if (positionCount === 3) return LAYOUT.labelRadiusMultiplier.three;
  return LAYOUT.labelRadiusMultiplier.many;
};

const getTwoPositionReferenceWidth = (scale: number): number => {
  const scaledKnobSize = LAYOUT.baseKnobSize * scale;
  const referenceRadius = LAYOUT.baseLabelRadius * LAYOUT.labelRadiusMultiplier.two * scale;
  const referenceCosMagnitude = 0.5; // abs(cos((±30 - 90)deg))
  const referenceLabelHalfWidth = estimateLabelWidth('STOP') / 2;
  const extent = Math.max(
    scaledKnobSize / 2,
    (referenceRadius * referenceCosMagnitude) + referenceLabelHalfWidth,
  );
  return (extent * 2) + (LAYOUT.baseContainerHorizontalPadding * 2);
};

const LabeledKnob: React.FC<LabeledKnobProps> = ({
  position,
  positions,
  onChange,
  className,
  labelRadius,
  matchTwoPositionWidth = false,
  scaleFactor = LAYOUT.defaultScale,
  testId,
  label,
}) => {
  const rotation = positions[position]?.angle ?? 0;

  const handleLeftClick = () => {
    onChange?.((position + positions.length - 1) % positions.length);
  };

  const handleRightClick = () => {
    onChange?.((position + 1) % positions.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        onChange?.((position + 1) % positions.length);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        onChange?.((position + positions.length - 1) % positions.length);
        break;
      case 'Home':
        e.preventDefault();
        onChange?.(0);
        break;
      case 'End':
        e.preventDefault();
        onChange?.(positions.length - 1);
        break;
    }
  };

  const scale = scaleFactor > 0 ? scaleFactor : LAYOUT.defaultScale;
  const scaledKnobSize = LAYOUT.baseKnobSize * scale;
  const showTickmarks = positions.length > 2;
  const hasExplicitLabelRadius = labelRadius !== undefined;
  const autoLabelRadiusMultiplier = hasExplicitLabelRadius ? 1 : getAutoLabelRadiusMultiplier(positions.length);
  const currentRadius = (labelRadius ?? LAYOUT.baseLabelRadius) * autoLabelRadiusMultiplier * scale;
  const useTwoPositionAlignedCenterline = !hasExplicitLabelRadius && positions.length <= 2;
  const tickRadius = LAYOUT.tick.baseRadius * LAYOUT.tick.radiusScale * scale;
  const tickWidth = scaledKnobSize * (LAYOUT.gripGroove.baseWidth / LAYOUT.gripGroove.viewBoxSize);
  const tickHeight = scaledKnobSize * (LAYOUT.gripGroove.baseHeight / LAYOUT.gripGroove.viewBoxSize);
  const effectiveLabelRadius = showTickmarks
    ? Math.max(0, currentRadius - (tickHeight / 2))
    : currentRadius;
  const positionGeometry = positions.map((p) => {
    const angleRad = (p.angle - 90) * (Math.PI / 180);
    return {
      ...p,
      angleRad,
      cos: Math.cos(angleRad),
      sin: Math.sin(angleRad),
    };
  });
  const maxHorizontalExtent = Math.max(
    scaledKnobSize / 2,
    ...positionGeometry.map((p) => Math.abs((effectiveLabelRadius * p.cos)) + (estimateLabelWidth(p.label) / 2)),
    ...positionGeometry.map((p) => Math.abs((tickRadius * p.cos)) + (tickWidth / 2)),
  );
  const baseContainerWidth = LAYOUT.baseContainerWidth * scale;
  const contentAwareContainerWidth = (maxHorizontalExtent * 2) + (LAYOUT.baseContainerHorizontalPadding * 2);
  const twoPositionReferenceWidth = getTwoPositionReferenceWidth(scale);
  const scaledContainerWidth = matchTwoPositionWidth
    ? twoPositionReferenceWidth
    : positions.length >= LAYOUT.contentAwareWidthMinPositions
    ? Math.max(baseContainerWidth, contentAwareContainerWidth)
    : positions.length <= 2
      ? Math.min(baseContainerWidth, contentAwareContainerWidth)
      : baseContainerWidth;
  const scaledContainerHeight = LAYOUT.baseContainerHeight * scale;
  const twoPositionLabelCenterY = scaledContainerHeight
    - scaledKnobSize
    - LAYOUT.twoPositionLabel.verticalGapFromKnob
    - (LAYOUT.twoPositionLabel.decimalDisplayHeight / 2)
    + (LAYOUT.twoPositionLabel.yNudge * (scale / LAYOUT.defaultScale));
  const knobTranslateX = LAYOUT.knobCenter.xOffset * scale;
  const knobCenterX = (scaledContainerWidth / 2) + knobTranslateX;
  const knobCenterY = scaledContainerHeight - (scaledKnobSize / 2)
    + ((LAYOUT.knobCenter.yOffsetAtDefaultScale / LAYOUT.defaultScale) * scale);

  return (
    <div
      className={cn(styles.knobContainer, className)}
      data-testid={testId}
      data-position={position}
      data-current-label={positions[position]?.label ?? ''}
      role="slider"
      aria-valuenow={position}
      aria-valuemin={0}
      aria-valuemax={positions.length - 1}
      aria-valuetext={positions[position]?.label ?? ''}
      aria-label={label ?? testId ?? 'Selector'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ width: `${scaledContainerWidth}px`, minWidth: `${scaledContainerWidth}px`, height: `${scaledContainerHeight}px` }}
    >
      <div
        className={styles.labeledKnobInnerContainer}
        style={{ width: `${scaledContainerWidth}px`, minWidth: `${scaledContainerWidth}px`, height: `${scaledContainerHeight}px` }}
      >
        {positionGeometry.map((p, i) => {
          const x = Math.round(knobCenterX + effectiveLabelRadius * p.cos);
          const y = Math.round(
            useTwoPositionAlignedCenterline
              ? twoPositionLabelCenterY
              : knobCenterY + effectiveLabelRadius * p.sin,
          );

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
        {showTickmarks && positionGeometry.map((p, i) => {
          const x = knobCenterX + tickRadius * p.cos;
          const y = knobCenterY + tickRadius * p.sin;

          return (
            <div
              key={`tick-${i}`}
              className={styles.labeledKnobTickmark}
              style={{
                top: `${y.toFixed(2)}px`,
                left: `${x.toFixed(2)}px`,
                width: `${tickWidth}px`,
                height: `${tickHeight}px`,
                borderRadius: `${scale * LAYOUT.tick.sizeScale}px`,
                transform: `translate(-50%, -50%) rotate(${p.angle}deg)`,
              }}
            />
          );
        })}
        <div
          className={cn(styles.knobWrapper, styles.labeledKnobWrapper)}
          style={{
            width: `${scaledKnobSize}px`,
            height: `${scaledKnobSize}px`,
            transform: `translateX(calc(-50% + ${knobTranslateX.toFixed(2)}px))`,
          }}
        >
          <Knob rotation={rotation} size={scaledKnobSize} />
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
