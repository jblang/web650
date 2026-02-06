import { useEffect, useRef, useState } from 'react';

export type DisplayIntensity = {
  digits: Array<{ left: number; right: number; rows: number[] }>;
  sign: { plus: number; minus: number };
};

type DisplayLitMask = {
  digits: Array<{ left: boolean; right: boolean; rows: boolean[] }>;
  sign: { plus: boolean; minus: boolean };
};

const DECAY_TAU_MS = 50;

function createEmptyIntensity(): DisplayIntensity {
  return {
    digits: Array.from({ length: 10 }, () => ({
      left: 0,
      right: 0,
      rows: [0, 0, 0, 0, 0],
    })),
    sign: { plus: 0, minus: 0 },
  };
}

function cloneIntensity(source: DisplayIntensity): DisplayIntensity {
  return {
    digits: source.digits.map((digit) => ({
      left: digit.left,
      right: digit.right,
      rows: [...digit.rows],
    })),
    sign: { plus: source.sign.plus, minus: source.sign.minus },
  };
}

function createEmptyMask(): DisplayLitMask {
  return {
    digits: Array.from({ length: 10 }, () => ({
      left: false,
      right: false,
      rows: [false, false, false, false, false],
    })),
    sign: { plus: false, minus: false },
  };
}

function applyDecay(
  intensity: DisplayIntensity,
  factor: number,
  mask: DisplayLitMask
): void {
  for (let i = 0; i < intensity.digits.length; i += 1) {
    const digit = intensity.digits[i];
    const lit = mask.digits[i];
    if (!lit.left) digit.left *= factor;
    if (!lit.right) digit.right *= factor;
    for (let j = 0; j < digit.rows.length; j += 1) {
      if (!lit.rows[j]) digit.rows[j] *= factor;
    }
  }
  if (!mask.sign.plus) intensity.sign.plus *= factor;
  if (!mask.sign.minus) intensity.sign.minus *= factor;
}

function applyLitBulbs(
  intensity: DisplayIntensity,
  mask: DisplayLitMask,
  normalizedValue: string
): void {
  mask.sign.plus = false;
  mask.sign.minus = false;
  for (const digit of mask.digits) {
    digit.left = false;
    digit.right = false;
    digit.rows.fill(false);
  }

  const sign = normalizedValue.charAt(10);
  if (sign === '+') {
    mask.sign.plus = true;
    intensity.sign.plus = 1;
  }
  if (sign === '-') {
    mask.sign.minus = true;
    intensity.sign.minus = 1;
  }
  const digits = normalizedValue.substring(0, 10);
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number(digits.charAt(i));
    if (digit <= 4) {
      mask.digits[i].left = true;
      intensity.digits[i].left = 1;
    }
    if (digit >= 5) {
      mask.digits[i].right = true;
      intensity.digits[i].right = 1;
    }
    mask.digits[i].rows[digit % 5] = true;
    intensity.digits[i].rows[digit % 5] = 1;
  }
}

export function useDisplayDecay(normalizedValue: string, tick: number): DisplayIntensity {
  const intensityRef = useRef<DisplayIntensity>(createEmptyIntensity());
  const litMaskRef = useRef<DisplayLitMask>(createEmptyMask());
  const [intensity, setIntensity] = useState<DisplayIntensity>(() =>
    createEmptyIntensity()
  );
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    applyLitBulbs(intensityRef.current, litMaskRef.current, normalizedValue);
    setIntensity(cloneIntensity(intensityRef.current));
  }, [normalizedValue, tick]);

  useEffect(() => {
    let rafId = 0;
    const step = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }
      const delta = timestamp - (lastFrameRef.current ?? timestamp);
      lastFrameRef.current = timestamp;
      if (delta > 0) {
        const factor = Math.exp(-delta / DECAY_TAU_MS);
        if (factor < 1) {
          applyDecay(intensityRef.current, factor, litMaskRef.current);
          setIntensity(cloneIntensity(intensityRef.current));
        }
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return intensity;
}
