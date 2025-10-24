import { useState, useEffect } from "react";

/**
 * Hook do obliczania czasu trwania treningu w czasie rzeczywistym
 * @param startedAt - ISO 8601 date string
 * @returns Sformatowany czas trwania (np. "1h 30min" lub "45min")
 */
export function useWorkoutTimer(startedAt: string): string {
  const [timeElapsed, setTimeElapsed] = useState("0min");

  useEffect(() => {
    // Walidacja daty
    const start = new Date(startedAt);
    if (isNaN(start.getTime())) {
      return;
    }

    // Funkcja aktualizacji czasu
    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      if (hours > 0) {
        setTimeElapsed(`${hours}h ${minutes}min`);
      } else {
        setTimeElapsed(`${minutes}min`);
      }
    };

    // Inicjalne wywołanie
    updateTime();

    // Interval co sekundę
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return timeElapsed;
}
