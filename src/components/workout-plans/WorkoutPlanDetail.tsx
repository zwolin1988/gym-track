import { useState, useEffect } from "react";
import type { WorkoutPlanDetailDTO } from "@/types";

interface WorkoutPlanDetailProps {
  planId: string;
}

export default function WorkoutPlanDetail({ planId }: WorkoutPlanDetailProps) {
  const [plan, setPlan] = useState<WorkoutPlanDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching plan with ID: ${planId}`);
        const response = await fetch(`/api/workout-plans/${planId}`);

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);

          if (response.status === 404) {
            throw new Error("Nie znaleziono planu treningowego");
          }
          throw new Error("Nie udało się pobrać planu treningowego");
        }

        const data = await response.json();
        console.log("Plan data received:", data);
        setPlan(data.data);
      } catch (err) {
        console.error("Error fetching plan:", err);
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const handleStartWorkout = async () => {
    if (!plan || plan.exercises.length === 0) {
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
        const errorData = await response.json();
        if (response.status === 409) {
          alert("Masz już aktywny trening. Zakończ go przed rozpoczęciem nowego.");
        } else {
          alert(errorData.message || "Nie udało się rozpocząć treningu");
        }
        return;
      }

      window.location.href = "/workouts/active";
    } catch (err) {
      console.error("Error starting workout:", err);
      alert("Wystąpił błąd podczas rozpoczynania treningu");
    } finally {
      setIsStarting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!confirm("Czy na pewno chcesz usunąć ten plan treningowy? Tej operacji nie można cofnąć.")) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log(`Deleting plan with ID: ${planId}`);
      const response = await fetch(`/api/workout-plans/${planId}`, {
        method: "DELETE",
      });

      console.log(`Delete response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Delete error response:", errorData);

        if (response.status === 409) {
          alert("Nie można usunąć planu z aktywnym treningiem. Zakończ trening przed usunięciem planu.");
        } else if (response.status === 404) {
          alert("Plan treningowy nie został znaleziony.");
        } else {
          alert(`Nie udało się usunąć planu treningowego. Status: ${response.status}`);
        }
        return;
      }

      console.log("Plan deleted successfully, redirecting...");
      // Redirect to plans list after successful deletion
      window.location.href = "/workout-plans";
    } catch (err) {
      console.error("Error deleting plan:", err);
      alert("Wystąpił błąd podczas usuwania planu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Ładowanie planu...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <span className="material-symbols-outlined mb-2 text-4xl text-destructive">error</span>
        <p className="text-sm text-destructive">
          {error || "Plan treningowy nie został znaleziony lub został usunięty"}
        </p>
        <a href="/workout-plans" className="mt-4 inline-block text-sm text-primary hover:underline">
          Powrót do listy planów
        </a>
      </div>
    );
  }

  const exerciseCount = plan.exercises.length;
  const totalSets = plan.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

  return (
    <>
      {/* Back Button */}
      <a
        href="/workout-plans"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Powrót do planów
      </a>

      {/* Header with Actions */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{plan.name}</h1>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Aktywny</span>
          </div>
          {plan.description && <p className="text-muted-foreground">{plan.description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">Utworzono: {formatDate(plan.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/workout-plans/${planId}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 font-medium hover:bg-muted"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Edytuj
          </a>
          <button
            onClick={handleStartWorkout}
            disabled={isStarting || exerciseCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            {isStarting ? "Rozpoczynanie..." : "Rozpocznij trening"}
          </button>
        </div>
      </div>

      {/* Plan Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ćwiczenia</p>
          <p className="mt-1 text-2xl font-bold">{exerciseCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Łączna liczba serii</p>
          <p className="mt-1 text-2xl font-bold">{totalSets}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ostatni trening</p>
          <p className="mt-1 text-lg font-semibold">{plan.last_used_at ? formatDate(plan.last_used_at) : "Nigdy"}</p>
        </div>
      </div>

      {/* Exercises in Plan */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Ćwiczenia w planie</h2>
        {exerciseCount === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center" id="exercises-empty">
            <span className="material-symbols-outlined mb-2 text-4xl text-muted-foreground">fitness_center</span>
            <p className="text-sm text-muted-foreground">Brak ćwiczeń w tym planie</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plan.exercises.map((exercise, index) => (
              <div key={exercise.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    {exercise.exercise.image_path ? (
                      <img
                        src={exercise.exercise.image_path}
                        alt={exercise.exercise.name}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-2xl text-muted-foreground">fitness_center</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="font-semibold">{exercise.exercise.name}</h3>
                      <span className="text-sm text-muted-foreground">Kolejność: {index + 1}</span>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {exercise.exercise.category.name} • {exercise.exercise.difficulty}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Serie: <span className="font-medium text-foreground">{exercise.sets.length}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Powtórzenia:{" "}
                        <span className="font-medium text-foreground">
                          {exercise.sets.map((s) => s.reps).join(", ")}
                        </span>
                      </span>
                      {exercise.sets.some((s) => s.weight !== null) && (
                        <span className="text-muted-foreground">
                          Ciężar:{" "}
                          <span className="font-medium text-foreground">
                            {exercise.sets.map((s) => (s.weight !== null ? `${s.weight}kg` : "-")).join(", ")}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-12 rounded-lg border border-destructive/50 p-6">
        <h3 className="mb-2 font-semibold text-destructive">Strefa niebezpieczna</h3>
        <p className="mb-4 text-sm text-muted-foreground">Akcje nieodwracalne</p>
        <div className="flex gap-4">
          <button
            onClick={handleDeletePlan}
            disabled={isDeleting}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Usuwanie..." : "Usuń plan"}
          </button>
        </div>
      </div>
    </>
  );
}
