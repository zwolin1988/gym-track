import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { CategoryDTO } from "@/types";

interface ExercisesFiltersProps {
  categories: CategoryDTO[];
  initialSearch?: string;
  initialCategoryId?: string;
  initialDifficulty?: string;
}

export function ExercisesFilters({
  categories,
  initialSearch = "",
  initialCategoryId = "",
  initialDifficulty = "",
}: ExercisesFiltersProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [search, setSearch] = useState(initialSearch);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-submit form when filters change
  const submitForm = useCallback(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  // Handle search input with debounce
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Submit after 500ms of no typing
      searchTimeoutRef.current = setTimeout(() => {
        submitForm();
      }, 500);
    },
    [submitForm]
  );

  // Handle search on Enter key
  const handleSearchKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        submitForm();
      }
    },
    [submitForm]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form ref={formRef} method="get" action="/exercises" className="mb-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="mb-2 block text-sm font-medium">
            Wyszukaj
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              id="search"
              name="search"
              value={search}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              placeholder="Wyszukaj ćwiczenie..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category_id" className="mb-2 block text-sm font-medium">
            Kategoria
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={initialCategoryId}
            onChange={submitForm}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Wszystkie kategorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label htmlFor="difficulty" className="mb-2 block text-sm font-medium">
            Poziom trudności
          </label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={initialDifficulty}
            onChange={submitForm}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Wszystkie poziomy</option>
            <option value="easy">Łatwy</option>
            <option value="medium">Średni</option>
            <option value="hard">Trudny</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <a
            href="/exercises"
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Wyczyść filtry
          </a>
        </div>
      </div>
    </form>
  );
}
