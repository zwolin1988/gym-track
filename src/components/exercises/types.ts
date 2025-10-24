import type { ExerciseListItemDTO, CategoryDTO, DifficultyLevel } from "@/types";

/**
 * Aktywne filtry wy[wietlane w header
 */
export interface ActiveFilters {
  category?: string; // nazwa kategorii (nie ID)
  difficulty?: DifficultyLevel[]; // tablica poziom�w
  search?: string;
}

/**
 * Props dla SearchInput
 */
export interface SearchInputProps {
  searchQuery: string;
  onChange: (query: string) => void;
  onClear: () => void;
}

/**
 * Props dla CategoryFilter
 */
export interface CategoryFilterProps {
  categories: CategoryDTO[];
  selectedCategoryId?: string;
  onChange: (categoryId: string | undefined) => void;
}

/**
 * Props dla DifficultyFilter
 */
export interface DifficultyFilterProps {
  selectedDifficulty: DifficultyLevel[];
  onChange: (difficulty: DifficultyLevel[]) => void;
}

/**
 * Props dla ExercisesGrid
 */
export interface ExercisesGridProps {
  exercises: ExerciseListItemDTO[];
  isLoading?: boolean;
}

/**
 * Props dla ExerciseCard
 */
export interface ExerciseCardProps {
  exercise: ExerciseListItemDTO;
}

/**
 * Props dla Pagination
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}
