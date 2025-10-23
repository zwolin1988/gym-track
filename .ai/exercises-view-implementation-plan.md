# Plan implementacji widoku bazy ćwiczeń

## 1. Przegląd

Widok bazy ćwiczeń umożliwia użytkownikom przeglądanie, filtrowanie i wyszukiwanie dostępnych ćwiczeń z predefiniowanej bazy (minimum 50 ćwiczeń w MVP). Użytkownicy mogą filtrować ćwiczenia po kategorii mięśniowej (dropdown/select), po poziomie trudności (checkboxy dla multiple selection), oraz wyszukiwać po nazwie (real-time lub on Enter). Ćwiczenia wyświetlane są w responsywnym grid/list z paginacją. Kliknięcie na ćwiczenie otwiera widok szczegółowy w dialog (desktop) lub sheet (mobile).

Widok realizuje historyjki użytkownika US-006 do US-010 z PRD i integruje się z endpointem GET /api/exercises z parametrami query dla filtrowania i wyszukiwania.

## 2. Routing widoku

**Ścieżka:** `/exercises`

**Query Parameters:**
- `category_id` (UUID, optional) - filtr kategorii
- `difficulty` (string[], optional) - filtr poziomu trudności (Easy, Medium, Hard)
- `search` (string, optional) - wyszukiwanie po nazwie
- `page` (number, optional, default: 1) - numer strony paginacji
- `limit` (number, optional, default: 20) - liczba wyników na stronę

**Przykłady URL:**
- `/exercises` - wszystkie ćwiczenia (strona 1)
- `/exercises?category_id=uuid` - ćwiczenia z określonej kategorii
- `/exercises?difficulty=Medium,Hard` - ćwiczenia o poziomie Medium i Hard
- `/exercises?search=bench` - wyszukiwanie "bench"
- `/exercises?category_id=uuid&difficulty=Medium&search=press&page=2` - kombinacja filtrów

**Typ renderowania:** Server-side rendering (domyślne dla Astro w trybie `output: "server"`) z parametrami query

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

## 3. Struktura komponentów

