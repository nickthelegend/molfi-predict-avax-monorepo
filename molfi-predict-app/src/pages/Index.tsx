import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { SEO } from "@/components/SEO";
import { brand, getThemedLogo } from "@/config/brand";
import { useTheme } from "@/providers/ThemeProvider";
import { X } from "lucide-react";

// Thesis background images
import thesisTradeBg from "@/assets/thesis-trade-bg.png";
import thesisTomorrowBg from "@/assets/thesis-tomorrow-bg.png";
import thesisTodayBg from "@/assets/thesis-today-bg.png";
import { WaitlistCTA } from "@/components/WaitlistCTA";

type MarketDomain = "default" | "politics" | "sports" | "conflict" | "crypto" | "macro";
type ThesisWord = "TRADE" | "TOMORROW" | "TODAY";

type ArenaState = "registering" | "live" | "offline";

interface DomainMotionProfile {
  bgDuration: number;
  bgEase: string;
  emphasisDuration: number;
  volatility: "LOW" | "MEDIUM" | "HIGH";
}

interface ThesisMotionProfile {
  bgGradient: string;
  bgImage: string;
  kineticText: string;
  emphasisColor: string;
  charDelay: number;
}

interface ScatteredWord {
  text: string;
  top: string;
  left?: string;
  right?: string;
}

// Domain-specific motion profiles
const motionProfiles: Record<MarketDomain, DomainMotionProfile> = {
  default: { bgDuration: 0.5, bgEase: "power2.out", emphasisDuration: 0.3, volatility: "LOW" },
  politics: { bgDuration: 0.8, bgEase: "power4.inOut", emphasisDuration: 0.5, volatility: "LOW" },
  sports: { bgDuration: 0.25, bgEase: "power3.out", emphasisDuration: 0.2, volatility: "MEDIUM" },
  conflict: { bgDuration: 0.4, bgEase: "power2.inOut", emphasisDuration: 0.35, volatility: "HIGH" },
  crypto: { bgDuration: 0.2, bgEase: "power1.out", emphasisDuration: 0.15, volatility: "HIGH" },
  macro: { bgDuration: 1.0, bgEase: "power4.out", emphasisDuration: 0.6, volatility: "LOW" },
};

// Thesis word motion profiles with character animation timing and background images
interface ThesisMotionProfile {
  bgGradient: string;
  bgImage: string;
  kineticText: string;
  emphasisColor: string;
  charDelay: number;
}

const thesisProfiles: Record<ThesisWord, ThesisMotionProfile> = {
  TRADE: {
    bgGradient: "radial-gradient(circle at 40% 50%, rgba(43,213,118,0.15), transparent 65%)",
    bgImage: thesisTradeBg,
    kineticText: "TRADE",
    emphasisColor: "rgba(43,213,118,0.95)",
    charDelay: 0.04,
  },
  TOMORROW: {
    bgGradient: "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15), transparent 65%)",
    bgImage: thesisTomorrowBg,
    kineticText: "TOMORROW",
    emphasisColor: "rgba(139,92,246,0.95)",
    charDelay: 0.03,
  },
  TODAY: {
    bgGradient: "radial-gradient(circle at 60% 50%, rgba(251,191,36,0.18), transparent 65%)",
    bgImage: thesisTodayBg,
    kineticText: "TODAY",
    emphasisColor: "rgba(251,191,36,0.95)",
    charDelay: 0.05,
  },
};

// Scattered background words - prediction market themed
const scatteredWords: ScatteredWord[] = [
  // Top section - market concepts
  { text: "AGGREGATE", top: "8%", left: "5%" },
  { text: "PREDICT", top: "8%", left: "18%" },
  { text: "RESOLVE", top: "8%", left: "32%" },
  { text: "SETTLE", top: "8%", left: "46%" },
  { text: "PRICE", top: "8%", left: "60%" },
  { text: "&", top: "8%", left: "72%" },
  { text: "WIN", top: "8%", right: "8%" },
  
  // Second row - outcomes
  { text: "BINARY", top: "13%", left: "8%" },
  { text: "OUTCOMES", top: "13%", left: "35%" },
  { text: "RESOLVED", top: "13%", right: "12%" },
  
  // Third row - belief
  { text: "YOUR", top: "18%", left: "4%" },
  { text: "CONVICTION", top: "18%", left: "18%" },
  { text: "BECOMES", top: "18%", left: "45%" },
  { text: "YOUR", top: "18%", right: "20%" },
  { text: "POSITION", top: "18%", right: "3%" },
  
  // LIQUIDITY spelled out
  { text: "L", top: "26%", left: "3%" },
  { text: "I", top: "26%", left: "6%" },
  { text: "Q", top: "26%", left: "9%" },
  { text: "U", top: "26%", left: "12%" },
  { text: "I", top: "26%", left: "15%" },
  { text: "D", top: "26%", left: "18%" },
  { text: "I", top: "26%", left: "21%" },
  { text: "T", top: "26%", left: "24%" },
  { text: "Y", top: "26%", left: "27%" },
  { text: "IS KING", top: "26%", right: "4%" },
  
  // Middle section - trading
  { text: "BEST EXECUTION", top: "38%", left: "12%" },
  { text: "UNIFIED ORDERBOOK", top: "38%", right: "10%" },
  
  // Scattered around thesis
  { text: "PRICE DISCOVERY", top: "52%", left: "3%" },
  { text: "MARKET EFFICIENCY", top: "52%", right: "2%" },
  
  // Lower section - core values
  { text: "SIGNAL", top: "68%", left: "12%" },
  { text: "ALPHA", top: "68%", right: "14%" },
  
  { text: "BUY", top: "74%", left: "6%" },
  { text: "PROBABILITY", top: "74%", left: "18%" },
  { text: "VOLATILITY", top: "74%", left: "50%" },
  { text: "SELL", top: "74%", right: "6%" },
  
  { text: "YES", top: "80%", left: "15%" },
  { text: "NO", top: "80%", right: "18%" },
  
  // Extra density - market terminology
  { text: "ODDS", top: "44%", left: "6%" },
  { text: "STAKE", top: "44%", right: "8%" },
  { text: "EDGE", top: "56%", left: "22%" },
  { text: "EXPOSURE", top: "56%", right: "20%" },
  { text: "LONG", top: "62%", left: "4%" },
  { text: "SHORT", top: "62%", right: "5%" },
  { text: "SPREAD", top: "84%", left: "6%" },
  { text: "SLIPPAGE", top: "84%", right: "8%" },
  { text: "ORDERBOOK", top: "46%", left: "32%" },
  { text: "DEPTH", top: "48%", right: "35%" },
  { text: "AMM", top: "60%", left: "40%" },
  { text: "CLOB", top: "60%", right: "42%" },
  { text: "RESOLUTION", top: "88%", left: "25%" },
  { text: "ORACLE", top: "88%", right: "28%" },
];

