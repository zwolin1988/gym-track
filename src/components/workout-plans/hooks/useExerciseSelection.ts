import { useState, useMemo } from "react";
import type { ExerciseListItemDTO, DifficultyLevel } from "@/types";

interface UseExerciseSelectionProps {
  exercises: ExerciseListItemDTO[];
}

interface UseExerciseSelectionReturn {
  filteredExercises: ExerciseListItemDTO[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedDifficulties: DifficultyLevel[];
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  toggleDifficulty: (difficulty: DifficultyLevel) => void;
}

/**
 * useExerciseSelection - Custom hook do zarządzania filtrowaniem ćwiczeń
 * Obsługuje:
 * - Wyszukiwanie po nazwie (case-insensitive)
 * - Filtrowanie po kategorii
 * - Filtrowanie po poziomie trudności
 */
export function useExerciseSelection({ exercises }: UseExerciseSelectionProps): UseExerciseSelectionReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([]);

  const toggleDifficulty = (difficulty: DifficultyLevel) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty]
    );
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Filtr wyszukiwania
      const matchesSearch =
        searchQuery.trim() === "" ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtr kategorii
      const matchesCategory = !selectedCategory || exercise.category.id === selectedCategory;

      // Filtr trudności
      const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(exercise.difficulty);

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [exercises, searchQuery, selectedCategory, selectedDifficulties]);

  return {
    filteredExercises,
    searchQuery,
    selectedCategory,
    selectedDifficulties,
    setSearchQuery,
    setSelectedCategory,
    toggleDifficulty,
  };
}
