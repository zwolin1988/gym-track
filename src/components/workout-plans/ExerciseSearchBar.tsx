import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ExerciseSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * ExerciseSearchBar - Pole wyszukiwania ćwiczeń z debounce
 */
export function ExerciseSearchBar({ value, onChange, placeholder = "Szukaj ćwiczenia..." }: ExerciseSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce - opóźnij wywołanie onChange o 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // Synchronizuj z zewnętrzną wartością
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
