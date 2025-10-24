import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SearchInputProps } from "./types";

/**
 * Komponent pola wyszukiwania z ikon i przyciskiem czyszczenia
 * Wspiera debounced search przez callback onChange
 */
export function SearchInput({ searchQuery, onChange, onClear }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(searchQuery);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    onChange(value);
  };

  const handleClear = () => {
    setLocalValue("");
    onClear();
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Wyszukaj wiczenie..."
        value={localValue}
        onChange={handleChange}
        maxLength={100}
        className="pl-10 pr-10"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Wyczy[ wyszukiwanie</span>
        </Button>
      )}
    </div>
  );
}
