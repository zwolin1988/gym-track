import { SearchX } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import type { CategoriesGridProps } from "./types";

/**
 * Komponent gridu kategorii wiczeD
 * Wy[wietla kategorie w responsywnym ukBadzie grid
 * @param {CategoriesGridProps} props - Props zawierajce tablic kategorii z liczb wiczeD
 * @returns {JSX.Element} Grid z kartami kategorii lub empty state
 */
export function CategoriesGrid({ categories }: CategoriesGridProps) {
  // Empty state - brak kategorii
  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center shadow-sm">
        <SearchX className="mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Brak kategorii</h3>
        <p className="max-w-md text-muted-foreground">
          Nie znaleziono |adnych kategorii wiczeD. Skontaktuj si z
          administratorem.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map(({ category, exerciseCount }) => (
        <CategoryCard
          key={category.id}
          category={category}
          exerciseCount={exerciseCount}
        />
      ))}
    </div>
  );
}
