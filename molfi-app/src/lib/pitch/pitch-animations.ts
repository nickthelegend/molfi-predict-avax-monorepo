import { gsap } from "@/lib/animation/gsap-config";
import { prefersReducedMotion } from "@/lib/animation/counter";
import type { PitchIllustration } from "@/lib/pitch/slides";

function querySlideParts(slide: HTMLElement) {
  return {
    pattern: slide.querySelector<HTMLElement>(".pitch-slide-pattern"),
    illustration: slide.querySelector<HTMLElement>(".pitch-illus"),
    eyebrow: slide.querySelector<HTMLElement>(".pitch-eyebrow"),
    title: slide.querySelector<HTMLElement>(".pitch-title"),
    body: slide.querySelector<HTMLElement>(".pitch-body"),
    items: slide.querySelectorAll<HTMLElement>(".pitch-list li"),
    links: slide.querySelectorAll<HTMLElement>(".pitch-links a"),
  };
}

function prepareStrokeTargets(targets: Element[]) {
  targets.forEach((target) => {
    if (!(target instanceof SVGGeometryElement)) return;
    const length = target.getTotalLength();
    gsap.set(target, {
      strokeDasharray: length,
      strokeDashoffset: length,
    });
  });
}

/** Nested illustration enter — frame, parts, SVG strokes. */
function buildIllustrationEnterTimeline(
  slide: HTMLElement,
  illustration: HTMLElement | null,
): gsap.core.Timeline {
  const timeline = gsap.timeline();

  if (!illustration) return timeline;

  timeline.fromTo(
    illustration,
    { opacity: 0, x: 36, scale: 0.94 },
    { opacity: 1, x: 0, scale: 1, duration: 0.72, ease: "power3.out" },
    0,
  );

  const parts = illustration.querySelectorAll<HTMLElement>("[data-pitch-illus-part]");
  if (parts.length > 0) {
    timeline.from(
      parts,
      {
        y: 16,
        opacity: 0,
        duration: 0.45,
        stagger: 0.07,
        ease: "power2.out",
      },
      0.12,
    );
  }

  const strokes = illustration.querySelectorAll<SVGElement>(
    ".pitch-illus-stroke, .pitch-illus-draw polyline, .pitch-illus-draw path, .landing-illus-svg polyline, .landing-illus-vault-chart polyline, .landing-illus-vault-chart path",
  );
  if (strokes.length > 0) {
    prepareStrokeTargets(Array.from(strokes));
    timeline.to(
      strokes,
      {
        strokeDashoffset: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power2.inOut",
      },
      0.18,
    );
  }

  const chartDot = illustration.querySelector<SVGCircleElement>(".pitch-illus-chart-dot");
  if (chartDot) {
    timeline.from(chartDot, { scale: 0, opacity: 0, duration: 0.35, ease: "back.out(2)" }, "-=0.2");
  }

  return timeline;
}

/** Nested enter timeline — pattern, illustration, copy, then staggered list. */
export function buildSlideEnterTimeline(slide: HTMLElement): gsap.core.Timeline {
  const reduced = prefersReducedMotion();
  const { pattern, illustration, eyebrow, title, body, items, links } = querySlideParts(slide);

  if (reduced) {
    gsap.set(slide, { autoAlpha: 1, y: 0 });
    return gsap.timeline();
  }

  gsap.set(slide, { autoAlpha: 1 });

  const master = gsap.timeline({
    defaults: { ease: "power3.out" },
  });

  const patternTimeline = gsap.timeline();
  if (pattern) {
    patternTimeline.fromTo(
      pattern,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 0.85, ease: "power2.out" },
    );
  }

  const illustrationTimeline = buildIllustrationEnterTimeline(slide, illustration);

  const copyTimeline = gsap.timeline();
  if (eyebrow) {
    copyTimeline.from(eyebrow, { y: 18, opacity: 0, duration: 0.42 }, 0);
  }
  if (title) {
    copyTimeline.from(title, { y: 28, opacity: 0, duration: 0.55 }, 0.06);
  }
  if (body) {
    copyTimeline.from(body, { y: 20, opacity: 0, duration: 0.48 }, 0.12);
  }

  const listTimeline = gsap.timeline();
  if (items.length > 0) {
    listTimeline.from(items, {
      x: -16,
      opacity: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: "power2.out",
    });
  }
  if (links.length > 0) {
    listTimeline.from(
      links,
      {
        y: 10,
        opacity: 0,
        duration: 0.38,
        stagger: 0.06,
        ease: "power2.out",
      },
      items.length > 0 ? "-=0.12" : 0,
    );
  }

  master
    .add(patternTimeline, 0)
    .add(illustrationTimeline, 0.02)
    .add(copyTimeline, 0.04)
    .add(listTimeline, 0.18);

  return master;
}

