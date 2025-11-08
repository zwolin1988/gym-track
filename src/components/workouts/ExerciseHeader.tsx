interface ExerciseHeaderProps {
  name: string;
  imagePath: string | null;
  completedSets: number;
  totalSets: number;
}

export function ExerciseHeader({ name, imagePath, completedSets, totalSets }: ExerciseHeaderProps) {
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Exercise Image */}
      {imagePath ? (
        <img
          src={imagePath}
          alt={name}
          className="h-10 w-10 rounded-lg object-cover ring-2 ring-border sm:h-12 sm:w-12"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-2 ring-border sm:h-12 sm:w-12">
          <span className="text-lg font-bold text-primary sm:text-xl">{name.charAt(0)}</span>
        </div>
      )}

      {/* Exercise Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold group-hover:text-primary sm:text-base">{name}</h3>
        <div className="mt-1 flex items-center gap-2 sm:mt-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted sm:h-2">
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
