import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkoutTimer } from "@/components/hooks/useWorkoutTimer";
import type { ActiveWorkoutBannerProps } from "./types";

/**
 * Sticky banner wyświetlany na wszystkich stronach aplikacji gdy użytkownik ma aktywny trening.
 * Pokazuje kluczowe informacje i CTA do kontynuacji.
 */
export function ActiveWorkoutBanner({ workout }: ActiveWorkoutBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const timeElapsed = useWorkoutTimer(workout.started_at || "");

  // Sprawdź localStorage przy montowaniu
  useEffect(() => {
    if (!workout?.id) return;
    const dismissed = localStorage.getItem(`banner-dismissed-${workout.id}`);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, [workout?.id]);

  // Walidacja danych
  if (!workout?.id || !workout?.started_at || !workout?.plan_name) {
    return null;
  }

  // Oblicz liczbę wykonanych serii
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`banner-dismissed-${workout.id}`, "true");
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Play className="w-5 h-5" />
            <div>
              <p className="font-semibold">{workout.plan_name}</p>
              <p className="text-sm text-primary-foreground/80">
                {timeElapsed} • {completedSets}/{totalSets} serii wykonanych
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button asChild variant="secondary" size="sm">
              <a href="/workouts/active">Kontynuuj trening</a>
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-primary/80 rounded transition-colors"
              aria-label="Zamknij banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
