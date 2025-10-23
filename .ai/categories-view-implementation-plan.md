# Plan implementacji widoku kategorii ćwiczeń

## 1. Przegląd

Widok kategorii ćwiczeń umożliwia użytkownikom przeglądanie wszystkich dostępnych kategorii mięśniowych (minimum 5-10 kategorii w MVP). Każda kategoria zawiera nazwę, opis, obrazek oraz liczbę powiązanych ćwiczeń. Kliknięcie na kategorię przekierowuje użytkownika do widoku bazy ćwiczeń z automatycznie zastosowanym filtrem dla wybranej kategorii.

Widok realizuje historyjki użytkownika US-011 i wspiera nawigację do widoku ćwiczeń opisanego w US-006, US-007.

## 2. Routing widoku

**Ścieżka:** `/exercises/categories`

**Typ renderowania:** Server-side rendering (domyślne dla Astro w trybie `output: "server"`)

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

## 3. Struktura komponentów

```
src/pages/exercises/categories.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/categories/
    ├── CategoriesGrid.tsx (React - Grid z kategoriami)
    │   └── CategoryCard.tsx (React - Pojedyncza karta kategorii)
    └── CategoriesHeader.tsx (React - Nagłówek z licznikiem)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do pobrania danych kategorii
- `CategoriesGrid` jako React component - umożliwia interaktywność (hover states, kliknięcia)
- `CategoryCard` jako React component - reużywalny komponent z interaktywnością
- `CategoriesHeader` jako React component - dynamiczne wyświetlanie liczby kategorii

## 4. Szczegóły komponentów

### 4.1. categories.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku
- Pobranie danych kategorii z API Supabase
- Walidację autoryzacji użytkownika
- Obsługę błędów ładowania danych
- Przekazanie danych do komponentów React

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Wywołanie Supabase client dla pobrania kategorii
- Sekcja `<main>` z kontenerem na komponenty
- Conditional rendering w przypadku błędów
- Przekazanie danych przez props do `CategoriesGrid`

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- Zapytanie do bazy musi się powieść (obsługa `error` z Supabase)
- Dane kategorii muszą istnieć (co najmniej 5 kategorii w MVP)

**Typy:**
- `CategoryDTO[]` - tablica kategorii z API
- `SupabaseClient` - klient Supabase z kontekstu

**Propsy:**
Brak (główna strona Astro)

---

### 4.2. CategoriesHeader.tsx

**Opis komponentu:**
Komponent nagłówka wyświetlający tytuł strony oraz liczbę dostępnych kategorii. Zapewnia kontekst wizualny dla użytkownika.

**Główne elementy:**
- `<header>` z klasą dla stylowania
- `<h1>` - tytuł "Kategorie ćwiczeń"
- `<p>` - opis i licznik kategorii (np. "Wybierz kategorię mięśniową. Dostępnych kategorii: 8")
- Stylowanie z Tailwind CSS

**Obsługiwane zdarzenia:**
- Brak (komponent prezentacyjny)

**Warunki walidacji:**
- `totalCategories` musi być liczbą >= 0

**Typy:**
- `totalCategories: number`

**Propsy:**
```typescript
interface CategoriesHeaderProps {
  totalCategories: number;
}
```

---

### 4.3. CategoriesGrid.tsx

**Opis komponentu:**
Główny kontener wyświetlający kategorię w układzie grid (responsywnym). Renderuje komponenty `CategoryCard` dla każdej kategorii. Obsługuje stan pusty (brak kategorii).

**Główne elementy:**
- `<div>` kontener z responsive grid (1 kolumna mobile, 2-3 desktop)
- Mapowanie tablicy kategorii na komponenty `CategoryCard`
- Empty state - komunikat gdy brak kategorii
- Klasy Tailwind dla responsywności (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`)

**Obsługiwane zdarzenia:**
- Brak bezpośrednio w tym komponencie (delegowane do `CategoryCard`)

**Warunki walidacji:**
- `categories` musi być tablicą
- Jeśli `categories.length === 0`, wyświetl empty state