export function buildSlideExitTimeline(slide: HTMLElement): gsap.core.Timeline {
  if (prefersReducedMotion()) {
    return gsap.timeline().set(slide, { autoAlpha: 0 });
  }

  return gsap.timeline().to(slide, {
    autoAlpha: 0,
    y: -18,
    duration: 0.34,
    ease: "power2.in",
  });
}

/** Ambient pattern drift on the active slide — infinite, run separately from transitions. */
export function buildPatternAmbientTimeline(pattern: HTMLElement): gsap.core.Timeline {
  if (prefersReducedMotion()) return gsap.timeline();

  return gsap
    .timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } })
    .to(pattern, { x: 8, y: -6, duration: 9 })
    .to(pattern, { x: -6, y: 4, duration: 11 }, 0);
}

/** Looping micro-motion on illustration elements after slide settles. */
export function buildIllustrationAmbientTimeline(
  slide: HTMLElement,
  kind: PitchIllustration,
): gsap.core.Timeline | null {
  if (prefersReducedMotion()) return null;

  const illustration = slide.querySelector<HTMLElement>(".pitch-illus");
  if (!illustration) return null;

  const timeline = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" } });
  let hasTween = false;

  illustration.querySelectorAll<HTMLElement>(".pitch-illus-float").forEach((el) => {
    timeline.to(el, { y: -5, duration: 2.8, yoyo: true, repeat: -1 }, 0);
    hasTween = true;
  });

  illustration.querySelectorAll<HTMLElement>(".pitch-illus-pulse").forEach((el) => {
    timeline.to(el, { scale: 1.05, duration: 1.6, yoyo: true, repeat: -1 }, 0);
    hasTween = true;
  });

  const liveDot = illustration.querySelector<HTMLElement>(".pitch-illus-live");
  if (liveDot) {
    timeline.to(liveDot, { opacity: 0.35, duration: 0.9, yoyo: true, repeat: -1 }, 0);
    hasTween = true;
  }

  if (kind === "chart" || kind === "cover") {
    const chartDot = illustration.querySelector<SVGCircleElement>(
      ".pitch-illus-chart-dot, .landing-illus-svg circle",
    );
    if (chartDot) {
      timeline.to(chartDot, { y: -4, duration: 1.4, yoyo: true, repeat: -1 }, 0);
      hasTween = true;
    }
  }

  if (kind === "flow") {
    const steps = illustration.querySelectorAll<HTMLElement>(".pitch-illus-flow-step");
    steps.forEach((step, index) => {
      timeline.to(
        step,
        { boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 50%, transparent)", duration: 0.4 },
        index * 0.85,
      );
      timeline.to(step, { boxShadow: "0 0 0 1px transparent", duration: 0.4 }, index * 0.85 + 0.55);
      hasTween = true;
    });
  }

  if (kind === "pillars") {
    illustration.querySelectorAll<HTMLElement>(".pitch-illus-pillar-bar").forEach((bar, index) => {
      timeline.to(bar, { scaleY: 1.08, duration: 1.8, yoyo: true, repeat: -1, delay: index * 0.2 }, 0);
      hasTween = true;
    });
  }

  if (kind === "vault") {
    const vaultLine = illustration.querySelector<SVGPolylineElement>(".landing-illus-vault-chart polyline");
    if (vaultLine) {
      timeline.to(vaultLine, { opacity: 0.65, duration: 1.5, yoyo: true, repeat: -1 }, 0);
      hasTween = true;
    }
  }

  if (!hasTween) {
    timeline.kill();
    return null;
  }

  return timeline;
}

export function buildDeckTransition(
  fromSlide: HTMLElement | null,
  toSlide: HTMLElement,
  onComplete?: () => void,
): gsap.core.Timeline {
  const reduced = prefersReducedMotion();

  if (reduced) {
    if (fromSlide) gsap.set(fromSlide, { autoAlpha: 0, y: 0 });
    gsap.set(toSlide, { autoAlpha: 1, y: 0 });
    onComplete?.();
    return gsap.timeline();
  }

  const master = gsap.timeline({ onComplete });

  if (fromSlide) {
    master.add(buildSlideExitTimeline(fromSlide));
  }

  gsap.set(toSlide, { autoAlpha: 0, y: 22 });
  master.add(buildSlideEnterTimeline(toSlide), fromSlide ? "-=0.1" : 0);

  return master;
}
