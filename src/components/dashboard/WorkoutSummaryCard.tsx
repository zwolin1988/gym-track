import { Clock, Dumbbell, Hash, Repeat, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutSummaryCardProps } from "./types";

/**
 * Formatuje czas trwania z minut na czytelny format
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

/**
 * Formatuje datę do polskiego formatu
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Reużywalna karta do wyświetlania podsumowania treningu
 * Używana w Dashboard, historii treningów i innych miejscach
 */
export function WorkoutSummaryCard({ stats, planName, date, workoutId, onClick }: WorkoutSummaryCardProps) {
  const href = workoutId ? `/workouts/${workoutId}/summary` : undefined;

  const content = (
    <>
      <CardHeader>
        <CardTitle className="text-lg">{planName}</CardTitle>
        <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Czas trwania */}
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Czas</p>
              <p className="text-lg font-semibold">{formatDuration(stats.duration_minutes)}</p>
            </div>
          </div>

          {/* Objętość - wyróżniona */}
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Objętość</p>
              <p className="text-lg font-bold text-primary">{stats.total_volume.toLocaleString("pl-PL")} kg</p>
            </div>
          </div>

          {/* Serie */}
          <div className="flex items-center space-x-2">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Serie</p>
              <p className="text-lg font-semibold">{stats.total_sets}</p>
            </div>
          </div>

          {/* Powtórzenia */}
          <div className="flex items-center space-x-2">
            <Repeat className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Powtórzenia</p>
              <p className="text-lg font-semibold">{stats.total_reps}</p>
            </div>
          </div>

          {/* Maks. ciężar (opcjonalnie) */}
          {stats.max_weight > 0 && (
            <div className="flex items-center space-x-2">
              <Weight className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Maks. ciężar</p>
                <p className="text-lg font-semibold">{stats.max_weight} kg</p>
              </div>
            </div>
          )}

          {/* Ćwiczenia */}
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Ćwiczenia</p>
              <p className="text-lg font-semibold">{stats.total_exercises}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );

  if (href && !onClick) {
    return (
      <Card asChild className="hover:shadow-lg transition-shadow h-full">
        <a href={href}>{content}</a>
      </Card>
    );
  }

  if (onClick) {
    return (
      <Card asChild className="cursor-pointer hover:shadow-lg transition-shadow h-full">
        <button onClick={onClick} type="button">
          {content}
        </button>
      </Card>
    );
  }

  return <Card className="h-full">{content}</Card>;
}