**Typy:**
- `CategoryDTO[]` - tablica kategorii

**Propsy:**
```typescript
interface CategoriesGridProps {
  categories: CategoryDTO[];
}
```

---

### 4.4. CategoryCard.tsx

**Opis komponentu:**
Interaktywna karta reprezentująca pojedynczą kategorię. Wyświetla obrazek, nazwę, opis oraz liczbę ćwiczeń. Kliknięcie przekierowuje do widoku ćwiczeń z filtrem kategorii.

**Główne elementy:**
- `<a>` lub `<Link>` do `/exercises?category_id={category.id}`
- `<img>` - obrazek kategorii z obsługą fallback
- `<h3>` - nazwa kategorii
- `<p>` - opis kategorii (skrócony do 100 znaków + "...")
- Badge z liczbą ćwiczeń (np. "12 ćwiczeń")
- Hover effects (scale, shadow)
- Loading state dla obrazka (`loading="lazy"`)

**Obsługiwane zdarzenia:**
- `onClick` - nawigacja do `/exercises?category_id={category.id}`
- `onError` (obrazek) - wyświetlenie placeholder w przypadku błędu ładowania

**Warunki walidacji:**
- `category.id` musi być niepustym UUID
- `category.name` musi być niepustym stringiem
- `category.image_path` może być null (fallback do placeholder)
- `exerciseCount` musi być liczbą >= 0

**Typy:**
- `CategoryDTO` - pojedyncza kategoria
- `exerciseCount: number` - liczba ćwiczeń w kategorii

**Propsy:**
```typescript
interface CategoryCardProps {
  category: CategoryDTO;
  exerciseCount: number;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Typ kategorii - już zdefiniowany
export type CategoryDTO = Tables<"categories">;

// Struktura:
// {
//   id: string (UUID);
//   name: string;
//   slug: string;
//   description: string | null;
//   image_path: string | null;
//   image_alt: string | null;
//   order_index: number;
//   created_at: string;
// }
```

### 5.2. Nowe typy (ViewModel)

```typescript
// src/components/categories/types.ts

/**
 * ViewModel dla kategorii z liczbą ćwiczeń
 * Używany do przekazania danych do komponentu CategoryCard
 */
export interface CategoryWithExerciseCountViewModel {
  category: CategoryDTO;
  exerciseCount: number;
}

/**
 * Props dla komponentu CategoriesHeader
 */
export interface CategoriesHeaderProps {
  totalCategories: number;
}

/**
 * Props dla komponentu CategoriesGrid
 */
export interface CategoriesGridProps {
  categories: CategoryWithExerciseCountViewModel[];
}

/**
 * Props dla komponentu CategoryCard
 */
export interface CategoryCardProps {
  category: CategoryDTO;
  exerciseCount: number;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** Supabase PostgreSQL

**Zapytanie:**
```typescript
// Pobranie wszystkich kategorii z liczbą ćwiczeń
const { data: categories, error } = await supabase
  .from('categories')
  .select(`
    *,
    exercises:exercises(count)
  `)
  .order('order_index', { ascending: true });
```

**Transformacja danych:**
```typescript
// Mapowanie wyniku na ViewModel
const categoriesWithCount: CategoryWithExerciseCountViewModel[] = categories?.map(cat => ({
  category: {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image_path: cat.image_path,
    image_alt: cat.image_alt,
    order_index: cat.order_index,
    created_at: cat.created_at
  },
  exerciseCount: cat.exercises?.[0]?.count || 0
})) || [];
```

### 6.2. Stan client-side (React)

**Brak globalnego stanu** - dane są przekazywane przez props z Astro do React.

**Stan lokalny w CategoryCard:**
- `imageError: boolean` - czy obrazek nie załadował się (obsługa fallback)
- Stan zarządzany przez `useState`

**Nie jest wymagany custom hook** - widok jest prosty i nie wymaga złożonej logiki stanu.

## 7. Integracja API

### 7.1. Endpoint używany

**Endpoint:** Nie ma dedykowanego endpointa `/api/categories` - dane są pobierane bezpośrednio z Supabase w komponencie Astro (SSR).

**Typ:** Read-only (SELECT)

**Autoryzacja:** Kategorie są globalne (shared), dostępne dla wszystkich zalogowanych użytkowników. RLS Policy: `TO authenticated USING (true)`

### 7.2. Zapytanie Supabase

**Query:**
```typescript
const { data: categories, error } = await locals.supabase
  .from('categories')
  .select(`
    id,
    name,
    slug,
    description,
    image_path,
    image_alt,
    order_index,
    created_at,
    exercises:exercises(count)
  `)
  .order('order_index', { ascending: true });
