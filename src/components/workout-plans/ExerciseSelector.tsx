import { ExerciseSearchBar } from "./ExerciseSearchBar";
import { ExerciseFilters } from "./ExerciseFilters";
import { ExerciseSelectorCard } from "./ExerciseSelectorCard";
import { useExerciseSelection } from "./hooks/useExerciseSelection";
import type { ExerciseSelectorProps } from "./types";

/**
 * ExerciseSelector - Interfejs wyboru ćwiczeń
 * Obsługuje:
 * - Wyszukiwanie po nazwie (live search z debounce)
 * - Filtrowanie po kategorii
 * - Filtrowanie po poziomie trudności
 * - Listę wyników w formie kart
 */
export function ExerciseSelector({ exercises, categories, selectedExerciseIds, onSelect }: ExerciseSelectorProps) {
  const {
    filteredExercises,
    searchQuery,
    selectedCategory,
    selectedDifficulties,
    setSearchQuery,
    setSelectedCategory,
    toggleDifficulty,
  } = useExerciseSelection({ exercises });

  return (
    <div className="space-y-4">
      {/* Wyszukiwanie i Filtry w osobnej sekcji z tłem */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        {/* Wyszukiwanie */}
        <ExerciseSearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Filtry */}
        <div className="mt-4">
          <ExerciseFilters
            categories={categories}
            selectedCategory={selectedCategory}
            selectedDifficulties={selectedDifficulties}
            onCategoryChange={setSelectedCategory}
            onDifficultyToggle={toggleDifficulty}
          />
        </div>
      </div>

      {/* Lista wyników */}
      <div className="h-[500px] overflow-y-auto space-y-2 pr-2">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nie znaleziono ćwiczeń</p>
            <p className="text-sm mt-1">Spróbuj zmienić filtry lub wyszukiwanie</p>
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <ExerciseSelectorCard
              key={exercise.id}
              exercise={exercise}
              isSelected={selectedExerciseIds.includes(exercise.id)}
              onSelect={() => onSelect(exercise.id)}
            />
          ))
        )}
      </div>

      {/* Informacja o liczbie wyników */}
      {filteredExercises.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Znaleziono {filteredExercises.length}{" "}
          {filteredExercises.length === 1 ? "ćwiczenie" : filteredExercises.length < 5 ? "ćwiczenia" : "ćwiczeń"}
        </p>
      )}
    </div>
  );
}
