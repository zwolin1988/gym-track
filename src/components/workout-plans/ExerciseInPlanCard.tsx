import type { PlanExerciseDTO } from "@/types";
import type { SelectedExercise } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExerciseSetsEditor } from "./ExerciseSetsEditor";

interface ExerciseInPlanCardProps {
  exercise: PlanExerciseDTO | SelectedExercise;
  index: number;
  // Opcjonalne propsy dla trybu edycji
  editMode?: boolean;
  onUpdateSets?: (sets: SelectedExercise["sets"]) => void;
  onRemove?: () => void;
  draggable?: boolean;
}

// Helper function to check if exercise is SelectedExercise type
function isSelectedExercise(exercise: PlanExerciseDTO | SelectedExercise): exercise is SelectedExercise {
  return "exerciseId" in exercise;
}

export default function ExerciseInPlanCard({
  exercise,
  index,
  editMode = false,
  onUpdateSets,
  onRemove,
  draggable = false,
}: ExerciseInPlanCardProps) {
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

  // Drag and drop setup - always call hook, but only use it if draggable
  const sortable = useSortable({
    id: isSelectedExercise(exercise) ? exercise.exerciseId : exercise.exercise.id,
    disabled: !draggable,
  });

  const style = draggable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.5 : 1,
      }
    : undefined;

  // Get exercise data based on type
  const exerciseData = isSelectedExercise(exercise) ? exercise.exercise : exercise.exercise;
  const sets = exercise.sets;

  return (
    <div
      ref={draggable ? sortable.setNodeRef : undefined}
      style={style}
      className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Drag handle (only in edit mode with draggable) */}
        {editMode && draggable && (
          <button
            type="button"
            className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none pt-1"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        {/* Exercise Image */}
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {exerciseData.image_path ? (
            <img
              src={exerciseData.image_path}
              alt={exerciseData.name}
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
                <h3 className="font-semibold">{exerciseData.name}</h3>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {exerciseData.category.name}
                </Badge>
                <Badge variant="outline" className={`text-xs ${difficultyColors[exerciseData.difficulty]}`}>
                  {difficultyLabels[exerciseData.difficulty]}
                </Badge>
              </div>
            </div>

            {/* Remove button (only in edit mode) */}
            {editMode && onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Sets - Display or Edit mode */}
          <div className="mt-3">
            {editMode && onUpdateSets && isSelectedExercise(exercise) ? (
              <ExerciseSetsEditor exerciseName={exerciseData.name} sets={exercise.sets} onUpdate={onUpdateSets} />
            ) : (
              <>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Serie ({sets.length}):</p>
                <div className="space-y-1">
                  {sets.map((set, setIndex) => (
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