```
src/pages/exercises/index.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/exercises/
    ├── ExercisesFilters.tsx (React - Sekcja filtrów i wyszukiwania)
    │   ├── CategoryFilter.tsx (React - Select dla kategorii)
    │   ├── DifficultyFilter.tsx (React - Checkboxy dla trudności)
    │   └── SearchInput.tsx (React - Input wyszukiwania)
    ├── ExercisesHeader.tsx (React - Nagłówek z licznikiem wyników)
    ├── ExercisesGrid.tsx (React - Grid z ćwiczeniami)
    │   └── ExerciseCard.tsx (React - Pojedyncza karta ćwiczenia)
    ├── ExerciseDetailDialog.tsx (React - Dialog szczegółów na desktop)
    ├── ExerciseDetailSheet.tsx (React - Sheet szczegółów na mobile)
    ├── Pagination.tsx (React - Komponenty paginacji)
    ├── hooks/
    │   └── useExercisesFilters.ts (Custom hook - zarządzanie stanem filtrów)
    └── types.ts (TypeScript typy dla komponentów)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do pobrania danych ćwiczeń z API
- `ExercisesFilters` jako React component - zarządza interaktywnymi filtrami i wyszukiwaniem
- `ExercisesGrid` jako React component - renderuje listę ćwiczeń z paginacją
- `ExerciseCard` jako React component - reużywalny, interaktywny komponent karty
- `ExerciseDetailDialog` / `ExerciseDetailSheet` - responsywne modalne widoki szczegółów
- Custom hook `useExercisesFilters` - centralizuje logikę zarządzania filtrami i synchronizację z URL

## 4. Szczegóły komponentów

### 4.1. exercises/index.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku
- Odczytanie parametrów query z URL (category_id, difficulty, search, page)
- Pobranie danych ćwiczeń z endpointa GET /api/exercises z parametrami
- Pobranie listy wszystkich kategorii dla filtra
- Walidację autoryzacji użytkownika
- Obsługę błędów ładowania danych
- Przekazanie danych (exercises, categories, pagination) do komponentów React

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Parsing URL search params (`Astro.url.searchParams`)
- Wywołanie fetch do `/api/exercises` z parametrami query
- Wywołanie fetch do `/api/categories` dla listy kategorii
- Sekcja `<main>` z kontenerem na komponenty
- Conditional rendering w przypadku błędów
- Przekazanie danych przez props do React components

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- Parametry query muszą być prawidłowe (UUID dla category_id, number dla page/limit)
- Zapytania do API muszą się powieść
- Dane ćwiczeń muszą istnieć (może być pusta tablica jeśli brak wyników)

**Typy:**
- `ExercisesPaginatedResponseDTO` - odpowiedź z API exercises
- `CategoryDTO[]` - lista kategorii
- `URLSearchParams` - parametry z URL

**Propsy:**
Brak (główna strona Astro)

---

### 4.2. ExercisesHeader.tsx

**Opis komponentu:**
Komponent nagłówka wyświetlający tytuł strony oraz licznik znalezionych wyników. Pokazuje informację o aktywnych filtrach i umożliwia ich wyczyszczenie.

**Główne elementy:**
- `<header>` z klasą dla stylowania
- `<h1>` - tytuł "Baza ćwiczeń"
- `<p>` - licznik wyników (np. "Znaleziono 45 ćwiczeń")
- Sekcja "Aktywne filtry" z badge'ami (kategoria, trudność, wyszukiwanie)
- Przycisk "Wyczyść wszystkie filtry"

**Obsługiwane zdarzenia:**
- `onClearFilters` - callback do wyczyszczenia wszystkich filtrów

**Warunki walidacji:**
- `totalResults` musi być liczbą >= 0
- `activeFilters` - obiekt z aktywnymi filtrami (opcjonalny)

**Typy:**
```typescript
interface ActiveFilters {
  category?: string; // nazwa kategorii
  difficulty?: string[]; // tablica poziomów trudności
  search?: string;
}
```

**Propsy:**
```typescript
interface ExercisesHeaderProps {
  totalResults: number;
  activeFilters?: ActiveFilters;
  onClearFilters: () => void;
}
```

---

### 4.3. ExercisesFilters.tsx

**Opis komponentu:**
Główny kontener dla wszystkich filtrów i wyszukiwania. Zarządza stanem filtrów przy użyciu custom hooka `useExercisesFilters` i synchronizuje z URL parameters.

**Główne elementy:**
- `<div>` kontener z responsive layout (kolumna mobile, wiersz desktop)
- `CategoryFilter` - dropdown/select dla wyboru kategorii
- `DifficultyFilter` - checkboxy dla wyboru poziomów trudności
- `SearchInput` - pole tekstowe dla wyszukiwania
- Przycisk "Zastosuj filtry" (opcjonalny - filtry mogą działać real-time)
- Przycisk "Resetuj" do czyszczenia filtrów

**Obsługiwane zdarzenia:**
- `onFilterChange` - callback wywoływany przy zmianie filtrów
- Debounced update dla search input (300-500ms)

**Warunki walidacji:**
- `categories` musi być tablicą kategorii
- Wartości filtrów muszą być zgodne z typami (UUID, enum, string)

**Typy:**
```typescript
interface ExercisesFiltersProps {
  categories: CategoryDTO[];
  initialFilters: {
    categoryId?: string;
    difficulty?: string[];
    search?: string;
  };
}
```

**Propsy:**
- Jak wyżej - otrzymuje kategorie i początkowe wartości filtrów z URL

---

### 4.4. CategoryFilter.tsx

**Opis komponentu:**
Dropdown/select do wyboru kategorii mięśniowej. Wyświetla wszystkie dostępne kategorie z opcją "Wszystkie kategorie".

**Główne elementy:**
- Komponent `Select` z Shadcn/ui
- Opcja "Wszystkie kategorie" (wartość: null/undefined)
- Lista kategorii jako opcje (nazwa + liczba ćwiczeń)
- Ikona kategorii obok nazwy (opcjonalnie)

**Obsługiwane zdarzenia:**
- `onChange(categoryId: string | undefined)` - zmiana wybranej kategorii

**Warunki walidacji:**
- `categories` musi być niepustą tablicą
- `selectedCategoryId` musi być prawidłowym UUID lub undefined

**Typy:**
```typescript
interface CategoryFilterProps {
  categories: CategoryDTO[];
  selectedCategoryId?: string;
  onChange: (categoryId: string | undefined) => void;
}
```

---

### 4.5. DifficultyFilter.tsx

**Opis komponentu:**
Grupa checkboxów do wyboru poziomów trudności (Easy, Medium, Hard). Umożliwia multiple selection.

**Główne elementy:**
- `<fieldset>` z `<legend>` "Poziom trudności"
- Checkbox dla każdego poziomu: Easy, Medium, Hard
- Wizualna reprezentacja trudności (ikony lub kolory)
- Stan: tablica wybranych poziomów

**Obsługiwane zdarzenia:**
- `onChange(difficulty: DifficultyLevel[])` - zmiana wybranych poziomów

**Warunki walidacji:**
- `selectedDifficulty` musi być tablicą wartości z enuma `DifficultyLevel`
- Maksymalnie 3 elementy (wszystkie poziomy)

**Typy:**
```typescript
interface DifficultyFilterProps {
  selectedDifficulty: DifficultyLevel[];
  onChange: (difficulty: DifficultyLevel[]) => void;
}
```

---

### 4.6. SearchInput.tsx

**Opis komponentu:**
Pole tekstowe do wyszukiwania ćwiczeń po nazwie. Wspiera real-time search (debounced) lub wyszukiwanie po naciśnięciu Enter.

**Główne elementy:**
- Komponent `Input` z Shadcn/ui
- Ikona wyszukiwania (Lucide `Search`)
- Przycisk "X" do czyszczenia pola (jeśli wartość nie jest pusta)
- Placeholder "Wyszukaj ćwiczenie..."
- Debounced onChange (300-500ms)

**Obsługiwane zdarzenia:**
- `onChange(searchQuery: string)` - zmiana wartości wyszukiwania (debounced)
- `onClear()` - wyczyszczenie pola wyszukiwania

**Warunki walidacji:**
- `searchQuery` może być pustym stringiem
- Maksymalna długość: 100 znaków

**Typy:**
```typescript
interface SearchInputProps {
  searchQuery: string;
  onChange: (query: string) => void;
  onClear: () => void;
}
```

---

### 4.7. ExercisesGrid.tsx

**Opis komponentu:**
Główny kontener wyświetlający ćwiczenia w układzie grid (responsywnym). Renderuje komponenty `ExerciseCard` dla każdego ćwiczenia. Obsługuje stan pusty (brak wyników) i loading state.

**Główne elementy:**
- `<div>` kontener z responsive grid (1 kolumna mobile, 2-3 desktop)
- Mapowanie tablicy exercises na komponenty `ExerciseCard`
- Empty state - komunikat gdy brak wyników
- Loading state - skeleton loader (opcjonalnie)
- Klasy Tailwind dla responsywności

**Obsługiwane zdarzenia:**
- `onExerciseClick(exerciseId: string)` - callback po kliknięciu ćwiczenia

**Warunki walidacji:**
- `exercises` musi być tablicą
- Jeśli `exercises.length === 0`, wyświetl empty state

**Typy:**
```typescript
interface ExercisesGridProps {
  exercises: ExerciseListItemDTO[];
  onExerciseClick: (exerciseId: string) => void;
  isLoading?: boolean;
}
```

---

### 4.8. ExerciseCard.tsx

**Opis komponentu:**
Interaktywna karta reprezentująca pojedyncze ćwiczenie. Wyświetla obrazek, nazwę, kategorię i poziom trudności. Kliknięcie otwiera dialog/sheet z szczegółami.

**Główne elementy:**
- `<button>` lub `<div>` clickable (nie `<a>` bo otwiera modal, nie nawiguje)
- `<img>` - obrazek ćwiczenia z obsługą fallback
- `<h3>` - nazwa ćwiczenia
- Badge z kategorią (nazwa kategorii)
- Badge z poziomem trudności (Easy/Medium/Hard z odpowiednim kolorem)
- Hover effects (scale, shadow)
- Loading state dla obrazka (`loading="lazy"`)

**Obsługiwane zdarzenia:**
- `onClick` - otwiera ExerciseDetailDialog/Sheet
- `onError` (obrazek) - wyświetlenie placeholder w przypadku błędu

**Warunki walidacji:**
- `exercise.id` musi być niepustym UUID
- `exercise.name` musi być niepustym stringiem
- `exercise.image_path` może być null (fallback do placeholder)
- `exercise.difficulty` musi być wartością z enuma

**Typy:**
```typescript
interface ExerciseCardProps {
  exercise: ExerciseListItemDTO;
  onClick: (exerciseId: string) => void;
}
```

---

### 4.9. ExerciseDetailDialog.tsx

**Opis komponentu:**
Dialog (desktop) wyświetlający pełne szczegóły ćwiczenia. Pokazuje duży obrazek, nazwę, opis techniczny, kategorię, poziom trudności. Umożliwia zamknięcie przez przycisk X lub kliknięcie poza dialog.

**Główne elementy:**
- Komponent `Dialog` z Shadcn/ui
- `DialogContent` z pełnymi szczegółami ćwiczenia
- Duży obrazek (max 600px szerokości)
- Tytuł ćwiczenia
- Badge z kategorią i poziomem trudności
- Pełny opis techniczny (formatowany tekst)
- Przycisk "Zamknij"
- Opcjonalnie: Przycisk "Dodaj do planu" (przyszła funkcjonalność)

**Obsługiwane zdarzenia:**
- `onClose()` - zamknięcie dialogu
- `onOpenChange(open: boolean)` - zmiana stanu otwarcia

**Warunki walidacji:**
- `exercise` musi być pełnym obiektem `ExerciseDetailDTO`
- `isOpen` musi być boolean

**Typy:**
```typescript
interface ExerciseDetailDialogProps {
  exercise: ExerciseDetailDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

### 4.10. ExerciseDetailSheet.tsx

**Opis komponentu:**
Sheet (mobile - od dołu ekranu) wyświetlający pełne szczegóły ćwiczenia. Funkcjonalnie identyczny z `ExerciseDetailDialog`, ale używa komponentu `Sheet` dla lepszego UX na mobile.

**Główne elementy:**
- Komponent `Sheet` z Shadcn/ui
- `SheetContent` z pełnymi szczegółami ćwiczenia
- Responsywny obrazek (100% szerokości na mobile)
- Reszta elementów jak w `ExerciseDetailDialog`

**Obsługiwane zdarzenia:**
- Identyczne jak `ExerciseDetailDialog`

**Warunki walidacji:**
- Identyczne jak `ExerciseDetailDialog`

**Typy:**
```typescript
interface ExerciseDetailSheetProps {
  exercise: ExerciseDetailDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

### 4.11. Pagination.tsx

**Opis komponentu:**
Komponenty paginacji umożliwiające nawigację między stronami wyników. Wyświetla numery stron, przyciski Poprzednia/Następna i informację o zakresie wyników.

**Główne elementy:**
- Przycisk "Poprzednia" (disabled na stronie 1)
- Numery stron (z elipsami dla wielu stron)
- Przycisk "Następna" (disabled na ostatniej stronie)
- Informacja "Wyświetlane 1-20 z 45 wyników"
- Mobilny wariant: tylko Poprzednia/Następna

**Obsługiwane zdarzenia:**
- `onPageChange(page: number)` - zmiana strony

**Warunki walidacji:**
- `currentPage` >= 1
- `totalPages` >= 1
- `currentPage` <= `totalPages`

**Typy:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}
```

---

### 4.12. useExercisesFilters.ts (Custom Hook)

**Opis komponentu:**
Custom React hook zarządzający stanem filtrów i synchronizujący go z URL search parameters. Obsługuje debouncing dla search input i nawigację przeglądarki.

**Główne elementy:**
- State dla `categoryId`, `difficulty`, `search`, `page`
- Funkcje do zmiany filtrów (setCategoryId, setDifficulty, setSearch, setPage)
- Funkcja `clearFilters()` do resetowania wszystkich filtrów
- Synchronizacja z URL przez `window.history.pushState` lub router Astro
- Debounced update dla search (useDebounce)

**Obsługiwane zdarzenia:**
- Zmiana URL przy zmianie filtrów
- Odczyt URL przy inicjalizacji

**Warunki walidacji:**
- Wartości filtrów muszą być zgodne z typami
- URL params muszą być poprawnie zakodowane (encodeURIComponent)

**Typy:**
```typescript
interface UseExercisesFiltersResult {
  filters: {
    categoryId?: string;
    difficulty: DifficultyLevel[];
    search: string;
    page: number;
  };
  setCategoryId: (id: string | undefined) => void;
  setDifficulty: (levels: DifficultyLevel[]) => void;
  setSearch: (query: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  isFilterActive: boolean;
}
```

**Implementacja:**
```typescript
export function useExercisesFilters(initialFilters: InitialFilters) {
  const [categoryId, setCategoryId] = useState<string | undefined>(initialFilters.categoryId);
  const [difficulty, setDifficulty] = useState<DifficultyLevel[]>(initialFilters.difficulty || []);
  const [search, setSearch] = useState<string>(initialFilters.search || '');
  const [page, setPage] = useState<number>(initialFilters.page || 1);

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set('category_id', categoryId);
    if (difficulty.length > 0) params.set('difficulty', difficulty.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (page > 1) params.set('page', page.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : '/exercises';
    window.history.pushState({}, '', newUrl);
  }, [categoryId, difficulty, debouncedSearch, page]);

  const clearFilters = () => {
    setCategoryId(undefined);
    setDifficulty([]);
    setSearch('');
    setPage(1);
  };

  const isFilterActive = !!(categoryId || difficulty.length > 0 || search);

  return {
    filters: { categoryId, difficulty, search, page },
    setCategoryId,
    setDifficulty,
    setSearch,
    setPage,
    clearFilters,
    isFilterActive
  };
}
```

---

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Typy już zdefiniowane w src/types.ts

export type ExerciseListItemDTO = Omit<Tables<"exercises">, "category_id"> & {
  category: ExerciseCategoryMinimalDTO;
};

export type ExerciseDetailDTO = Omit<Tables<"exercises">, "category_id"> & {
  category: ExerciseCategoryFullDTO;
};

export type ExercisesPaginatedResponseDTO = PaginatedResponseDTO<ExerciseListItemDTO>;

export type CategoryDTO = Tables<"categories">;

export type DifficultyLevel = Enums<"difficulty_level">; // "Easy" | "Medium" | "Hard"

export interface PaginationMetadataDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

### 5.2. Nowe typy (ViewModel i Props)

```typescript
// src/components/exercises/types.ts

import type {
  ExerciseListItemDTO,
  ExerciseDetailDTO,
  CategoryDTO,
  DifficultyLevel,
  PaginationMetadataDTO
} from '@/types';

/**
 * Aktywne filtry wyświetlane w header
 */
export interface ActiveFilters {
  category?: string; // nazwa kategorii (nie ID)
  difficulty?: string[]; // tablica nazw poziomów
  search?: string;
}

/**
 * Props dla ExercisesHeader
 */
export interface ExercisesHeaderProps {
  totalResults: number;
  activeFilters?: ActiveFilters;
  onClearFilters: () => void;
}

/**
 * Props dla ExercisesFilters
 */
export interface ExercisesFiltersProps {
  categories: CategoryDTO[];
  initialFilters: {
    categoryId?: string;
    difficulty?: string[];
    search?: string;
  };
}

/**
 * Props dla CategoryFilter
 */
export interface CategoryFilterProps {
  categories: CategoryDTO[];
  selectedCategoryId?: string;
  onChange: (categoryId: string | undefined) => void;
}

/**
 * Props dla DifficultyFilter
 */
export interface DifficultyFilterProps {
  selectedDifficulty: DifficultyLevel[];
  onChange: (difficulty: DifficultyLevel[]) => void;
}

/**
 * Props dla SearchInput
 */
export interface SearchInputProps {
  searchQuery: string;
  onChange: (query: string) => void;
  onClear: () => void;
}

/**
 * Props dla ExercisesGrid
 */
export interface ExercisesGridProps {
  exercises: ExerciseListItemDTO[];
  onExerciseClick: (exerciseId: string) => void;
  isLoading?: boolean;
}

/**
 * Props dla ExerciseCard
 */
export interface ExerciseCardProps {
  exercise: ExerciseListItemDTO;
  onClick: (exerciseId: string) => void;
}

/**
 * Props dla ExerciseDetailDialog
 */
export interface ExerciseDetailDialogProps {
  exercise: ExerciseDetailDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Props dla ExerciseDetailSheet
 */
export interface ExerciseDetailSheetProps {
  exercise: ExerciseDetailDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Props dla Pagination
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}

/**
 * Parametry inicjalizacyjne dla useExercisesFilters
 */
export interface InitialFilters {
  categoryId?: string;
  difficulty?: string[];
  search?: string;
  page?: number;
}

/**
 * Wynik hooka useExercisesFilters
 */
export interface UseExercisesFiltersResult {
  filters: {
    categoryId?: string;
    difficulty: DifficultyLevel[];
    search: string;
    page: number;
  };
  setCategoryId: (id: string | undefined) => void;
  setDifficulty: (levels: DifficultyLevel[]) => void;
  setSearch: (query: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  isFilterActive: boolean;
}
```

---

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** API endpoint `/api/exercises` (server-side fetch w Astro)

**Zapytanie:**
```typescript
// Parsing URL parameters
const searchParams = Astro.url.searchParams;
const categoryId = searchParams.get('category_id') || undefined;
const difficultyParam = searchParams.get('difficulty');
const difficulty = difficultyParam ? difficultyParam.split(',') : undefined;
const search = searchParams.get('search') || undefined;
const page = parseInt(searchParams.get('page') || '1', 10);
const limit = 20; // Default limit

// Budowanie URL do API
const apiParams = new URLSearchParams();
if (categoryId) apiParams.set('category_id', categoryId);
if (difficulty) apiParams.set('difficulty', difficulty.join(','));
if (search) apiParams.set('search', search);
apiParams.set('page', page.toString());
apiParams.set('limit', limit.toString());

// Fetch exercises
const exercisesResponse = await fetch(
  `${Astro.url.origin}/api/exercises?${apiParams.toString()}`,
  {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  }
);

const exercisesData: ExercisesPaginatedResponseDTO = await exercisesResponse.json();

// Fetch categories dla filtra
const categoriesResponse = await fetch(
  `${Astro.url.origin}/api/categories`,
  {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  }
);

const categoriesData = await categoriesResponse.json();
```

**Transformacja danych:**
- Dane z API są już w odpowiednim formacie (DTO)
- Konwersja difficulty string[] na DifficultyLevel[] dla React components
- Przygotowanie ActiveFilters dla header (mapowanie ID kategorii na nazwę)

### 6.2. Stan client-side (React)

**State w useExercisesFilters hook:**
- `categoryId: string | undefined` - wybrana kategoria
- `difficulty: DifficultyLevel[]` - wybrane poziomy trudności
- `search: string` - fraza wyszukiwania
- `page: number` - numer strony

**State w ExercisesFilters component:**
- Używa `useExercisesFilters` hook
- Zarządza debounced search input

**State w ExerciseCard:**
- `imageError: boolean` - czy obrazek nie załadował się (fallback)

**State w głównym komponencie (ExercisesView logic):**
- `selectedExerciseId: string | null` - ID wybranego ćwiczenia do wyświetlenia w dialog/sheet
- `isDialogOpen: boolean` - stan otwarcia dialogu
- `selectedExerciseDetail: ExerciseDetailDTO | null` - pełne dane wybranego ćwiczenia

**Przepływ stanu:**
1. Użytkownik zmienia filtr → `useExercisesFilters` aktualizuje URL
2. Zmiana URL → Astro reloaduje stronę z nowymi parametrami (SSR)
3. Nowe dane z API → re-render komponentów React z nowymi props
4. Kliknięcie ćwiczenia → fetch szczegółów → otwarcie dialog/sheet

**Alternatywnie (Client-Side Filtering - nie zalecane dla MVP):**
- Można zaimplementować filtrowanie po stronie klienta, ale to wymaga załadowania wszystkich ćwiczeń
- Dla MVP lepiej użyć server-side filtering (API) dla lepszej wydajności

### 6.3. Synchronizacja z URL

**Mechanizm:**
- Custom hook `useExercisesFilters` używa `window.history.pushState` do aktualizacji URL
- Każda zmiana filtra aktualizuje URL bez przeładowania strony
- Użytkownik może użyć przycisku "Wstecz" w przeglądarce
- Przy odświeżeniu strony filtry są odczytywane z URL (server-side)

**Implementacja w hooku:**
```typescript
useEffect(() => {
  const params = new URLSearchParams();
  if (categoryId) params.set('category_id', categoryId);
  if (difficulty.length > 0) params.set('difficulty', difficulty.join(','));
  if (debouncedSearch) params.set('search', debouncedSearch);
  if (page > 1) params.set('page', page.toString());

  const newUrl = params.toString() ? `/exercises?${params.toString()}` : '/exercises';
  window.history.pushState({}, '', newUrl);
}, [categoryId, difficulty, debouncedSearch, page]);
```

---

## 7. Integracja API

### 7.1. Endpoint używany

**Endpoint:** `GET /api/exercises`

**Query Parameters:**
- `category_id` (UUID, optional) - filtr kategorii
- `difficulty` (string[], optional) - filtr trudności (comma-separated: "Easy,Medium,Hard")
- `search` (string, optional) - wyszukiwanie po nazwie
- `page` (number, optional, default: 1) - numer strony
- `limit` (number, optional, default: 20, max: 100) - liczba wyników

**Request Example:**
```
GET /api/exercises?category_id=uuid&difficulty=Medium,Hard&search=bench&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Barbell Bench Press",
      "description": "Lie on a flat bench...",
      "image_path": "/storage/exercises/bench-press.jpg",
      "image_alt": "Person performing bench press",
      "difficulty": "Medium",
      "category": {
        "id": "uuid",
        "name": "Chest",
        "slug": "chest"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**
- `400 Bad Request` - nieprawidłowe parametry query
- `401 Unauthorized` - użytkownik niezalogowany
- `500 Internal Server Error` - błąd bazy danych

### 7.2. Endpoint dla szczegółów ćwiczenia

**Endpoint:** `GET /api/exercises/{id}`

**Path Parameters:**
- `id` (UUID) - ID ćwiczenia

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Barbell Bench Press",
    "description": "Lie on a flat bench and grip the barbell...",
    "image_path": "/storage/exercises/bench-press.jpg",
    "image_alt": "Person performing bench press",
    "difficulty": "Medium",
    "category": {
      "id": "uuid",
      "name": "Chest",
      "slug": "chest",
      "description": "Chest muscle exercises",
      "image_path": "/storage/categories/chest.jpg"
    },
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`
- `404 Not Found` - ćwiczenie nie istnieje
- `500 Internal Server Error`

### 7.3. Endpoint dla kategorii

**Endpoint:** `GET /api/categories`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Chest",
      "slug": "chest",
      "description": "Chest muscle exercises",
      "image_path": "/storage/categories/chest.jpg",
      "image_alt": "Chest muscle diagram",
      "order_index": 1,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 7.4. Obsługa błędów

**Scenariusze błędów:**
1. Błąd autoryzacji (401) - użytkownik niezalogowany
2. Błąd zapytania (500) - problem z bazą danych
3. Brak wyników - empty state (data: [])
4. Nieprawidłowe parametry (400) - walidacja query params

**Obsługa w Astro:**
```typescript
if (!exercisesResponse.ok) {
  if (exercisesResponse.status === 401) {
    return Astro.redirect('/auth/login');
  }
  console.error('Error fetching exercises:', exercisesResponse.statusText);
  return Astro.redirect('/error?message=Nie udało się załadować ćwiczeń');
}

if (!exercisesData.data || exercisesData.data.length === 0) {
  // Wyświetl empty state w UI (nie przekierowuj)
}
```

---

## 8. Interakcje użytkownika

### 8.1. Przeglądanie ćwiczeń

**Akcja:** Użytkownik wchodzi na stronę `/exercises`

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro odczytuje URL parameters
3. Astro wykonuje fetch do `/api/exercises` z parametrami
4. Astro wykonuje fetch do `/api/categories`
5. Strona renderuje się z danymi ćwiczeń i kategorii
6. Użytkownik widzi grid z kartami ćwiczeń

**Oczekiwany wynik:**
- Lista 20 ćwiczeń (domyślnie) w responsive grid
- Każde ćwiczenie z obrazkiem, nazwą, kategorią i poziomem trudności
- Paginacja jeśli więcej niż 20 wyników
- Filtry i wyszukiwarka gotowe do użycia

### 8.2. Filtrowanie po kategorii

**Akcja:** Użytkownik wybiera kategorię z dropdown

**Przepływ:**
1. Użytkownik klika dropdown CategoryFilter
2. Wybiera kategorię (np. "Chest")
3. `useExercisesFilters` aktualizuje `categoryId`
4. URL zmienia się na `/exercises?category_id=uuid`
5. Astro reloaduje stronę z nowym parametrem
6. API zwraca przefiltrowane ćwiczenia
7. Grid renderuje się z nowymi danymi

**Oczekiwany wynik:**
- Lista ćwiczeń przefiltrowana do wybranej kategorii
- Header pokazuje aktywny filtr "Kategoria: Chest"
- Licznik wyników aktualizuje się
- Paginacja resetuje się do strony 1

### 8.3. Filtrowanie po poziomie trudności

**Akcja:** Użytkownik zaznacza checkboxy poziomów trudności (np. Medium i Hard)

**Przepływ:**
1. Użytkownik klika checkbox "Medium"
2. Użytkownik klika checkbox "Hard"
3. `useExercisesFilters` aktualizuje `difficulty` na ["Medium", "Hard"]
4. URL zmienia się na `/exercises?difficulty=Medium,Hard`
5. Astro reloaduje stronę z nowym parametrem
6. API zwraca ćwiczenia o poziomie Medium LUB Hard
7. Grid renderuje się z nowymi danymi

**Oczekiwany wynik:**
- Lista ćwiczeń przefiltrowana do Medium i Hard
- Header pokazuje aktywne filtry
- Paginacja resetuje się do strony 1

### 8.4. Wyszukiwanie po nazwie

**Akcja:** Użytkownik wpisuje frazę w pole wyszukiwania (np. "bench")

**Przepływ:**
1. Użytkownik wpisuje "bench" w SearchInput
2. Hook debounce czeka 300ms
3. `useExercisesFilters` aktualizuje `search` (debounced)
4. URL zmienia się na `/exercises?search=bench`
5. Astro reloaduje stronę z nowym parametrem
6. API wykonuje case-insensitive search (zawiera "bench")
7. Grid renderuje się z wynikami wyszukiwania

**Oczekiwany wynik:**
- Lista ćwiczeń zawierających "bench" w nazwie
- Header pokazuje aktywny filtr "Wyszukiwanie: bench"
- Paginacja resetuje się do strony 1
- Jeśli brak wyników, wyświetl empty state

### 8.5. Kombinacja filtrów

**Akcja:** Użytkownik stosuje wiele filtrów jednocześnie

**Przepływ:**
1. Wybór kategorii "Chest"
2. Zaznaczenie poziomu "Medium"
3. Wpisanie "press" w wyszukiwarkę
4. URL: `/exercises?category_id=uuid&difficulty=Medium&search=press`
5. API zwraca ćwiczenia spełniające WSZYSTKIE warunki (AND logic)

**Oczekiwany wynik:**
- Lista ćwiczeń z kategorii Chest, poziom Medium, zawierające "press"
- Header pokazuje wszystkie aktywne filtry
- Przycisk "Wyczyść filtry" widoczny

### 8.6. Czyszczenie filtrów

**Akcja:** Użytkownik klika "Wyczyść wszystkie filtry"

**Przepływ:**
1. Kliknięcie przycisku w header lub filters
2. `clearFilters()` z hooka resetuje wszystkie filtry
3. URL zmienia się na `/exercises`
4. Astro reloaduje stronę bez parametrów
5. API zwraca wszystkie ćwiczenia (strona 1)

**Oczekiwany wynik:**
- Wszystkie filtry wyczyszczone
- Pełna lista ćwiczeń
- Paginacja na stronie 1

### 8.7. Paginacja

**Akcja:** Użytkownik klika "Następna strona" lub numer strony

**Przepływ:**
1. Kliknięcie przycisku "Następna" lub numeru strony (np. 2)
2. `setPage(2)` z hooka
3. URL zmienia się na `/exercises?page=2` (z zachowaniem innych filtrów)
4. Astro reloaduje stronę
5. API zwraca ćwiczenia ze strony 2

**Oczekiwany wynik:**
- Grid renderuje ćwiczenia ze strony 2
- Paginacja pokazuje stronę 2 jako aktywną
- Scroll do góry strony
- Filtry pozostają aktywne

### 8.8. Wyświetlanie szczegółów ćwiczenia

**Akcja:** Użytkownik klika na kartę ćwiczenia

**Przepływ:**
1. Kliknięcie na `ExerciseCard`
2. `onExerciseClick(exerciseId)` wywołuje się
3. Fetch do `/api/exercises/{exerciseId}` dla pełnych danych
4. `selectedExerciseDetail` aktualizuje się
5. `isDialogOpen` zmienia się na `true`
6. Na desktop: `ExerciseDetailDialog` otwiera się
7. Na mobile: `ExerciseDetailSheet` wysuwa się od dołu

**Oczekiwany wynik:**
- Dialog/Sheet z pełnymi szczegółami ćwiczenia
- Duży obrazek, nazwa, kategoria, poziom trudności, pełny opis
- Możliwość zamknięcia przez X lub kliknięcie poza dialog
- Scrollowanie w obrębie dialog/sheet jeśli treść długa

### 8.9. Zamknięcie szczegółów

**Akcja:** Użytkownik zamyka dialog/sheet

**Przepływ:**
1. Kliknięcie przycisku X lub poza dialog
2. `onOpenChange(false)` wywołuje się
3. `isDialogOpen` zmienia się na `false`
4. Dialog/Sheet zamyka się z animacją

**Oczekiwany wynik:**
- Dialog/Sheet znika
- Focus wraca do karty ćwiczenia (a11y)
- Grid pozostaje niezmieniony

### 8.10. Błąd ładowania obrazka

**Akcja:** Obrazek ćwiczenia nie może się załadować

**Przepływ:**
1. Event `onError` wywołuje się na `<img>`
2. Stan `imageError` ustawia się na `true`
3. Wyświetla się placeholder (ikona lub domyślny obrazek)

**Oczekiwany wynik:**
- Użytkownik widzi placeholder zamiast broken image
- Karta pozostaje funkcjonalna (klikalna)

---

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

### 9.2. Walidacja parametrów URL

**Komponent:** `exercises/index.astro`

**Warunki:**
- `category_id` - musi być prawidłowym UUID lub undefined
- `difficulty` - wartości muszą być z enuma ("Easy", "Medium", "Hard")
- `search` - max 100 znaków
- `page` - integer >= 1
- `limit` - integer, 1-100

**Efekt niepowodzenia:**
- Jeśli parametry nieprawidłowe → ignoruj lub użyj default values
- Jeśli błąd krytyczny → przekierowanie do strony błędu

**Implementacja:**
```typescript
const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

// Walidacja UUID dla category_id
const categoryId = searchParams.get('category_id');
const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validCategoryId = categoryId && isValidUUID.test(categoryId) ? categoryId : undefined;

// Walidacja difficulty
const difficultyParam = searchParams.get('difficulty');
const validDifficulty = difficultyParam
  ? difficultyParam.split(',').filter(d => ['Easy', 'Medium', 'Hard'].includes(d))
  : undefined;
```

### 9.3. Walidacja danych z API

**Komponent:** `exercises/index.astro`

**Warunki:**
- Response status === 200
- Response.data jest tablicą
- Response.pagination istnieje i zawiera prawidłowe wartości

**Efekt niepowodzenia:**
- Jeśli błąd API → przekierowanie do strony błędu lub wyświetlenie toast
- Jeśli data === [] → wyświetl empty state

### 9.4. Walidacja propsów komponentów

**Komponent:** `ExerciseCard.tsx`

**Warunki:**
- `exercise.id` - niepusty string (UUID)
- `exercise.name` - niepusty string (minimum 1 znak)
- `exercise.difficulty` - wartość z enuma DifficultyLevel

**Efekt niepowodzenia:**
- Console warning (dev mode)
- Komponent nie renderuje się (return null)

**Implementacja:**
```typescript
if (!exercise?.id || !exercise?.name) {
  console.warn('Invalid exercise data:', exercise);
  return null;
}
```

### 9.5. Walidacja obrazków

**Komponent:** `ExerciseCard.tsx`, `ExerciseDetailDialog.tsx`

**Warunek:** `exercise.image_path` może być null

**Efekt:**
- Jeśli `image_path === null` lub błąd ładowania → wyświetl placeholder
- Placeholder: domyślny obrazek lub ikona z Lucide React (np. `<Dumbbell />`)

---

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik próbuje uzyskać dostęp do `/exercises` bez zalogowania

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu użytkownik wraca do `/exercises`

**Komunikat:** Toast info: "Zaloguj się, aby przeglądać ćwiczenia"

### 10.2. Błąd zapytania do API (500)

**Scenariusz:** API zwraca błąd podczas pobierania ćwiczeń

**Obsługa:**
```typescript
if (!exercisesResponse.ok) {
  console.error('API error:', exercisesResponse.status, exercisesResponse.statusText);
  return Astro.redirect('/error?message=Nie udało się załadować ćwiczeń');
}
```

**Komunikat:** Toast error: "Nie udało się załadować ćwiczeń. Spróbuj ponownie później."

### 10.3. Brak wyników (Empty state)

**Scenariusz:** Zapytanie się powiodło, ale brak ćwiczeń spełniających kryteria (`data.length === 0`)

**Obsługa:**
- Renderowanie empty state w `ExercisesGrid`
- Komunikat: "Nie znaleziono ćwiczeń spełniających kryteria. Spróbuj zmienić filtry."
- Ikona placeholder (np. `<SearchX />` z Lucide)
- Przycisk "Wyczyść filtry"

**UI Empty State:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <SearchX className="w-16 h-16 text-neutral-400 mb-4" />
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
    Brak wyników
  </h3>
  <p className="text-neutral-600 max-w-md mb-4">
    Nie znaleziono ćwiczeń spełniających wybrane kryteria.
    Spróbuj zmienić filtry lub wyczyść wyszukiwanie.
  </p>
  <Button variant="outline" onClick={onClearFilters}>
    Wyczyść filtry
  </Button>
</div>
```

### 10.4. Błąd ładowania obrazka

**Scenariusz:** Obrazek ćwiczenia nie może się załadować (404, CORS, timeout)

**Obsługa:**
- Event handler `onError` w `<img>`
- Ustawienie stanu `imageError = true`
- Renderowanie placeholder (ikona + nazwa ćwiczenia)

**Implementacja:**
```tsx
const [imageError, setImageError] = useState(false);

{imageError || !exercise.image_path ? (
  <div className="w-full h-48 bg-neutral-100 flex items-center justify-center">
    <Dumbbell className="w-12 h-12 text-neutral-400" />
  </div>
) : (
  <img
    src={exercise.image_path}
    alt={exercise.image_alt || exercise.name}
    onError={() => setImageError(true)}
    loading="lazy"
    className="w-full h-48 object-cover"
  />
)}
```

### 10.5. Błąd ładowania szczegółów ćwiczenia

**Scenariusz:** Fetch do `/api/exercises/{id}` kończy się błędem

**Obsługa:**
```typescript
const fetchExerciseDetails = async (exerciseId: string) => {
  try {
    const response = await fetch(`/api/exercises/${exerciseId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercise details');
    }
    const data = await response.json();
    setSelectedExerciseDetail(data.data);
    setIsDialogOpen(true);
  } catch (error) {
    console.error('Error fetching exercise details:', error);
    // Toast error
    toast.error('Nie udało się załadować szczegółów ćwiczenia');
  }
};
```

**Komunikat:** Toast error: "Nie udało się załadować szczegółów ćwiczenia"

### 10.6. Błąd nieprawidłowych parametrów (400)

**Scenariusz:** API zwraca 400 Bad Request z powodu nieprawidłowych parametrów

**Obsługa:**
- Walidacja parametrów przed wysłaniem do API (po stronie Astro)
- Jeśli mimo to błąd 400 → przekierowanie do `/exercises` bez parametrów
- Toast warning: "Nieprawidłowe parametry filtrów. Wyświetlono wszystkie ćwiczenia."

### 10.7. Błąd paginacji (strona poza zakresem)

**Scenariusz:** Użytkownik wpisuje ręcznie `/exercises?page=999` ale jest tylko 5 stron

**Obsługa:**
- API zwraca pustą tablicę dla strony poza zakresem
- UI wyświetla empty state
- Przycisk "Wróć do strony 1"

**Implementacja:**
```typescript
if (page > pagination.total_pages && pagination.total_pages > 0) {
  // Przekieruj do ostatniej dostępnej strony
  return Astro.redirect(`/exercises?page=${pagination.total_pages}`);
}
```

---

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalog komponentów:
```bash
mkdir -p src/components/exercises
mkdir -p src/components/exercises/hooks
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/exercises/ExercisesHeader.tsx
touch src/components/exercises/ExercisesFilters.tsx
touch src/components/exercises/CategoryFilter.tsx
touch src/components/exercises/DifficultyFilter.tsx
touch src/components/exercises/SearchInput.tsx
touch src/components/exercises/ExercisesGrid.tsx
touch src/components/exercises/ExerciseCard.tsx
touch src/components/exercises/ExerciseDetailDialog.tsx
touch src/components/exercises/ExerciseDetailSheet.tsx
touch src/components/exercises/Pagination.tsx
touch src/components/exercises/types.ts
touch src/components/exercises/hooks/useExercisesFilters.ts
touch src/components/exercises/hooks/useDebounce.ts
```

1.3. Utwórz plik strony Astro:
```bash
touch src/pages/exercises/index.astro
```

---

### Krok 2: Definicja typów

2.1. W pliku `src/components/exercises/types.ts` zdefiniuj wszystkie typy (patrz sekcja 5.2)

2.2. Importuj istniejące typy z `@/types`:
```typescript
import type {
  ExerciseListItemDTO,
  ExerciseDetailDTO,
  CategoryDTO,
  DifficultyLevel,
  PaginationMetadataDTO
} from '@/types';
```

---

### Krok 3: Implementacja custom hooks

3.1. Implementuj `useDebounce.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

3.2. Implementuj `useExercisesFilters.ts`:

```typescript
import { useState, useEffect } from 'react';
import type { DifficultyLevel } from '@/types';
import type { InitialFilters, UseExercisesFiltersResult } from '../types';
import { useDebounce } from './useDebounce';

export function useExercisesFilters(initialFilters: InitialFilters): UseExercisesFiltersResult {
  const [categoryId, setCategoryId] = useState<string | undefined>(initialFilters.categoryId);
  const [difficulty, setDifficulty] = useState<DifficultyLevel[]>(initialFilters.difficulty || []);
  const [search, setSearch] = useState<string>(initialFilters.search || '');
  const [page, setPage] = useState<number>(initialFilters.page || 1);

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set('category_id', categoryId);
    if (difficulty.length > 0) params.set('difficulty', difficulty.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (page > 1) params.set('page', page.toString());

    const newUrl = params.toString() ? `/exercises?${params.toString()}` : '/exercises';

    // Update URL without reload (client-side navigation)
    window.history.pushState({}, '', newUrl);

    // Trigger Astro page reload with new params
    window.location.href = newUrl;
  }, [categoryId, difficulty, debouncedSearch, page]);

  const clearFilters = () => {
    setCategoryId(undefined);
    setDifficulty([]);
    setSearch('');
    setPage(1);
  };

  const isFilterActive = !!(categoryId || difficulty.length > 0 || search);

  return {
    filters: { categoryId, difficulty, search, page },
    setCategoryId,
    setDifficulty,
    setSearch,
    setPage,
    clearFilters,
    isFilterActive
  };
}
```

---

### Krok 4: Implementacja podstawowych komponentów filtrów

4.1. Implementuj `SearchInput.tsx`:

```tsx
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SearchInputProps } from './types';

export function SearchInput({ searchQuery, onChange, onClear }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(searchQuery);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    onChange(value);
  };

  const handleClear = () => {
    setLocalValue('');
    onClear();
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
      <Input
        type="text"
        placeholder="Wyszukaj ćwiczenie..."
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
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Wyczyść wyszukiwanie</span>
        </Button>
      )}
    </div>
  );
}
```

4.2. Implementuj `CategoryFilter.tsx`:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoryFilterProps } from './types';

export function CategoryFilter({ categories, selectedCategoryId, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="category-filter" className="text-sm font-medium text-neutral-700">
        Kategoria
      </label>
      <Select
        value={selectedCategoryId || 'all'}
        onValueChange={(value) => onChange(value === 'all' ? undefined : value)}
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
```

