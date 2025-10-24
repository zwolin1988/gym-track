import type { CategoriesHeaderProps } from "./types";

/**
 * Komponent nagBówka widoku kategorii
 * Wy[wietla tytuB i liczb dostpnych kategorii
 * @param {CategoriesHeaderProps} props - Props zawierajce liczb kategorii
 * @returns {JSX.Element} NagBówek strony kategorii
 */
export function CategoriesHeader({ totalCategories }: CategoriesHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Kategorie wiczeD
      </h1>
      <p className="text-lg text-muted-foreground">
        Wybierz kategori mi[niow, aby przeglda dostpne wiczenia.{" "}
        <span className="font-semibold">
          Dostpnych kategorii: {totalCategories}
        </span>
      </p>
    </header>
  );
}
