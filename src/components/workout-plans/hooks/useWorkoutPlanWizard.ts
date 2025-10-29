import { useState, useEffect } from "react";
import type {
  WizardState,
  SelectedExercise,
  PlanSet,
  UseWorkoutPlanWizardReturn,
  CreateWorkoutPlanWizardProps,
} from "../types";

const STORAGE_KEY = "workout-plan-wizard-state";

/**
 * useWorkoutPlanWizard - Główny custom hook zarządzający logiką wizarda
 * Obsługuje:
 * - Stan formularza (wszystkie 3 kroki)
 * - Nawigację między krokami
 * - Walidację na każdym etapie
 * - Persystencję do localStorage
 * - Komunikację z API
 * - Tryb edycji (editMode)
 */
export function useWorkoutPlanWizard({
  exercises,
  editMode = false,
  existingPlanId,
}: CreateWorkoutPlanWizardProps): UseWorkoutPlanWizardReturn {
  const [state, setState] = useState<WizardState>(() => {
    // W trybie edycji nie ładuj z localStorage
    if (editMode) {
      return {
        step: 1,
        planName: "",
        planDescription: null,
        selectedExercises: [],
        planId: existingPlanId || null,
      };
    }

    // Załaduj stan z localStorage lub utwórz nowy
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to parse saved wizard state:", e);
        }
      }
    }

    return {
      step: 1,
      planName: "",
      planDescription: null,
      selectedExercises: [],
      planId: null,
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Załaduj dane istniejącego planu w trybie edycji
  useEffect(() => {
    if (editMode && existingPlanId && !initialLoadDone) {
      setIsLoading(true);
      const loadPlan = async () => {
        try {
          // Pobierz plan z API
          const response = await fetch(`/api/workout-plans/${existingPlanId}`);
          if (!response.ok) {
            throw new Error("Nie udało się załadować planu");
          }

          const { data: plan } = await response.json();

          // Przekształć dane do formatu SelectedExercise
          const selectedExercises: SelectedExercise[] = plan.exercises.map(
            (planExercise: {
              exercise_id: string;
              order_index: number;
              id: string;
              sets: { reps: number; weight: number | null; order_index: number; id: string }[];
            }) => {
              const exercise = exercises.find((e) => e.id === planExercise.exercise_id);
              if (!exercise) {
                throw new Error(`Exercise with id ${planExercise.exercise_id} not found`);
              }
              return {
                exerciseId: planExercise.exercise_id,
                exercise,
                orderIndex: planExercise.order_index,
                planExerciseId: planExercise.id,
                sets: planExercise.sets.map((set) => ({
                  reps: set.reps,
                  weight: set.weight,
                  orderIndex: set.order_index,
                  id: set.id,
                })),
              };
            }
          );

          setState({
            step: 1,
            planName: plan.name,
            planDescription: plan.description,
            selectedExercises,
            planId: existingPlanId,
          });

          setInitialLoadDone(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania planu");
        } finally {
          setIsLoading(false);
        }
      };

      loadPlan();
    }
  }, [editMode, existingPlanId, exercises, initialLoadDone]);

  // Zapisz stan do localStorage przy każdej zmianie (tylko w trybie tworzenia)
  useEffect(() => {
    if (!editMode && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, editMode]);

  // Ostrzeżenie przed opuszczeniem strony
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.planId !== null) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.planId]);

  // Walidacja kroku 1
  const validateStep1 = (): boolean => {
    if (state.planName.length < 3) {
      setError("Nazwa planu musi mieć co najmniej 3 znaki");
      return false;
    }
    if (state.planName.length > 100) {
      setError("Nazwa planu może mieć maksymalnie 100 znaków");
      return false;
    }
    if (state.planDescription && state.planDescription.length > 500) {
      setError("Opis może mieć maksymalnie 500 znaków");
      return false;
    }
    return true;
  };

  // Walidacja kroku 2
  const validateStep2 = (): boolean => {
    if (state.selectedExercises.length === 0) {
      setError("Wybierz co najmniej jedno ćwiczenie");
      return false;
    }
    return true;
  };

  // Walidacja kroku 3
  const validateStep3 = (): boolean => {
    for (const exercise of state.selectedExercises) {
      if (exercise.sets.length === 0) {
        setError(`Ćwiczenie "${exercise.exercise.name}" musi mieć co najmniej jedną serię`);
        return false;
      }
      for (const set of exercise.sets) {
        if (set.reps < 1) {
          setError("Wszystkie serie muszą mieć powtórzenia > 0");
          return false;
        }
        if (set.weight !== null && set.weight < 0) {
          setError("Ciężar nie może być ujemny");
          return false;
        }
      }
    }
    return true;
  };

  // Przejście do następnego kroku
  const goNext = async () => {
    setError(null);

    if (state.step === 1) {
      if (!validateStep1()) return;

      // W trybie edycji aktualizuj plan, w trybie tworzenia utwórz nowy
      setIsLoading(true);
      try {
        if (editMode && existingPlanId) {
          // Aktualizuj istniejący plan
          const response = await fetch(`/api/workout-plans/${existingPlanId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: state.planName,
              description: state.planDescription,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Nie udało się zaktualizować planu");
          }

          setState((prev) => ({ ...prev, step: 2 }));
        } else {
          // Utwórz nowy plan
          const response = await fetch("/api/workout-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: state.planName,
              description: state.planDescription,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Nie udało się utworzyć planu");
          }

          const { data: plan } = await response.json();
          setState((prev) => ({ ...prev, planId: plan.id, step: 2 }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setIsLoading(false);
      }
    } else if (state.step === 2) {
      if (!validateStep2()) return;

      // Dodaj ćwiczenia do planu
      setIsLoading(true);
      try {
        if (!state.planId) {
          throw new Error("Plan ID is missing");
        }
        const planId = state.planId;

        if (editMode) {
          // W trybie edycji: usuń wszystkie stare ćwiczenia i dodaj nowe
          // To uproszczone podejście - można by zoptymalizować, żeby tylko aktualizować różnice

          // Usuń wszystkie ćwiczenia bez planExerciseId (nowo dodane nie muszą być usuwane)
          // i te, które mają planExerciseId ale zostały usunięte przez użytkownika
          const deletePromises = state.selectedExercises
            .filter((ex) => ex.planExerciseId)
            .map((ex) =>
              fetch(`/api/plan-exercises/${ex.planExerciseId}`, {
                method: "DELETE",
              })
            );

          await Promise.all(deletePromises);
        }

        // Dodaj wszystkie ćwiczenia (nowe lub ponownie dodane)
        const planExercisesPromises = state.selectedExercises.map((exercise, index) =>
          fetch(`/api/workout-plans/${planId}/exercises`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise_id: exercise.exerciseId,
              order_index: index,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error("Nie udało się dodać ćwiczenia");
            return res.json();
          })
        );

        const results = await Promise.all(planExercisesPromises);

        // Aktualizuj state z planExerciseId
        setState((prev) => ({
          ...prev,
          selectedExercises: prev.selectedExercises.map((exercise, index) => ({
            ...exercise,
            planExerciseId: results[index].data.id,
          })),
          step: 3,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Powrót do poprzedniego kroku
  const goPrevious = () => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 }));
      setError(null);
    }
  };

  // Finalne utworzenie planu (krok 3)
  const submitPlan = async () => {
    setError(null);
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      if (editMode) {
        // W trybie edycji: usuń wszystkie stare serie i dodaj nowe
        const deletePromises = state.selectedExercises.flatMap((exercise) =>
          exercise.sets
            .filter((set) => set.id !== null)
            .map((set) =>
              fetch(`/api/plan-exercise-sets/${set.id}`, {
                method: "DELETE",
              })
            )
        );

        await Promise.all(deletePromises);
      }

      // Dodaj serie dla każdego ćwiczenia
      const setsPromises = state.selectedExercises.flatMap((exercise) =>
        exercise.sets.map((set, index) =>
          fetch(`/api/plan-exercises/${exercise.planExerciseId}/sets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reps: set.reps,
              weight: set.weight,
              order_index: index,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error("Nie udało się dodać serii");
            return res.json();
          })
        )
      );

      await Promise.all(setsPromises);

      // Wyczyść localStorage (tylko w trybie tworzenia)
      if (!editMode && typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }

      // Przekieruj do właściwej strony
      if (editMode) {
        window.location.href = `/workout-plans/${state.planId}?success=Plan%20zaktualizowany%20pomyślnie`;
      } else {
        window.location.href = `/workout-plans?success=Plan%20utworzony%20pomyślnie`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  // Aktualizacja podstawowych informacji
  const updateBasicInfo = (name: string, description: string | null) => {
    setState((prev) => ({ ...prev, planName: name, planDescription: description }));
  };

  // Dodaj ćwiczenie
  const addExercise = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newExercise: SelectedExercise = {
      exerciseId,
      exercise,
      orderIndex: state.selectedExercises.length,
      planExerciseId: null,
      sets: [
        // Dodaj domyślną serię
        {
          reps: 10,
          weight: null,
          orderIndex: 0,
          id: null,
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      selectedExercises: [...prev.selectedExercises, newExercise],
    }));
  };

  // Usuń ćwiczenie
  const removeExercise = (index: number) => {
    setState((prev) => ({
      ...prev,
      selectedExercises: prev.selectedExercises
        .filter((_, i) => i !== index)
        .map((e, idx) => ({ ...e, orderIndex: idx })),
    }));
  };

  // Zmień kolejność ćwiczeń
  const reorderExercises = (newOrder: SelectedExercise[]) => {
    setState((prev) => ({ ...prev, selectedExercises: newOrder }));
  };

  // Aktualizuj serie ćwiczenia
  const updateExerciseSets = (exerciseIndex: number, sets: PlanSet[]) => {
    setState((prev) => ({
      ...prev,
      selectedExercises: prev.selectedExercises.map((exercise, idx) =>
        idx === exerciseIndex ? { ...exercise, sets } : exercise
      ),
    }));
  };

  // Sprawdź czy można przejść dalej
  const canGoNext = (): boolean => {
    if (state.step === 1) {
      return state.planName.length >= 3 && state.planName.length <= 100;
    }
    if (state.step === 2) {
      return state.selectedExercises.length > 0;
    }
    if (state.step === 3) {
      return state.selectedExercises.every((ex) => ex.sets.length > 0 && ex.sets.every((set) => set.reps > 0));
    }
    return false;
  };

  return {
    state,
    currentStep: state.step,
    canGoNext: canGoNext(),
    canGoPrevious: state.step > 1,
    goNext,
    goPrevious,
    updateBasicInfo,
    addExercise,
    removeExercise,
    reorderExercises,
    updateExerciseSets,
    submitPlan,
    isLoading,
    error,
  };
}