```

**Typ odpowiedzi:**
```typescript
type Response = {
  data: (CategoryDTO & { exercises: { count: number }[] })[] | null;
  error: PostgrestError | null;
}
```

### 7.3. Obsługa błędów

**Scenariusze błędów:**
1. Błąd autoryzacji (401) - użytkownik niezalogowany
2. Błąd zapytania (500) - problem z bazą danych
3. Brak kategorii - empty state

**Obsługa:**
```typescript
if (error) {
  console.error('Error fetching categories:', error);
  return Astro.redirect('/error?message=Nie udało się załadować kategorii');
}

if (!categories || categories.length === 0) {
  // Wyświetl empty state w UI
}
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie kategorii

**Akcja:** Użytkownik wchodzi na stronę `/exercises/categories`

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro wykonuje SSR i pobiera dane z Supabase
3. Strona renderuje się z danymi kategorii
4. Użytkownik widzi grid z kartami kategorii

**Oczekiwany wynik:**
- Lista 5-10 kategorii w responsive grid
- Każda kategoria z obrazkiem, nazwą, opisem i liczbą ćwiczeń
- Smooth loading (skeleton loader opcjonalnie)

### 8.2. Wybór kategorii

**Akcja:** Użytkownik klika na kartę kategorii

**Przepływ:**
1. Kliknięcie na `CategoryCard`
2. Nawigacja do `/exercises?category_id={category.id}`
3. Widok ćwiczeń ładuje się z automatycznie zastosowanym filtrem kategorii

**Oczekiwany wynik:**
- Przekierowanie do widoku ćwiczeń
- Filtr kategorii aktywny
- Lista ćwiczeń przefiltrowana do wybranej kategorii

### 8.3. Hover na karcie

**Akcja:** Użytkownik najeżdża kursorem na kartę kategorii

**Przepływ:**
1. Hover state aktywuje się (CSS transition)
2. Karta powiększa się nieznacznie (`scale-105`)
3. Shadow intensywność zwiększa się

**Oczekiwany wynik:**
- Wizualna informacja zwrotna
- Smooth transition (200-300ms)

### 8.4. Błąd ładowania obrazka

**Akcja:** Obrazek kategorii nie ładuje się

**Przepływ:**
1. Event `onError` wywołuje się na `<img>`
2. Stan `imageError` ustawia się na `true`
3. Wyświetla się placeholder (ikona lub domyślny obrazek)

**Oczekiwany wynik:**
- Użytkownik widzi placeholder zamiast broken image
- Karta pozostaje funkcjonalna (klikalna)

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

### 9.2. Walidacja danych z API

**Komponent:** `categories.astro`

**Warunki:**
- `error === null` - zapytanie się powiodło
- `categories !== null` - dane istnieją
- `categories.length >= 5` - minimalna liczba kategorii w MVP

**Efekt niepowodzenia:**
- Jeśli `error`: Przekierowanie do strony błędu lub wyświetlenie toast error
- Jeśli `categories.length === 0`: Empty state z komunikatem "Brak dostępnych kategorii"

### 9.3. Walidacja propsów komponentów

**Komponent:** `CategoryCard.tsx`

**Warunki:**
- `category.id` - niepusty string (UUID)
- `category.name` - niepusty string (minimum 1 znak)
- `exerciseCount` - liczba >= 0

**Efekt niepowodzenia:**
- Console warning (dev mode)
- Komponent nie renderuje się (return null)

