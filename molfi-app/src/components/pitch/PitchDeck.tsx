import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { gsap } from "@/lib/animation/gsap-config";
import { prefersReducedMotion } from "@/lib/animation/counter";
import {
  buildDeckTransition,
  buildIllustrationAmbientTimeline,
  buildPatternAmbientTimeline,
} from "@/lib/pitch/pitch-animations";
import { PITCH_SLIDE_COUNT, PITCH_SLIDES, type PitchSlide } from "@/lib/pitch/slides";
import { PitchIllustration } from "@/components/pitch/PitchIllustrations";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

function PitchSlideView({
  slide,
  index,
  slideRef,
}: {
  slide: PitchSlide;
  index: number;
  slideRef: (node: HTMLElement | null) => void;
}) {
  return (
    <section
      ref={slideRef}
      className="pitch-slide"
      aria-label={`Slide ${index + 1} of ${PITCH_SLIDE_COUNT}: ${slide.title}`}
      aria-hidden
      inert
    >
      <div
        className={cn("pitch-slide-pattern", `pitch-slide-pattern--${slide.pattern}`)}
        aria-hidden
      />

      <div className="pitch-slide-inner">
        <div className="pitch-slide-copy">
          <p className="pitch-eyebrow">{slide.eyebrow}</p>
          <h2 className="pitch-title">{slide.title}</h2>

          {slide.body ? <p className="pitch-body">{slide.body}</p> : null}

          {slide.items && slide.items.length > 0 ? (
            <ul className="pitch-list">
              {slide.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {slide.links && slide.links.length > 0 ? (
            <div className="pitch-links">
              {slide.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pitch-link"
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <PitchIllustration kind={slide.illustration} />
      </div>
    </section>
  );
}

export function PitchDeck() {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const prevIndexRef = useRef(0);
  const patternTweenRef = useRef<gsap.core.Timeline | null>(null);
  const illusTweenRef = useRef<gsap.core.Timeline | null>(null);
  const wheelLockRef = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= PITCH_SLIDE_COUNT || next === index || isAnimating) return;
      setIndex(next);
    },
    [index, isAnimating],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useLayoutEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const prev = prevIndexRef.current;
    const curr = index;
    const fromSlide = prev !== curr ? slideRefs.current[prev] : null;
    const toSlide = slideRefs.current[curr];

    if (!toSlide) return;

    slideRefs.current.forEach((el, i) => {
      if (!el || i === curr) return;
      gsap.set(el, { autoAlpha: 0, y: 0 });
      el.setAttribute("aria-hidden", "true");
      el.setAttribute("inert", "");
    });

    toSlide.removeAttribute("inert");
    toSlide.setAttribute("aria-hidden", "false");

    patternTweenRef.current?.kill();
    patternTweenRef.current = null;
    illusTweenRef.current?.kill();
    illusTweenRef.current = null;

    const ctx = gsap.context(() => {
      setIsAnimating(true);

      buildDeckTransition(fromSlide, toSlide, () => {
        setIsAnimating(false);

        const pattern = toSlide.querySelector<HTMLElement>(".pitch-slide-pattern");
        if (pattern) {
          patternTweenRef.current = buildPatternAmbientTimeline(pattern);
        }

        const kind = PITCH_SLIDES[curr]?.illustration;
        if (kind) {
          illusTweenRef.current = buildIllustrationAmbientTimeline(toSlide, kind);
        }
      });
    }, deck);

    prevIndexRef.current = curr;

    return () => {
      ctx.revert();
      patternTweenRef.current?.kill();
      patternTweenRef.current = null;
      illusTweenRef.current?.kill();
      illusTweenRef.current = null;
      setIsAnimating(false);
    };
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        goNext();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        goPrev();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        goTo(PITCH_SLIDE_COUNT - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, goTo]);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || prefersReducedMotion()) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 12) return;
      event.preventDefault();

      if (wheelLockRef.current) return;
      wheelLockRef.current = true;

      if (event.deltaY > 0) goNext();
      else goPrev();

      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 650);
    };

    deck.addEventListener("wheel", onWheel, { passive: false });
    return () => deck.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev]);

  const onDeckKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      goNext();
    }
  };

  return (
    <div
      ref={deckRef}
      className="pitch-deck"
      tabIndex={0}
      onKeyDown={onDeckKeyDown}
      aria-roledescription="presentation"
      aria-label={`${APP_NAME} pitch deck`}
    >
      <header className="pitch-deck-header">
        <Link to="/" className="pitch-deck-home">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {APP_NAME}
        </Link>

        <p className="pitch-deck-counter" aria-live="polite">
          <span className="pitch-deck-counter-current">{String(index + 1).padStart(2, "0")}</span>
          <span className="pitch-deck-counter-sep">/</span>
          <span>{String(PITCH_SLIDE_COUNT).padStart(2, "0")}</span>
        </p>
      </header>

      <div className="pitch-slides">
        {PITCH_SLIDES.map((slide, slideIndex) => (
          <PitchSlideView
            key={slide.id}
            slide={slide}
            index={slideIndex}
            slideRef={(node) => {
              slideRefs.current[slideIndex] = node;
            }}
          />
        ))}
      </div>

      <nav className="pitch-nav" aria-label="Slide navigation">
        <button
          type="button"
          className="pitch-nav-btn"
          onClick={goPrev}
          disabled={index === 0 || isAnimating}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="pitch-dots" role="tablist" aria-label="Slides">
          {PITCH_SLIDES.map((slide, dotIndex) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={cn("pitch-dot", dotIndex === index && "pitch-dot--active")}
              aria-selected={dotIndex === index}
              aria-label={`Go to slide ${dotIndex + 1}: ${slide.title}`}
              onClick={() => goTo(dotIndex)}
              disabled={isAnimating}
            />
          ))}
        </div>

        <button
          type="button"
          className="pitch-nav-btn"
          onClick={goNext}
          disabled={index === PITCH_SLIDE_COUNT - 1 || isAnimating}
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </nav>

      {index < PITCH_SLIDE_COUNT - 1 ? (
        <button
          type="button"
          className="pitch-advance-hint"
          onClick={goNext}
          disabled={isAnimating}
        >
          Next
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <Link to="/markets" className="pitch-advance-hint pitch-advance-hint--cta">
          Open app
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}

      <p className="pitch-hint" aria-hidden>
        Arrow keys · scroll · space
      </p>
    </div>
  );
}
