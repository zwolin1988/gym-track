import { useState, useEffect } from "react";
import type { WorkoutPlansPaginatedResponseDTO } from "@/types";
import WorkoutPlanCard from "./WorkoutPlanCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkoutPlansList() {
  const [plans, setPlans] = useState<WorkoutPlansPaginatedResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sort: sortBy,
          order: order,
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        const response = await fetch(`/api/workout-plans?${params}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać planów treningowych");
        }

        const data: WorkoutPlansPaginatedResponseDTO = await response.json();
        setPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchPlans();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, sortBy, order, page]);

  if (loading && !plans) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Ładowanie planów...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const isEmpty = !plans || plans.data.length === 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Search */}
        <div className="sm:col-span-2">
          <Input type="text" placeholder="Szukaj planu..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Sort */}
        <Select
          value={`${sortBy}-${order}`}
          onValueChange={(value) => {
            const [newSortBy, newOrder] = value.split("-") as [string, "asc" | "desc"];
            setSortBy(newSortBy);
            setOrder(newOrder);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sortowanie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at-desc">Ostatnio edytowane</SelectItem>
            <SelectItem value="created_at-desc">Najnowsze</SelectItem>
            <SelectItem value="created_at-asc">Najstarsze</SelectItem>
            <SelectItem value="name-asc">Nazwa A-Z</SelectItem>
            <SelectItem value="name-desc">Nazwa Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plans Grid or Empty State */}
      {isEmpty ? (
        <div className="rounded-lg border bg-card p-12 text-center shadow-sm">
          <span className="material-symbols-outlined mb-4 text-6xl text-muted-foreground">list_alt</span>
          <h3 className="mb-2 text-lg font-semibold">Brak planów treningowych</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {search ? "Nie znaleziono planów pasujących do wyszukiwania" : "Stwórz swój pierwszy plan treningowy"}
          </p>
          {!search && (
            <a
              href="/workout-plans/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nowy plan treningowy
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.data.map((plan) => (
              <WorkoutPlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Pagination */}
          {plans.pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border bg-background px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Poprzednia
              </button>
              <span className="text-sm text-muted-foreground">
                Strona {page} z {plans.pagination.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(plans.pagination.total_pages, p + 1))}
                disabled={page === plans.pagination.total_pages}
                className="rounded-lg border bg-background px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Następna
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
