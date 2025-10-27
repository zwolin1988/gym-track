import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkoutSetDTO, CreateWorkoutSetCommand } from "@/types";

interface AddSetButtonProps {
  exerciseId: string;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  lastSet?: WorkoutSetDTO;
  isLoading: boolean;
}

export function AddSetButton({ exerciseId, onAddSet, lastSet, isLoading }: AddSetButtonProps) {
  const handleAddSet = () => {
    const newSetData: CreateWorkoutSetCommand = {
      planned_reps: lastSet?.actual_reps ?? lastSet?.planned_reps ?? 10,
      planned_weight: lastSet?.actual_weight ?? lastSet?.planned_weight ?? null,
      actual_reps: null,
      actual_weight: null,
      completed: false,
      note: null,
    };

    onAddSet(exerciseId, newSetData);
  };

  return (
    <Button variant="outline" onClick={handleAddSet} disabled={isLoading} className="mt-3 w-full">
      <Plus className="mr-2 h-4 w-4" />
      Dodaj seri
    </Button>
  );
}
