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
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="mb-1 text-lg font-semibold group-hover:text-primary">{plan.name}</h3>
            <p className="text-sm text-muted-foreground">
              {plan.exercise_count} {plan.exercise_count === 1 ? "ćwiczenie" : "ćwiczeń"} • {plan.total_sets}{" "}
              {plan.total_sets === 1 ? "seria" : "serii"}
            </p>
          </div>
        </div>

        {plan.description && <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{plan.description}</p>}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Utworzono: {formatDate(plan.created_at)}</span>
          {plan.last_used_at && <span className="text-primary">Ostatni trening: {formatDate(plan.last_used_at)}</span>}
        </div>
      </div>
    </a>
  );
}
