import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutSummaryCard } from "./WorkoutSummaryCard";
import type { LastWorkoutSummaryProps } from "./types";

/**
 * Podsumowanie ostatniego zakończonego treningu.
 * Wyświetla kluczowe metryki i link do szczegółów treningu.
 * Służy jako punkt odniesienia i motywacji.
 */
export function LastWorkoutSummary({ lastWorkout }: LastWorkoutSummaryProps) {
  if (!lastWorkout || !lastWorkout.stats) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Ostatni trening</h2>
        <div className="bg-muted rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nie wykonałeś jeszcze żadnego treningu</p>
          <Button asChild variant="outline">
            <a href="/workout-plans">Rozpocznij trening</a>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Ostatni trening</h2>
        <Button asChild variant="link">
          <a href={`/workouts/${lastWorkout.id}/summary`}>Zobacz szczegóły →</a>
        </Button>
      </div>

      <div className="flex-1">
        <WorkoutSummaryCard
          stats={lastWorkout.stats}
          planName={lastWorkout.plan_name}
          date={lastWorkout.completed_at || lastWorkout.started_at}
          workoutId={lastWorkout.id}
        />
      </div>
    </section>
  );
}
