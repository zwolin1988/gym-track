import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SelectedExerciseItemProps } from "./types";

/**
 * SelectedExerciseItem - Pojedynczy element listy wybranych ćwiczeń
 * Obsługuje:
 * - Drag-and-drop (grip handle)
 * - Numer kolejności
 * - Przycisk usuwania
 */
export function SelectedExerciseItem({ exercise, index, onRemove }: SelectedExerciseItemProps) {
  const [imageError, setImageError] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.exerciseId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg transition-shadow",
        isDragging && "shadow-lg"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Numer */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
        {index + 1}
      </div>

      {/* Obrazek */}
      <div className="relative w-12 h-12 flex-shrink-0 bg-muted rounded overflow-hidden">
        {imageError || !exercise.exercise.image_path ? (
          <div className="flex h-full w-full items-center justify-center">
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={exercise.exercise.image_path}
            alt={exercise.exercise.name}
            onError={() => setImageError(true)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Nazwa i kategoria */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{exercise.exercise.name}</p>
        <Badge variant="outline" className="text-xs mt-1">
          {exercise.exercise.category.name}
        </Badge>
      </div>

      {/* Przycisk usuwania */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );
}
