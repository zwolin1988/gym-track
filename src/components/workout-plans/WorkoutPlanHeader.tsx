interface WorkoutPlanHeaderProps {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkoutPlanHeader({ name, createdAt, updatedAt }: WorkoutPlanHeaderProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/workout-plans" className="hover:text-foreground">
          Plany treningowe
        </a>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>Utworzono: {formatDate(createdAt)}</span>
            <span>•</span>
            <span>Zaktualizowano: {formatDate(updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
