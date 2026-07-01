import { ensureGsapPlugins, gsap } from "@/lib/animation/gsap-config";
import { prefersReducedMotion } from "@/lib/animation/counter";
import { cancelAnimatedScroll } from "@/lib/animation/scroll-to";

const LERP = 0.11;
const WHEEL_MULTIPLIER = 1;

type SmoothScrollController = {
  destroy: () => void;
  pause: () => void;
  resume: () => void;
};

function isCoarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

function isScrollLocked(): boolean {
  const body = document.body;
  if (body.dataset.scrollLock === "true") return true;
  if (body.style.overflow === "hidden") return true;
  return false;
}

function hasScrollableAncestor(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.documentElement) {
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function createSmoothScroll(): SmoothScrollController | null {
  if (typeof window === "undefined") return null;
  if (prefersReducedMotion() || isCoarsePointer()) return null;

  ensureGsapPlugins();

  let enabled = true;
  let current = window.scrollY;
  let target = current;
  let maxScroll = 0;

  const refreshBounds = () => {
    maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    target = gsap.utils.clamp(0, maxScroll, target);
    current = gsap.utils.clamp(0, maxScroll, current);
  };

  const syncToNative = () => {
    current = window.scrollY;
    target = window.scrollY;
    refreshBounds();
  };

  const onWheel = (event: WheelEvent) => {
    if (!enabled || isScrollLocked()) return;
    if (event.ctrlKey || event.metaKey) return;
    if (hasScrollableAncestor(event.target)) return;

    event.preventDefault();
    cancelAnimatedScroll();
    refreshBounds();
    target = gsap.utils.clamp(0, maxScroll, target + event.deltaY * WHEEL_MULTIPLIER);
  };

  const onResize = () => refreshBounds();

  const tick = () => {
    if (!enabled || isScrollLocked()) {
      syncToNative();
      return;
    }

    refreshBounds();
    const delta = target - current;
    if (Math.abs(delta) < 0.35) {
      if (current !== target) {
        current = target;
        window.scrollTo(0, current);
      }
      return;
    }

    current += delta * LERP;
    window.scrollTo(0, current);
  };

  refreshBounds();
  gsap.ticker.add(tick);
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", onResize, { passive: true });

  return {
    destroy: () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    },
    pause: () => {
      enabled = false;
      syncToNative();
    },
    resume: () => {
      enabled = true;
      syncToNative();
    },
  };
}
