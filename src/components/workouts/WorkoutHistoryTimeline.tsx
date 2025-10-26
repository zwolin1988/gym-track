/**
 * WorkoutHistoryTimeline Component
 *
 * Main container displaying workouts in timeline format.
 * Renders WorkoutHistoryItem components for each workout.
 * Handles empty state, loading state, and workout grouping.
 */

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutHistoryItem } from "./WorkoutHistoryItem";
import type { WorkoutHistoryTimelineProps } from "./types";

export function WorkoutHistoryTimeline({ workouts, isLoading, onWorkoutClick }: WorkoutHistoryTimelineProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!workouts || workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center shadow-sm">
        <History className="mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Brak treningów</h3>
        <p className="mb-4 max-w-md text-muted-foreground">
          Nie masz jeszcze |adnych zakoDczonych treningów. Rozpocznij trening, aby zobaczy histori.
        </p>
        <Button asChild>
          <a href="/workout-plans">Wybierz plan treningowy</a>
        </Button>
      </div>
    );
  }

  // Timeline
  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <WorkoutHistoryItem key={workout.id} workout={workout} onClick={onWorkoutClick} />
      ))}
    </div>
  );
}
