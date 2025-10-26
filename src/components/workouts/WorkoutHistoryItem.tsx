/**
 * WorkoutHistoryItem Component
 *
 * Interactive card representing a single workout in the timeline.
 * Displays date, time, plan name, duration, volume, and exercise count.
 * Clicking opens a modal with full workout details.
 */

import { Calendar, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkoutHistoryItemProps } from "./types";
import { formatDate, formatTime, formatDuration, formatNumber } from "@/lib/utils/dates";

export function WorkoutHistoryItem({ workout, onClick }: WorkoutHistoryItemProps) {
  if (!workout?.id) {
    return null;
  }

  const stats = workout.stats;

  const handleClick = () => {
    onClick(workout.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(workout.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Zobacz szczeg�By treningu ${workout.plan_name} z dnia ${formatDate(workout.started_at)}`}
      className="group relative cursor-pointer overflow-hidden rounded-lg border-l-4 border-l-green-500 bg-card shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-1 text-lg font-bold group-hover:text-primary">{workout.plan_name}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(workout.started_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(workout.started_at)}
              </span>
            </div>
          </div>

          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            ZakoDczony
          </Badge>
        </div>
      </div>

      {/* Statystyki */}
      {stats ? (
        <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          {/* Czas trwania */}
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Czas</p>
              <p className="text-sm font-semibold">{formatDuration(stats.duration_minutes)}</p>
            </div>
          </div>

          {/* Objto[ */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Objto[</p>
              <p className="text-sm font-semibold">{formatNumber(stats.total_volume)} kg</p>
            </div>
          </div>

          {/* Liczba wiczeD */}
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">wiczenia</p>
              <p className="text-sm font-semibold">{stats.total_exercises}</p>
            </div>
          </div>

          {/* Liczba serii */}
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center text-muted-foreground font-bold">#</div>
            <div>
              <p className="text-xs text-muted-foreground">Serie</p>
              <p className="text-sm font-semibold">{stats.total_sets}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm italic text-muted-foreground">Statystyki niedostpne</p>
        </div>
      )}
    </div>
  );
}
