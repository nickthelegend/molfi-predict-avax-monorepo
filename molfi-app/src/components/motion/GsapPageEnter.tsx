import { type ReactNode, useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/animation/gsap-config";
import { consumeInitialPageEnter } from "@/lib/animation/page-enter-once";
import { revealFromHidden, staggerReveal } from "@/lib/animation/presets";

type PageEnterMode = "initial" | "always" | "never";

type Props = {
  children: ReactNode;
  className?: string;
  /** Stagger direct children instead of animating the wrapper. */
  stagger?: boolean;
  /** `initial` — animate once per hard load; `always` / `never` override. */
  mode?: PageEnterMode;
};

function shouldAnimateEnter(mode: PageEnterMode): boolean {
  if (mode === "always") return true;
  if (mode === "never") return false;
  return consumeInitialPageEnter();
}

export function GsapPageEnter({ children, className, stagger = false, mode = "initial" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const animateRef = useRef(shouldAnimateEnter(mode));

  useLayoutEffect(() => {
    if (!animateRef.current) return;

    const el = ref.current;
    if (!el) return;

    if (stagger) {
      const items = el.children;
      if (items.length === 0) return;
      const tween = staggerReveal(items, { duration: 0.5, y: 12 });
      return () => {
        tween?.kill();
        gsap.set(items, { clearProps: "opacity,transform" });
      };
    }

    const tween = revealFromHidden(el, undefined, { duration: 0.45, y: 10 });
    return () => {
      tween?.kill();
      gsap.set(el, { clearProps: "opacity,transform" });
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
