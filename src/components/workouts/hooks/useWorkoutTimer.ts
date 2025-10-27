import { useState, useEffect } from "react";
import type { UseWorkoutTimerReturn } from "../types";

/**
 * Hook do zarzdzania timerem treningu
 * Aktualizuje si co sekund i zwraca czas w formacie hours, minutes, seconds
 */
export function useWorkoutTimer(startedAt: string): UseWorkoutTimerReturn {
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    // Oblicz pocztkowy czas
    const startTime = new Date(startedAt).getTime();
    const now = Date.now();
    const initialSeconds = Math.floor((now - startTime) / 1000);
    setTotalSeconds(initialSeconds);

    // Ustaw interval do aktualizacji co sekund
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      setTotalSeconds(elapsed);
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [startedAt]);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
  };
}
