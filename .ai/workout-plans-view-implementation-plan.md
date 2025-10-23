# Plan implementacji widoku listy planów treningowych

## 1. Przegląd

Widok listy planów treningowych umożliwia użytkownikom przeglądanie, zarządzanie i rozpoczynanie treningów na podstawie swoich planów. Każdy plan wyświetla nazwę, opis, liczbę ćwiczeń, liczbę serii oraz datę ostatniego użycia. Użytkownik może wyszukiwać plany po nazwie, sortować je według różnych kryteriów, edytować, usuwać oraz rozpoczynać treningi.

Widok realizuje historyjki użytkownika US-018 (Przeglądanie listy planów treningowych) i US-020 (Usuwanie planu treningowego).

## 2. Routing widoku

**Ścieżka:** `/workout-plans`

**Typ renderowania:** Server-side rendering (domyślne dla Astro w trybie `output: "server"`)

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

## 3. Struktura komponentów

```
src/pages/workout-plans/index.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/workout-plans/
    ├── WorkoutPlansHeader.tsx (React - Nagłówek z wyszukiwaniem i akcjami)
    ├── WorkoutPlansList.tsx (React - Lista/Grid z planami)
    │   └── WorkoutPlanCard.tsx (React - Pojedyncza karta planu)
    ├── WorkoutPlansSortControls.tsx (React - Kontrolki sortowania)
    ├── DeleteWorkoutPlanDialog.tsx (React - Dialog potwierdzenia usunięcia)
    └── EmptyState.tsx (React - Stan pusty gdy brak planów)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do pobrania danych planów
- `WorkoutPlansHeader` jako React component - interaktywna wyszukiwarka
- `WorkoutPlansList` jako React component - obsługuje klienckie filtrowanie i sortowanie
- `WorkoutPlanCard` jako React component - przyciski akcji (Edit, Delete, Start)
- `DeleteWorkoutPlanDialog` jako React component - zarządzanie stanem dialogu
- `WorkoutPlansSortControls` jako React component - interaktywne kontrolki sortowania

## 4. Szczegóły komponentów

### 4.1. index.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku
- Pobranie listy planów treningowych użytkownika z API Supabase
- Walidację autoryzacji użytkownika
- Obsługę błędów ładowania danych
- Przekazanie danych do komponentów React

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Wywołanie Supabase client dla pobrania planów z liczbą ćwiczeń i serii
- Sprawdzenie czy istnieje aktywny trening (blokada usuwania/rozpoczynania)
- Sekcja `<main>` z kontenerem na komponenty
- Conditional rendering w przypadku błędów
- Przekazanie danych przez props do `WorkoutPlansList`

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- Zapytanie do bazy musi się powieść (obsługa `error` z Supabase)
- RLS automatycznie filtruje plany użytkownika (`user_id = auth.uid()`)

**Typy:**
- `WorkoutPlanListItemDTO[]` - tablica planów z API
- `SupabaseClient` - klient Supabase z kontekstu

**Propsy:**
Brak (główna strona Astro)

**Zapytanie Supabase:**
```typescript
const { data: plans, error } = await locals.supabase
  .from('workout_plans')
  .select(`
    id,
    name,
    description,
    last_used_at,
    created_at,
    updated_at,
    plan_exercises:plan_exercises(
      id,
      plan_exercise_sets:plan_exercise_sets(id)
    )
  `)
  .is('deleted_at', null)
  .order('updated_at', { ascending: false });
```

---

### 4.2. WorkoutPlansHeader.tsx

**Opis komponentu:**
Komponent nagłówka wyświetlający tytuł strony, pole wyszukiwania oraz przycisk "Utwórz nowy plan". Zapewnia główne akcje użytkownika na tej stronie.

**Główne elementy:**
- `<header>` z klasą dla stylowania
- `<h1>` - tytuł "Moje plany treningowe"
- `<Input>` - pole wyszukiwania (search by name)
- `<Button>` - "Utwórz nowy plan" (link do `/workout-plans/new`)
- Ikona wyszukiwania (Lucide React `<Search />`)
- Licznik planów (np. "Znaleziono 5 planów")

**Obsługiwane zdarzenia:**
- `onChange` - wyszukiwanie w czasie rzeczywistym (debounce 300ms)
- `onClick` - nawigacja do tworzenia nowego planu

**Warunki walidacji:**
- `searchQuery` - string, może być pusty
- `totalPlans` - liczba >= 0
- `onSearchChange` - funkcja wymagana

**Typy:**
```typescript
interface WorkoutPlansHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalPlans: number;
  filteredCount: number;
}
```

**Propsy:**
```typescript
interface WorkoutPlansHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalPlans: number;
  filteredCount: number;
}
```

---

### 4.3. WorkoutPlansSortControls.tsx

**Opis komponentu:**
Komponent kontrolek sortowania pozwalający użytkownikowi sortować plany według daty utworzenia, daty aktualizacji lub nazwy, w kolejności rosnącej lub malejącej.

**Główne elementy:**
- `<Select>` (z shadcn/ui) - wybór pola sortowania
- `<Button>` - toggle kierunku sortowania (asc/desc)
- Ikony: `<ArrowUpDown />`, `<ArrowUp />`, `<ArrowDown />`
- Label: "Sortuj według:"

**Obsługiwane zdarzenia:**
- `onValueChange` - zmiana pola sortowania
- `onClick` - zmiana kierunku sortowania

**Warunki walidacji:**
- `sortField` - jeden z: `created_at`, `updated_at`, `name`
- `sortOrder` - jeden z: `asc`, `desc`

**Typy:**
```typescript
type SortField = 'created_at' | 'updated_at' | 'name';
type SortOrder = 'asc' | 'desc';

interface WorkoutPlansSortControlsProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}
```

**Propsy:**
```typescript
interface WorkoutPlansSortControlsProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}
```

---

### 4.4. WorkoutPlansList.tsx

**Opis komponentu:**
Główny kontener wyświetlający plany w układzie grid (responsywnym). Renderuje komponenty `WorkoutPlanCard` dla każdego planu. Obsługuje filtrowanie i sortowanie po stronie klienta. Wyświetla empty state gdy brak planów.

**Główne elementy:**
- `<div>` kontener z responsive grid (1 kolumna mobile, 2-3 desktop)
- Mapowanie przefiltrowanych i posortowanych planów na `WorkoutPlanCard`
- Empty state - komponent `<EmptyState />` gdy brak planów
- Klasy Tailwind dla responsywności (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`)

**Obsługiwane zdarzenia:**
- Delegowane do `WorkoutPlanCard` (edit, delete, start)

