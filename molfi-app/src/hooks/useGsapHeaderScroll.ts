import type { RefObject } from "react";
import { useEffect } from "react";
import { ensureGsapPlugins, gsap, ScrollTrigger } from "@/lib/animation/gsap-config";
import { prefersReducedMotion } from "@/lib/animation/counter";

export function useGsapHeaderScroll(headerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = headerRef.current;
    if (!header || prefersReducedMotion()) return;

    ensureGsapPlugins();

    const trigger = ScrollTrigger.create({
      start: "top top",
      end: 120,
      scrub: 0.35,
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.to(header, {
          boxShadow: `0 1px 0 color-mix(in oklab, var(--color-border) ${40 + progress * 60}%, transparent), 0 8px 24px -12px color-mix(in oklab, black ${8 + progress * 14}%, transparent)`,
          duration: 0.15,
          overwrite: "auto",
        });
      },
    });

    return () => {
      trigger.kill();
      gsap.set(header, { clearProps: "boxShadow" });
    };
  }, [headerRef]);
}
