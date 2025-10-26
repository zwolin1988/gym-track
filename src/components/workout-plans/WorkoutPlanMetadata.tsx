interface WorkoutPlanMetadataProps {
  exerciseCount: number;
  totalSets: number;
  lastUsedAt: string | null;
}

export default function WorkoutPlanMetadata({ exerciseCount, totalSets, lastUsedAt }: WorkoutPlanMetadataProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "Nigdy";
    return new Date(date).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      {/* Exercises Count */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-xl text-primary">fitness_center</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ćwiczenia</p>
            <p className="text-2xl font-bold">{exerciseCount}</p>
          </div>
        </div>
      </div>

      {/* Total Sets */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-xl text-primary">format_list_numbered</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serie</p>
            <p className="text-2xl font-bold">{totalSets}</p>
          </div>
        </div>
      </div>

      {/* Last Used */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-xl text-primary">event</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ostatni trening</p>
            <p className="text-lg font-semibold">{formatDate(lastUsedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