**Warunki walidacji:**
- `plans` - tablica, może być pusta
- `searchQuery` - string do filtrowania
- `sortField` i `sortOrder` - walidowane przez parent

**Typy:**
```typescript
interface WorkoutPlansListProps {
  plans: WorkoutPlanListItemDTO[];
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeletePlan: (planId: string) => void;
}
```

**Propsy:**
```typescript
interface WorkoutPlansListProps {
  plans: WorkoutPlanListItemDTO[];
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeletePlan: (planId: string) => void;
}
```

**Logika filtrowania i sortowania:**
```typescript
const filteredPlans = useMemo(() => {
  let result = [...plans];

  // Filtrowanie po nazwie
  if (searchQuery) {
    result = result.filter(plan =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sortowanie
  result.sort((a, b) => {
    let compareValue = 0;
    if (sortField === 'name') {
      compareValue = a.name.localeCompare(b.name);
    } else if (sortField === 'created_at') {
      compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortField === 'updated_at') {
      compareValue = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  return result;
}, [plans, searchQuery, sortField, sortOrder]);
```

---

### 4.5. WorkoutPlanCard.tsx

**Opis komponentu:**
Interaktywna karta reprezentująca pojedynczy plan treningowy. Wyświetla nazwę, opis, liczbę ćwiczeń, liczbę serii oraz datę ostatniego użycia. Zawiera przyciski akcji: Edytuj, Usuń, Rozpocznij trening.

**Główne elementy:**
- `<Card>` (z shadcn/ui) - kontener karty
- `<CardHeader>` - nazwa planu i data ostatniego użycia
- `<CardContent>` - opis, liczba ćwiczeń, liczba serii
- `<CardFooter>` - przyciski akcji
- Badge: "X ćwiczeń", "Y serii"
- `<DropdownMenu>` (opcjonalnie) - menu z akcjami
- Przyciski: "Rozpocznij trening", "Edytuj", "Usuń"

**Obsługiwane zdarzenia:**
- `onClick` (Rozpocznij trening) - nawigacja do `/workouts/active` + POST do API
- `onClick` (Edytuj) - nawigacja do `/workout-plans/{id}/edit`
- `onClick` (Usuń) - otwiera `DeleteWorkoutPlanDialog`

**Warunki walidacji:**
- `plan.id` - niepusty string (UUID)
- `plan.name` - niepusty string (minimum 3 znaki)
- `plan.exercise_count` - liczba >= 0
- `plan.total_sets` - liczba >= 0
- Przycisk "Rozpocznij trening" - disabled jeśli `hasActiveWorkout && activeWorkoutPlanId !== plan.id`
- Przycisk "Usuń" - disabled jeśli `activeWorkoutPlanId === plan.id`

**Typy:**
```typescript
interface WorkoutPlanCardProps {
  plan: WorkoutPlanListItemDTO;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeleteClick: (planId: string) => void;
}
```

**Propsy:**
```typescript
interface WorkoutPlanCardProps {
  plan: WorkoutPlanListItemDTO;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeleteClick: (planId: string) => void;
}
```

**Przykład renderowania:**
```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>{plan.name}</CardTitle>
    <CardDescription>
      {plan.last_used_at
        ? `Ostatnio użyty: ${formatDate(plan.last_used_at)}`
        : 'Nie użyty jeszcze'}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
      {plan.description || 'Brak opisu'}
    </p>
    <div className="flex gap-2">
      <Badge variant="secondary">
        {plan.exercise_count} {plan.exercise_count === 1 ? 'ćwiczenie' : 'ćwiczeń'}
      </Badge>
      <Badge variant="secondary">
        {plan.total_sets} {plan.total_sets === 1 ? 'seria' : 'serii'}
      </Badge>
    </div>
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button
      variant="default"
      disabled={hasActiveWorkout && activeWorkoutPlanId !== plan.id}
      onClick={() => handleStartWorkout(plan.id)}
    >
      <Play className="w-4 h-4 mr-2" />
      Rozpocznij
    </Button>
    <Button
      variant="outline"
      asChild
    >
      <a href={`/workout-plans/${plan.id}/edit`}>
        <Edit className="w-4 h-4 mr-2" />
        Edytuj
      </a>
    </Button>
    <Button
      variant="destructive"
      disabled={activeWorkoutPlanId === plan.id}
      onClick={() => onDeleteClick(plan.id)}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </CardFooter>
</Card>
```

---

### 4.6. DeleteWorkoutPlanDialog.tsx

**Opis komponentu:**
Dialog potwierdzenia usunięcia planu treningowego. Wyświetla ostrzeżenie, a jeśli istnieją zakończone treningi powiązane z planem, informuje użytkownika o tym fakcie. Blokuje usunięcie jeśli plan ma aktywny trening.

**Główne elementy:**
- `<Dialog>` (z shadcn/ui) - kontener dialogu
- `<DialogHeader>` - tytuł "Usuń plan treningowy"
- `<DialogContent>` - komunikat ostrzegawczy
- Alert: "Ten plan ma X zakończonych treningów. Usunięcie nie wpłynie na historię."
- Error: "Nie można usunąć planu z aktywnym treningiem. Zakończ trening najpierw."
- `<DialogFooter>` - przyciski: Anuluj, Usuń

**Obsługiwane zdarzenia:**
- `onOpenChange` - otwarcie/zamknięcie dialogu
- `onConfirm` - potwierdzenie usunięcia (wywołanie DELETE API)
- `onCancel` - zamknięcie dialogu bez akcji

**Warunki walidacji:**
- Dialog otwiera się tylko jeśli plan nie ma aktywnego treningu
- `planId` - niepusty UUID
- `planName` - niepusty string (do wyświetlenia w komunikacie)

**Typy:**
```typescript
interface DeleteWorkoutPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  hasActiveWorkout: boolean;
  completedWorkoutsCount?: number;
  onConfirm: () => Promise<void>;
}
```

**Propsy:**
```typescript
interface DeleteWorkoutPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  hasActiveWorkout: boolean;
  completedWorkoutsCount?: number;
  onConfirm: () => Promise<void>;
}
```

