interface SetNoteProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function SetNote({ value, onChange, maxLength = 200, disabled = false }: SetNoteProps) {
  const remaining = maxLength - value.length;

  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Notatka</span>
        <span className={`text-[10px] ${remaining < 20 ? "text-destructive" : "text-muted-foreground/70"}`}>
          {value.length}/{maxLength}
        </span>
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        placeholder="Dodaj notatkę (opcjonalnie)"
        className="w-full resize-none rounded-lg border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
        rows={2}
      />
    </div>
  );
}
