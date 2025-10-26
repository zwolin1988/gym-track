import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface WorkoutHistoryFiltersProps {
  initialSearch?: string;
}

export function WorkoutHistoryFilters({ initialSearch = "" }: WorkoutHistoryFiltersProps) {
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
    <form
      ref={formRef}
      method="get"
      action="/workouts/history"
      className="mb-6 rounded-lg border bg-card p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="mb-2 block text-sm font-medium">
            Wyszukaj
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              id="search"
              name="search"
              value={search}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              placeholder="Wyszukaj plan treningowy..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <a
            href="/workouts/history"
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Wyczyść filtry
          </a>
        </div>
      </div>
    </form>
  );
}
