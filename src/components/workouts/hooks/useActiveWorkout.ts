import { useState, useEffect, useCallback } from "react";
import type { WorkoutDetailDTO, UpdateWorkoutSetCommand, CreateWorkoutSetCommand } from "@/types";
import type { UseActiveWorkoutReturn, StoredWorkoutState } from "../types";
import {
  saveWorkoutToLocalStorage,
  loadWorkoutFromLocalStorage,
  clearWorkoutFromLocalStorage,
} from "./useLocalStorage";

/**
 * Główny hook do zarządzania stanem aktywnego treningu
 * Obsługuje optimistic updates, localStorage persistence i API calls
 */
export function useActiveWorkout(initialWorkout: WorkoutDetailDTO): UseActiveWorkoutReturn {
  const [workout, setWorkout] = useState<WorkoutDetailDTO>(initialWorkout);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Załaduj stan z localStorage przy montowaniu
  useEffect(() => {
    const storedState = loadWorkoutFromLocalStorage(initialWorkout.id);
    if (storedState) {
      // Merge localStorage state z server state
      const mergedWorkout = mergeWorkoutStates(initialWorkout, storedState);
      setWorkout(mergedWorkout);
    }
  }, [initialWorkout.id]);

  // Zapisz stan do localStorage przy każdej zmianie (backup)
  useEffect(() => {
    const stateToSave: StoredWorkoutState = {
      workoutId: workout.id,
      lastUpdated: new Date().toISOString(),
      exercises: workout.exercises.map((ex) => ({
        exerciseId: ex.id,
        sets: ex.sets.map((set) => ({
          setId: set.id,
          actual_reps: set.actual_reps,
          actual_weight: set.actual_weight,
          completed: set.completed,
          note: set.note,
        })),
      })),
    };

    saveWorkoutToLocalStorage(stateToSave);
  }, [workout]);

  /**
   * Aktualizacja serii z optimistic update
   */
  const updateSet = useCallback(async (setId: string, updates: UpdateWorkoutSetCommand) => {
    // Optimistic update
    setWorkout((prev) => {
      const newState = {
        ...prev,
        exercises: prev.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((set) => (set.id === setId ? { ...set, ...updates } : set)),
        })),
      };

      // KLUCZOWE: Zapisz NOWY stan do localStorage NATYCHMIAST
      const stateToSave: StoredWorkoutState = {
        workoutId: newState.id,
        lastUpdated: new Date().toISOString(),
        exercises: newState.exercises.map((ex) => ({
          exerciseId: ex.id,
          sets: ex.sets.map((set) => ({
            setId: set.id,
            actual_reps: set.actual_reps,
            actual_weight: set.actual_weight,
            completed: set.completed,
            note: set.note,
          })),
        })),
      };

      saveWorkoutToLocalStorage(stateToSave);

      return newState;
    });

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workout-sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update set");
      }

      // Sukces - stan już zaktualizowany optimistically
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      // Rollback - odśwież dane z serwera
      await refreshWorkout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Dodanie nowej serii
   */
  const addSet = useCallback(async (exerciseId: string, setData: CreateWorkoutSetCommand) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workout-exercises/${exerciseId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setData),
      });

      if (!response.ok) {
        throw new Error("Failed to add set");
      }

      const { data: newSet } = await response.json();

      // Dodaj nową serię do stanu
      setWorkout((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Usunięcie serii
   */
  const deleteSet = useCallback(async (setId: string, exerciseId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workout-sets/${setId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete set");
      }

      // Usuń serię ze stanu
      setWorkout((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Zsynchronizuj wszystkie dane z localStorage do API
   * WAŻNE: Pobiera dane bezpośrednio z localStorage, nie ze stanu React
   */
  const syncAllUpdates = useCallback(async () => {
    // Pobierz świeży stan z localStorage
    const storedState = loadWorkoutFromLocalStorage(workout.id);
    if (!storedState) {
      return;
    }

    // Wysyłamy wszystkie aktualizacje serii równolegle
    const updatePromises: Promise<void>[] = [];

    for (const storedExercise of storedState.exercises) {
      for (const storedSet of storedExercise.sets) {
        const payload = {
          actual_reps: storedSet.actual_reps,
          actual_weight: storedSet.actual_weight,
          completed: storedSet.completed,
          note: storedSet.note,
        };

        // Wysyłamy dane każdej serii do API
        const updatePromise = fetch(`/api/workout-sets/${storedSet.setId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to sync set ${storedSet.setId}`);
          }
        });

        updatePromises.push(updatePromise);
      }
    }

    // Czekamy na wszystkie aktualizacje (używamy allSettled aby kontynuować nawet jeśli niektóre się nie powiodą)
    await Promise.allSettled(updatePromises);
  }, [workout.id]);

  /**
   * Zakończenie treningu
   */
  const completeWorkout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // KLUCZOWE: Najpierw synchronizujemy wszystkie zmiany z localStorage
      await syncAllUpdates();

      const response = await fetch(`/api/workouts/${workout.id}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete workout");
      }

      // Usuń stan z localStorage
      clearWorkoutFromLocalStorage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err; // Re-throw aby komponent mógł obsłużyć
    } finally {
      setIsLoading(false);
    }
  }, [workout.id, syncAllUpdates]);

  /**
   * Odświeżenie danych treningu z serwera
   */
  const refreshWorkout = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/workouts/active");

      if (!response.ok) {
        throw new Error("Failed to refresh workout");
      }

      const { data } = await response.json();
      setWorkout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    workout,
    isLoading,
    error,
    updateSet,
    addSet,
    deleteSet,
    completeWorkout,
    refreshWorkout,
  };
}

/**
 * Merge localStorage state z server state
 * localStorage ma pierwszeństwo dla actual_* pól i completed
 */
function mergeWorkoutStates(serverWorkout: WorkoutDetailDTO, storedState: StoredWorkoutState): WorkoutDetailDTO {
  return {
    ...serverWorkout,
    exercises: serverWorkout.exercises.map((serverEx) => {
      const storedEx = storedState.exercises.find((ex) => ex.exerciseId === serverEx.id);
      if (!storedEx) return serverEx;

      return {
        ...serverEx,
        sets: serverEx.sets.map((serverSet) => {
          const storedSet = storedEx.sets.find((set) => set.setId === serverSet.id);
          if (!storedSet) return serverSet;

          // Merge - localStorage ma pierwszeństwo
          return {
            ...serverSet,
            actual_reps: storedSet.actual_reps ?? serverSet.actual_reps,
            actual_weight: storedSet.actual_weight ?? serverSet.actual_weight,
            completed: storedSet.completed,
            note: storedSet.note ?? serverSet.note,
          };
        }),
      };
    }),
  };
}
