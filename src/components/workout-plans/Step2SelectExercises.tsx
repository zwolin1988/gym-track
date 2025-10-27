import { ExerciseSelector } from "./ExerciseSelector";
import { SelectedExercisesList } from "./SelectedExercisesList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Step2SelectExercisesProps } from "./types";

/**
 * Step2SelectExercises - Drugi krok wizarda
 * Interfejs wyboru ćwiczeń składający się z:
 * - ExerciseSelector - wyszukiwanie i filtrowanie ćwiczeń z bazy
 * - SelectedExercisesList - lista wybranych ćwiczeń z możliwością zmiany kolejności
 */
export function Step2SelectExercises({
  exercises,
  categories,
  selectedExercises,
  onAdd,
  onRemove,
  onReorder,
}: Step2SelectExercisesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel wyboru ćwiczeń */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dostępne ćwiczenia</h3>
        <ExerciseSelector
          exercises={exercises}
          categories={categories}
          selectedExerciseIds={selectedExercises.map((e) => e.exerciseId)}
          onSelect={onAdd}
        />
      </div>

      {/* Panel wybranych ćwiczeń */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Wybrane ćwiczenia ({selectedExercises.length})</h3>
        {selectedExercises.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Wybierz co najmniej jedno ćwiczenie z lewego panelu.</AlertDescription>
          </Alert>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">Przeciągnij ćwiczenia, aby zmienić kolejność</p>
            <SelectedExercisesList exercises={selectedExercises} onRemove={onRemove} onReorder={onReorder} />
          </>
        )}
      </div>
    </div>
  );
}