4.3. Implementuj `DifficultyFilter.tsx`:

```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { DifficultyLevel } from '@/types';
import type { DifficultyFilterProps } from './types';

const DIFFICULTY_LEVELS: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  Easy: 'Łatwy',
  Medium: 'Średni',
  Hard: 'Trudny'
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  Easy: 'text-green-600',
  Medium: 'text-yellow-600',
  Hard: 'text-red-600'
};

export function DifficultyFilter({ selectedDifficulty, onChange }: DifficultyFilterProps) {
  const handleToggle = (level: DifficultyLevel) => {
    if (selectedDifficulty.includes(level)) {
      onChange(selectedDifficulty.filter(d => d !== level));
    } else {
      onChange([...selectedDifficulty, level]);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-neutral-700 mb-2">
        Poziom trudności
      </legend>
      <div className="flex flex-col gap-3">
        {DIFFICULTY_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <Checkbox
              id={`difficulty-${level}`}
              checked={selectedDifficulty.includes(level)}
              onCheckedChange={() => handleToggle(level)}
            />
            <Label
              htmlFor={`difficulty-${level}`}
              className={`cursor-pointer ${DIFFICULTY_COLORS[level]}`}
            >
              {DIFFICULTY_LABELS[level]}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
```

---

### Krok 5: Implementacja ExercisesFilters (kontenera filtrów)

