import { useState, useEffect, useRef } from "react";

export type TypewriterPhase = "typing" | "paused" | "deleting" | "cycling";

export function useTypewriter(
  repositories: string[],
  typingSpeed = 45,
  deleteSpeed = 25,
  pauseDuration = 2000,
  cycleDuration = 3000
) {
  const [displayText, setDisplayText] = useState("");
  const [currentRepoIndex, setCurrentRepoIndex] = useState(0);
  const [phase, setPhase] = useState<TypewriterPhase>("typing");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTabVisibleRef = useRef(true);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Monitor Page Visibility API
  useEffect(() => {
    if (typeof document !== "undefined") {
      const handleVisibilityChange = () => {
        isTabVisibleRef.current = !document.hidden;
      };
      
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, []);

  // Typewriter phase cycle (First Repository Only)
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText("any codebase");
      setPhase("cycling");
      return;
    }

    if (phase === "cycling") return;

    const currentRepo = repositories[currentRepoIndex] || "";

    const tick = () => {
      if (!isTabVisibleRef.current) {
        // Tab hidden, try again in 500ms
        timerRef.current = setTimeout(tick, 500);
        return;
      }

      if (phase === "typing") {
        if (displayText.length < currentRepo.length) {
          setDisplayText(currentRepo.slice(0, displayText.length + 1));
          timerRef.current = setTimeout(tick, typingSpeed);
        } else {
          setPhase("paused");
        }
      } else if (phase === "paused") {
        setPhase("deleting");
      } else if (phase === "deleting") {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, displayText.length - 1));
          timerRef.current = setTimeout(tick, deleteSpeed);
        } else {
          // Transition to cycling mode
          setPhase("cycling");
          const nextIndex = 1 % repositories.length;
          setCurrentRepoIndex(nextIndex);
          setDisplayText(repositories[nextIndex] || "");
          setIsTransitioning(true);
          
          timerRef.current = setTimeout(() => {
            setIsTransitioning(false);
          }, 300);
        }
      }
    };

    if (phase === "typing") {
      timerRef.current = setTimeout(tick, typingSpeed);
    } else if (phase === "paused") {
      timerRef.current = setTimeout(tick, pauseDuration);
    } else if (phase === "deleting") {
      timerRef.current = setTimeout(tick, deleteSpeed);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayText, phase, currentRepoIndex, repositories, typingSpeed, deleteSpeed, pauseDuration, prefersReducedMotion]);

  // Smooth cycling phase cycle (All subsequent repositories)
  useEffect(() => {
    if (prefersReducedMotion || phase !== "cycling") return;

    const cycleNext = () => {
      if (!isTabVisibleRef.current) {
        timerRef.current = setTimeout(cycleNext, 500);
        return;
      }

      // Start fade out and slide up
      setIsTransitioning(true);

      timerRef.current = setTimeout(() => {
        const nextIndex = (currentRepoIndex + 1) % repositories.length;
        setCurrentRepoIndex(nextIndex);
        setDisplayText(repositories[nextIndex] || "");

        // Fade in
        timerRef.current = setTimeout(() => {
          setIsTransitioning(false);
          timerRef.current = setTimeout(cycleNext, cycleDuration);
        }, 150); // half duration fade in
      }, 150); // half duration fade out
    };

    timerRef.current = setTimeout(cycleNext, cycleDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, currentRepoIndex, repositories, cycleDuration, prefersReducedMotion]);

  return {
    displayText,
    currentRepoIndex,
    phase,
    isTransitioning,
    prefersReducedMotion,
  };
}