**Implementacja:**
```typescript
if (!category?.id || !category?.name || exerciseCount < 0) {
  console.warn('Invalid category data:', category);
  return null;
}
```

### 9.4. Walidacja obrazków

**Komponent:** `CategoryCard.tsx`

**Warunek:** `category.image_path` może być null

**Efekt:**
- Jeśli `image_path === null` lub błąd ładowania → wyświetl placeholder
- Placeholder: domyślny obrazek lub ikona z Lucide React (np. `<Dumbbell />`)

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik próbuje uzyskać dostęp do `/exercises/categories` bez zalogowania

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu użytkownik wraca do `/exercises/categories`

**Komunikat:** Toast info: "Zaloguj się, aby przeglądać kategorie"

### 10.2. Błąd zapytania do bazy (500)

**Scenariusz:** Supabase zwraca błąd podczas pobierania kategorii

**Obsługa:**
```typescript
if (error) {
  console.error('Database error:', error);
  // Opcja 1: Przekierowanie
  return Astro.redirect('/error?message=Nie udało się załadować kategorii');

  // Opcja 2: Wyświetlenie komunikatu na stronie
  // return { error: 'Nie udało się załadować kategorii' };
}
```

**Komunikat:** Toast error: "Nie udało się załadować kategorii. Spróbuj ponownie później."

### 10.3. Brak kategorii (Empty state)

**Scenariusz:** Zapytanie się powiodło, ale baza nie zawiera kategorii (`categories.length === 0`)

**Obsługa:**
- Renderowanie empty state w `CategoriesGrid`
- Komunikat: "Brak dostępnych kategorii. Skontaktuj się z administratorem."
- Ikona placeholder (np. `<SearchX />` z Lucide)

**UI Empty State:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <SearchX className="w-16 h-16 text-neutral-400 mb-4" />
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
    Brak kategorii
  </h3>
  <p className="text-neutral-600 max-w-md">
    Nie znaleziono żadnych kategorii ćwiczeń. Skontaktuj się z administratorem.
  </p>
</div>
```

### 10.4. Błąd ładowania obrazka

**Scenariusz:** Obrazek kategorii nie może się załadować (404, CORS, timeout)

**Obsługa:**
- Event handler `onError` w `<img>`
- Ustawienie stanu `imageError = true`
- Renderowanie placeholder (ikona + nazwa kategorii)

**Implementacja:**
```tsx
const [imageError, setImageError] = useState(false);

{imageError || !category.image_path ? (
  <div className="w-full h-48 bg-neutral-100 flex items-center justify-center">
    <Dumbbell className="w-12 h-12 text-neutral-400" />
  </div>
) : (
  <img
    src={category.image_path}
    alt={category.image_alt || category.name}
    onError={() => setImageError(true)}
    loading="lazy"
    className="w-full h-48 object-cover"
  />
)}
```

### 10.5. Błąd nawigacji

**Scenariusz:** Kliknięcie na kategorię nie przekierowuje poprawnie

**Obsługa:**
- Walidacja `category.id` przed renderowaniem linku
- Fallback: Jeśli `category.id` jest pusty, link jest disabled

**Implementacja:**
```tsx
{category.id ? (
  <a href={`/exercises?category_id=${category.id}`}>
    {/* Zawartość karty */}
  </a>
) : (
  <div className="opacity-50 cursor-not-allowed">
    {/* Zawartość karty */}
  </div>
)}
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalog komponentów:
```bash
mkdir -p src/components/categories
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/categories/CategoriesHeader.tsx
touch src/components/categories/CategoriesGrid.tsx
touch src/components/categories/CategoryCard.tsx
touch src/components/categories/types.ts
```

1.3. Utwórz plik strony Astro:
```bash
touch src/pages/exercises/categories.astro
```

---

### Krok 2: Definicja typów

2.1. W pliku `src/components/categories/types.ts` zdefiniuj ViewModele i Props:

