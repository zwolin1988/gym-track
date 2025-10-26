import { useState } from "react";
import { Button } from "@/components/ui/button";

interface WorkoutPlanActionsProps {
  planId: string;
  hasExercises: boolean;
}

export default function WorkoutPlanActions({ planId, hasExercises }: WorkoutPlanActionsProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStartWorkout = async () => {
    if (!hasExercises) {
      alert("Plan musi zawierać co najmniej jedno ćwiczenie, aby rozpocząć trening");
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          alert("Masz już aktywny trening. Zakończ go przed rozpoczęciem nowego.");
        } else {
          alert(error.message || "Nie udało się rozpocząć treningu");
        }
        return;
      }

      // Przekierowanie do aktywnego treningu
      window.location.href = "/workouts/active";
    } catch (error) {
      console.error("Error starting workout:", error);
      alert("Wystąpił błąd podczas rozpoczynania treningu");
    } finally {
      setIsStarting(false);
    }
  };

  const handleEdit = () => {
    window.location.href = `/workout-plans/${planId}/edit`;
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={handleStartWorkout}
        disabled={isStarting || !hasExercises}
        size="lg"
        className="flex-1 sm:flex-none"
      >
        <span className="material-symbols-outlined mr-2 text-base">play_arrow</span>
        {isStarting ? "Rozpoczynanie..." : "Rozpocznij trening"}
      </Button>

      <Button onClick={handleEdit} variant="outline" size="lg" className="flex-1 sm:flex-none">
        <span className="material-symbols-outlined mr-2 text-base">edit</span>
        Edytuj plan
      </Button>
    </div>
  );
}
