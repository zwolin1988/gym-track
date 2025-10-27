import { Clock } from "lucide-react";
import { useWorkoutTimer } from "./hooks/useWorkoutTimer";

interface WorkoutTimerProps {
  startedAt: string;
}

export function WorkoutTimer({ startedAt }: WorkoutTimerProps) {
  const { hours, minutes, seconds } = useWorkoutTimer(startedAt);

  const displayTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm sm:px-4">
      <Clock className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Czas</span>
        <span className="tabular-nums text-sm font-bold sm:text-lg">{displayTime}</span>
      </div>
    </div>
  );
}