```typescript
import type { CategoryDTO } from '@/types';

export interface CategoryWithExerciseCountViewModel {
  category: CategoryDTO;
  exerciseCount: number;
}

export interface CategoriesHeaderProps {
  totalCategories: number;
}

export interface CategoriesGridProps {
  categories: CategoryWithExerciseCountViewModel[];
}

export interface CategoryCardProps {
  category: CategoryDTO;
  exerciseCount: number;
}
```

---

### Krok 3: Implementacja CategoryCard

3.1. W `src/components/categories/CategoryCard.tsx`:

```tsx
import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import type { CategoryCardProps } from './types';

export function CategoryCard({ category, exerciseCount }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);

  if (!category?.id || !category?.name || exerciseCount < 0) {
    console.warn('Invalid category data:', category);
    return null;
  }

  const truncatedDescription = category.description
    ? category.description.length > 100
      ? `${category.description.substring(0, 100)}...`
      : category.description
    : null;

  return (
    <a
      href={`/exercises?category_id=${category.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden"
    >
      {/* Obrazek lub placeholder */}
      <div className="relative h-48 bg-neutral-100">
        {imageError || !category.image_path ? (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-neutral-400" />
          </div>
        ) : (
          <img
            src={category.image_path}
            alt={category.image_alt || category.name}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Treść */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          {category.name}
        </h3>

        {truncatedDescription && (
          <p className="text-sm text-neutral-600 mb-3">
            {truncatedDescription}
          </p>
        )}

        {/* Badge z liczbą ćwiczeń */}
        <div className="inline-flex items-center px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
          <span className="font-semibold">{exerciseCount}</span>
          <span className="ml-1">{exerciseCount === 1 ? 'ćwiczenie' : 'ćwiczeń'}</span>
        </div>
      </div>
    </a>
  );
}
```

---

### Krok 4: Implementacja CategoriesGrid

4.1. W `src/components/categories/CategoriesGrid.tsx`:

```tsx
import { SearchX } from 'lucide-react';
import { CategoryCard } from './CategoryCard';
import type { CategoriesGridProps } from './types';

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SearchX className="w-16 h-16 text-neutral-400 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Brak kategorii
        </h3>
        <p className="text-neutral-600 max-w-md">
          Nie znaleziono żadnych kategorii ćwiczeń. Skontaktuj się z administratorem.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map(({ category, exerciseCount }) => (
        <CategoryCard
          key={category.id}
          category={category}
          exerciseCount={exerciseCount}
        />
      ))}
    </div>
  );
}
```

---

### Krok 5: Implementacja CategoriesHeader

5.1. W `src/components/categories/CategoriesHeader.tsx`:

```tsx
import type { CategoriesHeaderProps } from './types';

export function CategoriesHeader({ totalCategories }: CategoriesHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
        Kategorie ćwiczeń
      </h1>
      <p className="text-lg text-neutral-600">
        Wybierz kategorię mięśniową, aby przeglądać dostępne ćwiczenia.{' '}
        <span className="font-semibold">
          Dostępnych kategorii: {totalCategories}
        </span>
      </p>
    </header>
  );
}
```

---

### Krok 6: Implementacja strony Astro (SSR)

6.1. W `src/pages/exercises/categories.astro`:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { CategoriesHeader } from '@/components/categories/CategoriesHeader';
import { CategoriesGrid } from '@/components/categories/CategoriesGrid';
import type { CategoryWithExerciseCountViewModel } from '@/components/categories/types';

// Sprawdź autoryzację
if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Pobierz dane kategorii z Supabase
const { data: categoriesRaw, error } = await Astro.locals.supabase
  .from('categories')
  .select(`
    *,
    exercises:exercises(count)
  `)
  .order('order_index', { ascending: true });

// Obsługa błędu
if (error) {
  console.error('Error fetching categories:', error);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20kategorii');
}

// Transformacja danych
const categories: CategoryWithExerciseCountViewModel[] = (categoriesRaw || []).map(cat => ({
  category: {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image_path: cat.image_path,
    image_alt: cat.image_alt,
    order_index: cat.order_index,
    created_at: cat.created_at
  },
  exerciseCount: cat.exercises?.[0]?.count || 0
}));

const totalCategories = categories.length;
---

<MainLayout title="Kategorie ćwiczeń - Gym Track">
  <main class="container mx-auto px-4 py-8 max-w-7xl">
    <CategoriesHeader totalCategories={totalCategories} client:load />
    <CategoriesGrid categories={categories} client:load />
  </main>
</MainLayout>
```

