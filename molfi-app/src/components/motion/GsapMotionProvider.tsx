import { useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef } from "react";
import { ensureGsapPlugins, ScrollTrigger } from "@/lib/animation/gsap-config";
import { prefersReducedMotion } from "@/lib/animation/counter";
import { animateScrollTo } from "@/lib/animation/scroll-to";
import { createSmoothScroll } from "@/lib/animation/smooth-scroll";
import { fadeUpPreset } from "@/lib/animation/presets";
import { gsap } from "@/lib/animation/gsap-config";

type Props = {
  children: ReactNode;
};

export function GsapMotionProvider({ children }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const prevPath = useRef(pathname);

  useEffect(() => {
    ensureGsapPlugins();
    const smoothScroll = createSmoothScroll();

    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a[href^='#']");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;

      const id = hash.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 72;
      animateScrollTo(y, { duration: 0.75, ease: "power2.inOut" });
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      smoothScroll?.destroy();
      document.removeEventListener("click", onAnchorClick);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  useEffect(() => {
    if (pathname === prevPath.current) return;

    const action = router.history.action;
    prevPath.current = pathname;

    if (action === "POP") return;

    animateScrollTo(0, { duration: 0.55, ease: "power2.out" });
  }, [pathname, router.history.action]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    ensureGsapPlugins();

    const triggers = ScrollTrigger.batch("[data-gsap-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          ...fadeUpPreset,
          y: 10,
          duration: 0.5,
          stagger: 0.06,
          clearProps: "transform",
        });
      },
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [pathname]);

  return children;
}