**Przykład renderowania:**
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Usuń plan treningowy</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <p>
        Czy na pewno chcesz usunąć plan <strong>"{planName}"</strong>?
      </p>

      {hasActiveWorkout && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nie można usunąć planu z aktywnym treningiem. Zakończ trening najpierw.
          </AlertDescription>
        </Alert>
      )}

      {completedWorkoutsCount > 0 && !hasActiveWorkout && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ten plan ma {completedWorkoutsCount} zakończonych treningów.
            Usunięcie planu nie wpłynie na historię treningów.
          </AlertDescription>
        </Alert>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Anuluj
      </Button>
      <Button
        variant="destructive"
        onClick={onConfirm}
        disabled={hasActiveWorkout || isDeleting}
      >
        {isDeleting ? 'Usuwanie...' : 'Usuń'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 4.7. EmptyState.tsx

**Opis komponentu:**
Komponent wyświetlany gdy użytkownik nie ma żadnych planów treningowych lub wyniki wyszukiwania są puste.

**Główne elementy:**
- `<div>` - kontener z wycentrowaną zawartością
- Ikona: `<ClipboardList />` lub `<SearchX />` (Lucide React)
- `<h3>` - tytuł (np. "Brak planów treningowych")
- `<p>` - opis
- `<Button>` - "Utwórz pierwszy plan" (link do `/workout-plans/new`)

**Obsługiwane zdarzenia:**
- `onClick` - nawigacja do tworzenia nowego planu

**Warunki walidacji:**
- `variant` - "no-plans" lub "no-results"

**Typy:**
```typescript
interface EmptyStateProps {
  variant: 'no-plans' | 'no-results';
  searchQuery?: string;
}
```

**Propsy:**
```typescript
interface EmptyStateProps {
  variant: 'no-plans' | 'no-results';
  searchQuery?: string;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Workout plan list item - już zdefiniowany
export type WorkoutPlanListItemDTO = Omit<Tables<"workout_plans">, "user_id" | "deleted_at"> & {
  exercise_count: number;
  total_sets: number;
};

// Struktura:
// {
//   id: string (UUID);
//   name: string;
//   description: string | null;
//   last_used_at: string | null;
//   created_at: string;
//   updated_at: string;
//   exercise_count: number;
//   total_sets: number;
// }
```

### 5.2. Nowe typy (ViewModel i Props)

```typescript
// src/components/workout-plans/types.ts

/**
 * Typ pola sortowania
 */
export type SortField = 'created_at' | 'updated_at' | 'name';

/**
 * Typ kierunku sortowania
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Props dla WorkoutPlansHeader
 */
export interface WorkoutPlansHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalPlans: number;
  filteredCount: number;
}

/**
 * Props dla WorkoutPlansSortControls
 */
export interface WorkoutPlansSortControlsProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

/**
 * Props dla WorkoutPlansList
 */
export interface WorkoutPlansListProps {
  plans: WorkoutPlanListItemDTO[];
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeletePlan: (planId: string) => void;
}

/**
 * Props dla WorkoutPlanCard
 */
export interface WorkoutPlanCardProps {
  plan: WorkoutPlanListItemDTO;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeleteClick: (planId: string) => void;
}

/**
 * Props dla DeleteWorkoutPlanDialog
 */
export interface DeleteWorkoutPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  hasActiveWorkout: boolean;
  completedWorkoutsCount?: number;
  onConfirm: () => Promise<void>;
}

/**
 * Props dla EmptyState
 */
export interface EmptyStateProps {
  variant: 'no-plans' | 'no-results';
  searchQuery?: string;
}

/**
 * ViewModel dla aktywnego treningu
 */
export interface ActiveWorkoutViewModel {
  id: string;
  plan_id: string;
  started_at: string;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** Supabase PostgreSQL

**Zapytanie - lista planów:**
```typescript
// Pobranie planów użytkownika z liczbą ćwiczeń i serii
const { data: plansRaw, error } = await locals.supabase
  .from('workout_plans')
  .select(`
    id,
    name,
    description,
    last_used_at,
    created_at,
    updated_at,
    plan_exercises:plan_exercises(
      id,
      plan_exercise_sets:plan_exercise_sets(id)
    )
  `)
  .is('deleted_at', null)
  .order('updated_at', { ascending: false });
```

**Zapytanie - aktywny trening:**
```typescript
const { data: activeWorkout } = await locals.supabase
  .from('workouts')
  .select('id, plan_id, started_at')
  .eq('status', 'active')
  .single();
```

**Transformacja danych:**
```typescript
const plans: WorkoutPlanListItemDTO[] = (plansRaw || []).map(plan => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  last_used_at: plan.last_used_at,
  created_at: plan.created_at,
  updated_at: plan.updated_at,
  exercise_count: plan.plan_exercises?.length || 0,
  total_sets: plan.plan_exercises?.reduce((sum, ex) =>
    sum + (ex.plan_exercise_sets?.length || 0), 0) || 0
}));
```

### 6.2. Stan client-side (React)

**Stan w głównym komponencie kontenerowym (wrapper React):**

```typescript
// src/components/workout-plans/WorkoutPlansContainer.tsx

const [searchQuery, setSearchQuery] = useState('');
const [sortField, setSortField] = useState<SortField>('updated_at');
const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [selectedPlanToDelete, setSelectedPlanToDelete] = useState<{
  id: string;
  name: string;
} | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

**Custom hook do zarządzania usuwaniem planu:**
```typescript
// src/components/hooks/useDeleteWorkoutPlan.ts

export function useDeleteWorkoutPlan() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePlan = async (planId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workout-plans/${planId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Nie można usunąć planu z aktywnym treningiem');
        }
        throw new Error('Nie udało się usunąć planu');
      }

      // Toast success
      toast.success('Plan został usunięty');

      // Reload page to refresh data
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd';
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deletePlan, isDeleting, error };
}
```

**Custom hook do rozpoczynania treningu:**
```typescript
// src/components/hooks/useStartWorkout.ts

export function useStartWorkout() {
  const [isStarting, setIsStarting] = useState(false);

  const startWorkout = async (planId: string) => {
    setIsStarting(true);

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId })
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Masz już aktywny trening');
        }
        throw new Error('Nie udało się rozpocząć treningu');
      }

      const { data } = await response.json();

      // Toast success
      toast.success('Trening rozpoczęty');

      // Navigate to active workout
      window.location.href = '/workouts/active';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd';
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  return { startWorkout, isStarting };
}
```

## 7. Integracja API

### 7.1. Endpointy używane

#### GET /api/workout-plans

**Opis:** Pobranie listy planów użytkownika (nie używany w tym widoku - SSR z Astro)

**Alternatywa:** Bezpośrednie zapytanie Supabase w komponencie Astro (SSR)

#### DELETE /api/workout-plans/{id}

**Opis:** Usunięcie planu treningowego (soft delete)

**Request:**
```http
DELETE /api/workout-plans/{id}
```

**Response (204 No Content):**
- Pusta odpowiedź

**Response (409 Conflict):**
```json
{
  "error": "Cannot delete plan with active workout",
  "message": "Zakończ aktywny trening przed usunięciem planu"
}
```

