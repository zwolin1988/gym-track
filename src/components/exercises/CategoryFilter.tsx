import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryFilterProps } from "./types";

/**
 * Komponent filtra kategorii
 * Dropdown/select do wyboru kategorii mi[niowej
 */
export function CategoryFilter({ categories, selectedCategoryId, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="category-filter" className="text-sm font-medium">
        Kategoria
      </label>
      <Select
        value={selectedCategoryId || "all"}
        onValueChange={(value) => onChange(value === "all" ? undefined : value)}
      >
        <SelectTrigger id="category-filter" className="w-full">
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
  );
}
