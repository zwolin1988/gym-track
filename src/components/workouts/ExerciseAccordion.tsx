import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ExerciseHeader } from "./ExerciseHeader";
import { SetsList } from "./SetsList";
import { AddSetButton } from "./AddSetButton";
import type { WorkoutExerciseDTO, WorkoutSetDTO, CreateWorkoutSetCommand } from "@/types";

interface ExerciseAccordionProps {
  exercise: WorkoutExerciseDTO;
  defaultExpanded?: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  isLoading: boolean;
}

export function ExerciseAccordion({
  exercise,
  defaultExpanded = false,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  isLoading,
}: ExerciseAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;

  return (
    <div className="group overflow-hidden rounded-lg border bg-card shadow-md transition-all duration-200 hover:shadow-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-accent/50"
      >
        <ExerciseHeader
          name={exercise.exercise.name}
          imagePath={exercise.exercise.image_path}
          completedSets={completedSets}
          totalSets={totalSets}
        />
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4">
          <SetsList sets={exercise.sets} onUpdateSet={onUpdateSet} onDeleteSet={onDeleteSet} isLoading={isLoading} />
          <AddSetButton
            exerciseId={exercise.id}
            onAddSet={onAddSet}
            lastSet={exercise.sets[exercise.sets.length - 1]}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
