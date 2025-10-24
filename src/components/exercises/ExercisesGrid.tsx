import { SearchX } from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import type { ExercisesGridProps } from "./types";

/**
 * Komponent gridu wiczeD
 * Wy[wietla wiczenia w responsywnym ukBadzie grid
 */
export function ExercisesGrid({ exercises, isLoading }: ExercisesGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Aadowanie wiczeD...</p>
      </div>
    );
  }

  // Empty state
  if (!exercises || exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center shadow-sm">
        <SearchX className="mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Brak wynik�w</h3>
        <p className="max-w-md text-muted-foreground">
          Nie znaleziono wiczeD speBniajcych wybrane kryteria. Spr�buj zmieni filtry lub wyczy[ wyszukiwanie.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
