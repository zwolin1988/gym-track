import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseAccordion } from "./ExerciseAccordion";
import type { WorkoutExerciseDTO, WorkoutSetDTO, CreateWorkoutSetCommand } from "@/types";

interface ExerciseListProps {
  exercises: WorkoutExerciseDTO[];
  focusMode: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  isLoading: boolean;
}

export function ExerciseList({
  exercises,
  focusMode,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  isLoading,
}: ExerciseListProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  if (focusMode) {
    const currentExercise = exercises[currentExerciseIndex];
    const canGoPrev = currentExerciseIndex > 0;
    const canGoNext = currentExerciseIndex < exercises.length - 1;

    return (
      <div className="space-y-4">
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card p-2 shadow-sm sm:mb-6 sm:p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentExerciseIndex((prev) => prev - 1)}
            disabled={!canGoPrev}
            className="px-2 sm:px-3"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Poprzednie</span>
          </Button>

          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <span className="text-xs text-muted-foreground">Ćwiczenie</span>
            <span className="text-sm font-bold">
              {currentExerciseIndex + 1} / {exercises.length}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentExerciseIndex((prev) => prev + 1)}
            disabled={!canGoNext}
            className="px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Następne</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <ExerciseAccordion
          exercise={currentExercise}
          defaultExpanded={true}
          onUpdateSet={onUpdateSet}
          onAddSet={onAddSet}
          onDeleteSet={onDeleteSet}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise, index) => (
        <ExerciseAccordion
          key={exercise.id}
          exercise={exercise}
          defaultExpanded={index === 0}
          onUpdateSet={onUpdateSet}
          onAddSet={onAddSet}
          onDeleteSet={onDeleteSet}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
