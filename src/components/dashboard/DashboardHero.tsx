import { Dumbbell, TrendingUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveWorkoutBanner } from "./ActiveWorkoutBanner";
import type { DashboardHeroProps } from "./types";

/**
 * Sekcja Hero Dashboard wyświetlająca:
 * - Banner z aktywnym treningiem i CTA "Kontynuuj trening" (jeśli trening aktywny)
 * - Motywujący komunikat i CTA "Rozpocznij trening" (jeśli brak aktywnego treningu)
 */
export function DashboardHero({ activeWorkout }: DashboardHeroProps) {
  if (activeWorkout) {
    return (
      <section className="mb-8">
        <ActiveWorkoutBanner workout={activeWorkout} />
      </section>
    );
  }

  return (
    <section className="mb-12 bg-gradient-to-br from-primary/5 to-muted rounded-lg p-8 md:p-12">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <Dumbbell className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Gotowy na trening?</h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Śledź swoje postępy, buduj mięśnie i osiągaj cele treningowe z Gym Track
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <a href="/workout-plans">
              <Play className="w-5 h-5 mr-2" />
              Rozpocznij trening
            </a>
          </Button>

          <Button asChild variant="outline" size="lg">
            <a href="/workouts/history">
              <TrendingUp className="w-5 h-5 mr-2" />
              Zobacz postępy
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
