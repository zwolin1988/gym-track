import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryDTO, DifficultyLevel } from "@/types";

interface ExerciseFiltersProps {
  categories: CategoryDTO[];
  selectedCategory: string | null;
  selectedDifficulties: DifficultyLevel[];
  onCategoryChange: (categoryId: string | null) => void;
  onDifficultyToggle: (difficulty: DifficultyLevel) => void;
}

const difficultyOptions: { value: DifficultyLevel; label: string }[] = [
  { value: "easy", label: "Łatwy" },
  { value: "medium", label: "Średni" },
  { value: "hard", label: "Trudny" },
];

/**
 * ExerciseFilters - Filtry dla selektora ćwiczeń
 * - Select kategorii
 * - Checkboxy poziomów trudności
 */
export function ExerciseFilters({
  categories,
  selectedCategory,
  selectedDifficulties,
  onCategoryChange,
  onDifficultyToggle,
}: ExerciseFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Filtr kategorii */}
      <div>
        <Label htmlFor="category-filter" className="mb-2 block">
          Kategoria
        </Label>
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) => onCategoryChange(value === "all" ? null : value)}
        >
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtr trudności */}
      <div>
        <Label className="mb-2 block">Poziom trudności</Label>
        <div className="space-y-2">
          {difficultyOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`difficulty-${option.value}`}
                checked={selectedDifficulties.includes(option.value)}
                onCheckedChange={() => onDifficultyToggle(option.value)}
              />
              <label
                htmlFor={`difficulty-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
