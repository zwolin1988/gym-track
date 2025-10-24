import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DifficultyLevel } from "@/types";
import type { DifficultyFilterProps } from "./types";

const DIFFICULTY_LEVELS: DifficultyLevel[] = ["easy", "medium", "hard"];

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: "text-green-600",
  medium: "text-yellow-600",
  hard: "text-red-600",
};

/**
 * Komponent filtra poziomu trudno[ci
 * Grupa checkbox�w do wyboru poziom�w (multiple selection)
 */
export function DifficultyFilter({ selectedDifficulty, onChange }: DifficultyFilterProps) {
  const handleToggle = (level: DifficultyLevel) => {
    if (selectedDifficulty.includes(level)) {
      onChange(selectedDifficulty.filter((d) => d !== level));
    } else {
      onChange([...selectedDifficulty, level]);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Poziom trudno[ci</legend>
      <div className="flex flex-col gap-3">
        {DIFFICULTY_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <Checkbox
              id={`difficulty-${level}`}
              checked={selectedDifficulty.includes(level)}
              onCheckedChange={() => handleToggle(level)}
            />
            <Label htmlFor={`difficulty-${level}`} className={`cursor-pointer ${DIFFICULTY_COLORS[level]}`}>
              {DIFFICULTY_LABELS[level]}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