**Obsługa w komponencie:**
```typescript
const handleDeletePlan = async (planId: string) => {
  const response = await fetch(`/api/workout-plans/${planId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    if (response.status === 409) {
      toast.error('Nie można usunąć planu z aktywnym treningiem');
      return;
    }
    toast.error('Nie udało się usunąć planu');
    return;
  }

  toast.success('Plan został usunięty');
  window.location.reload(); // Reload to refresh SSR data
};
```

#### POST /api/workouts

**Opis:** Rozpoczęcie nowego treningu na podstawie planu

**Request:**
```http
POST /api/workouts
Content-Type: application/json

{
  "plan_id": "uuid"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "status": "active",
    "started_at": "2024-01-20T14:00:00Z",
    "exercises": [...]
  }
}
```

**Response (409 Conflict):**
```json
{
  "error": "Active workout already exists",
  "message": "Masz już aktywny trening. Zakończ go przed rozpoczęciem nowego.",
  "active_workout_id": "uuid"
}
```

#### GET /api/workouts/active

**Opis:** Pobranie aktywnego treningu (używane w SSR do sprawdzenia stanu)

**Request:**
```http
GET /api/workouts/active
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "status": "active",
    "started_at": "2024-01-20T14:00:00Z"
  }
}
```

**Response (204 No Content):**
- Brak aktywnego treningu

### 7.2. Obsługa błędów API

**Scenariusze błędów:**
1. **401 Unauthorized** - użytkownik niezalogowany
2. **404 Not Found** - plan nie istnieje lub użytkownik nie jest właścicielem
3. **409 Conflict** - próba usunięcia planu z aktywnym treningiem
4. **500 Internal Server Error** - błąd serwera/bazy

**Obsługa:**
```typescript
try {
  const response = await fetch(`/api/workout-plans/${planId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/auth/login';
      return;
    }
    if (response.status === 404) {
      toast.error('Plan nie został znaleziony');
      return;
    }
    if (response.status === 409) {
      toast.error('Nie można usunąć planu z aktywnym treningiem');
      return;
    }
    throw new Error('Wystąpił błąd serwera');
  }

  // Success
  toast.success('Plan został usunięty');
  window.location.reload();
} catch (error) {
  console.error('Delete error:', error);
  toast.error('Nie udało się usunąć planu. Spróbuj ponownie.');
}
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie listy planów

**Akcja:** Użytkownik wchodzi na stronę `/workout-plans`

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro wykonuje SSR i pobiera dane z Supabase
3. Strona renderuje się z danymi planów i statusem aktywnego treningu
4. Użytkownik widzi grid z kartami planów

**Oczekiwany wynik:**
- Lista planów w responsive grid (1 kolumna mobile, 2-3 desktop)
- Każdy plan z nazwą, opisem, liczbą ćwiczeń, serii i datą ostatniego użycia
- Kontrolki wyszukiwania i sortowania
- Przycisk "Utwórz nowy plan"

### 8.2. Wyszukiwanie planu po nazwie

**Akcja:** Użytkownik wpisuje tekst w pole wyszukiwania

**Przepływ:**
1. `onChange` event wywołuje `setSearchQuery` (debounce 300ms)
2. `WorkoutPlansList` filtruje plany po stronie klienta
3. Lista renderuje się z przefiltrowanymi wynikami
4. Licznik pokazuje "Znaleziono X z Y planów"

**Oczekiwany wynik:**
- Wyszukiwanie case-insensitive
- Real-time filtering
- Empty state jeśli brak wyników

### 8.3. Sortowanie planów

**Akcja:** Użytkownik zmienia pole sortowania lub kierunek

**Przepływ:**
1. Wybór z `<Select>` lub kliknięcie przycisku kierunku
2. `onSortFieldChange` lub `onSortOrderChange` aktualizuje stan
3. `WorkoutPlansList` sortuje plany po stronie klienta
4. Lista re-renderuje się z posortowanymi danymi

**Oczekiwany wynik:**
- Sortowanie działa natychmiast
- Możliwe pola: data utworzenia, data aktualizacji, nazwa
- Kierunek: rosnąco/malejąco

### 8.4. Rozpoczęcie treningu

**Akcja:** Użytkownik klika "Rozpocznij trening" na karcie planu

**Przepływ:**
1. Sprawdzenie czy brak aktywnego treningu (disabled button jeśli jest)
2. POST request do `/api/workouts` z `plan_id`
3. Loading state na przycisku ("Rozpoczynanie...")
4. Po sukcesie: toast success + redirect do `/workouts/active`
5. Po błędzie 409: toast error "Masz już aktywny trening"

**Oczekiwany wynik:**
- Przycisk disabled jeśli istnieje inny aktywny trening
- Po sukcesie: przekierowanie do aktywnego treningu
- Po błędzie: komunikat toast i pozostanie na stronie

### 8.5. Edycja planu

**Akcja:** Użytkownik klika "Edytuj" na karcie planu

**Przepływ:**
1. Nawigacja do `/workout-plans/{id}/edit`
2. Ładowanie widoku edycji (multi-step flow)

**Oczekiwany wynik:**
- Przekierowanie do strony edycji
- Załadowanie danych planu

### 8.6. Usuwanie planu

**Akcja:** Użytkownik klika "Usuń" na karcie planu

**Przepływ:**
1. Otwiera się `DeleteWorkoutPlanDialog`
2. Dialog wyświetla komunikat ostrzegawczy
3. Jeśli plan ma aktywny trening: przycisk "Usuń" jest disabled + komunikat błędu
4. Jeśli plan ma zakończone treningi: info alert (nie blokuje usunięcia)
5. Użytkownik klika "Usuń" (potwierdzenie)
6. DELETE request do `/api/workout-plans/{id}`
7. Loading state w dialogu ("Usuwanie...")
8. Po sukcesie: toast success + reload strony
9. Po błędzie: toast error

**Oczekiwany wynik:**
- Dialog potwierdzenia przed usunięciem
- Ochrona przed usunięciem planu z aktywnym treningiem
- Informacja o zakończonych treningach (nie blokuje)
- Po sukcesie: odświeżenie listy

### 8.7. Brak planów (Empty state)

**Akcja:** Użytkownik wchodzi na stronę gdy nie ma żadnych planów

**Przepływ:**
1. SSR zwraca pustą tablicę planów
2. `WorkoutPlansList` renderuje `<EmptyState variant="no-plans" />`
3. Wyświetlany jest komunikat i przycisk "Utwórz pierwszy plan"

**Oczekiwany wynik:**
- Czytelny komunikat
- CTA do utworzenia pierwszego planu
- Link do `/workout-plans/new`

### 8.8. Brak wyników wyszukiwania

**Akcja:** Użytkownik wyszukuje plan, którego nie ma

**Przepływ:**
1. Filtrowanie zwraca pustą tablicę
2. `WorkoutPlansList` renderuje `<EmptyState variant="no-results" />`
3. Wyświetlany jest komunikat "Brak wyników dla '{searchQuery}'"

**Oczekiwany wynik:**
- Komunikat z nazwą wyszukiwanego planu
- Sugestia: "Spróbuj innego wyszukiwania"

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

### 9.2. Walidacja danych z API

**Komponent:** `index.astro`

**Warunki:**
- `error === null` - zapytanie się powiodło
- `plans !== null` - dane istnieją
- RLS filtruje plany użytkownika (`user_id = auth.uid()`)

**Efekt niepowodzenia:**
- Jeśli `error`: Przekierowanie do strony błędu lub toast error
- Jeśli `plans.length === 0`: Empty state z komunikatem

### 9.3. Walidacja usuwania planu

**Komponent:** API endpoint `DELETE /api/workout-plans/{id}`

**Warunki:**
- Plan nie może mieć aktywnego treningu
- Plan musi należeć do użytkownika (RLS)

**Efekt niepowodzenia:**
- 409 Conflict: "Cannot delete plan with active workout"
- 404 Not Found: Plan nie istnieje lub nie należy do użytkownika

**Implementacja w API:**
```typescript
// src/pages/api/workout-plans/[id].ts

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  const { id } = params;

  // Check for active workout
  const { data: activeWorkout } = await locals.supabase
    .from('workouts')
    .select('id')
    .eq('plan_id', id)
    .eq('status', 'active')
    .single();

  if (activeWorkout) {
    return new Response(JSON.stringify({
      error: 'Cannot delete plan with active workout',
      message: 'Zakończ aktywny trening przed usunięciem planu'
    }), { status: 409 });
  }

  // Soft delete
  const { error } = await locals.supabase
    .from('workout_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500
    });
  }

  return new Response(null, { status: 204 });
};
```

### 9.4. Walidacja rozpoczęcia treningu

**Komponent:** API endpoint `POST /api/workouts`

**Warunki:**
- Użytkownik nie może mieć aktywnego treningu
- Plan musi istnieć i należeć do użytkownika
- Plan musi zawierać co najmniej jedno ćwiczenie

**Efekt niepowodzenia:**
- 409 Conflict: "Active workout already exists"
- 404 Not Found: Plan nie istnieje
- 400 Bad Request: Plan nie ma ćwiczeń

**Implementacja w UI:**
```typescript
// Przycisk disabled jeśli istnieje inny aktywny trening
<Button
  disabled={hasActiveWorkout && activeWorkoutPlanId !== plan.id}
  onClick={() => handleStartWorkout(plan.id)}
