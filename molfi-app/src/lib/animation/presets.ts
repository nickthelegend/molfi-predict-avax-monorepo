import type { gsap as GsapType } from "gsap";
import { ensureGsapPlugins, gsap } from "@/lib/animation/gsap-config";
import { prefersReducedMotion } from "@/lib/animation/counter";

export const fadeUpPreset = {
  y: 14,
  opacity: 0,
  duration: 0.55,
  ease: "power2.out",
} as const;

export const fadeInPreset = {
  opacity: 0,
  duration: 0.4,
  ease: "power1.out",
} as const;

export function revealFromHidden(
  targets: GsapType.TweenTarget,
  preset: typeof fadeUpPreset | typeof fadeInPreset = fadeUpPreset,
  overrides: GsapType.TweenVars = {},
): GsapType.core.Tween | null {
  ensureGsapPlugins();

  if (prefersReducedMotion()) {
    gsap.set(targets, { clearProps: "all", opacity: 1, y: 0 });
    return null;
  }

  const y = (overrides.y ?? ("y" in preset ? preset.y : 0)) as number;
  const { y: _y, ...restOverrides } = overrides;

  return gsap.fromTo(
    targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: preset.duration,
      ease: preset.ease,
      ...restOverrides,
    },
  );
}

export function staggerReveal(
  targets: GsapType.TweenTarget,
  overrides: GsapType.TweenVars = {},
): GsapType.core.Tween | null {
  return revealFromHidden(targets, fadeUpPreset, {
    stagger: 0.07,
    ...overrides,
  });
}