5.1. W `src/components/exercises/ExercisesFilters.tsx`:

```tsx
import { CategoryFilter } from './CategoryFilter';
import { DifficultyFilter } from './DifficultyFilter';
import { SearchInput } from './SearchInput';
import { Button } from '@/components/ui/button';
import { useExercisesFilters } from './hooks/useExercisesFilters';
import type { ExercisesFiltersProps } from './types';

export function ExercisesFilters({ categories, initialFilters }: ExercisesFiltersProps) {
  const {
    filters,
    setCategoryId,
    setDifficulty,
    setSearch,
    clearFilters,
    isFilterActive
  } = useExercisesFilters(initialFilters);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search */}
        <SearchInput
          searchQuery={filters.search}
          onChange={setSearch}
          onClear={() => setSearch('')}
        />

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategoryId={filters.categoryId}
          onChange={setCategoryId}
        />

        {/* Difficulty Filter */}
        <DifficultyFilter
          selectedDifficulty={filters.difficulty}
          onChange={setDifficulty}
        />
      </div>

      {/* Clear Filters Button */}
      {isFilterActive && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={clearFilters}>
            Wyczyść filtry
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Krok 6: Implementacja ExercisesHeader

6.1. W `src/components/exercises/ExercisesHeader.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ExercisesHeaderProps } from './types';

