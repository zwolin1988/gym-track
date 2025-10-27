import { Stepper } from "./Stepper";
import { Step1BasicInfo } from "./Step1BasicInfo";
import { Step2SelectExercises } from "./Step2SelectExercises";
import { Step3DefineSets } from "./Step3DefineSets";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useWorkoutPlanWizard } from "./hooks/useWorkoutPlanWizard";
import type { CreateWorkoutPlanWizardProps } from "./types";

/**
 * CreateWorkoutPlanWizard - Główny kontener wizarda
 * Zarządza:
 * - Stanem całego formularza (wszystkie 3 kroki)
 * - Nawigacją między krokami
 * - Walidacją na każdym etapie
 * - Komunikacją z API
 * - Obsługą błędów
 */
export function CreateWorkoutPlanWizard({
  exercises,
  categories,
  editMode = false,
  existingPlanId,
}: CreateWorkoutPlanWizardProps) {
  const {
    state,
    currentStep,
    canGoNext,
    canGoPrevious,
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
  } = useWorkoutPlanWizard({ exercises, categories, editMode, existingPlanId });

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="py-6 px-6 md:px-8 border-b">
        <Stepper currentStep={currentStep} totalSteps={3} />
      </div>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Renderowanie warunkowe aktualnego kroku */}
        {currentStep === 1 && (
          <Step1BasicInfo name={state.planName} description={state.planDescription} onChange={updateBasicInfo} />
        )}

        {currentStep === 2 && (
          <Step2SelectExercises
            exercises={exercises}
            categories={categories}
            selectedExercises={state.selectedExercises}
            onAdd={addExercise}
            onRemove={removeExercise}
            onReorder={reorderExercises}
          />
        )}

        {currentStep === 3 && (
          <Step3DefineSets
            selectedExercises={state.selectedExercises}
            onUpdateSets={updateExerciseSets}
            onReorder={reorderExercises}
            onRemove={removeExercise}
          />
        )}

        {/* Komunikat błędu */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Nawigacja */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={goPrevious} disabled={!canGoPrevious || isLoading}>
            Wstecz
          </Button>

          {currentStep < 3 ? (
            <Button onClick={goNext} disabled={!canGoNext || isLoading}>
              {isLoading ? "Zapisywanie..." : "Dalej"}
            </Button>
          ) : (
            <Button onClick={submitPlan} disabled={!canGoNext || isLoading}>
              {isLoading ? "Tworzenie planu..." : "Utwórz plan"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
