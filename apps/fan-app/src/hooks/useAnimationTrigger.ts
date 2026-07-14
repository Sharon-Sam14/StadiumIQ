import { useState, useCallback, useRef } from "react";

// ============================================================
// ANIMATION TRIGGER HOOK
// Helper for managing one-shot animated states (e.g. goal celebration)
// ============================================================

interface UseAnimationTriggerReturn {
  isTriggered: boolean;
  trigger: () => void;
  reset: () => void;
}

export function useAnimationTrigger(durationMs: number = 1000): UseAnimationTriggerReturn {
  const [isTriggered, setIsTriggered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback((): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsTriggered(false);
  }, []);

  const trigger = useCallback((): void => {
    reset();
    setIsTriggered(true);
    timerRef.current = setTimeout(() => {
      setIsTriggered(false);
    }, durationMs);
  }, [durationMs, reset]);

  return { isTriggered, trigger, reset };
}
