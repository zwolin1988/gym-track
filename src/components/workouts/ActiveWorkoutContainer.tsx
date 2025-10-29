import { useState } from "react";
import { WorkoutHeader } from "./WorkoutHeader";
import { ExerciseList } from "./ExerciseList";
import { CompleteWorkoutDialog } from "./CompleteWorkoutDialog";
import { useActiveWorkout } from "./hooks/useActiveWorkout";
import { useBeforeUnload } from "./hooks/useBeforeUnload";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { WorkoutDetailDTO } from "@/types";

interface ActiveWorkoutContainerProps {
  initialWorkout: WorkoutDetailDTO;
}

export function ActiveWorkoutContainer({ initialWorkout }: ActiveWorkoutContainerProps) {
  const { workout, isLoading, error, updateSet, addSet, deleteSet, completeWorkout } = useActiveWorkout(initialWorkout);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Ochrona przed przypadkowym zamknięciem - wyłączamy gdy użytkownik kończy trening
  useBeforeUnload(!isCompleting);

  const handleCompleteWorkout = async () => {
    try {
      setIsCompleting(true); // Wyłącz beforeunload
      await completeWorkout();
      // Przekierowanie do szczegółów treningu
      window.location.href = `/workouts/${workout.id}`;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to complete workout:", err);
      setIsCompleting(false); // Przywróć beforeunload jeśli błąd
      // Error jest już wyświetlony w UI przez useActiveWorkout
    }
  };

  const handleDeleteSet = async (setId: string) => {
    // Find which exercise contains this set
    const exercise = workout.exercises.find((ex) => ex.sets.some((set) => set.id === setId));

    if (exercise) {
      await deleteSet(setId, exercise.id);
    }
  };

  return (
    <div className="min-h-screen">
      <WorkoutHeader planName={workout.plan_name} startedAt={workout.started_at} />

      <main className="container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Zakończ trening button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => setCompleteDialogOpen(true)}
            size="default"
            className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
          >
            <Check className="mr-2 h-4 w-4" />
            Zakończ trening
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <ExerciseList
          exercises={workout.exercises}
          focusMode={true}
          onUpdateSet={updateSet}
          onAddSet={addSet}
          onDeleteSet={handleDeleteSet}
          isLoading={isLoading}
        />
      </main>

      <CompleteWorkoutDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        onConfirm={handleCompleteWorkout}
      />
    </div>
  );
}
