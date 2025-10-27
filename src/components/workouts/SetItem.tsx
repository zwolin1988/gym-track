import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useDebounce } from "@/components/exercises/hooks/useDebounce";
import { SetCheckbox } from "./SetCheckbox";
import { SetInput } from "./SetInput";
import { DeleteSetDialog } from "./DeleteSetDialog";
import type { WorkoutSetDTO } from "@/types";

interface SetItemProps {
  set: WorkoutSetDTO;
  setNumber: number;
  onUpdate: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onDelete: (setId: string) => Promise<void>;
  isLoading: boolean;
}

export function SetItem({ set, setNumber, onUpdate, onDelete, isLoading }: SetItemProps) {
  // Local state dla optimistic updates
  const [reps, setReps] = useState(set.actual_reps ?? set.planned_reps);
  const [weight, setWeight] = useState(set.actual_weight ?? set.planned_weight);
  const [completed, setCompleted] = useState(set.completed);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Debounced values
  const debouncedReps = useDebounce(reps, 500);
  const debouncedWeight = useDebounce(weight, 500);

  // Auto-save na zmianę debounced values
  useEffect(() => {
    if (debouncedReps !== (set.actual_reps ?? set.planned_reps)) {
      onUpdate(set.id, { actual_reps: debouncedReps });
    }
  }, [debouncedReps, set.id, set.actual_reps, set.planned_reps, onUpdate]);

  useEffect(() => {
    if (debouncedWeight !== (set.actual_weight ?? set.planned_weight)) {
      onUpdate(set.id, { actual_weight: debouncedWeight });
    }
  }, [debouncedWeight, set.id, set.actual_weight, set.planned_weight, onUpdate]);

  const handleToggleCompleted = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);

    // Gdy oznaczamy serię jako completed, upewnij się że actual_reps i actual_weight są zapisane
    // Jeśli użytkownik nie zmienił wartości, użyj bieżących wartości z local state
    onUpdate(set.id, {
      completed: newCompleted,
      actual_reps: reps,
      actual_weight: weight,
    });
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete(set.id);
  };

  return (
    <>
      <div
        className={`rounded-lg border p-3 shadow-sm transition-all duration-200 sm:p-4 ${
          completed ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:shadow-md"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox - 44x44px touch target */}
          <SetCheckbox checked={completed} onChange={handleToggleCompleted} disabled={isLoading} />

          <div className="flex-1 space-y-3">
            {/* Numer serii + Delete button */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Seria {setNumber}</div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isLoading}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  aria-label="Usuń serię"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Inputs dla reps i weight */}
            <div className="grid grid-cols-2 gap-3">
              <SetInput
                label="Powtórzenia"
                value={reps}
                onChange={setReps}
                min={1}
                disabled={isLoading}
                planned={set.planned_reps}
              />
              <SetInput
                label="Ciężar (kg)"
                value={weight}
                onChange={setWeight}
                min={0}
                step={2.5}
                disabled={isLoading}
                planned={set.planned_weight}
              />
            </div>
          </div>
        </div>
      </div>

      <DeleteSetDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
