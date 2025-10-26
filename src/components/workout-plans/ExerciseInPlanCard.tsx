import type { PlanExerciseDTO } from "@/types";
import { Badge } from "@/components/ui/badge";

interface ExerciseInPlanCardProps {
  exercise: PlanExerciseDTO;
  index: number;
}

export default function ExerciseInPlanCard({ exercise, index }: ExerciseInPlanCardProps) {
  const difficultyColors = {
    easy: "bg-green-500/10 text-green-700 dark:text-green-400",
    medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    hard: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  const difficultyLabels = {
    easy: "Łatwy",
    medium: "Średni",
    hard: "Trudny",
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Exercise Image */}
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {exercise.exercise.image_path ? (
            <img
              src={exercise.exercise.image_path}
              alt={exercise.exercise.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-exercise.png";
              }}
            />
          ) : (
            <span className="material-symbols-outlined text-3xl text-muted-foreground">fitness_center</span>
          )}
        </div>

        {/* Exercise Info */}
        <div className="flex-1">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">#{index + 1}</span>
                <h3 className="font-semibold">{exercise.exercise.name}</h3>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {exercise.exercise.category.name}
                </Badge>
                <Badge variant="outline" className={`text-xs ${difficultyColors[exercise.exercise.difficulty]}`}>
                  {difficultyLabels[exercise.exercise.difficulty]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Sets List */}
          <div className="mt-3">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Serie ({exercise.sets.length}):</p>
            <div className="space-y-1">
              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-muted-foreground">Seria {setIndex + 1}:</span>
                  <span className="font-medium">
                    {set.reps} {set.reps === 1 ? "powtórzenie" : "powtórzenia"}
                  </span>
                  {set.weight !== null && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium">{set.weight} kg</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
