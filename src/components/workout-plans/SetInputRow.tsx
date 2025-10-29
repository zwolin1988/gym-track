import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetInputRowProps } from "./types";

/**
 * SetInputRow - Pojedynczy wiersz edycji serii
 * Pola:
 * - Numer serii (tylko wyświetlanie)
 * - Input powtórzeń (wymagane, > 0)
 * - Input ciężaru (opcjonalne, >= 0)
 * - Przycisk usuwania
 */
export function SetInputRow({
  setNumber,
  reps,
  weight,
  onUpdateReps,
  onUpdateWeight,
  onRemove,
  canRemove,
}: SetInputRowProps) {
  const [repsError, setRepsError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  // Reps handlers
  const handleRepsIncrement = () => {
    onUpdateReps(reps + 1);
    setRepsError(null);
  };

  const handleRepsDecrement = () => {
    if (reps > 1) {
      onUpdateReps(reps - 1);
      setRepsError(null);
    }
  };

  const handleRepsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setRepsError("Powtórzenia są wymagane");
      return;
    }
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      setRepsError("Powtórzenia muszą być większe od 0");
    } else {
      setRepsError(null);
      onUpdateReps(numValue);
    }
  };

  // Weight handlers
  const handleWeightIncrement = () => {
    onUpdateWeight((weight ?? 0) + 0.5);
    setWeightError(null);
  };

  const handleWeightDecrement = () => {
    const currentWeight = weight ?? 0;
    if (currentWeight >= 0.5) {
      onUpdateWeight(currentWeight - 0.5);
      setWeightError(null);
    }
  };

  const handleWeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setWeightError(null);
      onUpdateWeight(null);
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setWeightError("Ciężar musi być liczbą >= 0");
    } else {
      setWeightError(null);
      onUpdateWeight(numValue);
    }
  };

  return (
    <div className="flex items-start gap-3">
      {/* Numer serii */}
      <div className="flex items-center justify-center pt-2 w-8">
        <span className="font-semibold text-muted-foreground">{setNumber}</span>
      </div>

      {/* Powtórzenia */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="reps">
          Powtórzenia
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRepsDecrement}
            disabled={reps <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <input
            type="number"
            data-testid={`set-${setNumber}-reps`}
            value={reps}
            onChange={handleRepsInputChange}
            min="1"
            className={cn(
              "h-9 flex-1 rounded-lg border bg-card px-2 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary",
              repsError && "border-destructive"
            )}
            onFocus={(e) => e.target.select()}
          />

          <button
            type="button"
            onClick={handleRepsIncrement}
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {repsError && <p className="text-xs text-destructive mt-1">{repsError}</p>}
      </div>

      {/* Ciężar */}
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="weight">
          Ciężar (kg)
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleWeightDecrement}
            disabled={(weight ?? 0) < 0.5}
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <input
            type="number"
            data-testid={`set-${setNumber}-weight`}
            value={weight ?? ""}
            onChange={handleWeightInputChange}
            min="0"
            step="0.5"
            placeholder="0"
            className={cn(
              "h-9 flex-1 rounded-lg border bg-card px-2 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary",
              weightError && "border-destructive"
            )}
            onFocus={(e) => e.target.select()}
          />

          <button
            type="button"
            onClick={handleWeightIncrement}
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {weightError && <p className="text-xs text-destructive mt-1">{weightError}</p>}
      </div>

      {/* Przycisk usuwania */}
      <div className="flex items-center justify-end pt-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
