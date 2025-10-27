import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ExerciseInPlanCard from "./ExerciseInPlanCard";
import type { Step3DefineSetsProps } from "./types";

/**
 * Step3DefineSets - Trzeci krok wizarda
 * Definiowanie serii dla każdego wybranego ćwiczenia
 * Wyświetla listę ćwiczeń z możliwością edycji, drag-and-drop i usuwania
 */
export function Step3DefineSets({ selectedExercises, onUpdateSets, onReorder, onRemove }: Step3DefineSetsProps) {
  const hasValidSets = selectedExercises.every((e) => e.sets.length > 0);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedExercises.findIndex((e) => e.exerciseId === active.id);
      const newIndex = selectedExercises.findIndex((e) => e.exerciseId === over.id);

      const reordered = arrayMove(selectedExercises, oldIndex, newIndex).map((e, idx) => ({
        ...e,
        orderIndex: idx,
      }));

      onReorder(reordered);
    }
  };

  return (
    <div className="space-y-4">
      {!hasValidSets && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Każde ćwiczenie musi mieć co najmniej jedną serię.</AlertDescription>
        </Alert>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={selectedExercises.map((e) => e.exerciseId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {selectedExercises.map((exercise, index) => (
              <ExerciseInPlanCard
                key={exercise.exerciseId}
                exercise={exercise}
                index={index}
                editMode={true}
                draggable={true}
                onUpdateSets={(newSets) => onUpdateSets(index, newSets)}
                onRemove={() => onRemove(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
