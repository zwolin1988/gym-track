import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SelectedExerciseItem } from "./SelectedExerciseItem";
import type { SelectedExercisesListProps } from "./types";

/**
 * SelectedExercisesList - Lista wybranych ćwiczeń z drag-and-drop
 * Obsługuje:
 * - Drag-and-drop do zmiany kolejności
 * - Przycisk usunięcia ćwiczenia
 * - Wizualna numeracja (1, 2, 3...)
 */
export function SelectedExercisesList({ exercises, onRemove, onReorder }: SelectedExercisesListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex((e) => e.exerciseId === active.id);
      const newIndex = exercises.findIndex((e) => e.exerciseId === over.id);

      const reordered = arrayMove(exercises, oldIndex, newIndex).map((e, idx) => ({
        ...e,
        orderIndex: idx,
      }));

      onReorder(reordered);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={exercises.map((e) => e.exerciseId)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {exercises.map((exercise, index) => (
            <SelectedExerciseItem
              key={exercise.exerciseId}
              exercise={exercise}
              index={index}
              onRemove={() => onRemove(index)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