>
  {hasActiveWorkout && activeWorkoutPlanId !== plan.id
    ? 'Masz aktywny trening'
    : 'Rozpocznij trening'}
</Button>
```

### 9.5. Walidacja propsów komponentów

**Komponent:** `WorkoutPlanCard.tsx`

**Warunki:**
- `plan.id` - niepusty string (UUID)
- `plan.name` - niepusty string (minimum 3 znaki)
- `plan.exercise_count` - liczba >= 0
- `plan.total_sets` - liczba >= 0

**Efekt niepowodzenia:**
- Console warning (dev mode)
- Komponent nie renderuje się (return null)

**Implementacja:**
```typescript
if (!plan?.id || !plan?.name || plan.exercise_count < 0) {
  console.warn('Invalid plan data:', plan);
  return null;
}
```

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik próbuje uzyskać dostęp do `/workout-plans` bez zalogowania

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu użytkownik wraca do `/workout-plans`

**Komunikat:** Toast info: "Zaloguj się, aby zarządzać planami treningowymi"

### 10.2. Błąd zapytania do bazy (500)

**Scenariusz:** Supabase zwraca błąd podczas pobierania planów

**Obsługa:**
```typescript
if (error) {
  console.error('Database error:', error);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20planów');
}
```

**Komunikat:** Toast error: "Nie udało się załadować planów. Spróbuj ponownie później."

### 10.3. Brak planów (Empty state)

**Scenariusz:** Użytkownik nie ma żadnych planów (`plans.length === 0`)

**Obsługa:**
- Renderowanie `<EmptyState variant="no-plans" />`
- Komunikat: "Nie masz jeszcze żadnych planów treningowych"
- Przycisk: "Utwórz pierwszy plan"

### 10.4. Błąd usuwania planu

**Scenariusz 1:** Próba usunięcia planu z aktywnym treningiem (409)

**Obsługa:**
```typescript
if (response.status === 409) {
  toast.error('Nie można usunąć planu z aktywnym treningiem. Zakończ trening najpierw.');
  return;
}
```

**Scenariusz 2:** Plan nie istnieje lub użytkownik nie jest właścicielem (404)

**Obsługa:**
```typescript
if (response.status === 404) {
  toast.error('Plan nie został znaleziony');
  window.location.reload(); // Refresh list
  return;
}
```

**Scenariusz 3:** Błąd serwera (500)

**Obsługa:**
```typescript
toast.error('Nie udało się usunąć planu. Spróbuj ponownie później.');
```

### 10.5. Błąd rozpoczęcia treningu

**Scenariusz 1:** Aktywny trening już istnieje (409)

**Obsługa:**
```typescript
if (response.status === 409) {
  const data = await response.json();
  toast.error('Masz już aktywny trening. Zakończ go przed rozpoczęciem nowego.', {
    action: {
      label: 'Zobacz aktywny trening',
      onClick: () => window.location.href = '/workouts/active'
    }
  });
  return;
}
```

**Scenariusz 2:** Plan nie ma ćwiczeń (400)

**Obsługa:**
```typescript
if (response.status === 400) {
  toast.error('Plan musi zawierać co najmniej jedno ćwiczenie');
  return;
}
```

### 10.6. Błąd sieci

**Scenariusz:** Brak połączenia z internetem lub timeout

**Obsługa:**
```typescript
try {
  const response = await fetch('/api/workouts', { method: 'POST', ... });
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toast.error('Brak połączenia z internetem. Sprawdź swoje połączenie.');
  } else {
    toast.error('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
}
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalog komponentów:
```bash
mkdir -p src/components/workout-plans
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/workout-plans/WorkoutPlansContainer.tsx
touch src/components/workout-plans/WorkoutPlansHeader.tsx
touch src/components/workout-plans/WorkoutPlansSortControls.tsx
touch src/components/workout-plans/WorkoutPlansList.tsx
touch src/components/workout-plans/WorkoutPlanCard.tsx
touch src/components/workout-plans/DeleteWorkoutPlanDialog.tsx
touch src/components/workout-plans/EmptyState.tsx
touch src/components/workout-plans/types.ts
```

1.3. Utwórz katalog hooks:
```bash
mkdir -p src/components/hooks
touch src/components/hooks/useDeleteWorkoutPlan.ts
touch src/components/hooks/useStartWorkout.ts
```

1.4. Utwórz plik strony Astro:
```bash
touch src/pages/workout-plans/index.astro
```

---

### Krok 2: Definicja typów

2.1. W pliku `src/components/workout-plans/types.ts` zdefiniuj typy:

```typescript
import type { WorkoutPlanListItemDTO } from '@/types';

export type SortField = 'created_at' | 'updated_at' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface WorkoutPlansHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalPlans: number;
  filteredCount: number;
}

export interface WorkoutPlansSortControlsProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export interface WorkoutPlansListProps {
  plans: WorkoutPlanListItemDTO[];
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeletePlan: (planId: string) => void;
}

export interface WorkoutPlanCardProps {
  plan: WorkoutPlanListItemDTO;
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
  onDeleteClick: (planId: string) => void;
}

export interface DeleteWorkoutPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  hasActiveWorkout: boolean;
  completedWorkoutsCount?: number;
  onConfirm: () => Promise<void>;
}

export interface EmptyStateProps {
  variant: 'no-plans' | 'no-results';
  searchQuery?: string;
}
```

---

### Krok 3: Implementacja custom hooks

3.1. W `src/components/hooks/useDeleteWorkoutPlan.ts`:

```typescript
import { useState } from 'react';
import { toast } from 'sonner';

export function useDeleteWorkoutPlan() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePlan = async (planId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workout-plans/${planId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Nie można usunąć planu z aktywnym treningiem');
        }
        if (response.status === 404) {
          throw new Error('Plan nie został znaleziony');
        }
        throw new Error('Nie udało się usunąć planu');
      }

      toast.success('Plan został usunięty');
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd';
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deletePlan, isDeleting, error };
}
```

3.2. W `src/components/hooks/useStartWorkout.ts`:

```typescript
import { useState } from 'react';
import { toast } from 'sonner';

export function useStartWorkout() {
  const [isStarting, setIsStarting] = useState(false);

  const startWorkout = async (planId: string) => {
    setIsStarting(true);

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId })
      });

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('Masz już aktywny trening', {
            action: {
              label: 'Zobacz',
              onClick: () => window.location.href = '/workouts/active'
            }
          });
          return;
        }
        if (response.status === 400) {
          throw new Error('Plan musi zawierać co najmniej jedno ćwiczenie');
        }
        throw new Error('Nie udało się rozpocząć treningu');
      }

      toast.success('Trening rozpoczęty');
      window.location.href = '/workouts/active';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd';
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  return { startWorkout, isStarting };
}
```

---

### Krok 4: Implementacja EmptyState

4.1. W `src/components/workout-plans/EmptyState.tsx`:

```tsx
import { ClipboardList, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EmptyStateProps } from './types';

export function EmptyState({ variant, searchQuery }: EmptyStateProps) {
  const isNoResults = variant === 'no-results';

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {isNoResults ? (
        <SearchX className="w-16 h-16 text-neutral-400 mb-4" />
      ) : (
        <ClipboardList className="w-16 h-16 text-neutral-400 mb-4" />
      )}

      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
        {isNoResults
          ? 'Brak wyników'
          : 'Brak planów treningowych'}
      </h3>

      <p className="text-neutral-600 max-w-md mb-6">
        {isNoResults
          ? `Nie znaleziono planów pasujących do "${searchQuery}". Spróbuj innego wyszukiwania.`
          : 'Nie masz jeszcze żadnych planów treningowych. Utwórz swój pierwszy plan, aby rozpocząć!'}
      </p>

      {!isNoResults && (
        <Button asChild>
          <a href="/workout-plans/new">
            Utwórz pierwszy plan
          </a>
        </Button>
      )}
    </div>
  );
}
```

---

### Krok 5: Implementacja DeleteWorkoutPlanDialog

5.1. W `src/components/workout-plans/DeleteWorkoutPlanDialog.tsx`:

```tsx
import { AlertCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DeleteWorkoutPlanDialogProps } from './types';

export function DeleteWorkoutPlanDialog({
  open,
  onOpenChange,
  planId,
  planName,
  hasActiveWorkout,
  completedWorkoutsCount = 0,
  onConfirm
}: DeleteWorkoutPlanDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń plan treningowy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Czy na pewno chcesz usunąć plan <strong>"{planName}"</strong>?
          </p>

          {hasActiveWorkout && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nie można usunąć planu z aktywnym treningiem. Zakończ trening najpierw.
              </AlertDescription>
            </Alert>
          )}

          {completedWorkoutsCount > 0 && !hasActiveWorkout && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ten plan ma <strong>{completedWorkoutsCount}</strong> {completedWorkoutsCount === 1 ? 'zakończony trening' : 'zakończonych treningów'}.
                Usunięcie planu nie wpłynie na historię treningów.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={hasActiveWorkout || isDeleting}
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Krok 6: Implementacja WorkoutPlanCard

6.1. W `src/components/workout-plans/WorkoutPlanCard.tsx`:

```tsx
import { Play, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStartWorkout } from '@/components/hooks/useStartWorkout';
import type { WorkoutPlanCardProps } from './types';

export function WorkoutPlanCard({
  plan,
  hasActiveWorkout,
  activeWorkoutPlanId,
  onDeleteClick
}: WorkoutPlanCardProps) {
  const { startWorkout, isStarting } = useStartWorkout();

  if (!plan?.id || !plan?.name) {
    console.warn('Invalid plan data:', plan);
    return null;
  }

  const isThisPlanActive = activeWorkoutPlanId === plan.id;
  const canStartWorkout = !hasActiveWorkout || isThisPlanActive;
  const canDelete = !isThisPlanActive;

  const formatLastUsed = (date: string | null) => {
    if (!date) return 'Nie użyty jeszcze';
    try {
      return `Ostatnio: ${formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: pl
      })}`;
    } catch {
      return 'Błędna data';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-1">{plan.name}</CardTitle>
        <CardDescription>{formatLastUsed(plan.last_used_at)}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
          {plan.description || 'Brak opisu'}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {plan.exercise_count} {plan.exercise_count === 1 ? 'ćwiczenie' : 'ćwiczeń'}
          </Badge>
          <Badge variant="secondary">
            {plan.total_sets} {plan.total_sets === 1 ? 'seria' : 'serii'}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          className="flex-1"
          variant={isThisPlanActive ? 'default' : 'default'}
          disabled={!canStartWorkout || isStarting}
          onClick={() => startWorkout(plan.id)}
        >
          <Play className="w-4 h-4 mr-2" />
          {isStarting
            ? 'Rozpoczynanie...'
            : isThisPlanActive
            ? 'Kontynuuj'
            : 'Rozpocznij'}
        </Button>

        <Button
          variant="outline"
          size="icon"
          asChild
        >
          <a href={`/workout-plans/${plan.id}/edit`}>
            <Edit className="w-4 h-4" />
            <span className="sr-only">Edytuj plan</span>
          </a>
        </Button>

        <Button
          variant="destructive"
          size="icon"
          disabled={!canDelete}
          onClick={() => onDeleteClick(plan.id)}
        >
          <Trash2 className="w-4 h-4" />
          <span className="sr-only">Usuń plan</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### Krok 7: Implementacja WorkoutPlansSortControls

7.1. W `src/components/workout-plans/WorkoutPlansSortControls.tsx`:

```tsx
import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { WorkoutPlansSortControlsProps, SortField, SortOrder } from './types';

const sortFieldLabels: Record<SortField, string> = {
  created_at: 'Data utworzenia',
  updated_at: 'Data aktualizacji',
  name: 'Nazwa'
};

export function WorkoutPlansSortControls({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderChange
}: WorkoutPlansSortControlsProps) {
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-600">Sortuj według:</span>

      <Select value={sortField} onValueChange={onSortFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(sortFieldLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortOrder}
        aria-label={sortOrder === 'asc' ? 'Sortuj malejąco' : 'Sortuj rosnąco'}
      >
        <ArrowUpDown className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

---

### Krok 8: Implementacja WorkoutPlansHeader

8.1. W `src/components/workout-plans/WorkoutPlansHeader.tsx`:

```tsx
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { WorkoutPlansHeaderProps } from './types';

export function WorkoutPlansHeader({
  searchQuery,
  onSearchChange,
  totalPlans,
  filteredCount
}: WorkoutPlansHeaderProps) {
  const showCount = totalPlans > 0;
  const isFiltered = searchQuery.length > 0;

  return (
    <header className="mb-8 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
            Moje plany treningowe
          </h1>
          {showCount && (
            <p className="text-neutral-600">
              {isFiltered
                ? `Znaleziono ${filteredCount} z ${totalPlans} planów`
                : `Łącznie ${totalPlans} ${totalPlans === 1 ? 'plan' : 'planów'}`}
            </p>
          )}
        </div>

        <Button asChild>
          <a href="/workout-plans/new">
            <Plus className="w-4 h-4 mr-2" />
            Utwórz nowy plan
          </a>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <Input
          type="search"
          placeholder="Szukaj planu po nazwie..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </header>
  );
}
```

---

### Krok 9: Implementacja WorkoutPlansList

9.1. W `src/components/workout-plans/WorkoutPlansList.tsx`:

```tsx
import { useMemo } from 'react';
import { WorkoutPlanCard } from './WorkoutPlanCard';
import { EmptyState } from './EmptyState';
import type { WorkoutPlansListProps } from './types';

export function WorkoutPlansList({
  plans,
  searchQuery,
  sortField,
  sortOrder,
  hasActiveWorkout,
  activeWorkoutPlanId,
  onDeletePlan
}: WorkoutPlansListProps) {
  const filteredAndSortedPlans = useMemo(() => {
    let result = [...plans];

    // Filtrowanie
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(plan =>
        plan.name.toLowerCase().includes(query)
      );
    }

    // Sortowanie
    result.sort((a, b) => {
      let compareValue = 0;

      if (sortField === 'name') {
        compareValue = a.name.localeCompare(b.name, 'pl');
      } else if (sortField === 'created_at') {
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'updated_at') {
        compareValue = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [plans, searchQuery, sortField, sortOrder]);

  // Empty states
  if (plans.length === 0) {
    return <EmptyState variant="no-plans" />;
  }

  if (filteredAndSortedPlans.length === 0) {
    return <EmptyState variant="no-results" searchQuery={searchQuery} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAndSortedPlans.map(plan => (
        <WorkoutPlanCard
          key={plan.id}
          plan={plan}
          hasActiveWorkout={hasActiveWorkout}
          activeWorkoutPlanId={activeWorkoutPlanId}
          onDeleteClick={onDeletePlan}
        />
      ))}
    </div>
  );
}
```

---

### Krok 10: Implementacja WorkoutPlansContainer

10.1. W `src/components/workout-plans/WorkoutPlansContainer.tsx`:

```tsx
import { useState } from 'react';
import { WorkoutPlansHeader } from './WorkoutPlansHeader';
import { WorkoutPlansSortControls } from './WorkoutPlansSortControls';
import { WorkoutPlansList } from './WorkoutPlansList';
import { DeleteWorkoutPlanDialog } from './DeleteWorkoutPlanDialog';
import { useDeleteWorkoutPlan } from '@/components/hooks/useDeleteWorkoutPlan';
import type { WorkoutPlanListItemDTO } from '@/types';
import type { SortField, SortOrder } from './types';

interface WorkoutPlansContainerProps {
  plans: WorkoutPlanListItemDTO[];
  hasActiveWorkout: boolean;
  activeWorkoutPlanId?: string | null;
}

export function WorkoutPlansContainer({
  plans,
  hasActiveWorkout,
  activeWorkoutPlanId
}: WorkoutPlansContainerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { deletePlan, isDeleting } = useDeleteWorkoutPlan();

  const handleDeleteClick = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setSelectedPlan({ id: plan.id, name: plan.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlan) return;
    await deletePlan(selectedPlan.id);
    setDeleteDialogOpen(false);
    setSelectedPlan(null);
  };

  const filteredCount = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const isPlanActive = selectedPlan ? activeWorkoutPlanId === selectedPlan.id : false;

  return (
    <>
      <WorkoutPlansHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalPlans={plans.length}
        filteredCount={filteredCount}
      />

      {plans.length > 0 && (
        <div className="mb-6">
          <WorkoutPlansSortControls
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={setSortField}
            onSortOrderChange={setSortOrder}
          />
        </div>
      )}

      <WorkoutPlansList
        plans={plans}
        searchQuery={searchQuery}
        sortField={sortField}
        sortOrder={sortOrder}
        hasActiveWorkout={hasActiveWorkout}
        activeWorkoutPlanId={activeWorkoutPlanId}
        onDeletePlan={handleDeleteClick}
      />

      {selectedPlan && (
        <DeleteWorkoutPlanDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          hasActiveWorkout={isPlanActive}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}
```

---

### Krok 11: Implementacja strony Astro (SSR)

11.1. W `src/pages/workout-plans/index.astro`:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { WorkoutPlansContainer } from '@/components/workout-plans/WorkoutPlansContainer';
import type { WorkoutPlanListItemDTO } from '@/types';

// Sprawdź autoryzację
if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Pobierz plany użytkownika
const { data: plansRaw, error: plansError } = await Astro.locals.supabase
  .from('workout_plans')
  .select(`
    id,
    name,
    description,
    last_used_at,
    created_at,
    updated_at,
    plan_exercises:plan_exercises(
      id,
      plan_exercise_sets:plan_exercise_sets(id)
    )
  `)
  .is('deleted_at', null)
  .order('updated_at', { ascending: false });

// Sprawdź aktywny trening
const { data: activeWorkout } = await Astro.locals.supabase
  .from('workouts')
  .select('id, plan_id, started_at')
  .eq('status', 'active')
  .maybeSingle();

// Obsługa błędu
if (plansError) {
  console.error('Error fetching workout plans:', plansError);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20planów');
}

// Transformacja danych
const plans: WorkoutPlanListItemDTO[] = (plansRaw || []).map(plan => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  last_used_at: plan.last_used_at,
  created_at: plan.created_at,
  updated_at: plan.updated_at,
  exercise_count: plan.plan_exercises?.length || 0,
  total_sets: plan.plan_exercises?.reduce((sum, ex) =>
    sum + (ex.plan_exercise_sets?.length || 0), 0) || 0
}));

const hasActiveWorkout = !!activeWorkout;
const activeWorkoutPlanId = activeWorkout?.plan_id || null;
---

<MainLayout title="Moje plany treningowe - Gym Track">
  <main class="container mx-auto px-4 py-8 max-w-7xl">
    <WorkoutPlansContainer
      plans={plans}
      hasActiveWorkout={hasActiveWorkout}
      activeWorkoutPlanId={activeWorkoutPlanId}
      client:load
    />
  </main>
</MainLayout>
```

---

### Krok 12: Implementacja API endpoint (DELETE)

12.1. Utwórz plik `src/pages/api/workout-plans/[id].ts`:

```typescript
import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ params, locals }) => {
  // Sprawdź autoryzację
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Plan ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Sprawdź czy istnieje aktywny trening dla tego planu
  const { data: activeWorkout } = await locals.supabase
    .from('workouts')
    .select('id')
    .eq('plan_id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (activeWorkout) {
    return new Response(JSON.stringify({
      error: 'Cannot delete plan with active workout',
      message: 'Zakończ aktywny trening przed usunięciem planu'
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Soft delete
  const { error } = await locals.supabase
    .from('workout_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'Nie udało się usunąć planu'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(null, { status: 204 });
};
```

---

### Krok 13: Dodanie linków nawigacyjnych

13.1. W głównej nawigacji (`src/layouts/MainLayout.astro` lub komponencie nawigacji):

```html
<nav>
  <a href="/">Dashboard</a>
  <a href="/workout-plans">Plany treningowe</a>
  <a href="/exercises">Ćwiczenia</a>
  <a href="/workouts/history">Historia</a>
</nav>
```

---

### Krok 14: Testowanie

14.1. **Test manualny:**
- Zaloguj się do aplikacji
- Przejdź do `/workout-plans`
- Sprawdź czy wszystkie plany się wyświetlają
- Przetestuj wyszukiwanie po nazwie
- Przetestuj sortowanie (data, nazwa, asc/desc)
- Kliknij "Rozpocznij trening" i sprawdź czy tworzy się aktywny trening
- Kliknij "Edytuj" i sprawdź czy przekierowuje do edycji
- Kliknij "Usuń" i sprawdź dialog potwierdzenia
- Spróbuj usunąć plan z aktywnym treningiem (powinno być zablokowane)
- Sprawdź responsywność na mobile (DevTools)

14.2. **Test błędów:**
- Wyloguj się i spróbuj wejść na `/workout-plans` → sprawdź redirect
- Rozpocznij trening, a następnie spróbuj rozpocząć drugi → sprawdź błąd 409
- Symuluj błąd bazy danych → sprawdź obsługę błędu

14.3. **Test wydajności:**
- Sprawdź czas ładowania strony (< 2s)
- Sprawdź czy wyszukiwanie działa płynnie (debounce)

---

### Krok 15: Styling i dostępność

15.1. **Upewnij się że używasz semantic HTML:**
- `<header>`, `<main>`, `<nav>`
- `<h1>` - `<h3>` w odpowiedniej hierarchii
- `<button>` dla akcji interaktywnych

15.2. **Dodaj ARIA attributes:**
```tsx
<Button
  aria-label={`Usuń plan ${plan.name}`}
  onClick={() => onDeleteClick(plan.id)}
>
  <Trash2 className="w-4 h-4" />
</Button>
```

15.3. **Sprawdź focus states dla klawiatury:**
- Tab przez wszystkie interaktywne elementy
- Enter/Space aktywuje przyciski

15.4. **Dodaj loading states:**
- Podczas usuwania: "Usuwanie..."
- Podczas rozpoczynania: "Rozpoczynanie..."

---

### Krok 16: Dokumentacja i code review

16.1. Dodaj komentarze JSDoc do komponentów

16.2. Sprawdź zgodność z wytycznymi projektu (CLAUDE.md)

16.3. Uruchom linter i formatter:
```bash
npm run lint:fix
npm run format
```

16.4. Commit zmian:
```bash
git add .
git commit -m "feat: implement workout plans list view with search, sort, and delete functionality"
```

---

### Krok 17: Deploy i smoke testing

17.1. Push do repozytorium
17.2. Deploy do środowiska testowego
17.3. Przeprowadź smoke testing na środowisku testowym
17.4. Po akceptacji merge do głównej gałęzi

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-018 i US-020
✅ **Pełna funkcjonalność:** Wyszukiwanie, sortowanie, rozpoczęcie treningu, edycja, usuwanie
✅ **Responsywność:** Grid 1 kolumna mobile, 2-3 desktop
✅ **Dostępność:** Semantic HTML, ARIA labels, focus states, keyboard navigation
✅ **Wydajność:** SSR z Astro, client-side filtering/sorting dla UX
✅ **Obsługa błędów:** Autoryzacja, błędy API, ochrona przed usunięciem planu z aktywnym treningiem
✅ **Type safety:** TypeScript w całym kodzie
✅ **Code quality:** Custom hooks, separacja concerns, reużywalne komponenty
✅ **UX:** Loading states, toast notifications, dialogi potwierdzenia, empty states
✅ **Bezpieczeństwo:** RLS w Supabase, walidacja po stronie serwera, soft delete

Implementacja powinna zająć **6-10 godzin** doświadczonemu programiście frontendowemu.
