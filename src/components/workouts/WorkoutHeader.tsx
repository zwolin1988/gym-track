import { WorkoutTimer } from "./WorkoutTimer";
import { Dumbbell } from "lucide-react";

interface WorkoutHeaderProps {
  planName: string;
  startedAt: string;
}

export function WorkoutHeader({ planName, startedAt }: WorkoutHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-card shadow-md">
      <div className="container mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{planName}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Aktywny trening</p>
            </div>
          </div>
          <WorkoutTimer startedAt={startedAt} />
        </div>
      </div>
    </header>
  );
}
