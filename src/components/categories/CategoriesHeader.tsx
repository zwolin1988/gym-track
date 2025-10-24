import type { CategoriesHeaderProps } from "./types";

/**
 * Komponent nagB�wka widoku kategorii
 * Wy[wietla tytuB i liczb dostpnych kategorii
 * @param {CategoriesHeaderProps} props - Props zawierajce liczb kategorii
 * @returns {JSX.Element} NagB�wek strony kategorii
 */
export function CategoriesHeader({ totalCategories }: CategoriesHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">Kategorie Ćwiczeń</h1>
      <p className="text-lg text-muted-foreground">
        Wybierz kategorię mięśniową, aby przeglądać dostępne ćwiczenia.{" "}
        <span className="font-semibold">Dostępnych kategorii: {totalCategories}</span>
      </p>
    </header>
  );
}