---

### Krok 7: Dodanie linków nawigacyjnych

7.1. W głównej nawigacji (`src/layouts/MainLayout.astro` lub odpowiednim komponencie nawigacji) dodaj link do kategorii:

```html
<nav>
  <a href="/exercises/categories">Kategorie</a>
  <a href="/exercises">Ćwiczenia</a>
  <!-- inne linki -->
</nav>
```

7.2. W widoku Dashboard dodaj szybki dostęp do kategorii (opcjonalnie).

---

### Krok 8: Testowanie

8.1. **Test manualny:**
- Zaloguj się do aplikacji
- Przejdź do `/exercises/categories`
- Sprawdź czy wszystkie kategorie się wyświetlają
- Kliknij na kategorię i sprawdź czy przekierowuje do ćwiczeń z filtrem
- Sprawdź responsywność na mobile (DevTools)
- Sprawdź hover states

8.2. **Test błędów:**
- Usuń `image_path` w bazie dla jednej kategorii → sprawdź placeholder
- Wyloguj się i spróbuj wejść na `/exercises/categories` → sprawdź redirect
- Symuluj błąd bazy danych → sprawdź obsługę błędu

8.3. **Test wydajności:**
- Sprawdź czas ładowania strony (< 2s)
- Sprawdź czy obrazki ładują się lazy (Network tab)

---

### Krok 9: Styling i dostępność

9.1. **Upewnij się że używasz semantic HTML:**
- `<header>`, `<main>`, `<nav>`
- `<h1>` - `<h3>` w odpowiedniej hierarchii

9.2. **Dodaj ARIA attributes (jeśli potrzebne):**
```tsx
<a
  href={`/exercises?category_id=${category.id}`}
  aria-label={`Zobacz ${exerciseCount} ćwiczeń w kategorii ${category.name}`}
>
```

9.3. **Sprawdź kontrast kolorów** (WCAG AA standard)

9.4. **Dodaj focus states dla klawiatury:**
```css
.category-card:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

---

### Krok 10: Dokumentacja i code review

10.1. Dodaj komentarze JSDoc do komponentów:
```tsx
/**
 * Komponent karty kategorii ćwiczeń
 * @param {CategoryCardProps} props - Props zawierające dane kategorii i liczbę ćwiczeń
 * @returns {JSX.Element | null} Renderowana karta lub null jeśli dane są nieprawidłowe
 */
export function CategoryCard({ category, exerciseCount }: CategoryCardProps) {
  // ...
}
```

10.2. Sprawdź czy kod jest zgodny z wytycznymi projektu (CLAUDE.md)

10.3. Uruchom linter i formatter:
```bash
npm run lint:fix
npm run format
```

10.4. Commit zmian z opisowym komunikatem:
```bash
git add .
git commit -m "feat: implement categories view with SSR and React components"
```

---

### Krok 11: Integracja z pipeline CI/CD

11.1. Sprawdź czy testy przechodzą w pipeline (jeśli są)

11.2. Deploy do środowiska testowego i przeprowadź smoke testing

11.3. Po akceptacji merge do głównej gałęzi

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-011 i wspiera US-006, US-007
✅ **Responsywność:** Grid 1 kolumna mobile, 2-3 desktop
✅ **Dostępność:** Semantic HTML, ARIA labels, focus states
✅ **Wydajność:** SSR z Astro, lazy loading obrazków
✅ **Obsługa błędów:** Autoryzacja, błędy API, empty states, fallback obrazków
✅ **Type safety:** TypeScript w całym kodzie
✅ **Code quality:** ESLint, Prettier, komentarze JSDoc
✅ **UX:** Smooth transitions, hover effects, clear feedback

Implementacja powinna zająć **2-4 godziny** doświadczonemu programiście frontendowemu.