const Index = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const logo = getThemedLogo(theme, resolvedTheme);
  
  const [activeBackground, setActiveBackground] = useState<MarketDomain>("default");
  const [activeDomainIndex, setActiveDomainIndex] = useState<number>(-1);
  const [showBanner, setShowBanner] = useState(true);
  const runningTweensRef = useRef<gsap.core.Tween[]>([]);
  
  // Telemetry state
  const [telemetryLine1, setTelemetryLine1] = useState("AGGREGATION: ACTIVE");
  const [telemetryLine2, setTelemetryLine2] = useState("STATE: NORMALIZED");
  
  // Arena state
  const [arenaState] = useState<ArenaState>("offline");
  const [showArena, setShowArena] = useState(false);
  
  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Thesis words for interactive rows
  const thesisWords: ThesisWord[] = ["TRADE", "TOMORROW", "TODAY"];
  
  // Active thesis word state
  const [activeThesisWord, setActiveThesisWord] = useState<ThesisWord | null>(null);
  const thesisRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaLeftRef = useRef<HTMLDivElement>(null);
  const ctaRightRef = useRef<HTMLDivElement>(null);
  const particleTrailContainerRef = useRef<HTMLDivElement>(null);
  const kineticTypeRef = useRef<HTMLDivElement>(null);
  const kineticAnimationRef = useRef<gsap.core.Timeline | null>(null);

  const domains: { text: string; bgType: MarketDomain; category: string }[] = [
    { text: "POLITICS", bgType: "politics", category: "politics" },
    { text: "SPORTS", bgType: "sports", category: "sports" },
    { text: "CONFLICT", bgType: "conflict", category: "news" },
    { text: "CRYPTO", bgType: "crypto", category: "crypto" },
    { text: "MACRO", bgType: "macro", category: "economics" },
  ];

  // Arena display text
  const arenaText = useMemo(() => {
    switch (arenaState) {
      case "registering":
        return { line1: "ARENA: SEASON 0", line2: "STATE: REGISTERING" };
      case "live":
        return { line1: "ARENA: LIVE", line2: "ROUND: 3 / 5" };
      case "offline":
        return { line1: "ARENA: SEASON 0", line2: "COMING SOON — Q2 2026" };
    }
  }, [arenaState]);

  // Kill running tweens helper
  const killRunningTweens = useCallback(() => {
    runningTweensRef.current.forEach((tween) => tween.kill());
    runningTweensRef.current = [];
  }, []);

  // Switch background with domain-specific motion
  const switchBackground = useCallback((target: MarketDomain) => {
    if (target === activeBackground) return;
    killRunningTweens();
    
    const profile = motionProfiles[target];
    const allBgs = document.querySelectorAll(".regime-bg");
    const targetBg = document.getElementById(`${target}-bg`);
    
    // Fade out all backgrounds
    runningTweensRef.current.push(
      gsap.to(allBgs, {
        opacity: 0,
        duration: profile.bgDuration * 0.7,
        ease: profile.bgEase,
      })
    );
    
    // Fade in target background
    if (targetBg) {
      runningTweensRef.current.push(
        gsap.to(targetBg, {
          opacity: 1,
          duration: profile.bgDuration,
          ease: profile.bgEase,
        })
      );
    }
    
    setActiveBackground(target);
  }, [activeBackground, killRunningTweens]);

  // Handle touch gestures for swiping between domains
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setActiveDomainIndex((prev) => {
          const newIndex = prev <= 0 ? domains.length - 1 : prev - 1;
          switchBackground(domains[newIndex].bgType);
          updateTelemetry(domains[newIndex].bgType);
          return newIndex;
        });
      } else {
        setActiveDomainIndex((prev) => {
          const newIndex = prev >= domains.length - 1 ? 0 : prev + 1;
          switchBackground(domains[newIndex].bgType);
          updateTelemetry(domains[newIndex].bgType);
          return newIndex;
        });
      }
    }
    
    touchStartRef.current = null;
  };

  // Update telemetry based on domain
  const updateTelemetry = useCallback((domain: MarketDomain) => {
    const profile = motionProfiles[domain];
    
    if (domain === "default") {
      gsap.to(".telemetry-text", {
        opacity: 0.12,
        duration: 0.3,
        onComplete: () => {
          setTelemetryLine1("AGGREGATION: ACTIVE");
          setTelemetryLine2("STATE: NORMALIZED");
          gsap.to(".telemetry-text", { opacity: 0.12, duration: 0.3 });
        },
      });
    } else {
      gsap.to(".telemetry-text", {
        opacity: 0.08,
        duration: 0.2,
        onComplete: () => {
          setTelemetryLine1(`REGIME: ${domain.toUpperCase()}`);
          setTelemetryLine2(`VOLATILITY: ${profile.volatility}`);
          gsap.to(".telemetry-text", { opacity: 0.15, duration: 0.3 });
        },
      });
    }
  }, []);

  // Boot sequence animation - FASTER
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background frame fade in
      gsap.fromTo(
        ".background-frame",
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      );

      // Logo fade in
      gsap.from(".logo-container", {
        opacity: 0,
        scale: 0.9,
        duration: 0.4,
        delay: 0.1,
        ease: "power2.out",
      });

      // Telemetry labels
      gsap.from(".telemetry-text", {
        opacity: 0,
        y: 4,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.2,
        ease: "power2.out",
      });

      // Domains stagger in
      gsap.from(".text-domain", {
        opacity: 0,
        y: 8,
        duration: 0.4,
        stagger: 0.05,
        delay: 0.3,
        ease: "power2.out",
      });

      // Scattered words stagger in
      gsap.from(".scattered-word", {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        stagger: {
          each: 0.02,
          from: "random",
        },
        delay: 0.3,
        ease: "power2.out",
      });

      // Thesis words with masked character reveal
      const thesisWordEls = document.querySelectorAll(".thesis-word");
      thesisWordEls.forEach((wordEl, wordIndex) => {
        const chars = wordEl.querySelectorAll(".thesis-char");
        chars.forEach((char, charIndex) => {
          gsap.fromTo(char,
            { 
              opacity: 0, 
              x: -20,
              clipPath: "inset(0 100% 0 0)",
            },
            { 
              opacity: 1, 
              x: 0,
              clipPath: "inset(0 0% 0 0)",
              duration: 0.5,
              delay: 0.5 + (wordIndex * 0.15) + (charIndex * 0.04),
              ease: "power2.out",
            }
          );
        });
      });

      // Assertions fade in
      gsap.from(".text-assertion", {
        opacity: 0,
        x: -10,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.6,
        ease: "power2.out",
      });

      // Primitives
      gsap.from(".text-primitive", {
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        delay: 0.8,
        ease: "power2.out",
      });

      // Setup scattered word drift animation
      setTimeout(() => {
        document.querySelectorAll(".scattered-word").forEach((el, i) => {
          gsap.to(el, {
            opacity: 0.4 + Math.random() * 0.3,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.15,
          });
        });
        
        // Random scramble effect on scattered words
        const scrambleRandomWord = () => {
          const words = document.querySelectorAll(".scattered-word");
          if (words.length === 0) return;
          
          const randomWord = words[Math.floor(Math.random() * words.length)] as HTMLElement;
          const originalText = randomWord.dataset.text || randomWord.textContent || "";
          const chars = "■▪▌▐▬";
          let iterations = 0;
          
          const interval = setInterval(() => {
            randomWord.textContent = originalText
              .split("")
              .map((char, idx) => {
                if (idx < iterations) return originalText[idx];
                if (char === " ") return " ";
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join("");
            
            iterations += 0.6;
            
            if (iterations >= originalText.length) {
              clearInterval(interval);
              randomWord.textContent = originalText;
            }
          }, 30);
          
          // Schedule next scramble
          setTimeout(scrambleRandomWord, 800 + Math.random() * 2000);
        };
        
        setTimeout(scrambleRandomWord, 1500);
      }, 800);

      // Setup primitive drift animation
      setTimeout(() => {
        document.querySelectorAll(".text-primitive").forEach((el, i) => {
          gsap.to(el, {
            opacity: 0.08,
            duration: 2 + Math.random(),
            repeat: -1,
            yoyo: true,
            ease: "none",
            delay: i * 0.4,
          });
        });
      }, 1200);

      // CTAs - Use fromTo to ensure final opacity is explicitly 1
      gsap.fromTo(".text-cta", 
        { opacity: 0, y: 6 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: 0.05, 
          delay: 0.9, 
          ease: "power2.out",
          clearProps: "opacity" // Clear GSAP inline styles after animation
        }
      );

      // Arena overlay - persistent appearance
      setTimeout(() => {
        setShowArena(true);
        gsap.fromTo(".arena-overlay", 
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      }, 1500);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Parallax mouse movement effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = (e.clientX - centerX) / centerX;
      const offsetY = (e.clientY - centerY) / centerY;
      
      // Move scattered words with individual parallax speeds
      document.querySelectorAll(".scattered-word").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const speed = parseFloat(htmlEl.dataset.parallaxSpeed || "0.02");
        const moveX = offsetX * 40 * speed;
        const moveY = offsetY * 25 * speed;
        
        gsap.to(htmlEl, {
          x: moveX,
          y: moveY,
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
      
      // Move regime backgrounds with subtle parallax
      document.querySelectorAll(".regime-bg").forEach((el, i) => {
        const speed = 0.015 + (i * 0.005);
        const moveX = offsetX * 30 * speed;
        const moveY = offsetY * 20 * speed;
        
        gsap.to(el, {
          x: moveX,
          y: moveY,
          duration: 1.0,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
      
      // Move scattered container slightly
      const scatteredContainer = document.querySelector(".scattered-container");
      if (scatteredContainer) {
        gsap.to(scatteredContainer, {
          x: offsetX * 8,
          y: offsetY * 5,
          duration: 1.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
      
      // Animate ambient particles with mouse movement
      document.querySelectorAll(".ambient-particle").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const speedX = parseFloat(htmlEl.dataset.speedX || "0.02");
        const speedY = parseFloat(htmlEl.dataset.speedY || "0.02");
        
        gsap.to(el, {
          x: offsetX * 50 * speedX * (Math.random() > 0.5 ? 1 : -1),
          y: offsetY * 50 * speedY * (Math.random() > 0.5 ? 1 : -1),
          duration: 1.5,
          ease: "power1.out",
          overwrite: "auto",
        });
      });
    };
    
    const handleMouseLeave = () => {
      // Reset positions
      document.querySelectorAll(".scattered-word").forEach((el) => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
        });
      });
      
      document.querySelectorAll(".regime-bg").forEach((el) => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
        });
      });
      
      const scatteredContainer = document.querySelector(".scattered-container");
      if (scatteredContainer) {
        gsap.to(scatteredContainer, {
          x: 0,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
        });
      }
      
      // Reset particles
      document.querySelectorAll(".ambient-particle").forEach((el) => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 1.5,
          ease: "power2.out",
        });
      });
    };
    
    // Throttle mouse move for performance
    let lastMoveTime = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 16) return; // ~60fps
      lastMoveTime = now;
      handleMouseMove(e);
    };
    
    window.addEventListener("mousemove", throttledMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleDomainEnter = (bgType: MarketDomain, element: HTMLElement, index: number) => {
    const profile = motionProfiles[bgType];
    
    switchBackground(bgType);
    setActiveDomainIndex(index);
    updateTelemetry(bgType);

    gsap.to(".text-domain", {
      opacity: 0.35,
      duration: profile.emphasisDuration,
      ease: "power2.out",
    });

    gsap.to(element, {
      opacity: 1,
      duration: profile.emphasisDuration,
      ease: "power2.out",
    });
  };

  const handleDomainLeave = () => {
    switchBackground("default");
    setActiveDomainIndex(-1);
    updateTelemetry("default");

    gsap.to(".text-domain", {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  // Kinetic type animation for thesis words
  const startKineticAnimation = useCallback((word: ThesisWord) => {
    if (!kineticTypeRef.current) return;
    
    // Kill any existing animation
    if (kineticAnimationRef.current) {
      kineticAnimationRef.current.kill();
    }
    
    const kineticType = kineticTypeRef.current;
    const typeLines = kineticType.querySelectorAll(".type-line");
    const oddLines = kineticType.querySelectorAll(".type-line.odd");
    const evenLines = kineticType.querySelectorAll(".type-line.even");
    
    // Set content
    const repeatedText = `${word} ${word} ${word}`;
    typeLines.forEach((line) => {
      line.textContent = repeatedText;
    });
    
    // Reset state
    gsap.set(kineticType, { display: "grid", scale: 1, rotation: 0, opacity: 1 });
    gsap.set(typeLines, { opacity: 0.02, x: "0%" });
    
    // Create animation - tuned timing
    const timeline = gsap.timeline();
    
    timeline.to(kineticType, {
      duration: 1.2,
      ease: "power4.inOut",
      scale: 2.2,
      rotation: -90,
    });
    
    timeline.to(oddLines, {
      keyframes: [
        { x: "15%", duration: 0.8, ease: "power4.inOut" },
        { x: "-180%", duration: 1.2, ease: "power4.inOut" },
      ],
      stagger: 0.06,
    }, 0);
    
    timeline.to(evenLines, {
      keyframes: [
        { x: "-15%", duration: 0.8, ease: "power4.inOut" },
        { x: "180%", duration: 1.2, ease: "power4.inOut" },
      ],
      stagger: 0.06,
    }, 0);
    
    timeline.to(typeLines, {
      keyframes: [
        { opacity: 0.8, duration: 0.6, ease: "power2.out" },
        { opacity: 0, duration: 1.0, ease: "power2.in" },
      ],
      stagger: 0.04,
    }, 0);
    
    kineticAnimationRef.current = timeline;
  }, []);

  const fadeOutKineticAnimation = useCallback(() => {
    if (!kineticTypeRef.current) return;
    
    if (kineticAnimationRef.current) {
      kineticAnimationRef.current.kill();
      kineticAnimationRef.current = null;
    }
    
    const kineticType = kineticTypeRef.current;
    const typeLines = kineticType.querySelectorAll(".type-line");
    
    gsap.to(kineticType, {
      opacity: 0,
      scale: 0.9,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(kineticType, { scale: 1, rotation: 0, opacity: 1 });
        gsap.set(typeLines, { opacity: 0.02, x: "0%" });
      },
    });
  }, []);

  // Spawn particle trail effect around an element
  const spawnParticleTrail = useCallback((element: HTMLElement, color: string) => {
    const container = particleTrailContainerRef.current;
    if (!container) return;
    
    const rect = element.getBoundingClientRect();
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle-trail";
      
      const size = 3 + Math.random() * 5;
      const startX = rect.left + Math.random() * rect.width;
      const startY = rect.top + Math.random() * rect.height;
      
      particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        left: ${startX}px;
        top: ${startY}px;
        box-shadow: 0 0 ${size * 2}px ${color};
        z-index: 200;
      `;
      
      container.appendChild(particle);
      
      // Animate particle floating upward and fading
      gsap.to(particle, {
        x: (Math.random() - 0.5) * 100,
        y: -50 - Math.random() * 80,
        opacity: 0,
        scale: 0,
        duration: 1 + Math.random() * 0.5,
        delay: i * 0.05,
        ease: "power2.out",
        onComplete: () => particle.remove(),
      });
    }
  }, []);
  
  // Magnetic CTA effect
  const handleCtaMouseMove = useCallback((e: React.MouseEvent, ctaRef: React.RefObject<HTMLDivElement | null>) => {
    if (!ctaRef.current) return;
    
    const rect = ctaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 100;
    
    if (distance < maxDistance) {
      const strength = (1 - distance / maxDistance) * 0.4;
      gsap.to(ctaRef.current, {
        x: deltaX * strength,
        y: deltaY * strength,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, []);
  
  const handleCtaMouseLeave = useCallback((ctaRef: React.RefObject<HTMLDivElement | null>) => {
    if (!ctaRef.current) return;
    
    gsap.to(ctaRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
  }, []);

  // Handle thesis word hover with character-level animation
  const handleThesisEnter = useCallback((word: ThesisWord, element: HTMLElement, index: number) => {
    if (activeThesisWord === word) return;
    setActiveThesisWord(word);
    
    const profile = thesisProfiles[word];
    
    // Show thesis background with stronger presence
    const thesisBg = document.getElementById("thesis-bg");
    if (thesisBg) {
      thesisBg.style.background = profile.bgGradient;
      gsap.to(thesisBg, { opacity: 1, duration: 0.5, ease: "power2.out" });
    }
    
    // Show corresponding thesis background image
    thesisWords.forEach((w) => {
      const imgEl = document.getElementById(`thesis-img-${w}`);
      if (imgEl) {
        gsap.to(imgEl, {
          opacity: w === word ? 0.3 : 0,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    });
    
    // Animate scattered words with highlight reveal
    document.querySelectorAll(".scattered-word").forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      const highlightBox = htmlEl.querySelector(".highlight-box") as HTMLElement;
      
      // Fade base text
      gsap.to(htmlEl, {
        opacity: 0.2,
        duration: 0.3,
        ease: "power2.out",
      });
      
      // Randomly highlight some words with yellow box reveal
      if (Math.random() > 0.6 && highlightBox) {
        gsap.to(highlightBox, {
          width: "calc(100% + 8px)",
          duration: 0.4,
          delay: Math.random() * 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            // Make text dark/black when highlighted with yellow background for visibility
            gsap.to(htmlEl, {
              color: "#0a0a0a",
              opacity: 1,
              duration: 0.2,
            });
          },
        });
      }
    });
    
    // Fade other thesis words
    gsap.to(".thesis-word", {
      opacity: 0.25,
      duration: 0.25,
      ease: "power2.out",
    });
    
    // Add glow/bloom effect and chromatic aberration to active word
    gsap.to(element, {
      textShadow: `0 0 20px ${profile.emphasisColor}, 0 0 40px ${profile.emphasisColor}, 0 0 60px ${profile.emphasisColor.replace('0.95', '0.5')}`,
      duration: 0.4,
      ease: "power2.out",
    });
    
    // Add chromatic aberration class
    element.classList.add("chromatic-active");
    
    // Spawn particle trail around the thesis word
    spawnParticleTrail(element, profile.emphasisColor);
    
    // Character-level animation for active word
    const chars = element.querySelectorAll(".thesis-char");
    gsap.to(element, {
      opacity: 1,
      duration: 0.2,
      ease: "power2.out",
    });
    
    // Animate each character with stagger
    chars.forEach((char, i) => {
      gsap.to(char, {
        y: -4,
        scale: 1.08,
        opacity: 1,
        duration: 0.35,
        delay: i * profile.charDelay,
        ease: "power2.out",
      });
    });
    
    // Expand letter spacing via the container
    gsap.to(element, {
      letterSpacing: "0.4em",
      duration: 0.5,
      ease: "power2.out",
    });
    
    // Update telemetry
    gsap.to(".telemetry-text", {
      opacity: 0.08,
      duration: 0.15,
      onComplete: () => {
        setTelemetryLine1(`MODE: ${word}`);
        setTelemetryLine2("SIGNAL: ACTIVE");
        gsap.to(".telemetry-text", { opacity: 0.2, duration: 0.25 });
      },
    });
    
    // Start kinetic animation
    startKineticAnimation(word);
  }, [activeThesisWord, startKineticAnimation, spawnParticleTrail]);

  const handleThesisLeave = useCallback(() => {
    setActiveThesisWord(null);
    
    // Fade out thesis background
    const thesisBg = document.getElementById("thesis-bg");
    if (thesisBg) {
      gsap.to(thesisBg, { opacity: 0, duration: 0.4, ease: "power2.out" });
    }
    
    // Fade out all thesis background images
    thesisWords.forEach((w) => {
      const imgEl = document.getElementById(`thesis-img-${w}`);
      if (imgEl) {
        gsap.to(imgEl, { opacity: 0, duration: 0.5, ease: "power2.out" });
      }
    });
    
    // Reset scattered words and their highlight boxes
    document.querySelectorAll(".scattered-word").forEach((el) => {
      const htmlEl = el as HTMLElement;
      const highlightBox = htmlEl.querySelector(".highlight-box") as HTMLElement;
      
      gsap.to(htmlEl, {
        opacity: 0.6,
        color: "rgba(255,204,0,0.8)",
        duration: 0.4,
        ease: "power2.out",
      });
      
      if (highlightBox) {
        gsap.to(highlightBox, {
          width: "0%",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    });
    
    // Reset all thesis words and their characters, remove chromatic aberration
    document.querySelectorAll(".thesis-word").forEach((wordEl) => {
      (wordEl as HTMLElement).classList.remove("chromatic-active");
      const chars = wordEl.querySelectorAll(".thesis-char");
      chars.forEach((char) => {
        gsap.to(char, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
    
    gsap.to(".thesis-word", {
      opacity: 0.95,
      letterSpacing: "0.22em",
      textShadow: "none",
      duration: 0.35,
      ease: "power2.out",
    });
    
    // Reset telemetry
    updateTelemetry("default");
    
    // Fade out kinetic animation
    fadeOutKineticAnimation();
  }, [updateTelemetry, fadeOutKineticAnimation]);

  // Scramble text effect with signal confirmation
  const handleAssertionEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const originalText = el.dataset.text || el.innerText;
    const chars = "0123456789%$#@!*&";
    let iterations = 0;

    // Show signal confirmed in telemetry
    gsap.to(".telemetry-text", {
      opacity: 0.08,
      duration: 0.15,
      onComplete: () => {
        setTelemetryLine2("SIGNAL CONFIRMED");
        gsap.to(".telemetry-text", { opacity: 0.18, duration: 0.2 });
      },
    });

    const interval = setInterval(() => {
      el.innerText = originalText
        .split("")
        .map((char, i) => {
          if (i < iterations) return originalText[i];
          if (char === " ") return " ";
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");

      iterations += 0.8;

      if (iterations >= originalText.length) {
        clearInterval(interval);
        el.innerText = originalText;
        // Reset telemetry after a moment
        setTimeout(() => updateTelemetry(activeBackground), 500);
      }
    }, 25);
  };

  // Navigate to markets with category filter
  const handleDomainClick = (category: string) => {
    navigate(`/markets?category=${category}`);
  };

  const getBackgroundStyle = (bg: MarketDomain): React.CSSProperties => {
    const styles: Record<MarketDomain, React.CSSProperties> = {
      default: {
        background: "radial-gradient(circle at center, rgba(255,255,255,0.04), transparent 70%)",
      },
      politics: {
        background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.9))",
      },
      sports: {
        background: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.08), transparent 65%)",
      },
      conflict: {
        background: "linear-gradient(135deg, rgba(255,80,80,0.08), rgba(0,0,0,0.95))",
      },
      crypto: {
        background: "radial-gradient(circle at 30% 60%, rgba(43,213,118,0.1), transparent 70%)",
      },
      macro: {
        background: "linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(0,0,0,1))",
      },
    };
    return styles[bg];
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen overflow-hidden bg-[#050505]" 
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <SEO
        title={brand.seo.defaultTitle}
        description={brand.seo.defaultDescription}
      />

      {/* Broadcast FX Layer - Scanlines & Grain */}
      <div 
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.03) 2px,
              rgba(0,0,0,0.03) 4px
            )
          `,
          mixBlendMode: "overlay",
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-[99] opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Alpha Banner - Protocol Style */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-amber-400">
              ALPHA_PHASE
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-white/40">
              // FEATURES MAY BE LIMITED
            </span>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Arena State Overlay - Bottom Left, clickable, persistent */}
      {showArena && (
        <div 
          className="arena-overlay fixed z-40 text-left cursor-pointer group"
          style={{ bottom: "80px", left: "16px" }}
          onClick={() => navigate("/arena")}
        >
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-400/60 group-hover:text-amber-400 transition-colors duration-150">
            {arenaText.line1}
          </div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-white/30 group-hover:text-white/50 transition-colors duration-150">
            {arenaText.line2}
          </div>
          <div className="text-[8px] uppercase tracking-[0.1em] text-white/15 mt-1 group-hover:text-white/30 transition-colors duration-150">
            CLICK TO ENTER →
          </div>
        </div>
      )}

      {/* Background Frame - Grid */}
      <div
        className="background-frame fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Market Regime Backgrounds */}
      {(["default", "politics", "sports", "conflict", "crypto", "macro"] as MarketDomain[]).map((bg) => (
        <div
          key={bg}
          id={`${bg}-bg`}
          className="regime-bg fixed inset-0 pointer-events-none z-[1]"
          style={{
            ...getBackgroundStyle(bg),
            opacity: activeBackground === bg ? 1 : 0,
          }}
        />
      ))}

      {/* Thesis Word Background with Images */}
      <div
        id="thesis-bg"
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ opacity: 0 }}
      />
      
      {/* Thesis Background Images Layer */}
      {thesisWords.map((word) => (
        <div
          key={`thesis-img-${word}`}
          id={`thesis-img-${word}`}
          className="fixed inset-0 pointer-events-none z-[0]"
          style={{
            backgroundImage: `url(${thesisProfiles[word].bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(100%)",
            opacity: 0,
            mixBlendMode: "overlay",
          }}
        />
      ))}

      {/* Kinetic Type Animation Layer */}
      <div
        ref={kineticTypeRef}
        className="fixed pointer-events-none z-[5]"
        style={{
          height: "100vmax",
          width: "100vmax",
          textTransform: "uppercase",
          display: "grid",
          justifyContent: "center",
          alignContent: "center",
          textAlign: "center",
          top: "50%",
          left: "50%",
          marginTop: "-50vmax",
          marginLeft: "-50vmax",
          transformStyle: "preserve-3d",
        }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`type-line ${i % 2 === 0 ? "odd" : "even"}`}
            style={{
              whiteSpace: "nowrap",
              fontSize: "clamp(7rem, 18.75vh, 15rem)",
              lineHeight: 0.75,
              fontWeight: "bold",
              fontFamily: "'JetBrains Mono', sans-serif",
              color: "#ffffff",
              opacity: 0.015,
              userSelect: "none",
              position: "relative",
              zIndex: i % 2 === 0 ? 50 : 150,
            }}
          >
            TRADE TRADE TRADE
          </div>
        ))}
      </div>

      {/* Scattered Background Words with Highlight Boxes */}
      <div className="scattered-container fixed inset-0 pointer-events-none z-[2]">
        {scatteredWords.map((word, i) => (
          <div
            key={`${word.text}-${i}`}
            className="scattered-word absolute text-[9px] md:text-[11px] uppercase tracking-[0.08em] whitespace-nowrap"
            style={{
              top: word.top,
              left: word.left,
              right: word.right,
              color: "rgba(255,204,0,0.8)",
              fontFamily: "'JetBrains Mono', monospace",
              opacity: 0.6,
            }}
            data-text={word.text}
            data-parallax-speed={0.02 + (i % 5) * 0.01}
          >
            {/* Highlight box for reveal animation */}
            <span 
              className="highlight-box absolute -top-[2px] -left-[4px] h-[calc(100%+4px)] bg-amber-400 z-[-1]"
              style={{ width: 0 }}
            />
            <span className="relative z-[1]">{word.text}</span>
          </div>
        ))}
      </div>

      {/* Floating Ambient Particles with Idle Animation */}
      <div id="particle-container" className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const size = 2 + Math.random() * 4;
          const baseX = Math.random() * 100;
          const baseY = Math.random() * 100;
          const animDuration = 8 + Math.random() * 12;
          const animDelay = Math.random() * -20;
          
          return (
            <div
              key={i}
              className="ambient-particle absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: `rgba(255, 204, 0, ${0.1 + Math.random() * 0.2})`,
                left: `${baseX}%`,
                top: `${baseY}%`,
                boxShadow: `0 0 ${4 + Math.random() * 8}px rgba(255, 204, 0, 0.3)`,
                animation: `particleFloat${i % 4} ${animDuration}s ease-in-out infinite`,
                animationDelay: `${animDelay}s`,
              }}
              data-speed-x={0.01 + Math.random() * 0.03}
              data-speed-y={0.01 + Math.random() * 0.03}
              data-base-x={baseX}
              data-base-y={baseY}
            />
          );
        })}
      </div>
      
      {/* Particle Float Keyframes */}
      <style>{`
        @keyframes particleFloat0 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(15px, -20px); }
          50% { transform: translate(-10px, -35px); }
          75% { transform: translate(20px, -15px); }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-20px, 15px); }
          50% { transform: translate(25px, 10px); }
          75% { transform: translate(-15px, -20px); }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, 25px); }
          50% { transform: translate(-20px, 15px); }
          75% { transform: translate(15px, -10px); }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-15px, -15px); }
          50% { transform: translate(20px, -25px); }
          75% { transform: translate(-10px, 20px); }
        }
        
        @keyframes ctaPulse {
          0%, 100% { 
            text-shadow: 0 0 8px rgba(255, 204, 0, 0.3), 0 0 16px rgba(255, 204, 0, 0.2);
          }
          50% { 
            text-shadow: 0 0 16px rgba(255, 204, 0, 0.5), 0 0 32px rgba(255, 204, 0, 0.3), 0 0 48px rgba(255, 204, 0, 0.15);
          }
        }
        
        /* Chromatic Aberration Effect */
        @keyframes chromaticShift {
          0%, 100% {
            text-shadow: 
              -2px 0 rgba(255, 0, 0, 0.5),
              2px 0 rgba(0, 255, 255, 0.5),
              0 0 20px currentColor;
          }
          33% {
            text-shadow: 
              -3px 1px rgba(255, 0, 0, 0.6),
              3px -1px rgba(0, 255, 255, 0.6),
              0 0 25px currentColor;
          }
          66% {
            text-shadow: 
              -1px -1px rgba(255, 0, 0, 0.4),
              1px 1px rgba(0, 255, 255, 0.4),
              0 0 15px currentColor;
          }
        }
        
        .chromatic-active {
          animation: chromaticShift 2s ease-in-out infinite;
          position: relative;
        }
        
        .chromatic-active::before,
        .chromatic-active::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chromatic-active::before {
          color: rgba(255, 0, 0, 0.4);
          animation: glitchLeft 3s ease-in-out infinite;
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
        }
        
        .chromatic-active::after {
          color: rgba(0, 255, 255, 0.4);
          animation: glitchRight 3s ease-in-out infinite;
          clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
        }
        
        @keyframes glitchLeft {
          0%, 100% { transform: translateX(-2px); }
          25% { transform: translateX(-3px) translateY(1px); }
          50% { transform: translateX(-1px); }
          75% { transform: translateX(-2px) translateY(-1px); }
        }
        
        @keyframes glitchRight {
          0%, 100% { transform: translateX(2px); }
          25% { transform: translateX(1px) translateY(-1px); }
          50% { transform: translateX(3px); }
          75% { transform: translateX(2px) translateY(1px); }
        }
      `}</style>

      {/* Bottom Gradient */}
      <div 
        className="fixed bottom-0 left-0 w-full h-[40%] z-[3] pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}
      />

      {/* Text Layer */}
      <div className="relative w-full h-full z-[3] pointer-events-none" style={{ paddingTop: showBanner ? "32px" : "0" }}>
        
        {/* Logo - Full Logo - Links to molfi.com */}
        <a 
          href="https://molfi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="logo-container absolute pointer-events-auto cursor-pointer"
          style={{ top: showBanner ? "6%" : "4%", right: "4%" }}
        >
          <img src={logo} alt="Molfi" className="h-6 md:h-8 opacity-80 hover:opacity-100 transition-opacity" />
        </a>

        {/* Telemetry HUD */}
        <div 
          className="telemetry-text absolute text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-white/12 pointer-events-none"
          style={{ top: showBanner ? "7%" : "5%", left: "4%" }}
        >
          {telemetryLine1}
        </div>
        <div 
          className="telemetry-text absolute text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-white/12 pointer-events-none"
          style={{ top: showBanner ? "10%" : "8%", left: "4%" }}
        >
          {telemetryLine2}
        </div>

        {/* Market Domains */}
        <div className="absolute w-full flex justify-center gap-4 sm:gap-8 md:gap-16 px-4 z-10" style={{ top: showBanner ? "16%" : "14%" }}>
          {domains.map((domain, index) => (
            <div
              key={domain.text}
              className={`text-domain text-xs sm:text-sm md:text-base uppercase tracking-[0.08em] md:tracking-[0.12em] cursor-pointer transition-colors duration-200 pointer-events-auto font-medium ${
                activeDomainIndex === index ? "text-amber-400" : "text-white hover:text-amber-400"
              }`}
              onMouseEnter={(e) => handleDomainEnter(domain.bgType, e.currentTarget, index)}
              onMouseLeave={handleDomainLeave}
              onClick={() => handleDomainClick(domain.category)}
            >
              {domain.text}
            </div>
          ))}
        </div>

        {/* Mobile Swipe Indicator */}
        <div className="absolute w-full text-center md:hidden pointer-events-none" style={{ top: showBanner ? "23%" : "21%" }}>
          <span className="text-[9px] uppercase tracking-[0.1em] text-white/30">
            ← SWIPE TO EXPLORE →
          </span>
        </div>

        {/* Active Domain Indicator (Mobile) */}
        {activeDomainIndex >= 0 && (
          <div className="absolute w-full flex justify-center gap-2 md:hidden pointer-events-none" style={{ top: showBanner ? "26%" : "24%" }}>
            {domains.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  activeDomainIndex === index ? "bg-amber-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}

        {/* Core Thesis - Interactive Rows with Character Splitting */}
        <div 
          className="thesis-container absolute w-full flex flex-col items-center gap-2 md:gap-3 z-10"
          style={{ top: showBanner ? "32%" : "29%" }}
        >
          {thesisWords.map((word, index) => (
            <div
              key={word}
              ref={(el) => { thesisRowRefs.current[index] = el; }}
              data-text={word}
              className={`thesis-word text-xl sm:text-2xl md:text-4xl lg:text-6xl uppercase tracking-[0.22em] cursor-pointer pointer-events-auto flex items-center justify-center ${
                activeThesisWord === word 
                  ? "text-white" 
                  : "text-white/95"
              }`}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
              }}
              onMouseEnter={(e) => handleThesisEnter(word, e.currentTarget, index)}
              onMouseLeave={handleThesisLeave}
            >
              {word.split("").map((char, charIndex) => (
                <span
                  key={charIndex}
                  className="thesis-char inline-block"
                  style={{
                    display: "inline-block",
                    willChange: "transform",
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Assertions */}
        <div 
          className="text-assertion absolute text-[10px] md:text-sm uppercase tracking-[0.12em] text-white/40 cursor-default pointer-events-auto hidden sm:block"
          style={{ top: "50%", left: "10%" }}
          data-text="OUTCOMES ARE LIQUID"
          onMouseEnter={handleAssertionEnter}
        >
          OUTCOMES ARE LIQUID
        </div>
        <div 
          className="text-assertion absolute text-[10px] md:text-sm uppercase tracking-[0.12em] text-white/40 cursor-default pointer-events-auto hidden sm:block"
          style={{ top: "56%", left: "55%" }}
          data-text="BELIEF IS PRICED"
          onMouseEnter={handleAssertionEnter}
        >
          BELIEF IS PRICED
        </div>
        <div 
          className="text-assertion absolute text-[10px] md:text-sm uppercase tracking-[0.12em] text-white/40 cursor-default pointer-events-auto hidden sm:block"
          style={{ top: "62%", left: "30%" }}
          data-text="TIME COMPRESSES"
          onMouseEnter={handleAssertionEnter}
        >
          TIME COMPRESSES
        </div>

        {/* Market Primitives */}
        <div className="absolute w-full flex justify-center gap-6 md:gap-12 lg:gap-20 hidden md:flex" style={{ top: "74%" }}>
          {["PROBABILITY", "LIQUIDITY", "VOLATILITY", "RESOLUTION"].map((primitive) => (
            <div 
              key={primitive}
              className="text-primitive text-[10px] md:text-xs uppercase tracking-[0.12em] text-white/20 pointer-events-none"
            >
              {primitive}
            </div>
          ))}
        </div>

        {/* Mobile Subtitle */}
        <div 
          className="absolute text-[9px] uppercase tracking-[0.1em] text-white/30 text-center w-full px-4 sm:hidden pointer-events-none"
          style={{ top: "44%" }}
        >
          AGGREGATED PREDICTION MARKETS
        </div>

        {/* Version / Status Footer */}
        <div 
          className="absolute text-[9px] uppercase tracking-[0.1em] text-white/20 text-center w-full pointer-events-none"
          style={{ bottom: "4%" }}
        >
          NETWORK_STATUS: DEVELOPMENT • BUILD: 0.1.0-ALPHA
        </div>
      </div>

      {/* Particle Trail Container */}
      <div ref={particleTrailContainerRef} className="fixed inset-0 pointer-events-none z-[150]" />

      {/* Primary Interaction Layer - ABOVE all FX layers */}
      <div 
        className="fixed inset-0 z-[110] pointer-events-none"
        style={{ mixBlendMode: "normal" }}
      >
        {/* CTA: Explore Markets with Pulsing Glow & Magnetic Effect */}
        <div 
          ref={ctaLeftRef}
          className="text-cta absolute text-[10px] sm:text-xs uppercase tracking-[0.14em] cursor-pointer pointer-events-auto transition-colors duration-200 hover:text-amber-300"
          style={{ 
            bottom: "15%", 
            left: "8%", 
            color: "rgba(200, 190, 150, 0.7)",
            mixBlendMode: "normal",
            animation: "ctaPulse 3s ease-in-out infinite",
          }}
          onClick={() => navigate("/markets")}
          onMouseMove={(e) => handleCtaMouseMove(e, ctaLeftRef)}
          onMouseLeave={() => handleCtaMouseLeave(ctaLeftRef)}
        >
          EXPLORE MARKETS →
        </div>

        {/* CTA: Get Access / Waitlist Status - Centered */}
        <WaitlistCTA />

        {/* CTA: Soft Stake with Pulsing Glow & Magnetic Effect */}
        <div 
          ref={ctaRightRef}
          className="text-cta absolute text-[10px] sm:text-xs uppercase tracking-[0.14em] cursor-pointer pointer-events-auto transition-colors duration-200 hover:text-amber-300"
          style={{ 
            bottom: "15%", 
            right: "8%", 
            color: "rgba(200, 190, 150, 0.7)",
            mixBlendMode: "normal",
            animation: "ctaPulse 3s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
          onClick={() => navigate("/earn")}
          onMouseMove={(e) => handleCtaMouseMove(e, ctaRightRef)}
          onMouseLeave={() => handleCtaMouseLeave(ctaRightRef)}
        >
          SOFT STAKE →
        </div>
      </div>
    </div>
  );
};

export default Index;
