import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SetInputRow } from "./SetInputRow";
import type { ExerciseSetsEditorProps, PlanSet } from "./types";

/**
 * ExerciseSetsEditor - Edytor serii dla pojedynczego ćwiczenia
 * Obsługuje:
 * - Dodawanie nowych serii
 * - Usuwanie serii
 * - Edycję powtórzeń i ciężaru każdej serii
 * - Walidację danych
 */
export function ExerciseSetsEditor({ sets, onUpdate }: ExerciseSetsEditorProps) {
  const handleAddSet = () => {
    const newSet: PlanSet = {
      reps: 10,
      weight: null,
      orderIndex: sets.length,
      id: null,
    };
    onUpdate([...sets, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    const updated = sets
      .filter((_, i) => i !== index)
      .map((set, idx) => ({
        ...set,
        orderIndex: idx,
      }));
    onUpdate(updated);
  };

  const handleUpdateSet = (index: number, updates: Partial<PlanSet>) => {
    const updated = sets.map((set, i) => (i === index ? { ...set, ...updates } : set));
    onUpdate(updated);
  };

  return (
    <div className="space-y-3 pt-4">
      {/* Lista serii */}
      {sets.map((set, index) => (
        <SetInputRow
          key={index}
          setNumber={index + 1}
          reps={set.reps}
          weight={set.weight}
          onUpdateReps={(reps) => handleUpdateSet(index, { reps })}
          onUpdateWeight={(weight) => handleUpdateSet(index, { weight })}
          onRemove={() => handleRemoveSet(index)}
          canRemove={sets.length > 1}
        />
      ))}

      {/* Przycisk dodawania serii */}
      <Button type="button" data-testid="add-set-button" variant="outline" onClick={handleAddSet} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Dodaj serię
      </Button>
    </div>
  );
}
