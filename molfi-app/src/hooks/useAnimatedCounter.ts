import { useEffect, useRef, useState } from "react";
import {
  animateCounter,
  prefersReducedMotion,
  roundCounterValue,
  type CounterEasing,
} from "@/lib/animation/counter";

export type UseAnimatedCounterOptions = {
  duration?: number;
  /** When false, snaps immediately to the latest target. */
  enabled?: boolean;
  decimals?: number;
  easing?: CounterEasing;
  /** Animate the first value; default false (snap on mount). */
  animateOnMount?: boolean;
};

export type UseAnimatedCounterResult = {
  value: number;
  isAnimating: boolean;
};

/**
 * React hook that counts up/down when `target` changes.
 * Skips animation when reduced motion is preferred or `enabled` is false.
 */
export function useAnimatedCounter(
  target: number | null | undefined,
  options?: UseAnimatedCounterOptions,
): UseAnimatedCounterResult {
  const {
    duration = 400,
    enabled = true,
    decimals,
    easing,
    animateOnMount = false,
  } = options ?? {};

  const [value, setValue] = useState(() =>
    target != null && Number.isFinite(target) ? target : 0,
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const valueRef = useRef(value);
  const cancelRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (target == null || !Number.isFinite(target)) return;

    cancelRef.current?.();
    cancelRef.current = null;

    const snap = (next: number) => {
      const rounded = roundCounterValue(next, decimals);
      valueRef.current = rounded;
      setValue(rounded);
      setIsAnimating(false);
    };

    if (!mountedRef.current) {
      mountedRef.current = true;
      if (!animateOnMount) {
        snap(target);
        return;
      }
    }

    if (!enabled || prefersReducedMotion()) {
      snap(target);
      return;
    }

    const from = valueRef.current;
    if (from === target) {
      snap(target);
      return;
    }

    setIsAnimating(true);
    cancelRef.current = animateCounter({
      from,
      to: target,
      duration,
      easing,
      onUpdate: (next) => {
        setValue(roundCounterValue(next, decimals));
      },
      onComplete: () => {
        snap(target);
        cancelRef.current = null;
      },
    });
  }, [target, duration, enabled, decimals, easing, animateOnMount]);

  return { value, isAnimating };
}
