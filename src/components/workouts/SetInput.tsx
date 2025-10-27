import { Minus, Plus } from "lucide-react";

interface SetInputProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  planned?: number | null;
}

export function SetInput({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  disabled = false,
  planned = null,
}: SetInputProps) {
  const displayValue = value ?? planned ?? 0;

  const handleIncrement = () => {
    onChange(displayValue + step);
  };

  const handleDecrement = () => {
    const newValue = displayValue - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {planned !== null && value !== planned && (
          <span className="ml-1 text-[10px] text-muted-foreground/70">(plan: {planned})</span>
        )}
      </label>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || displayValue <= min}
          className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <input
          type="number"
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          step={step}
          className="h-9 flex-1 rounded-lg border bg-card px-2 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          onFocus={(e) => e.target.select()}
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
