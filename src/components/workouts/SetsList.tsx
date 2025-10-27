import { SetItem } from "./SetItem";
import type { WorkoutSetDTO } from "@/types";

interface SetsListProps {
  sets: WorkoutSetDTO[];
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  isLoading: boolean;
}

export function SetsList({ sets, onUpdateSet, onDeleteSet, isLoading }: SetsListProps) {
  return (
    <div className="mt-4 space-y-3">
      {sets.map((set, index) => (
        <SetItem
          key={set.id}
          set={set}
          setNumber={index + 1}
          onUpdate={onUpdateSet}
          onDelete={onDeleteSet}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
