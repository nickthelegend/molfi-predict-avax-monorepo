import type { Tween } from "gsap";
import { ensureGsapPlugins, gsap } from "@/lib/animation/gsap-config";
import { prefersReducedMotion } from "@/lib/animation/counter";

export type ScrollToOptions = {
  duration?: number;
  ease?: string;
  onComplete?: () => void;
};

let activeTween: Tween | null = null;

export function getMaxScrollY(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

export function animateScrollTo(y: number, options: ScrollToOptions = {}): Tween | null {
  ensureGsapPlugins();

  const target = gsap.utils.clamp(0, getMaxScrollY(), y);

  if (prefersReducedMotion()) {
    window.scrollTo(0, target);
    options.onComplete?.();
    return null;
  }

  activeTween?.kill();

  const proxy = { y: window.scrollY };
  activeTween = gsap.to(proxy, {
    y: target,
    duration: options.duration ?? 0.65,
    ease: options.ease ?? "power2.out",
    onUpdate: () => {
      window.scrollTo(0, proxy.y);
    },
    onComplete: () => {
      activeTween = null;
      options.onComplete?.();
    },
  });

  return activeTween;
}

export function cancelAnimatedScroll(): void {
  activeTween?.kill();
  activeTween = null;
}
