export type CounterEasing = (progress: number) => number;

export const COUNTER_STEP_MIN = 0.01;
export const COUNTER_STEP_MAX = 1;

/** Increment size for counter ticks, scaled by |to − from| and clamped to [0.01, 1]. */
export function getCounterStep(from: number, to: number): number {
  const gap = Math.abs(to - from);
  return Math.min(COUNTER_STEP_MAX, Math.max(COUNTER_STEP_MIN, gap));
}

/** Smooth deceleration — optional for eased counter mode. */
export function easeOutCubic(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return 1 - (1 - t) ** 3;
}

export function roundCounterValue(value: number, decimals?: number): number {
  if (decimals == null) return value;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type AnimateCounterOptions = {
  from: number;
  to: number;
  duration?: number;
  easing?: CounterEasing;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
};

/**
 * Increment/decrement a number from `from` to `to` over `duration` ms.
 * Step size is derived from the change gap (min 0.01, max 1) unless `easing` is set.
 * Returns a cancel function for cleanup and rapid target changes.
 */
export function animateCounter({
  from,
  to,
  duration = 400,
  easing,
  onUpdate,
  onComplete,
}: AnimateCounterOptions): () => void {
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    onUpdate(to);
    onComplete?.();
    return () => {};
  }

  if (from === to || duration <= 0) {
    onUpdate(to);
    onComplete?.();
    return () => {};
  }

  if (easing) {
    return animateCounterEased({ from, to, duration, easing, onUpdate, onComplete });
  }

  return animateCounterStepped({ from, to, duration, onUpdate, onComplete });
}

function animateCounterEased({
  from,
  to,
  duration,
  easing,
  onUpdate,
  onComplete,
}: Required<Pick<AnimateCounterOptions, "from" | "to" | "duration" | "easing" | "onUpdate">> &
  Pick<AnimateCounterOptions, "onComplete">): () => void {
  const start = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const value = from + (to - from) * easing(progress);
    onUpdate(value);

    if (progress < 1) {
      raf = requestAnimationFrame(tick);
      return;
    }

    onUpdate(to);
    onComplete?.();
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function animateCounterStepped({
  from,
  to,
  duration,
  onUpdate,
  onComplete,
}: Required<Pick<AnimateCounterOptions, "from" | "to" | "duration" | "onUpdate">> &
  Pick<AnimateCounterOptions, "onComplete">): () => void {
  const step = getCounterStep(from, to);
  const direction = Math.sign(to - from);
  const gap = Math.abs(to - from);
  const totalSteps = Math.max(1, Math.ceil(gap / step));
  const msPerStep = duration / totalSteps;

  let current = from;
  let lastStepAt = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    while (now - lastStepAt >= msPerStep && current !== to) {
      lastStepAt += msPerStep;
      const remaining = to - current;
      if (Math.abs(remaining) <= step) {
        current = to;
      } else {
        current += direction * step;
      }
      onUpdate(current);
    }

    if (current !== to) {
      raf = requestAnimationFrame(tick);
      return;
    }

    onComplete?.();
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