export function ExercisesHeader({ totalResults, activeFilters, onClearFilters }: ExercisesHeaderProps) {
  const hasActiveFilters = activeFilters && (
    activeFilters.category ||
    (activeFilters.difficulty && activeFilters.difficulty.length > 0) ||
    activeFilters.search
  );

  return (
    <header className="mb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
        Baza ćwiczeń
      </h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-lg text-neutral-600">
          Znaleziono <span className="font-semibold">{totalResults}</span> {totalResults === 1 ? 'ćwiczenie' : 'ćwiczeń'}
        </p>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-600">Aktywne filtry:</span>
            {activeFilters.category && (
              <Badge variant="secondary">
                Kategoria: {activeFilters.category}
              </Badge>
            )}
            {activeFilters.difficulty && activeFilters.difficulty.map(level => (
              <Badge key={level} variant="secondary">
                {level}
              </Badge>
            ))}
            {activeFilters.search && (
              <Badge variant="secondary">
                &ldquo;{activeFilters.search}&rdquo;
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="w-4 h-4 mr-1" />
              Wyczyść
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
```

---

### Krok 7: Implementacja ExerciseCard

7.1. W `src/components/exercises/ExerciseCard.tsx`:

```tsx
import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ExerciseCardProps } from './types';

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800'
};

const DIFFICULTY_LABELS = {
  Easy: 'Łatwy',
  Medium: 'Średni',
  Hard: 'Trudny'
};

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);

  if (!exercise?.id || !exercise?.name) {
    console.warn('Invalid exercise data:', exercise);
    return null;
  }

  return (
    <button
      onClick={() => onClick(exercise.id)}
      className="block w-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-blue-500"
    >
      {/* Image */}
      <div className="relative h-48 bg-neutral-100">
        {imageError || !exercise.image_path ? (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-neutral-400" />
          </div>
        ) : (
          <img
            src={exercise.image_path}
            alt={exercise.image_alt || exercise.name}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          {exercise.name}
        </h3>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {exercise.category.name}
          </Badge>
          <Badge className={DIFFICULTY_COLORS[exercise.difficulty]}>
            {DIFFICULTY_LABELS[exercise.difficulty]}
          </Badge>
        </div>
      </div>
    </button>
  );
}
```

---

### Krok 8: Implementacja ExercisesGrid

8.1. W `src/components/exercises/ExercisesGrid.tsx`:

```tsx
import { SearchX } from 'lucide-react';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '@/components/ui/button';
import type { ExercisesGridProps } from './types';

export function ExercisesGrid({ exercises, onExerciseClick, isLoading }: ExercisesGridProps) {
  if (isLoading) {
    // TODO: Implement skeleton loader
    return <div>Ładowanie...</div>;
  }

  if (!exercises || exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SearchX className="w-16 h-16 text-neutral-400 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Brak wyników
        </h3>
        <p className="text-neutral-600 max-w-md mb-4">
          Nie znaleziono ćwiczeń spełniających wybrane kryteria.
          Spróbuj zmienić filtry lub wyczyść wyszukiwanie.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onClick={onExerciseClick}
        />
      ))}
    </div>
  );
}
```

---

### Krok 9: Implementacja Pagination

9.1. W `src/components/exercises/Pagination.tsx`:

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginationProps } from './types';

export function Pagination({
  currentPage,
  totalPages,
  totalResults,
  resultsPerPage,
  onPageChange
}: PaginationProps) {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and surrounding pages with ellipsis
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
      {/* Results info */}
      <p className="text-sm text-neutral-600">
        Wyświetlane {startResult}-{endResult} z {totalResults} wyników
      </p>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Poprzednia
        </Button>

        <div className="hidden md:flex gap-1">
          {renderPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-neutral-400">
                {page}
              </span>
            )
          ))}
        </div>

        {/* Mobile: show current page */}
        <div className="md:hidden">
          <span className="text-sm text-neutral-600">
            Strona {currentPage} z {totalPages}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Następna
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
```

