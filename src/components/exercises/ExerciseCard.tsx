import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ExerciseCardProps } from "./types";

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
 * Komponent karty wiczenia
 * Wy[wietla obrazek, nazw, kategori i poziom trudno[ci
 */
export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);

  // Walidacja danych
  if (!exercise?.id || !exercise?.name) {
    // eslint-disable-next-line no-console
    console.warn("Invalid exercise data:", exercise);
    return null;
  }

  return (
    <a
      href={`/exercises/${exercise.id}`}
      className="block w-full overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-xl focus-visible:outline-2 focus-visible:outline-primary"
    >
      {/* Obrazek */}
      <div className="relative h-48 bg-muted">
        {imageError || !exercise.image_path ? (
          <div className="flex h-full w-full items-center justify-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground" />
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

      {/* Tre[ */}
      <div className="p-4">
        <h3 className="mb-2 text-xl font-bold">{exercise.name}</h3>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{exercise.category.name}</Badge>
          <Badge className={DIFFICULTY_COLORS[exercise.difficulty]}>{DIFFICULTY_LABELS[exercise.difficulty]}</Badge>
        </div>
      </div>
    </a>
  );
}
