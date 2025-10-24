import { useState } from "react";
import { Dumbbell } from "lucide-react";
import type { CategoryCardProps } from "./types";

/**
 * Komponent karty kategorii wiczeD
 * @param {CategoryCardProps} props - Props zawierajce dane kategorii i liczb wiczeD
 * @returns {JSX.Element | null} Renderowana karta lub null je[li dane s nieprawidBowe
 */
export function CategoryCard({ category, exerciseCount }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);

  // Walidacja danych
  if (!category?.id || !category?.name || exerciseCount < 0) {
    console.warn("Invalid category data:", category);
    return null;
  }

  // Skr�cenie opisu do 100 znak�w
  const truncatedDescription = category.description
    ? category.description.length > 100
      ? `${category.description.substring(0, 100)}...`
      : category.description
    : null;

  return (
    <a
      href={`/categories/${category.id}`}
      className="block overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-xl"
      aria-label={`Zobacz ${exerciseCount} wiczeD w kategorii ${category.name}`}
    >
      {/* Obrazek lub placeholder */}
      <div className="relative h-48 bg-muted">
        {imageError || !category.image_path ? (
          <div className="flex h-full w-full items-center justify-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={category.image_path}
            alt={category.image_alt || category.name}
            onError={() => setImageError(true)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Tre[ */}
      <div className="p-4">
        <h3 className="mb-2 text-xl font-bold">{category.name}</h3>

        {truncatedDescription && (
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{truncatedDescription}</p>
        )}

        {/* Badge z liczb wiczeD */}
        <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm">
          <span className="font-semibold">{exerciseCount}</span>
          <span className="ml-1">{exerciseCount === 1 ? "wiczenie" : "wiczeD"}</span>
        </div>
      </div>
    </a>
  );
}
