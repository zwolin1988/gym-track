/**
 * WorkoutHistoryHeader Component
 *
 * Displays the page header with workout statistics summary.
 * Shows total number of workouts, total volume, and average volume per workout.
 */

import type { WorkoutHistoryHeaderProps } from "./types";
import { formatNumber } from "@/lib/utils/dates";

export function WorkoutHistoryHeader({ totalWorkouts, totalVolume }: WorkoutHistoryHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Historia treningów</h1>
      <p className="mb-6 text-muted-foreground">Przegldaj swoje ukoDczone treningi</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {/* Liczba treningów */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="mb-1 text-sm text-muted-foreground">Liczba treningów</p>
          <p className="text-2xl font-bold">{totalWorkouts}</p>
        </div>

        {/* CaBkowita objto[ */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="mb-1 text-sm text-muted-foreground">CaBkowita objto[</p>
          <p className="text-2xl font-bold">
            {formatNumber(totalVolume)} <span className="text-lg">kg</span>
          </p>
        </div>

        {/* Zrednia objto[ na trening */}
        {totalWorkouts > 0 && (
          <div className="col-span-2 rounded-lg border bg-card p-4 shadow-sm md:col-span-1">
            <p className="mb-1 text-sm text-muted-foreground">Zrednia objto[</p>
            <p className="text-2xl font-bold">
              {formatNumber(Math.round(totalVolume / totalWorkouts))} <span className="text-lg">kg</span>
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
