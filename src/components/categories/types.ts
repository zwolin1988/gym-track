import type { CategoryDTO } from "@/types";

/**
 * ViewModel dla kategorii z liczb wiczeD
 * U|ywany do przekazania danych do komponentu CategoryCard
 */
export interface CategoryWithExerciseCountViewModel {
  category: CategoryDTO;
  exerciseCount: number;
}

/**
 * Props dla komponentu CategoriesHeader
 */
export interface CategoriesHeaderProps {
  totalCategories: number;
}

/**
 * Props dla komponentu CategoriesGrid
 */
export interface CategoriesGridProps {
  categories: CategoryWithExerciseCountViewModel[];
}

/**
 * Props dla komponentu CategoryCard
 */
export interface CategoryCardProps {
  category: CategoryDTO;
  exerciseCount: number;
}
