interface ExerciseHeaderProps {
  name: string;
  imagePath: string | null;
  completedSets: number;
  totalSets: number;
}

export function ExerciseHeader({ name, imagePath, completedSets, totalSets }: ExerciseHeaderProps) {
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Exercise Image */}
      {imagePath ? (
        <img src={imagePath} alt={name} className="h-12 w-12 rounded-lg object-cover ring-2 ring-border" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ring-2 ring-border">
          <span className="text-xl font-bold text-primary">{name.charAt(0)}</span>
        </div>
      )}

      {/* Exercise Info */}
      <div className="flex-1">
        <h3 className="font-semibold group-hover:text-primary">{name}</h3>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {completedSets}/{totalSets}
          </span>
        </div>
      </div>
    </div>
  );
}
