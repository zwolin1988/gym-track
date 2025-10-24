import { Play, History, Dumbbell, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Sekcja z szybkimi akcjami do najważniejszych funkcji aplikacji.
 * Ułatwia nawigację i zachęca do działania.
 */
export function QuickActions() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">Szybkie akcje</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rozpocznij trening */}
        <Button asChild size="lg" className="h-auto flex-col py-6">
          <a href="/workout-plans">
            <Play className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Rozpocznij trening</span>
            <span className="text-sm text-primary-foreground/80 mt-1">Wybierz plan i zacznij</span>
          </a>
        </Button>

        {/* Zobacz historię */}
        <Button asChild variant="outline" size="lg" className="h-auto flex-col py-6">
          <a href="/workouts/history">
            <History className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Zobacz historię</span>
            <span className="text-sm text-muted-foreground mt-1">Twoje treningi</span>
          </a>
        </Button>

        {/* Moje plany */}
        <Button asChild variant="outline" size="lg" className="h-auto flex-col py-6">
          <a href="/workout-plans">
            <ClipboardList className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Moje plany</span>
            <span className="text-sm text-muted-foreground mt-1">Zarządzaj planami</span>
          </a>
        </Button>

        {/* Przeglądaj ćwiczenia */}
        <Button asChild variant="outline" size="lg" className="h-auto flex-col py-6">
          <a href="/exercises">
            <Dumbbell className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Ćwiczenia</span>
            <span className="text-sm text-muted-foreground mt-1">Przeglądaj bazę</span>
          </a>
        </Button>
      </div>
    </section>
  );
}
