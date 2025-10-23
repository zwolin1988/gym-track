# Plan implementacji widoku historii treningów

## 1. Przegląd

Widok historii treningów umożliwia użytkownikom przeglądanie wszystkich zakończonych treningów w formie osi czasu (timeline). Każdy trening wyświetla kluczowe informacje: datę, godzinę, nazwę planu treningowego, czas trwania, objętość treningową oraz liczbę ćwiczeń. Użytkownik może filtrować treningi według planu treningowego i zakresu dat, a także przeglądać szczegóły każdego treningu poprzez kliknięcie.

Widok realizuje historyjki użytkownika US-031, US-032, US-033, US-034 i dostarcza kluczowe dane dla analizy postępów treningowych.

## 2. Routing widoku

**Ścieżka:** `/workouts/history`

**Typ renderowania:** Server-side rendering (domyślne dla Astro w trybie `output: "server"`)

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

## 3. Struktura komponentów

```
src/pages/workouts/history.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/workouts/
    ├── WorkoutHistoryHeader.tsx (React - Nagłówek z licznikiem)
    ├── WorkoutHistoryFilters.tsx (React - Filtry: plan, daty)
    ├── WorkoutHistoryTimeline.tsx (React - Lista treningów)
    │   └── WorkoutHistoryItem.tsx (React - Pojedynczy wpis treningu)
    ├── WorkoutDetailModal.tsx (React - Modal ze szczegółami treningu)
    └── WorkoutHistoryPagination.tsx (React - Paginacja)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do pobrania danych treningów
- `WorkoutHistoryFilters` jako React component - interaktywne filtry z state management
- `WorkoutHistoryTimeline` jako React component - dynamiczna lista z loading states
- `WorkoutHistoryItem` jako React component - klikalne karty z hover effects
- `WorkoutDetailModal` jako React component - interaktywny modal z nawigacją
- `WorkoutHistoryPagination` jako React component - interaktywna paginacja

## 4. Szczegóły komponentów

### 4.1. history.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku historii
- Pobranie danych treningów z API Supabase
- Pobranie listy planów treningowych dla filtra
- Parsowanie query params (filtry, paginacja)
- Walidację autoryzacji użytkownika
- Obsługę błędów ładowania danych
- Przekazanie danych do komponentów React

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Parsowanie URL params: `status`, `plan_id`, `start_date`, `end_date`, `page`, `limit`
- Wywołanie Supabase client dla pobrania treningów z filtrami i paginacją
- Wywołanie Supabase client dla pobrania listy planów (dla dropdown filtra)
- Sekcja `<main>` z kontenerem na komponenty
- Conditional rendering w przypadku błędów
- Przekazanie danych przez props do komponentów React

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- Zapytanie do bazy musi się powieść (obsługa `error` z Supabase)
- Query params muszą być prawidłowe (walidacja dat, UUID planu)

**Typy:**
- `WorkoutListItemDTO[]` - tablica treningów z API
- `WorkoutPlanListItemDTO[]` - lista planów dla filtra
- `PaginationMetadataDTO` - metadane paginacji
- `SupabaseClient` - klient Supabase z kontekstu

**Propsy:**
Brak (główna strona Astro)

---

### 4.2. WorkoutHistoryHeader.tsx

**Opis komponentu:**
Komponent nagłówka wyświetlający tytuł strony oraz statystyki (liczba treningów, całkowita objętość). Zapewnia kontekst wizualny dla użytkownika.

**Główne elementy:**
- `<header>` z klasą dla stylowania
- `<h1>` - tytuł "Historia treningów"
- `<div>` - grid ze statystykami:
  - Liczba treningów (np. "25 treningów")
  - Całkowita objętość (np. "65,000 kg")
  - Średnia objętość na trening (opcjonalnie)
- Stylowanie z Tailwind CSS

**Obsługiwane zdarzenia:**
- Brak (komponent prezentacyjny)

**Warunki walidacji:**
- `totalWorkouts` musi być liczbą >= 0
- `totalVolume` musi być liczbą >= 0

**Typy:**
- `totalWorkouts: number`
- `totalVolume: number`

**Propsy:**
```typescript
interface WorkoutHistoryHeaderProps {
  totalWorkouts: number;
  totalVolume: number;
}
```

---

### 4.3. WorkoutHistoryFilters.tsx

**Opis komponentu:**
Komponent formularza filtrów umożliwiający filtrowanie treningów według planu treningowego i zakresu dat. Aktualizuje URL query params, co powoduje przeładowanie strony z nowymi filtrami.

**Główne elementy:**
- `<form>` kontener z grid dla filtrów
- `<Select>` (shadcn/ui) - wybór planu treningowego
  - Opcja "Wszystkie plany"
  - Lista planów użytkownika
- Filtry dat:
  - **Preset buttons:** "Ostatnie 7 dni", "Ostatnie 30 dni", "Ostatnie 3 miesiące", "Wszystkie"
  - **Custom range:** Dwa `<Input type="date">` (od - do)
- Przycisk "Zastosuj filtry"
- Przycisk "Wyczyść filtry" (reset)
- Stan form zarządzany przez `useState` lub React Hook Form

**Obsługiwane zdarzenia:**
- `onSubmit` - zastosowanie filtrów (aktualizacja URL)
- `onChange` dla każdego inputa - aktualizacja lokalnego stanu
- `onClick` (preset buttons) - szybkie ustawienie zakresu dat
- `onReset` - wyczyszczenie wszystkich filtrów

**Warunki walidacji:**
- `start_date` musi być <= `end_date`
- Daty muszą być w formacie ISO 8601 (YYYY-MM-DD)
- `plan_id` musi być prawidłowym UUID lub null

**Typy:**
- `WorkoutPlanListItemDTO[]` - lista planów dla dropdown
- `WorkoutHistoryFiltersFormData` - dane formularza

**Propsy:**
```typescript
interface WorkoutHistoryFiltersProps {
  plans: WorkoutPlanListItemDTO[];
  initialFilters: {
    plan_id?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
}
```

---

### 4.4. WorkoutHistoryTimeline.tsx

**Opis komponentu:**
Główny kontener wyświetlający treningi w formie osi czasu (timeline). Renderuje komponenty `WorkoutHistoryItem` dla każdego treningu. Obsługuje stan pusty (brak treningów), loading state oraz grupowanie treningów po datach.

**Główne elementy:**
- `<div>` kontener z layout timeline
- Grupowanie treningów po datach (opcjonalnie):
  - Header z datą (np. "20 stycznia 2024")
  - Lista treningów z tego dnia
- Mapowanie tablicy treningów na komponenty `WorkoutHistoryItem`
- Empty state - komunikat gdy brak treningów
- Loading skeleton - gdy dane się ładują
- Smooth transitions między stanami

**Obsługiwane zdarzenia:**
- `onClick` (delegowane do `WorkoutHistoryItem`) - otwarcie szczegółów treningu

**Warunki walidacji:**
- `workouts` musi być tablicą
- Jeśli `workouts.length === 0`, wyświetl empty state
- Jeśli `isLoading === true`, wyświetl skeleton

**Typy:**
- `WorkoutListItemDTO[]` - tablica treningów
- `isLoading?: boolean` - opcjonalny stan ładowania

**Propsy:**
```typescript
interface WorkoutHistoryTimelineProps {
  workouts: WorkoutListItemDTO[];
  isLoading?: boolean;
  onWorkoutClick: (workoutId: string) => void;
}
```

---

### 4.5. WorkoutHistoryItem.tsx

**Opis komponentu:**
Interaktywna karta reprezentująca pojedynczy trening w timeline. Wyświetla datę, godzinę, nazwę planu, czas trwania, objętość treningową i liczbę ćwiczeń. Kliknięcie otwiera modal ze szczegółami.

**Główne elementy:**
- `<article>` lub `<div>` z klasami timeline item
- Ikona lub marker timeline (np. kropka na lewej krawędzi)
- Header treningu:
  - Data (np. "20.01.2024")
  - Godzina rozpoczęcia (np. "14:30")
- Treść karty:
  - Nazwa planu treningowego
  - Badge ze statusem (completed - zielony)
- Statystyki (grid):
  - Czas trwania (np. "90 min")
  - Objętość treningowa (np. "8,500 kg")
  - Liczba ćwiczeń (np. "5 ćwiczeń")
  - Liczba serii (np. "15 serii")
- Hover effects (shadow, scale)
- Responsywny layout (stack vertical na mobile)

**Obsługiwane zdarzenia:**
- `onClick` - otwarcie modalu ze szczegółami treningu

**Warunki walidacji:**
- `workout.id` musi być niepustym UUID
- `workout.stats` powinny istnieć (completed workouts)
- Jeśli `stats` są null, wyświetl placeholder

**Typy:**
- `WorkoutListItemDTO` - pojedynczy trening z API

**Propsy:**
```typescript
interface WorkoutHistoryItemProps {
  workout: WorkoutListItemDTO;
  onClick: (workoutId: string) => void;
}
```

---

### 4.6. WorkoutDetailModal.tsx

**Opis komponentu:**
Modal (Dialog z shadcn/ui) wyświetlający pełne szczegóły wybranego treningu. Pokazuje wszystkie ćwiczenia, serie, rzeczywiste wykonanie vs planowane, notatki. Umożliwia zamknięcie i powrót do listy.

**Główne elementy:**
- `<Dialog>` (shadcn/ui) jako kontener modalu
- `<DialogHeader>` z tytułem i datą treningu
- Sekcja statystyk (identyczna jak w `WorkoutHistoryItem`, ale większa)
- Lista ćwiczeń (Accordion lub lista):
  - Nazwa ćwiczenia + obrazek
  - Tabela serii:
    - Kolumny: Nr, Planowane (powtórzenia x ciężar), Rzeczywiste, Status, Notatka
    - Wizualne oznaczenie wykonanych vs pominiętych serii
- Przycisk "Zamknij" lub `<DialogClose>`
- Loading state podczas ładowania szczegółów
- Error state w przypadku błędu

**Obsługiwane zdarzenia:**
- `onOpenChange` - obsługa otwarcia/zamknięcia modalu
- `useEffect` - fetch szczegółów treningu przy otwarciu

**Warunki walidacji:**
- `workoutId` musi być prawidłowym UUID
- Szczegóły treningu muszą się załadować (obsługa błędu)

**Typy:**
- `WorkoutDetailDTO | null` - szczegóły treningu lub null
- `workoutId: string | null` - ID aktualnie wyświetlanego treningu
- `isOpen: boolean` - stan modalu

**Propsy:**
```typescript
interface WorkoutDetailModalProps {
  workoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**State management:**
```typescript
const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetailDTO | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (isOpen && workoutId) {
    fetchWorkoutDetails(workoutId);
  }
}, [isOpen, workoutId]);
```

---

### 4.7. WorkoutHistoryPagination.tsx

**Opis komponentu:**
Komponent paginacji umożliwiający nawigację między stronami wyników. Wyświetla numer strony, liczbę wszystkich stron i przyciski nawigacyjne.

**Główne elementy:**
- Przycisk "Poprzednia" (disabled na pierwszej stronie)
- Liczby stron (aktywna strona wyróżniona)
- Przycisk "Następna" (disabled na ostatniej stronie)
- Informacja: "Strona X z Y"
- Aktualizacja URL query param `page` przy kliknięciu

**Obsługiwane zdarzenia:**
- `onClick` - zmiana strony (aktualizacja URL)

**Warunki walidacji:**
- `currentPage` >= 1
- `totalPages` >= 1
- `currentPage` <= `totalPages`

**Typy:**
- `PaginationMetadataDTO` - metadane paginacji

**Propsy:**
```typescript
interface WorkoutHistoryPaginationProps {
  pagination: PaginationMetadataDTO;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Treningi z listowania
export type WorkoutListItemDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
};

// Szczegóły treningu
export type WorkoutDetailDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
  exercises: WorkoutExerciseDTO[];
};

// Statystyki treningu
export type WorkoutStatsDTO = Omit<Tables<"workout_stats">, "id" | "user_id" | "workout_id" | "created_at">;

// Paginacja
export interface PaginationMetadataDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Plany treningowe (dla filtra)
export type WorkoutPlanListItemDTO = Omit<Tables<"workout_plans">, "user_id" | "deleted_at"> & {
  exercise_count: number;
  total_sets: number;
};
```

### 5.2. Nowe typy (ViewModel)

```typescript
// src/components/workouts/types.ts

/**
 * Filtry historii treningów
 */
export interface WorkoutHistoryFilters {
  plan_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Dane formularza filtrów
 */
export interface WorkoutHistoryFiltersFormData {
  plan_id: string;
  start_date: string;
  end_date: string;
  preset?: '7d' | '30d' | '3m' | 'all';
}

/**
 * Props dla WorkoutHistoryHeader
 */
export interface WorkoutHistoryHeaderProps {
  totalWorkouts: number;
  totalVolume: number;
}

/**
 * Props dla WorkoutHistoryFilters
 */
export interface WorkoutHistoryFiltersProps {
  plans: WorkoutPlanListItemDTO[];
  initialFilters: WorkoutHistoryFilters;
}

/**
 * Props dla WorkoutHistoryTimeline
 */
export interface WorkoutHistoryTimelineProps {
  workouts: WorkoutListItemDTO[];
  isLoading?: boolean;
  onWorkoutClick: (workoutId: string) => void;
}

/**
 * Props dla WorkoutHistoryItem
 */
export interface WorkoutHistoryItemProps {
  workout: WorkoutListItemDTO;
  onClick: (workoutId: string) => void;
}

/**
 * Props dla WorkoutDetailModal
 */
export interface WorkoutDetailModalProps {
  workoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props dla WorkoutHistoryPagination
 */
export interface WorkoutHistoryPaginationProps {
  pagination: PaginationMetadataDTO;
}

/**
 * Predefiniowane zakresy dat
 */
export const DATE_PRESETS = {
  '7d': { label: 'Ostatnie 7 dni', days: 7 },
  '30d': { label: 'Ostatnie 30 dni', days: 30 },
  '3m': { label: 'Ostatnie 3 miesiące', days: 90 },
  'all': { label: 'Wszystkie', days: null }
} as const;
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** Supabase PostgreSQL

**Zapytanie dla treningów:**
```typescript
// Parsowanie query params
const urlParams = new URLSearchParams(Astro.url.search);
const status = 'completed'; // zawsze completed dla historii
const planId = urlParams.get('plan_id') || null;
const startDate = urlParams.get('start_date') || null;
const endDate = urlParams.get('end_date') || null;
const page = parseInt(urlParams.get('page') || '1', 10);
const limit = parseInt(urlParams.get('limit') || '20', 10);

// Budowanie zapytania z filtrami
let query = supabase
  .from('workouts')
  .select(`
    id,
    plan_id,
    status,
    started_at,
    completed_at,
    workout_plans!inner(name),
    workout_stats(
      duration_minutes,
      total_exercises,
      total_sets,
      total_reps,
      max_weight,
      total_volume
    )
  `, { count: 'exact' })
  .eq('status', 'completed')
  .order('started_at', { ascending: false });

// Zastosowanie filtrów
if (planId) {
  query = query.eq('plan_id', planId);
}
if (startDate) {
  query = query.gte('started_at', startDate);
}
if (endDate) {
  query = query.lte('started_at', endDate);
}

// Paginacja
const from = (page - 1) * limit;
const to = from + limit - 1;
query = query.range(from, to);

// Wykonanie zapytania
const { data: workoutsRaw, error, count } = await query;
```

**Zapytanie dla planów (filtr):**
```typescript
const { data: plansRaw, error: plansError } = await supabase
  .from('workout_plans')
  .select('id, name')
  .is('deleted_at', null)
  .order('name', { ascending: true });
```

**Transformacja danych:**
```typescript
// Mapowanie treningów
const workouts: WorkoutListItemDTO[] = (workoutsRaw || []).map(w => ({
  id: w.id,
  plan_id: w.plan_id,
  status: w.status,
  started_at: w.started_at,
  completed_at: w.completed_at,
  plan_name: w.workout_plans.name,
  stats: w.workout_stats?.[0] || null
}));

// Metadane paginacji
const pagination: PaginationMetadataDTO = {
  page,
  limit,
  total: count || 0,
  total_pages: Math.ceil((count || 0) / limit)
};

// Statystyki nagłówka
const totalVolume = workouts.reduce((sum, w) => sum + (w.stats?.total_volume || 0), 0);
```

### 6.2. Stan client-side (React)

**Stan lokalny w WorkoutHistoryFilters:**
- `formData: WorkoutHistoryFiltersFormData` - dane formularza filtrów
- Stan zarządzany przez `useState` lub React Hook Form

**Stan lokalny w WorkoutDetailModal:**
- `workoutDetails: WorkoutDetailDTO | null` - szczegóły wybranego treningu
- `isLoading: boolean` - czy dane się ładują
- `error: string | null` - komunikat błędu

**Stan globalny aplikacji:**
- `selectedWorkoutId: string | null` - ID aktualnie wybranego treningu dla modalu
- `isModalOpen: boolean` - czy modal jest otwarty
- Zarządzane przez `useState` w komponencie nadrzędnym lub URL state

## 7. Integracja API

### 7.1. Endpoint używany

**Endpoint:** `GET /api/workouts`

**Query Parameters:**
- `status=completed` - zawsze dla historii
- `plan_id` (UUID, optional) - filtr po planie
- `start_date` (ISO 8601 date, optional) - filtr od daty
- `end_date` (ISO 8601 date, optional) - filtr do daty
- `sort=started_at` - sortowanie
- `order=desc` - kolejność (najnowsze pierwsze)
- `page` (number, default: 1) - numer strony
- `limit` (number, default: 20) - wyników na stronę

**Typ:** Read-only (SELECT)

**Autoryzacja:** Wymaga zalogowania, RLS filtruje po `user_id = auth.uid()`

### 7.2. Zapytanie szczegółów treningu

**Endpoint:** `GET /api/workouts/{id}`

**Użycie:** Fetch szczegółów treningu dla modalu

**Zapytanie (client-side):**
```typescript
async function fetchWorkoutDetails(workoutId: string): Promise<WorkoutDetailDTO> {
  const response = await fetch(`/api/workouts/${workoutId}`);

  if (!response.ok) {
    throw new Error('Nie udało się załadować szczegółów treningu');
  }

  const { data } = await response.json();
  return data;
}
```

### 7.3. Obsługa błędów

**Scenariusze błędów:**
1. Błąd autoryzacji (401) - użytkownik niezalogowany
2. Błąd zapytania (500) - problem z bazą danych
3. Brak treningów - empty state
4. Błąd ładowania szczegółów w modalu

**Obsługa:**
```typescript
if (error) {
  console.error('Error fetching workouts:', error);
  // Opcja 1: Wyświetl toast error
  toast.error('Nie udało się załadować historii treningów');

  // Opcja 2: Przekierowanie (jeśli krytyczny błąd)
  // return Astro.redirect('/error?message=...');
}

if (!workouts || workouts.length === 0) {
  // Wyświetl empty state w UI
}
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie historii

**Akcja:** Użytkownik wchodzi na stronę `/workouts/history`

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro wykonuje SSR i pobiera dane z Supabase
3. Strona renderuje się z listą treningów
4. Użytkownik widzi timeline z treningami

**Oczekiwany wynik:**
- Lista treningów sortowana od najnowszych
- Każdy trening z kluczowymi statystykami
- Responsywny layout (mobile i desktop)
- Smooth loading (skeleton opcjonalnie)

### 8.2. Filtrowanie po planie treningowym (US-033)

**Akcja:** Użytkownik wybiera plan z dropdown filtra

**Przepływ:**
1. Kliknięcie w `<Select>` otwiera dropdown z listą planów
2. Wybór planu aktualizuje stan formularza
3. Kliknięcie "Zastosuj filtry" submittuje formularz
4. URL aktualizuje się: `/workouts/history?plan_id={uuid}`
5. Strona przeładowuje się z nowymi danymi

**Oczekiwany wynik:**
- Lista treningów przefiltrowana do wybranego planu
- Licznik pokazuje liczbę znalezionych treningów
- Filtr jest zapamiętany w URL (możliwość bookmarku)

### 8.3. Filtrowanie po zakresie dat (US-034)

**Akcja:** Użytkownik wybiera zakres dat (preset lub custom)

**Przepływ opcja 1 (preset):**
1. Kliknięcie "Ostatnie 7 dni"
2. Automatyczne ustawienie `start_date` (dzisiaj - 7 dni) i `end_date` (dzisiaj)
3. Automatyczne zastosowanie filtra (submit)
4. URL aktualizuje się: `/workouts/history?start_date=...&end_date=...`

**Przepływ opcja 2 (custom):**
1. Wybór daty w polu "Od" (`<Input type="date">`)
2. Wybór daty w polu "Do"
3. Kliknięcie "Zastosuj filtry"
4. URL aktualizuje się z custom datami

**Oczekiwany wynik:**
- Lista treningów z wybranego zakresu dat
- Walidacja: data "Od" <= "Do"
- Komunikat błędu jeśli walidacja nie przejdzie

### 8.4. Przeglądanie szczegółów treningu (US-032)

**Akcja:** Użytkownik klika na kartę treningu

**Przepływ:**
1. Kliknięcie na `WorkoutHistoryItem`
2. Event handler wywołuje `onWorkoutClick(workoutId)`
3. Stan `selectedWorkoutId` aktualizuje się
4. Modal otwiera się (`isModalOpen = true`)
5. `useEffect` w modalu fetchuje szczegóły treningu
6. Modal wyświetla szczegóły (ćwiczenia, serie, notatki)

**Oczekiwany wynik:**
- Modal z pełnymi szczegółami treningu
- Lista wszystkich ćwiczeń i serii
- Porównanie planowane vs rzeczywiste
- Notatki jeśli były dodane
- Przycisk zamknięcia modalu

### 8.5. Paginacja

**Akcja:** Użytkownik klika "Następna strona"

**Przepływ:**
1. Kliknięcie na przycisk "Następna"
2. URL aktualizuje się: `/workouts/history?page=2`
3. Strona przeładowuje się z danymi strony 2
4. Scroll do góry strony (auto)

**Oczekiwany wynik:**
- Wyświetlenie następnej partii treningów
- Aktywny numer strony w paginacji
- Disabled "Następna" na ostatniej stronie

### 8.6. Wyczyszczenie filtrów

**Akcja:** Użytkownik klika "Wyczyść filtry"

**Przepływ:**
1. Kliknięcie przycisku "Wyczyść"
2. Wszystkie filtry resetują się do wartości domyślnych
3. URL aktualizuje się: `/workouts/history`
4. Strona przeładowuje się bez filtrów

**Oczekiwany wynik:**
- Pełna lista treningów bez filtrów
- Wszystkie pola filtrów puste/domyślne

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

### 9.2. Walidacja query params

**Komponent:** `history.astro`

**Warunki:**
- `page` - liczba całkowita >= 1
- `limit` - liczba całkowita, 1-100
- `plan_id` - prawidłowy UUID lub null
- `start_date` - prawidłowa data ISO 8601 lub null
- `end_date` - prawidłowa data ISO 8601 lub null
- `start_date` <= `end_date` (jeśli oba podane)

**Efekt niepowodzenia:**
```typescript
// Walidacja zakresu dat
if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
  toast.error('Data rozpoczęcia musi być wcześniejsza niż data zakończenia');
  return Astro.redirect('/workouts/history');
}

// Walidacja UUID planu
if (planId && !isValidUUID(planId)) {
  toast.error('Nieprawidłowy identyfikator planu');
  return Astro.redirect('/workouts/history');
}
```

### 9.3. Walidacja formularza filtrów

**Komponent:** `WorkoutHistoryFilters.tsx`

**Warunki:**
- Daty w prawidłowym formacie
- `start_date` <= `end_date`
- `plan_id` - prawidłowy UUID lub "all"

**Implementacja (Zod schema):**
```typescript
import { z } from 'zod';

const workoutFiltersSchema = z.object({
  plan_id: z.string().uuid().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
}).refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia",
  path: ["end_date"]
});
```

### 9.4. Walidacja danych z API

**Komponent:** `history.astro`

**Warunki:**
- `error === null` - zapytanie się powiodło
- `workouts !== null` - dane istnieją
- `count >= 0` - liczba wyników jest prawidłowa

**Efekt niepowodzenia:**
```typescript
if (error) {
  console.error('Database error:', error);
  toast.error('Nie udało się załadować historii treningów');
  // Wyświetl error state lub przekieruj
}
```

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik próbuje uzyskać dostęp do `/workouts/history` bez zalogowania

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu użytkownik wraca do `/workouts/history`

**Komunikat:** Toast info: "Zaloguj się, aby zobaczyć historię treningów"

### 10.2. Błąd zapytania do bazy (500)

**Scenariusz:** Supabase zwraca błąd podczas pobierania treningów

**Obsługa:**
```typescript
if (error) {
  console.error('Database error:', error);
  toast.error('Nie udało się załadować historii treningów. Spróbuj ponownie później.');
  // Wyświetl error state w UI (zamiast listy)
}
```

**UI Error State:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
    Wystąpił błąd
  </h3>
  <p className="text-neutral-600 max-w-md mb-4">
    Nie udało się załadować historii treningów. Spróbuj odświeżyć stronę.
  </p>
  <Button onClick={() => window.location.reload()}>
    Odśwież stronę
  </Button>
</div>
```

### 10.3. Brak treningów (Empty state)

**Scenariusz:** Zapytanie się powiodło, ale użytkownik nie ma żadnych zakończonych treningów

**Obsługa:**
- Renderowanie empty state w `WorkoutHistoryTimeline`

**UI Empty State:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <History className="w-16 h-16 text-neutral-400 mb-4" />
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
    Brak treningów
  </h3>
  <p className="text-neutral-600 max-w-md mb-4">
    Nie masz jeszcze żadnych zakończonych treningów. Rozpocznij trening, aby zobaczyć historię.
  </p>
  <Button asChild>
    <a href="/workout-plans">Wybierz plan treningowy</a>
  </Button>
</div>
```

### 10.4. Błąd filtrów (nieprawidłowe daty)

**Scenariusz:** Użytkownik wprowadza `start_date` > `end_date`

**Obsługa:**
- Walidacja w formularzu (Zod)
- Wyświetlenie błędu pod polem `end_date`
- Przycisk "Zastosuj filtry" disabled

**UI:**
```tsx
{errors.end_date && (
  <p className="text-sm text-red-600 mt-1">
    {errors.end_date.message}
  </p>
)}
```

### 10.5. Błąd ładowania szczegółów treningu (modal)

**Scenariusz:** Fetch szczegółów treningu kończy się błędem (404, 500)

**Obsługa:**
```typescript
const fetchWorkoutDetails = async (id: string) => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(`/api/workouts/${id}`);

    if (!response.ok) {
      throw new Error('Nie udało się załadować szczegółów treningu');
    }

    const { data } = await response.json();
    setWorkoutDetails(data);
  } catch (err) {
    setError(err.message);
    toast.error('Nie udało się załadować szczegółów treningu');
  } finally {
    setIsLoading(false);
  }
};
```

**UI w modalu:**
```tsx
{error && (
  <div className="text-center py-8">
    <p className="text-red-600">{error}</p>
    <Button onClick={onClose} className="mt-4">Zamknij</Button>
  </div>
)}
```

### 10.6. Brak statystyk treningu

**Scenariusz:** Trening istnieje, ale `stats` są null (edge case)

**Obsługa:**
- Wyświetlenie placeholdera zamiast statystyk
- Komunikat: "Statystyki niedostępne"

**UI:**
```tsx
{workout.stats ? (
  <div className="grid grid-cols-2 gap-4">
    <StatItem label="Czas trwania" value={`${workout.stats.duration_minutes} min`} />
    <StatItem label="Objętość" value={`${workout.stats.total_volume} kg`} />
  </div>
) : (
  <p className="text-sm text-neutral-500 italic">Statystyki niedostępne</p>
)}
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalog komponentów:
```bash
mkdir -p src/components/workouts
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/workouts/WorkoutHistoryHeader.tsx
touch src/components/workouts/WorkoutHistoryFilters.tsx
touch src/components/workouts/WorkoutHistoryTimeline.tsx
touch src/components/workouts/WorkoutHistoryItem.tsx
touch src/components/workouts/WorkoutDetailModal.tsx
touch src/components/workouts/WorkoutHistoryPagination.tsx
touch src/components/workouts/types.ts
```

1.3. Utwórz plik strony Astro:
```bash
mkdir -p src/pages/workouts
touch src/pages/workouts/history.astro
```

---

### Krok 2: Definicja typów

2.1. W pliku `src/components/workouts/types.ts` zdefiniuj wszystkie typy:

```typescript
import type {
  WorkoutListItemDTO,
  WorkoutDetailDTO,
  WorkoutPlanListItemDTO,
  PaginationMetadataDTO
} from '@/types';

export interface WorkoutHistoryFilters {
  plan_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface WorkoutHistoryFiltersFormData {
  plan_id: string;
  start_date: string;
  end_date: string;
  preset?: '7d' | '30d' | '3m' | 'all';
}

export interface WorkoutHistoryHeaderProps {
  totalWorkouts: number;
  totalVolume: number;
}

export interface WorkoutHistoryFiltersProps {
  plans: WorkoutPlanListItemDTO[];
  initialFilters: WorkoutHistoryFilters;
}

export interface WorkoutHistoryTimelineProps {
  workouts: WorkoutListItemDTO[];
  isLoading?: boolean;
  onWorkoutClick: (workoutId: string) => void;
}

export interface WorkoutHistoryItemProps {
  workout: WorkoutListItemDTO;
  onClick: (workoutId: string) => void;
}

export interface WorkoutDetailModalProps {
  workoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface WorkoutHistoryPaginationProps {
  pagination: PaginationMetadataDTO;
}

export const DATE_PRESETS = {
  '7d': { label: 'Ostatnie 7 dni', days: 7 },
  '30d': { label: 'Ostatnie 30 dni', days: 30 },
  '3m': { label: 'Ostatnie 3 miesiące', days: 90 },
  'all': { label: 'Wszystkie', days: null }
} as const;
```

---

### Krok 3: Utility functions dla dat

3.1. Utwórz plik `src/lib/utils/dates.ts`:

```typescript
/**
 * Oblicza datę X dni wstecz od dzisiaj
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Formatuje datę do polskiego formatu
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

/**
 * Formatuje godzinę
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Formatuje czas trwania (minuty) do formatu "Xh Ymin" lub "Xmin"
 */
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes}min`;
}

/**
 * Formatuje liczbę z separatorem tysięcy
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pl-PL').format(num);
}
```

---

### Krok 4: Implementacja WorkoutHistoryHeader

4.1. W `src/components/workouts/WorkoutHistoryHeader.tsx`:

```tsx
import type { WorkoutHistoryHeaderProps } from './types';
import { formatNumber } from '@/lib/utils/dates';

export function WorkoutHistoryHeader({ totalWorkouts, totalVolume }: WorkoutHistoryHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
        Historia treningów
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Liczba treningów */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
          <p className="text-sm text-neutral-600 mb-1">Liczba treningów</p>
          <p className="text-2xl font-bold text-neutral-900">
            {totalWorkouts}
          </p>
        </div>

        {/* Całkowita objętość */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
          <p className="text-sm text-neutral-600 mb-1">Całkowita objętość</p>
          <p className="text-2xl font-bold text-neutral-900">
            {formatNumber(totalVolume)} <span className="text-lg">kg</span>
          </p>
        </div>

        {/* Średnia objętość na trening */}
        {totalWorkouts > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-1">Średnia objętość</p>
            <p className="text-2xl font-bold text-neutral-900">
              {formatNumber(Math.round(totalVolume / totalWorkouts))} <span className="text-lg">kg</span>
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
```

---

### Krok 5: Implementacja WorkoutHistoryFilters

5.1. W `src/components/workouts/WorkoutHistoryFilters.tsx`:

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkoutHistoryFiltersProps } from './types';
import { DATE_PRESETS } from './types';
import { getDaysAgo } from '@/lib/utils/dates';

const filtersSchema = z.object({
  plan_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia",
  path: ["end_date"]
});

type FiltersFormData = z.infer<typeof filtersSchema>;

export function WorkoutHistoryFilters({ plans, initialFilters }: WorkoutHistoryFiltersProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FiltersFormData>({
    resolver: zodResolver(filtersSchema),
    defaultValues: {
      plan_id: initialFilters.plan_id || '',
      start_date: initialFilters.start_date || '',
      end_date: initialFilters.end_date || '',
    }
  });

  const applyDatePreset = (preset: keyof typeof DATE_PRESETS) => {
    if (preset === 'all') {
      setValue('start_date', '');
      setValue('end_date', '');
    } else {
      const days = DATE_PRESETS[preset].days;
      const startDate = getDaysAgo(days);
      const endDate = new Date().toISOString().split('T')[0];
      setValue('start_date', startDate);
      setValue('end_date', endDate);
    }
  };

  const onSubmit = (data: FiltersFormData) => {
    // Budowanie URL z query params
    const params = new URLSearchParams();

    if (data.plan_id) params.set('plan_id', data.plan_id);
    if (data.start_date) params.set('start_date', data.start_date);
    if (data.end_date) params.set('end_date', data.end_date);

    // Przekierowanie z nowymi filtrami
    window.location.href = `/workouts/history?${params.toString()}`;
  };

  const handleReset = () => {
    reset({
      plan_id: '',
      start_date: '',
      end_date: '',
    });
    window.location.href = '/workouts/history';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filtry</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Filtr planu */}
        <div>
          <Label htmlFor="plan_id">Plan treningowy</Label>
          <Select {...register('plan_id')} defaultValue={initialFilters.plan_id || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Wszystkie plany" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Wszystkie plany</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Presety dat */}
        <div>
          <Label>Szybki wybór zakresu dat</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {Object.entries(DATE_PRESETS).map(([key, value]) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyDatePreset(key as keyof typeof DATE_PRESETS)}
              >
                {value.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom zakres dat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Data od</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
            />
          </div>
          <div>
            <Label htmlFor="end_date">Data do</Label>
            <Input
              id="end_date"
              type="date"
              {...register('end_date')}
            />
            {errors.end_date && (
              <p className="text-sm text-red-600 mt-1">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="flex gap-3">
          <Button type="submit">
            Zastosuj filtry
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Wyczyść filtry
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

### Krok 6: Implementacja WorkoutHistoryItem

6.1. W `src/components/workouts/WorkoutHistoryItem.tsx`:

```tsx
import { Calendar, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WorkoutHistoryItemProps } from './types';
import { formatDate, formatTime, formatDuration, formatNumber } from '@/lib/utils/dates';

export function WorkoutHistoryItem({ workout, onClick }: WorkoutHistoryItemProps) {
  if (!workout?.id) {
    return null;
  }

  const stats = workout.stats;

  return (
    <article
      onClick={() => onClick(workout.id)}
      className="relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden border-l-4 border-l-green-500"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {workout.plan_name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(workout.started_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(workout.started_at)}
              </span>
            </div>
          </div>

          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Zakończony
          </Badge>
        </div>
      </div>

      {/* Statystyki */}
      {stats ? (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Czas trwania */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-600">Czas</p>
              <p className="text-sm font-semibold text-neutral-900">
                {formatDuration(stats.duration_minutes)}
              </p>
            </div>
          </div>

          {/* Objętość */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-600">Objętość</p>
              <p className="text-sm font-semibold text-neutral-900">
                {formatNumber(stats.total_volume)} kg
              </p>
            </div>
          </div>

          {/* Liczba ćwiczeń */}
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-600">Ćwiczenia</p>
              <p className="text-sm font-semibold text-neutral-900">
                {stats.total_exercises}
              </p>
            </div>
          </div>

          {/* Liczba serii */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center text-neutral-400 font-bold">
              #
            </div>
            <div>
              <p className="text-xs text-neutral-600">Serie</p>
              <p className="text-sm font-semibold text-neutral-900">
                {stats.total_sets}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-neutral-500 italic">Statystyki niedostępne</p>
        </div>
      )}
    </article>
  );
}
```

---

### Krok 7: Implementacja WorkoutHistoryTimeline

7.1. W `src/components/workouts/WorkoutHistoryTimeline.tsx`:

```tsx
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkoutHistoryItem } from './WorkoutHistoryItem';
import type { WorkoutHistoryTimelineProps } from './types';

export function WorkoutHistoryTimeline({ workouts, isLoading, onWorkoutClick }: WorkoutHistoryTimelineProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!workouts || workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-lg shadow-sm border border-neutral-200">
        <History className="w-16 h-16 text-neutral-400 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Brak treningów
        </h3>
        <p className="text-neutral-600 max-w-md mb-4">
          Nie masz jeszcze żadnych zakończonych treningów. Rozpocznij trening, aby zobaczyć historię.
        </p>
        <Button asChild>
          <a href="/workout-plans">Wybierz plan treningowy</a>
        </Button>
      </div>
    );
  }

  // Timeline
  return (
    <div className="space-y-4">
      {workouts.map(workout => (
        <WorkoutHistoryItem
          key={workout.id}
          workout={workout}
          onClick={onWorkoutClick}
        />
      ))}
    </div>
  );
}
```

---

### Krok 8: Implementacja WorkoutDetailModal

8.1. W `src/components/workouts/WorkoutDetailModal.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WorkoutDetailModalProps } from './types';
import type { WorkoutDetailDTO } from '@/types';
import { formatDate, formatTime, formatDuration, formatNumber } from '@/lib/utils/dates';
import { toast } from 'sonner';

export function WorkoutDetailModal({ workoutId, isOpen, onClose }: WorkoutDetailModalProps) {
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workoutId) {
      fetchWorkoutDetails(workoutId);
    } else {
      // Reset state when modal closes
      setWorkoutDetails(null);
      setError(null);
    }
  }, [isOpen, workoutId]);

  const fetchWorkoutDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workouts/${id}`);

      if (!response.ok) {
        throw new Error('Nie udało się załadować szczegółów treningu');
      }

      const { data } = await response.json();
      setWorkoutDetails(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Szczegóły treningu</DialogTitle>
          <DialogClose />
        </DialogHeader>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={onClose}>Zamknij</Button>
          </div>
        )}

        {/* Content */}
        {workoutDetails && !isLoading && !error && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                {workoutDetails.plan_name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <span>{formatDate(workoutDetails.started_at)}</span>
                <span>{formatTime(workoutDetails.started_at)}</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Zakończony
                </Badge>
              </div>
            </div>

            {/* Statystyki */}
            {workoutDetails.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Czas trwania</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {formatDuration(workoutDetails.stats.duration_minutes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Objętość</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {formatNumber(workoutDetails.stats.total_volume)} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Ćwiczenia</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {workoutDetails.stats.total_exercises}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Serie</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {workoutDetails.stats.total_sets}
                  </p>
                </div>
              </div>
            )}

            {/* Lista ćwiczeń */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Wykonane ćwiczenia
              </h3>
              <div className="space-y-6">
                {workoutDetails.exercises.map((exercise, idx) => (
                  <div key={exercise.id} className="border border-neutral-200 rounded-lg p-4">
                    {/* Nagłówek ćwiczenia */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg font-bold text-neutral-400">#{idx + 1}</span>
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {exercise.exercise.name}
                      </h4>
                    </div>

                    {/* Tabela serii */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="text-left p-2">Seria</th>
                            <th className="text-left p-2">Planowane</th>
                            <th className="text-left p-2">Wykonane</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Notatka</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, setIdx) => (
                            <tr key={set.id} className="border-t border-neutral-200">
                              <td className="p-2 font-semibold">{setIdx + 1}</td>
                              <td className="p-2">
                                {set.planned_reps} x {set.planned_weight ? `${set.planned_weight} kg` : 'BW'}
                              </td>
                              <td className="p-2">
                                {set.actual_reps || '-'} x {set.actual_weight ? `${set.actual_weight} kg` : '-'}
                              </td>
                              <td className="p-2">
                                {set.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-neutral-400" />
                                )}
                              </td>
                              <td className="p-2 text-xs text-neutral-600 italic">
                                {set.note || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

### Krok 9: Implementacja WorkoutHistoryPagination

9.1. W `src/components/workouts/WorkoutHistoryPagination.tsx`:

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkoutHistoryPaginationProps } from './types';

export function WorkoutHistoryPagination({ pagination }: WorkoutHistoryPaginationProps) {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) {
    return null;
  }

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    return `${window.location.pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <Button
        variant="outline"
        disabled={page === 1}
        asChild={page > 1}
      >
        {page > 1 ? (
          <a href={buildPageUrl(page - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Poprzednia
          </a>
        ) : (
          <span>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Poprzednia
          </span>
        )}
      </Button>

      <span className="text-sm text-neutral-600">
        Strona <span className="font-semibold">{page}</span> z{' '}
        <span className="font-semibold">{total_pages}</span>
      </span>

      <Button
        variant="outline"
        disabled={page === total_pages}
        asChild={page < total_pages}
      >
        {page < total_pages ? (
          <a href={buildPageUrl(page + 1)}>
            Następna
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        ) : (
          <span>
            Następna
            <ChevronRight className="w-4 h-4 ml-1" />
          </span>
        )}
      </Button>
    </div>
  );
}
```

---

### Krok 10: Implementacja strony Astro (SSR)

10.1. W `src/pages/workouts/history.astro`:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { WorkoutHistoryHeader } from '@/components/workouts/WorkoutHistoryHeader';
import { WorkoutHistoryFilters } from '@/components/workouts/WorkoutHistoryFilters';
import { WorkoutHistoryTimeline } from '@/components/workouts/WorkoutHistoryTimeline';
import { WorkoutDetailModal } from '@/components/workouts/WorkoutDetailModal';
import { WorkoutHistoryPagination } from '@/components/workouts/WorkoutHistoryPagination';
import type {
  WorkoutListItemDTO,
  WorkoutPlanListItemDTO,
  PaginationMetadataDTO
} from '@/types';

// Sprawdź autoryzację
if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Parsowanie query params
const urlParams = new URLSearchParams(Astro.url.search);
const planId = urlParams.get('plan_id') || null;
const startDate = urlParams.get('start_date') || null;
const endDate = urlParams.get('end_date') || null;
const page = parseInt(urlParams.get('page') || '1', 10);
const limit = Math.min(parseInt(urlParams.get('limit') || '20', 10), 100);

// Walidacja zakresu dat
if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
  return Astro.redirect('/workouts/history');
}

// Budowanie zapytania z filtrami
let query = Astro.locals.supabase
  .from('workouts')
  .select(`
    id,
    plan_id,
    status,
    started_at,
    completed_at,
    workout_plans!inner(name),
    workout_stats(
      duration_minutes,
      total_exercises,
      total_sets,
      total_reps,
      max_weight,
      total_volume
    )
  `, { count: 'exact' })
  .eq('status', 'completed')
  .order('started_at', { ascending: false });

// Zastosowanie filtrów
if (planId) {
  query = query.eq('plan_id', planId);
}
if (startDate) {
  query = query.gte('started_at', startDate);
}
if (endDate) {
  // Dodaj 1 dzień do end_date, aby uwzględnić cały dzień
  const endDateTime = new Date(endDate);
  endDateTime.setDate(endDateTime.getDate() + 1);
  query = query.lt('started_at', endDateTime.toISOString());
}

// Paginacja
const from = (page - 1) * limit;
const to = from + limit - 1;
query = query.range(from, to);

// Wykonanie zapytania
const { data: workoutsRaw, error, count } = await query;

// Obsługa błędu
if (error) {
  console.error('Error fetching workouts:', error);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20historii%20treningów');
}

// Pobranie listy planów dla filtra
const { data: plansRaw, error: plansError } = await Astro.locals.supabase
  .from('workout_plans')
  .select('id, name, created_at')
  .is('deleted_at', null)
  .order('name', { ascending: true });

if (plansError) {
  console.error('Error fetching plans:', plansError);
}

// Transformacja danych
const workouts: WorkoutListItemDTO[] = (workoutsRaw || []).map(w => ({
  id: w.id,
  plan_id: w.plan_id,
  status: w.status,
  started_at: w.started_at,
  completed_at: w.completed_at,
  plan_name: w.workout_plans.name,
  stats: w.workout_stats?.[0] || null
}));

const plans: WorkoutPlanListItemDTO[] = (plansRaw || []).map(p => ({
  id: p.id,
  name: p.name,
  description: null,
  exercise_count: 0,
  total_sets: 0,
  last_used_at: null,
  created_at: p.created_at,
  updated_at: p.created_at
}));

const pagination: PaginationMetadataDTO = {
  page,
  limit,
  total: count || 0,
  total_pages: Math.ceil((count || 0) / limit)
};

// Obliczanie statystyk nagłówka
const totalWorkouts = count || 0;
const totalVolume = workouts.reduce((sum, w) => sum + (w.stats?.total_volume || 0), 0);

const initialFilters = {
  plan_id: planId,
  start_date: startDate,
  end_date: endDate
};
---

<MainLayout title="Historia treningów - Gym Track">
  <main class="container mx-auto px-4 py-8 max-w-7xl">
    <WorkoutHistoryHeader
      totalWorkouts={totalWorkouts}
      totalVolume={totalVolume}
      client:load
    />

    <WorkoutHistoryFilters
      plans={plans}
      initialFilters={initialFilters}
      client:load
    />

    <WorkoutHistoryTimeline
      workouts={workouts}
      isLoading={false}
      onWorkoutClick={(id: string) => {
        // Obsługiwane przez React state w komponencie nadrzędnym
      }}
      client:load
    />

    <WorkoutHistoryPagination
      pagination={pagination}
      client:load
    />

    <WorkoutDetailModal
      workoutId={null}
      isOpen={false}
      onClose={() => {}}
      client:load
    />
  </main>
</MainLayout>
```

---

### Krok 11: Dodanie state management dla modalu

11.1. Utwórz wrapper component `src/components/workouts/WorkoutHistoryContainer.tsx`:

```tsx
import { useState } from 'react';
import { WorkoutHistoryTimeline } from './WorkoutHistoryTimeline';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import type { WorkoutListItemDTO } from '@/types';

interface WorkoutHistoryContainerProps {
  workouts: WorkoutListItemDTO[];
}

export function WorkoutHistoryContainer({ workouts }: WorkoutHistoryContainerProps) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWorkoutClick = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkoutId(null);
  };

  return (
    <>
      <WorkoutHistoryTimeline
        workouts={workouts}
        onWorkoutClick={handleWorkoutClick}
      />

      <WorkoutDetailModal
        workoutId={selectedWorkoutId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
```

11.2. Zaktualizuj `history.astro` aby używać kontenera:

```astro
<!-- Zastąp WorkoutHistoryTimeline i WorkoutDetailModal: -->
<WorkoutHistoryContainer
  workouts={workouts}
  client:load
/>
```

---

### Krok 12: Dodanie linków nawigacyjnych

12.1. W głównej nawigacji dodaj link do historii:

```html
<nav>
  <a href="/">Dashboard</a>
  <a href="/workout-plans">Plany</a>
  <a href="/workouts/history">Historia</a>
  <a href="/exercises">Ćwiczenia</a>
</nav>
```

12.2. W Dashboard dodaj szybki dostęp (opcjonalnie).

---

### Krok 13: Testowanie

13.1. **Test manualny - przeglądanie:**
- Zaloguj się do aplikacji
- Przejdź do `/workouts/history`
- Sprawdź czy lista treningów się wyświetla (od najnowszych)
- Sprawdź statystyki w nagłówku

13.2. **Test manualny - filtrowanie:**
- Wybierz plan z dropdown → sprawdź filtrowanie
- Kliknij "Ostatnie 7 dni" → sprawdź czy daty się aktualizują
- Wybierz custom zakres dat → sprawdź filtrowanie
- Kliknij "Wyczyść filtry" → sprawdź reset

13.3. **Test manualny - szczegóły treningu:**
- Kliknij na kartę treningu
- Sprawdź czy modal się otwiera
- Sprawdź czy szczegóły się ładują
- Sprawdź wyświetlanie ćwiczeń i serii
- Zamknij modal

13.4. **Test manualny - paginacja:**
- Jeśli masz > 20 treningów, sprawdź paginację
- Kliknij "Następna" → sprawdź strona 2
- Kliknij "Poprzednia" → sprawdź powrót

13.5. **Test responsywności:**
- Sprawdź widok na mobile (DevTools)
- Sprawdź grid statystyk (2 kolumny mobile, 4 desktop)
- Sprawdź formularz filtrów (stack vertical mobile)

13.6. **Test błędów:**
- Wprowadź nieprawidłowy zakres dat → sprawdź walidację
- Symuluj błąd API → sprawdź empty state
- Wyloguj się i spróbuj wejść → sprawdź redirect

---

### Krok 14: Styling i dostępność

14.1. **Upewnij się że używasz semantic HTML:**
- `<article>` dla `WorkoutHistoryItem`
- `<table>` dla listy serii w modalu
- Prawidłowa hierarchia nagłówków

14.2. **Dodaj ARIA attributes:**
```tsx
<article
  onClick={() => onClick(workout.id)}
  role="button"
  tabIndex={0}
  aria-label={`Zobacz szczegóły treningu ${workout.plan_name} z dnia ${formatDate(workout.started_at)}`}
>
```

14.3. **Dodaj keyboard navigation:**
```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    onClick(workout.id);
  }
}}
```

14.4. **Sprawdź kontrast kolorów** (WCAG AA)

---

### Krok 15: Dokumentacja i code review

15.1. Dodaj komentarze JSDoc do komponentów

15.2. Sprawdź zgodność z wytycznymi projektu (CLAUDE.md)

15.3. Uruchom linter i formatter:
```bash
npm run lint:fix
npm run format
```

15.4. Commit zmian:
```bash
git add .
git commit -m "feat: implement workout history view with filters and pagination"
```

---

### Krok 16: Integracja z pipeline CI/CD

16.1. Sprawdź czy testy przechodzą w pipeline

16.2. Deploy do środowiska testowego

16.3. Po akceptacji merge do głównej gałęzi

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-031, US-032, US-033, US-034
✅ **Filtrowanie:** Po planie treningowym i zakresie dat (presety + custom)
✅ **Paginacja:** Nawigacja między stronami wyników
✅ **Szczegóły treningu:** Modal z pełnymi danymi (ćwiczenia, serie, notatki)
✅ **Responsywność:** Mobile-first design, grid layout
✅ **Dostępność:** Semantic HTML, ARIA labels, keyboard navigation
✅ **Wydajność:** SSR z Astro, client-side modal fetching
✅ **Obsługa błędów:** Walidacja filtrów, empty states, error states
✅ **Type safety:** TypeScript w całym kodzie
✅ **Code quality:** ESLint, Prettier, komentarze JSDoc
✅ **UX:** Smooth transitions, loading states, clear feedback

Implementacja powinna zająć **6-8 godzin** doświadczonemu programiście frontendowemu.
