import { useState } from "react";
import { Dumbbell, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExerciseListItemDTO } from "@/types";

interface ExerciseSelectorCardProps {
  exercise: ExerciseListItemDTO;
  isSelected: boolean;
  onSelect: () => void;
}

const DIFFICULTY_COLORS = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const DIFFICULTY_LABELS = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};

/**
 * ExerciseSelectorCard - Karta ćwiczenia dla selektora
 * Wyświetla miniaturę ćwiczenia z przyciskiem "Dodaj" / "Dodano"
 */
export function ExerciseSelectorCard({ exercise, isSelected, onSelect }: ExerciseSelectorCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      data-testid={`exercise-card-${exercise.id}`}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg transition-all",
        isSelected && "border-primary bg-primary/5"
      )}
    >
      {/* Miniatura */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
        {imageError || !exercise.image_path ? (
          <div className="flex h-full w-full items-center justify-center">
            <Dumbbell className="h-6 w-6 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={exercise.image_path}
            alt={exercise.image_alt || exercise.name}
            onError={() => setImageError(true)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Informacje */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{exercise.name}</h4>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className="text-xs">
            {exercise.category.name}
          </Badge>
          <Badge className={cn("text-xs", DIFFICULTY_COLORS[exercise.difficulty])}>
            {DIFFICULTY_LABELS[exercise.difficulty]}
          </Badge>
        </div>
      </div>

      {/* Przycisk dodaj */}
      <Button
        type="button"
        data-testid={`exercise-add-button-${exercise.id}`}
        size="sm"
        variant={isSelected ? "secondary" : "default"}
        onClick={onSelect}
        disabled={isSelected}
        className="flex-shrink-0"
      >
        {isSelected ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Dodano
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-1" />
            Dodaj
          </>
        )}
      </Button>
    </div>
  );
}