---

### Krok 10: Implementacja ExerciseDetailDialog i ExerciseDetailSheet

10.1. W `src/components/exercises/ExerciseDetailDialog.tsx`:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';
import type { ExerciseDetailDialogProps } from './types';

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800'
};

const DIFFICULTY_LABELS = {
  Easy: 'Łatwy',
  Medium: 'Średni',
  Hard: 'Trudny'
};

export function ExerciseDetailDialog({ exercise, isOpen, onOpenChange }: ExerciseDetailDialogProps) {
  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{exercise.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="relative w-full h-64 bg-neutral-100 rounded-lg overflow-hidden">
            {exercise.image_path ? (
              <img
                src={exercise.image_path}
                alt={exercise.image_alt || exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Dumbbell className="w-16 h-16 text-neutral-400" />
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-base">
              {exercise.category.name}
            </Badge>
            <Badge className={`text-base ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Badge>
          </div>

          {/* Category Description */}
          {exercise.category.description && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Grupa mięśniowa</h3>
              <p className="text-neutral-600">{exercise.category.description}</p>
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Opis techniki wykonania</h3>
              <p className="text-neutral-600 whitespace-pre-line">{exercise.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

10.2. W `src/components/exercises/ExerciseDetailSheet.tsx`:

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';
import type { ExerciseDetailSheetProps } from './types';

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800'
};

const DIFFICULTY_LABELS = {
  Easy: 'Łatwy',
  Medium: 'Średni',
  Hard: 'Trudny'
};

export function ExerciseDetailSheet({ exercise, isOpen, onOpenChange }: ExerciseDetailSheetProps) {
  if (!exercise) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{exercise.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Image */}
          <div className="relative w-full h-48 bg-neutral-100 rounded-lg overflow-hidden">
            {exercise.image_path ? (
              <img
                src={exercise.image_path}
                alt={exercise.image_alt || exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Dumbbell className="w-12 h-12 text-neutral-400" />
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {exercise.category.name}
            </Badge>
            <Badge className={DIFFICULTY_COLORS[exercise.difficulty]}>
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Badge>
          </div>

          {/* Category Description */}
          {exercise.category.description && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Grupa mięśniowa</h3>
              <p className="text-neutral-600">{exercise.category.description}</p>
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Opis techniki wykonania</h3>
              <p className="text-neutral-600 whitespace-pre-line">{exercise.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

### Krok 11: Implementacja strony Astro (SSR)

11.1. W `src/pages/exercises/index.astro`:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { ExercisesHeader } from '@/components/exercises/ExercisesHeader';
import { ExercisesFilters } from '@/components/exercises/ExercisesFilters';
import { ExercisesGrid } from '@/components/exercises/ExercisesGrid';
import { Pagination } from '@/components/exercises/Pagination';
import type { ExercisesPaginatedResponseDTO, CategoryDTO } from '@/types';

// Sprawdź autoryzację
if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Parsing URL parameters
const searchParams = Astro.url.searchParams;
const categoryId = searchParams.get('category_id') || undefined;
const difficultyParam = searchParams.get('difficulty');
const difficulty = difficultyParam ? difficultyParam.split(',') : undefined;
const search = searchParams.get('search') || undefined;
const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
const limit = 20;

// Budowanie URL do API exercises
const apiParams = new URLSearchParams();
if (categoryId) apiParams.set('category_id', categoryId);
if (difficulty) apiParams.set('difficulty', difficulty.join(','));
if (search) apiParams.set('search', search);
apiParams.set('page', page.toString());
apiParams.set('limit', limit.toString());

// Fetch exercises
const exercisesResponse = await fetch(
  `${Astro.url.origin}/api/exercises?${apiParams.toString()}`,
  {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  }
);

if (!exercisesResponse.ok) {
  if (exercisesResponse.status === 401) {
    return Astro.redirect('/auth/login');
  }
  console.error('Error fetching exercises:', exercisesResponse.statusText);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20ćwiczeń');
}

const exercisesData: ExercisesPaginatedResponseDTO = await exercisesResponse.json();

// Fetch categories dla filtra
const categoriesResponse = await fetch(
  `${Astro.url.origin}/api/categories`,
  {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  }
);

if (!categoriesResponse.ok) {
  console.error('Error fetching categories:', categoriesResponse.statusText);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20kategorii');
}

const categoriesResult = await categoriesResponse.json();
const categories: CategoryDTO[] = categoriesResult.data || [];

// Prepare data for components
const exercises = exercisesData.data || [];
const pagination = exercisesData.pagination;

// Find selected category name for active filters
const selectedCategory = categoryId
  ? categories.find(cat => cat.id === categoryId)?.name
  : undefined;

const activeFilters = {
  category: selectedCategory,
  difficulty: difficulty,
  search: search
};

const initialFilters = {
  categoryId: categoryId,
  difficulty: difficulty,
  search: search,
  page: page
};
---

<MainLayout title="Baza ćwiczeń - Gym Track">
  <main class="container mx-auto px-4 py-8 max-w-7xl">
    <ExercisesHeader
      totalResults={pagination.total}
      activeFilters={activeFilters}
      onClearFilters={() => window.location.href = '/exercises'}
      client:load
    />

    <ExercisesFilters
      categories={categories}
      initialFilters={initialFilters}
      client:load
    />

    <ExercisesGrid
      exercises={exercises}
      onExerciseClick={(id) => console.log('Exercise clicked:', id)}
      client:load
    />

    {pagination.total_pages > 1 && (
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.total_pages}
        totalResults={pagination.total}
        resultsPerPage={pagination.limit}
        onPageChange={(newPage) => {
          const params = new URLSearchParams(window.location.search);
          params.set('page', newPage.toString());
          window.location.href = `/exercises?${params.toString()}`;
        }}
        client:load
      />
    )}
  </main>
</MainLayout>
```

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-006 do US-010
✅ **Filtrowanie:** Kategoria (select), trudność (checkboxy), wyszukiwanie (real-time)
✅ **Paginacja:** Nawigacja między stronami wyników
✅ **Szczegóły:** Dialog (desktop) i Sheet (mobile) z pełnymi informacjami
✅ **Responsywność:** Grid 1 kolumna mobile, 2-3 desktop
✅ **Dostępność:** Semantic HTML, ARIA labels, focus states
✅ **Wydajność:** SSR z Astro, debounced search, lazy loading obrazków
✅ **Obsługa błędów:** Autoryzacja, błędy API, empty states, fallback obrazków
✅ **Type safety:** TypeScript w całym kodzie
✅ **Code quality:** ESLint, Prettier, komentarze JSDoc
✅ **UX:** Smooth transitions, hover effects, clear feedback, synchronizacja z URL

Implementacja powinna zająć **8-12 godzin** doświadczonemu programiście frontendowemu.
