import { useEffect, useRef, useState } from 'react';

export type DigitIntensity = { left: number; right: number; rows: number[] };
type DigitMask = { left: boolean; right: boolean; rows: boolean[] };

const DECAY_TAU_MS = 50;

function createEmptyIntensities(count: number): DigitIntensity[] {
  return Array.from({ length: count }, () => ({
    left: 0,
    right: 0,
    rows: [0, 0, 0, 0, 0],
  }));
}

function cloneIntensities(source: DigitIntensity[]): DigitIntensity[] {
  return source.map((digit) => ({
    left: digit.left,
    right: digit.right,
    rows: [...digit.rows],
  }));
}

function createEmptyMasks(count: number): DigitMask[] {
  return Array.from({ length: count }, () => ({
    left: false,
    right: false,
    rows: [false, false, false, false, false],
  }));
}

function applyDecay(intensities: DigitIntensity[], factor: number, masks: DigitMask[]): void {
  for (let i = 0; i < intensities.length; i += 1) {
    const digit = intensities[i];
    const mask = masks[i];
    if (!mask.left) digit.left *= factor;
    if (!mask.right) digit.right *= factor;
    for (let j = 0; j < digit.rows.length; j += 1) {
      if (!mask.rows[j]) digit.rows[j] *= factor;
    }
  }
}

function applyLitBulbs(intensities: DigitIntensity[], masks: DigitMask[], digits: string): void {
  for (const mask of masks) {
    mask.left = false;
    mask.right = false;
    mask.rows.fill(false);
  }
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number(digits.charAt(i));
    if (digit <= 4) {
      masks[i].left = true;
      intensities[i].left = 1;
    }
    if (digit >= 5) {
      masks[i].right = true;
      intensities[i].right = 1;
    }
    masks[i].rows[digit % 5] = true;
    intensities[i].rows[digit % 5] = 1;
  }
}

export function useDigitDecay(digits: string, tick: number): DigitIntensity[] {
  const intensitiesRef = useRef<DigitIntensity[]>(createEmptyIntensities(digits.length));
  const masksRef = useRef<DigitMask[]>(createEmptyMasks(digits.length));
  const [intensity, setIntensity] = useState<DigitIntensity[]>(() =>
    createEmptyIntensities(digits.length)
  );
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (digits.length !== intensitiesRef.current.length) {
      intensitiesRef.current = createEmptyIntensities(digits.length);
      masksRef.current = createEmptyMasks(digits.length);
    }
    applyLitBulbs(intensitiesRef.current, masksRef.current, digits);
    setIntensity(cloneIntensities(intensitiesRef.current));
  }, [digits, tick]);

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
          applyDecay(intensitiesRef.current, factor, masksRef.current);
          setIntensity(cloneIntensities(intensitiesRef.current));
        }
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return intensity;
}
