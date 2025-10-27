import { Check } from "lucide-react";

interface SetCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function SetCheckbox({ checked, onChange, disabled = false }: SetCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`
        flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2
        transition-all duration-200
        ${
          checked
            ? "border-primary bg-primary shadow-sm"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent"
        }
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
      aria-label={checked ? "Oznacz jako niewykonaną" : "Oznacz jako wykonaną"}
    >
      {checked && <Check className="h-6 w-6 text-primary-foreground" strokeWidth={3} />}
    </button>
  );
}
