import type { WorkoutPlanListItemDTO } from "@/types";

interface WorkoutPlanCardProps {
  plan: WorkoutPlanListItemDTO;
}

export default function WorkoutPlanCard({ plan }: WorkoutPlanCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "Nigdy";
    return new Date(date).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <a
      href={`/workout-plans/${plan.id}`}
      data-testid={`workout-plan-card-${plan.id}`}
      className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:border-primary hover:shadow-md"
    >
      <div className="p-4 sm:p-6">
        <div className="mb-3 sm:mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 truncate text-base font-semibold group-hover:text-primary sm:text-lg">{plan.name}</h3>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {plan.exercise_count} {plan.exercise_count === 1 ? "ćwiczenie" : "ćwiczeń"} • {plan.total_sets}{" "}
                {plan.total_sets === 1 ? "seria" : "serii"}
              </p>
            </div>
          </div>
        </div>

        {plan.description && (
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground sm:mb-4 sm:text-sm">{plan.description}</p>
        )}

        <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="truncate">Utworzono: {formatDate(plan.created_at)}</span>
          {plan.last_used_at && (
            <span className="truncate text-primary">Ostatni trening: {formatDate(plan.last_used_at)}</span>
          )}
        </div>
      </div>
    </a>
  );
}
