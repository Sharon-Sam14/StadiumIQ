import { useEffect, useRef, useState } from "react";

// ============================================================
// USE MATCH CLOCK HOOK — counts up from 0:00
// ============================================================

const INITIAL_ELAPSED_SECONDS = 4512; // Starting at ~75:12 for demo realism

export function useMatchClock(): {
  elapsedSeconds: number;
  isRunning: boolean;
} {
  const [elapsedSeconds, setElapsedSeconds] = useState(INITIAL_ELAPSED_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Small delay before starting clock to simulate "loading"
    const startDelay = setTimeout(() => {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }, 1000);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { elapsedSeconds, isRunning };
}
