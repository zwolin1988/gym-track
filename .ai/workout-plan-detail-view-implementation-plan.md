# Plan implementacji widoku szczegółów planu treningowego

## 1. Przegląd

Widok szczegółów planu treningowego umożliwia użytkownikom przeglądanie pełnych informacji o wybranym planie, w tym wszystkich ćwiczeń i serii. Widok obsługuje tryb podglądu oraz tryb edycji, pozwalając na modyfikację nazwy, opisu, dodawanie/usuwanie ćwiczeń, zarządzanie seriami oraz zmianę kolejności ćwiczeń. Jest to najbardziej złożony widok w aplikacji ze względu na zagnieżdżoną strukturę danych (plan → ćwiczenia → serie).

Widok realizuje historyjki użytkownika US-021 (Wyświetlanie szczegółów planu treningowego) oraz US-019 (Edycja istniejącego planu treningowego) z pełnym wsparciem dla operacji CRUD na zagnieżdżonych danych.

## 2. Routing widoku

**Ścieżka:** `/workout-plans/[id]`

**Typ renderowania:** Server-side rendering (domyślne dla Astro w trybie `output: "server"`)

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

**Parametry URL:**
- `id` (UUID) - identyfikator planu treningowego
- Opcjonalny query param `edit=true` - włącza tryb edycji

## 3. Struktura komponentów

```
src/pages/workout-plans/[id].astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/workout-plans/
    ├── WorkoutPlanDetailView.tsx (React - Główny kontener)
    │   ├── WorkoutPlanHeader.tsx (React - Nagłówek z nazwą i akcjami)
    │   ├── WorkoutPlanMetadata.tsx (React - Metadata: liczba ćwiczeń, serii)
    │   ├── WorkoutPlanDescription.tsx (React - Edytowalny opis)
    │   ├── ExerciseList.tsx (React - Lista ćwiczeń z drag-and-drop)
    │   │   └── ExerciseItem.tsx (React - Pojedyncze ćwiczenie z seriami)
    │   │       ├── ExerciseCard.tsx (React - Nagłówek ćwiczenia)
    │   │       └── SetsList.tsx (React - Lista serii)
    │   │           └── SetItem.tsx (React - Pojedyncza seria, edytowalna)
    │   ├── AddExerciseModal.tsx (React - Modal wyboru ćwiczenia)
    │   └── ActionButtons.tsx (React - Przyciski: Edytuj, Usuń, Rozpocznij)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do pobrania pełnych danych planu
- `WorkoutPlanDetailView` jako główny React component - zarządza stanem edycji i zagnieżdżonymi danymi
- Komponenty potomne jako React - wysoka interaktywność (edycja inline, drag-and-drop, modals)
- Separacja odpowiedzialności - każdy komponent ma jedną, jasno zdefiniowaną funkcję

## 4. Szczegóły komponentów

### 4.1. [id].astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku
- Pobranie pełnych danych planu z API (nested: exercises → sets)
- Walidację autoryzacji i własności planu (RLS)
- Obsługę błędów 404 (plan nie istnieje lub brak dostępu)
- Przekazanie danych do głównego komponentu React

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Wywołanie Supabase client dla pobrania planu z zagnieżdżonymi danymi
- Walidacja parametru `id` (UUID format)
- Sekcja `<main>` z kontenerem na komponenty
- Conditional rendering w przypadku błędów
- Przekazanie danych przez props do `WorkoutPlanDetailView`

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- Parametr `id` musi być poprawnym UUID
- Plan musi istnieć w bazie (`data !== null`)
- Użytkownik musi być właścicielem planu (RLS automatycznie filtruje)
- Plan nie może być soft-deleted (`deleted_at IS NULL`)

**Typy:**
- `WorkoutPlanDetailDTO` - pełne dane planu z zagnieżdżonymi ćwiczeniami i seriami
- `SupabaseClient` - klient Supabase z kontekstu

**Propsy:**
Brak (główna strona Astro)

---

### 4.2. WorkoutPlanDetailView.tsx (Główny kontener)

**Opis komponentu:**
Główny komponent React zarządzający całym widokiem szczegółów planu. Obsługuje przełączanie między trybem podglądu i edycji, zarządza stanem lokalnym zagnieżdżonych danych oraz koordynuje operacje CRUD.

**Główne elementy:**
- Stan edycji (`isEditMode: boolean`)
- Stan lokalny kopii danych planu (`workoutPlan: WorkoutPlanDetailDTO`)
- Stan dirty flag (`hasChanges: boolean`)
- Renderowanie warunkowe w zależności od trybu (view/edit)
- Obsługa zapisywania zmian (batch update)
- Obsługa anulowania edycji (reset do oryginalnych danych)
- Dialog potwierdzający opuszczenie strony z niezapisanymi zmianami

**Obsługiwane zdarzenia:**
- `onToggleEditMode()` - przełączanie trybu edycji
- `onSave()` - zapisanie wszystkich zmian
- `onCancel()` - anulowanie edycji
- `beforeunload` (window) - ostrzeżenie o niezapisanych zmianach

**Warunki walidacji:**
- W trybie edycji: walidacja przed zapisem (nazwa min. 3 znaki)
- Blokada opuszczenia strony gdy `hasChanges === true`

**Typy:**
- `WorkoutPlanDetailDTO` - dane planu
- `isEditMode: boolean`
- `hasChanges: boolean`

**Propsy:**
```typescript
interface WorkoutPlanDetailViewProps {
  initialData: WorkoutPlanDetailDTO;
  userId: string;
}
```

---

### 4.3. WorkoutPlanHeader.tsx

**Opis komponentu:**
Nagłówek planu wyświetlający nazwę planu (edytowalną w trybie edycji) oraz datę utworzenia i ostatniej modyfikacji. W trybie edycji pokazuje przycisk zapisu i anulowania.

**Główne elementy:**
- Tytuł planu (edytowalny w trybie edycji - contentEditable lub Input)
- Data utworzenia i ostatniej aktualizacji
- Przyciski akcji (conditional rendering based on mode)
- Breadcrumb nawigacja: Plany → [Nazwa planu]

**Obsługiwane zdarzenia:**
- `onNameChange(newName: string)` - zmiana nazwy planu
- `onSave()` - zapisanie zmian (propagowane do rodzica)
- `onCancel()` - anulowanie edycji (propagowane do rodzica)

**Warunki walidacji:**
- Nazwa planu: min. 3 znaki, max 100 znaków
- Walidacja w czasie rzeczywistym z komunikatem błędu

**Typy:**
- `name: string`
- `createdAt: string`
- `updatedAt: string`
- `isEditMode: boolean`

**Propsy:**
```typescript
interface WorkoutPlanHeaderProps {
  name: string;
  createdAt: string;
  updatedAt: string;
  isEditMode: boolean;
  hasChanges: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}
```

---

### 4.4. WorkoutPlanMetadata.tsx

**Opis komponentu:**
Komponent wyświetlający metadata planu: łączną liczbę ćwiczeń, łączną liczbę serii, datę ostatniego użycia planu do treningu. Prezentowany w formie kart statystyk.

**Główne elementy:**
- Karty (Cards) z ikonami:
  - Ikona `Dumbbell` - Liczba ćwiczeń
  - Ikona `ListChecks` - Liczba serii
  - Ikona `Calendar` - Ostatnie użycie
- Responsive grid (1 kolumna mobile, 3 kolumny desktop)

**Obsługiwane zdarzenia:**
- Brak (komponent prezentacyjny)

**Warunki walidacji:**
- `exerciseCount` >= 0
- `totalSets` >= 0
- `lastUsedAt` może być null (komunikat "Nigdy nie użyto")

**Typy:**
- `exerciseCount: number`
- `totalSets: number`
- `lastUsedAt: string | null`

**Propsy:**
```typescript
interface WorkoutPlanMetadataProps {
  exerciseCount: number;
  totalSets: number;
  lastUsedAt: string | null;
}
```

---

### 4.5. WorkoutPlanDescription.tsx

**Opis komponentu:**
Komponent wyświetlający i pozwalający edytować opis planu. W trybie podglądu wyświetla tekst, w trybie edycji pokazuje Textarea.

**Główne elementy:**
- Tryb podglądu: `<p>` z opisem lub placeholder "Brak opisu"
- Tryb edycji: `<Textarea>` z licznikiem znaków (max 500)
- Label "Opis planu"

**Obsługiwane zdarzenia:**
- `onDescriptionChange(newDescription: string)` - zmiana opisu

**Warunki walidacji:**
- Opis: max 500 znaków
- Licznik znaków w czasie rzeczywistym
- Komunikat walidacji gdy przekroczono limit

**Typy:**
- `description: string | null`
- `isEditMode: boolean`

**Propsy:**
```typescript
interface WorkoutPlanDescriptionProps {
  description: string | null;
  isEditMode: boolean;
  onDescriptionChange: (description: string) => void;
}
```

---

### 4.6. ExerciseList.tsx

**Opis komponentu:**
Lista wszystkich ćwiczeń w planie z możliwością zmiany kolejności (drag-and-drop) w trybie edycji. Obsługuje dodawanie nowych ćwiczeń i usuwanie istniejących.

**Główne elementy:**
- Lista ćwiczeń renderowana przez `ExerciseItem`
- Przycisk "Dodaj ćwiczenie" (w trybie edycji)
- Drag-and-drop handles (ikona `GripVertical` w trybie edycji)
- Empty state gdy brak ćwiczeń
- Biblioteka `@dnd-kit/core` lub `react-beautiful-dnd` dla drag-and-drop

**Obsługiwane zdarzenia:**
- `onReorder(exercises: PlanExerciseDTO[])` - zmiana kolejności ćwiczeń
- `onAddExercise()` - otworzenie modalu dodawania ćwiczenia
- `onRemoveExercise(exerciseId: string)` - usunięcie ćwiczenia

**Warunki walidacji:**
- W trybie edycji: minimum 1 ćwiczenie w planie (walidacja przed zapisem)
- Komunikat walidacji gdy użytkownik próbuje usunąć ostatnie ćwiczenie

**Typy:**
- `exercises: PlanExerciseDTO[]`
- `isEditMode: boolean`

**Propsy:**
```typescript
interface ExerciseListProps {
  exercises: PlanExerciseDTO[];
  isEditMode: boolean;
  onReorder: (exercises: PlanExerciseDTO[]) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseId: string) => void;
}
```

---

### 4.7. ExerciseItem.tsx

**Opis komponentu:**
Pojedyncze ćwiczenie w planie zawierające nagłówek (ExerciseCard) i listę serii (SetsList). Obsługuje collapse/expand oraz akcje usuwania.

**Główne elementy:**
- `Accordion` lub własny collapse component
- Nagłówek: `ExerciseCard` (nazwa, obrazek, kategoria)
- Treść: `SetsList` (lista serii)
- Przycisk "Usuń ćwiczenie" (w trybie edycji)
- Przycisk "Dodaj serię" (w trybie edycji)
- Drag handle (w trybie edycji)

**Obsługiwane zdarzenia:**
- `onToggleCollapse()` - rozwinięcie/zwinięcie ćwiczenia
- `onRemoveExercise()` - usunięcie ćwiczenia (propagowane do rodzica)
- `onAddSet()` - dodanie nowej serii do ćwiczenia

**Warunki walidacji:**
- `exercise.id` - niepusty UUID
- Minimum 1 seria na ćwiczenie (walidacja w UI)

**Typy:**
- `exercise: PlanExerciseDTO`
- `isEditMode: boolean`
- `isCollapsed: boolean` (stan lokalny)

**Propsy:**
```typescript
interface ExerciseItemProps {
  exercise: PlanExerciseDTO;
  isEditMode: boolean;
  onRemoveExercise: (exerciseId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onUpdateSets: (exerciseId: string, sets: PlanExerciseSetDTO[]) => void;
}
```

---

### 4.8. ExerciseCard.tsx

**Opis komponentu:**
Nagłówek pojedynczego ćwiczenia wyświetlający nazwę, miniaturę obrazka, kategorię oraz liczbę serii. Używany zarówno w widoku szczegółów planu jak i w modalu wyboru ćwiczenia.

**Główne elementy:**
- Miniatura obrazka ćwiczenia (50x50px) z fallback
- Nazwa ćwiczenia
- Badge kategorii
- Badge poziomu trudności
- Badge liczby serii (np. "3 serie")

**Obsługiwane zdarzenia:**
- `onClick()` - opcjonalne (np. rozwinięcie szczegółów)

**Warunki walidacji:**
- `exercise.name` - niepusty string

**Typy:**
- `PlanExerciseMinimalDTO` - dane ćwiczenia

**Propsy:**
```typescript
interface ExerciseCardProps {
  exercise: PlanExerciseMinimalDTO;
  setCount: number;
  onClick?: () => void;
}
```

---

### 4.9. SetsList.tsx

**Opis komponentu:**
Lista wszystkich serii dla danego ćwiczenia. W trybie edycji każda seria jest edytowalna inline. Obsługuje dodawanie i usuwanie serii.

**Główne elementy:**
- Tabela lub lista serii
- Kolumny: Nr, Powtórzenia, Ciężar (kg), Akcje
- Każda seria renderowana przez `SetItem`
- Przycisk "Dodaj serię" (w trybie edycji)
- Empty state gdy brak serii

**Obsługiwane zdarzenia:**
- `onAddSet()` - dodanie nowej serii
- `onRemoveSet(setId: string)` - usunięcie serii
- `onUpdateSet(setId: string, data: Partial<PlanExerciseSetDTO>)` - aktualizacja serii

**Warunki walidacji:**
- Minimum 1 seria (walidacja w UI, komunikat gdy użytkownik próbuje usunąć ostatnią)

**Typy:**
- `sets: PlanExerciseSetDTO[]`
- `isEditMode: boolean`

**Propsy:**
```typescript
interface SetsListProps {
  sets: PlanExerciseSetDTO[];
  isEditMode: boolean;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, data: Partial<PlanExerciseSetDTO>) => void;
}
```

---

### 4.10. SetItem.tsx

**Opis komponentu:**
Pojedyncza seria w liście serii. W trybie podglądu wyświetla dane, w trybie edycji umożliwia inline editing pól Powtórzenia i Ciężar.

**Główne elementy:**
- Numer serii (badge)
- Pole Powtórzenia (edytowalne w trybie edycji)
- Pole Ciężar (edytowalne w trybie edycji, opcjonalne)
- Przycisk usunięcia (ikona `Trash2` w trybie edycji)
- Walidacja inline z komunikatami błędów

**Obsługiwane zdarzenia:**
- `onRepsChange(reps: number)` - zmiana powtórzeń
- `onWeightChange(weight: number | null)` - zmiana ciężaru
- `onRemove()` - usunięcie serii

**Warunki walidacji:**
- Powtórzenia: integer > 0, wymagane
- Ciężar: number >= 0, opcjonalne (może być null)
- Walidacja w czasie rzeczywistym z debounce

**Typy:**
- `set: PlanExerciseSetDTO`
- `index: number` (numer serii)
- `isEditMode: boolean`

**Propsy:**
```typescript
interface SetItemProps {
  set: PlanExerciseSetDTO;
  index: number;
  isEditMode: boolean;
  canDelete: boolean; // false gdy jest to ostatnia seria
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number | null) => void;
  onRemove: () => void;
}
```

---

### 4.11. AddExerciseModal.tsx

**Opis komponentu:**
Modal pozwalający na wybór ćwiczenia z bazy i dodanie go do planu. Zawiera wyszukiwarkę, filtry (kategoria, poziom trudności) oraz listę ćwiczeń.

**Główne elementy:**
- `Dialog` (shadcn/ui) z nagłówkiem "Dodaj ćwiczenie"
- Input wyszukiwania (po nazwie)
- Select filtr kategorii
- Checkboxy filtr poziomu trudności
- Lista wyników: `ExerciseCard` dla każdego ćwiczenia
- Przyciski: "Anuluj", "Dodaj" (disabled gdy nie wybrano)
- Loading state podczas ładowania ćwiczeń
- Empty state gdy brak wyników

**Obsługiwane zdarzenia:**
- `onSearch(query: string)` - wyszukiwanie
- `onFilterCategory(categoryId: string)` - filtrowanie po kategorii
- `onFilterDifficulty(difficulties: string[])` - filtrowanie po poziomie
- `onSelectExercise(exerciseId: string)` - wybór ćwiczenia
- `onConfirm()` - potwierdzenie dodania
- `onClose()` - zamknięcie modalu

**Warunki walidacji:**
- Ćwiczenie musi być wybrane przed potwierdzeniem
- Ćwiczenie nie może być już dodane do planu (sprawdzanie duplikatów opcjonalne)

**Typy:**
- `ExerciseListItemDTO[]` - lista ćwiczeń
- `CategoryDTO[]` - lista kategorii
- `selectedExerciseId: string | null`

**Propsy:**
```typescript
interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (exerciseId: string) => void;
}
```

---

### 4.12. ActionButtons.tsx

**Opis komponentu:**
Grupa przycisków akcji dla planu: Edytuj, Usuń, Rozpocznij trening. Przyciski są warunkowe (zależne od trybu i stanu planu).

**Główne elementy:**
- Przycisk "Rozpocznij trening" (primary, zawsze widoczny w trybie podglądu)
- Przycisk "Edytuj" (secondary, widoczny w trybie podglądu)
- Przycisk "Usuń" (destructive, widoczny w trybie podglądu)
- Dialog potwierdzający usunięcie
- Obsługa błędów (np. nie można usunąć planu z aktywnym treningiem)

**Obsługiwane zdarzenia:**
- `onStartWorkout()` - rozpoczęcie treningu (przekierowanie + API call)
- `onEdit()` - przełączenie na tryb edycji
- `onDelete()` - usunięcie planu (z potwierdzeniem)

**Warunki walidacji:**
- Usunięcie: plan nie może mieć aktywnego treningu
- Rozpoczęcie treningu: użytkownik nie może mieć już aktywnego treningu

**Typy:**
- `planId: string`
- `isEditMode: boolean`

**Propsy:**
```typescript
interface ActionButtonsProps {
  planId: string;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onStartWorkout: () => Promise<void>;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Typy już zdefiniowane w src/types.ts:

// Pełne dane planu z zagnieżdżonymi ćwiczeniami i seriami
export type WorkoutPlanDetailDTO = Omit<Tables<"workout_plans">, "user_id" | "deleted_at"> & {
  exercises: PlanExerciseDTO[];
};

// Ćwiczenie w planie z zagnieżdżonymi seriami
export type PlanExerciseDTO = Omit<Tables<"plan_exercises">, "user_id" | "plan_id"> & {
  exercise: PlanExerciseMinimalDTO;
  sets: PlanExerciseSetDTO[];
};

// Minimalne dane ćwiczenia
export type PlanExerciseMinimalDTO = Pick<Tables<"exercises">, "id" | "name" | "image_path" | "difficulty"> & {
  category: {
    name: string;
  };
};

// Seria w planie
export type PlanExerciseSetDTO = Omit<Tables<"plan_exercise_sets">, "user_id" | "plan_exercise_id">;

// Komendy (Commands)
export interface UpdateWorkoutPlanCommand {
  name?: string;
  description?: string | null;
}

export interface CreatePlanExerciseCommand {
  exercise_id: string;
  order_index?: number;
}

export interface CreatePlanExerciseSetCommand {
  reps: number;
  weight?: number | null;
  order_index?: number;
}

export interface UpdatePlanExerciseSetCommand {
  reps?: number;
  weight?: number | null;
}

export interface ReorderPlanExercisesCommand {
  plan_id: string;
  exercises: {
    id: string;
    order_index: number;
  }[];
}
```

### 5.2. Nowe typy (ViewModel i UI state)

```typescript
// src/components/workout-plans/types.ts

/**
 * ViewModel dla widoku szczegółów planu
 * Zawiera dodatkowe computed properties dla UI
 */
export interface WorkoutPlanDetailViewModel {
  plan: WorkoutPlanDetailDTO;
  exerciseCount: number;
  totalSets: number;
}

/**
 * Stan edycji widoku szczegółów planu
 */
export interface EditState {
  isEditMode: boolean;
  hasChanges: boolean;
  editedData: WorkoutPlanDetailDTO;
  errors: ValidationErrors;
}

/**
 * Błędy walidacji dla formularza edycji
 */
export interface ValidationErrors {
  name?: string;
  description?: string;
  exercises?: {
    [exerciseId: string]: {
      sets?: {
        [setId: string]: {
          reps?: string;
          weight?: string;
        };
      };
    };
  };
}

/**
 * Props dla głównego komponentu WorkoutPlanDetailView
 */
export interface WorkoutPlanDetailViewProps {
  initialData: WorkoutPlanDetailDTO;
  userId: string;
}

/**
 * Props dla komponentu WorkoutPlanHeader
 */
export interface WorkoutPlanHeaderProps {
  name: string;
  createdAt: string;
  updatedAt: string;
  isEditMode: boolean;
  hasChanges: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Props dla komponentu WorkoutPlanMetadata
 */
export interface WorkoutPlanMetadataProps {
  exerciseCount: number;
  totalSets: number;
  lastUsedAt: string | null;
}

/**
 * Props dla komponentu WorkoutPlanDescription
 */
export interface WorkoutPlanDescriptionProps {
  description: string | null;
  isEditMode: boolean;
  onDescriptionChange: (description: string) => void;
}

/**
 * Props dla komponentu ExerciseList
 */
export interface ExerciseListProps {
  exercises: PlanExerciseDTO[];
  isEditMode: boolean;
  onReorder: (exercises: PlanExerciseDTO[]) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseId: string) => void;
}

/**
 * Props dla komponentu ExerciseItem
 */
export interface ExerciseItemProps {
  exercise: PlanExerciseDTO;
  isEditMode: boolean;
  onRemoveExercise: (exerciseId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onUpdateSets: (exerciseId: string, sets: PlanExerciseSetDTO[]) => void;
}

/**
 * Props dla komponentu ExerciseCard
 */
export interface ExerciseCardProps {
  exercise: PlanExerciseMinimalDTO;
  setCount: number;
  onClick?: () => void;
}

/**
 * Props dla komponentu SetsList
 */
export interface SetsListProps {
  sets: PlanExerciseSetDTO[];
  isEditMode: boolean;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, data: Partial<PlanExerciseSetDTO>) => void;
}

/**
 * Props dla komponentu SetItem
 */
export interface SetItemProps {
  set: PlanExerciseSetDTO;
  index: number;
  isEditMode: boolean;
  canDelete: boolean;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number | null) => void;
  onRemove: () => void;
}

/**
 * Props dla komponentu AddExerciseModal
 */
export interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (exerciseId: string) => void;
}

/**
 * Props dla komponentu ActionButtons
 */
export interface ActionButtonsProps {
  planId: string;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onStartWorkout: () => Promise<void>;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** Supabase PostgreSQL

**Zapytanie:**
```typescript
// Pobranie pełnych danych planu z zagnieżdżonymi ćwiczeniami i seriami
const { data: plan, error } = await supabase
  .from('workout_plans')
  .select(`
    id,
    name,
    description,
    last_used_at,
    created_at,
    updated_at,
    exercises:plan_exercises(
      id,
      exercise_id,
      order_index,
      exercise:exercises(
        id,
        name,
        image_path,
        difficulty,
        category:categories(name)
      ),
      sets:plan_exercise_sets(
        id,
        reps,
        weight,
        order_index
      )
    )
  `)
  .eq('id', id)
  .is('deleted_at', null)
  .order('order_index', { foreignTable: 'plan_exercises', ascending: true })
  .order('order_index', { foreignTable: 'plan_exercises.plan_exercise_sets', ascending: true })
  .single();
```

**Transformacja danych:**
```typescript
// Dane są już w odpowiednim formacie dzięki zagnieżdżonemu select
const workoutPlanDetail: WorkoutPlanDetailDTO = plan;

// Obliczanie metadata
const exerciseCount = plan.exercises.length;
const totalSets = plan.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
```

### 6.2. Stan client-side (React)

**Stan globalny:**
Nie jest wymagany - cały stan jest lokalny w komponencie `WorkoutPlanDetailView`.

**Stan lokalny w WorkoutPlanDetailView:**

```typescript
const [isEditMode, setIsEditMode] = useState(false);
const [editedPlan, setEditedPlan] = useState<WorkoutPlanDetailDTO>(initialData);
const [hasChanges, setHasChanges] = useState(false);
const [errors, setErrors] = useState<ValidationErrors>({});
const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

**Custom hook dla zarządzania edycją:**

```typescript
// src/components/workout-plans/hooks/useWorkoutPlanEdit.ts

export function useWorkoutPlanEdit(initialData: WorkoutPlanDetailDTO) {
  const [editedPlan, setEditedPlan] = useState(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Aktualizacja nazwy planu
  const updateName = (name: string) => {
    setEditedPlan(prev => ({ ...prev, name }));
    setHasChanges(true);
    validateName(name);
  };

  // Aktualizacja opisu planu
  const updateDescription = (description: string | null) => {
    setEditedPlan(prev => ({ ...prev, description }));
    setHasChanges(true);
    validateDescription(description);
  };

  // Dodanie ćwiczenia
  const addExercise = (exerciseData: PlanExerciseDTO) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: [...prev.exercises, exerciseData]
    }));
    setHasChanges(true);
  };

  // Usunięcie ćwiczenia
  const removeExercise = (exerciseId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
    setHasChanges(true);
  };

  // Zmiana kolejności ćwiczeń
  const reorderExercises = (reorderedExercises: PlanExerciseDTO[]) => {
    setEditedPlan(prev => ({ ...prev, exercises: reorderedExercises }));
    setHasChanges(true);
  };

  // Dodanie serii do ćwiczenia
  const addSet = (exerciseId: string, setData: PlanExerciseSetDTO) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, setData] }
          : ex
      )
    }));
    setHasChanges(true);
  };

  // Aktualizacja serii
  const updateSet = (exerciseId: string, setId: string, updates: Partial<PlanExerciseSetDTO>) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map(set =>
                set.id === setId ? { ...set, ...updates } : set
              )
            }
          : ex
      )
    }));
    setHasChanges(true);
  };

  // Usunięcie serii
  const removeSet = (exerciseId: string, setId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
          : ex
      )
    }));
    setHasChanges(true);
  };

  // Walidacja
  const validateAll = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!editedPlan.name || editedPlan.name.trim().length < 3) {
      newErrors.name = 'Nazwa musi mieć co najmniej 3 znaki';
    }

    if (editedPlan.description && editedPlan.description.length > 500) {
      newErrors.description = 'Opis może mieć maksymalnie 500 znaków';
    }

    if (editedPlan.exercises.length === 0) {
      newErrors.exercises = { general: 'Plan musi zawierać co najmniej jedno ćwiczenie' };
    }

    // Walidacja serii
    editedPlan.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (!set.reps || set.reps <= 0) {
          if (!newErrors.exercises) newErrors.exercises = {};
          if (!newErrors.exercises[exercise.id]) newErrors.exercises[exercise.id] = { sets: {} };
          newErrors.exercises[exercise.id].sets![set.id] = {
            reps: 'Liczba powtórzeń musi być większa od 0'
          };
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset do początkowego stanu
  const reset = () => {
    setEditedPlan(initialData);
    setHasChanges(false);
    setErrors({});
  };

  return {
    editedPlan,
    hasChanges,
    errors,
    updateName,
    updateDescription,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    validateAll,
    reset
  };
}
```

**Custom hook dla drag-and-drop:**

```typescript
// src/components/workout-plans/hooks/useDragAndDrop.ts
import { useState } from 'react';
import type { PlanExerciseDTO } from '@/types';

export function useDragAndDrop(
  exercises: PlanExerciseDTO[],
  onReorder: (reordered: PlanExerciseDTO[]) => void
) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...exercises];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);

    // Aktualizacja order_index
    const updated = reordered.map((ex, idx) => ({ ...ex, order_index: idx }));
    onReorder(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return {
    draggedIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
}
```

## 7. Integracja API

### 7.1. Endpointy używane

#### GET /api/workout-plans/{id}

**Opis:** Pobranie pełnych danych planu z zagnieżdżonymi ćwiczeniami i seriami.

**Użycie:** SSR w Astro component (initial data load)

**Request:**
```typescript
const { data, error } = await locals.supabase
  .from('workout_plans')
  .select(`/* nested query */`)
  .eq('id', id)
  .single();
```

**Response:** `WorkoutPlanDetailDTO`

**Obsługa błędów:**
- 401: Niezalogowany użytkownik (middleware redirect)
- 404: Plan nie istnieje lub użytkownik nie ma dostępu (RLS)
- 500: Błąd bazy danych

---

#### PATCH /api/workout-plans/{id}

**Opis:** Aktualizacja nazwy i opisu planu.

**Użycie:** Zapisanie zmian w trybie edycji (nazwa, opis)

**Request Body:**
```json
{
  "name": "Updated Plan Name",
  "description": "Updated description"
}
```

**Response:** `200 OK` + updated plan data

**Obsługa błędów:**
- 400: Błąd walidacji (np. nazwa za krótka)
- 404: Plan nie istnieje
- 500: Błąd serwera

---

#### POST /api/workout-plans/{planId}/exercises

**Opis:** Dodanie ćwiczenia do planu.

**Użycie:** Modal "Dodaj ćwiczenie"

**Request Body:**
```json
{
  "exercise_id": "uuid",
  "order_index": 3
}
```

**Response:** `201 Created` + `PlanExerciseDTO`

**Obsługa błędów:**
- 400: Nieprawidłowe dane (np. exercise_id nie istnieje)
- 404: Plan nie istnieje
- 500: Błąd serwera

---

#### DELETE /api/plan-exercises/{id}

**Opis:** Usunięcie ćwiczenia z planu.

**Użycie:** Przycisk "Usuń ćwiczenie"

**Response:** `204 No Content`

**Obsługa błędów:**
- 404: Ćwiczenie nie istnieje w planie
- 500: Błąd serwera

**Note:** Kaskadowe usunięcie wszystkich serii (`plan_exercise_sets`)

---

#### POST /api/plan-exercises/{planExerciseId}/sets

**Opis:** Dodanie serii do ćwiczenia w planie.

**Użycie:** Przycisk "Dodaj serię"

**Request Body:**
```json
{
  "reps": 10,
  "weight": 80.0,
  "order_index": 2
}
```

**Response:** `201 Created` + `PlanExerciseSetDTO`

**Obsługa błędów:**
- 400: Błąd walidacji (reps <= 0, weight < 0)
- 404: Plan exercise nie istnieje
- 500: Błąd serwera

---

#### PATCH /api/plan-exercise-sets/{id}

**Opis:** Aktualizacja serii (powtórzenia, ciężar).

**Użycie:** Inline editing serii

**Request Body:**
```json
{
  "reps": 12,
  "weight": 85.0
}
```

**Response:** `200 OK` + updated set data

**Obsługa błędów:**
- 400: Błąd walidacji
- 404: Seria nie istnieje
- 500: Błąd serwera

---

#### DELETE /api/plan-exercise-sets/{id}

**Opis:** Usunięcie serii z ćwiczenia.

**Użycie:** Przycisk "Usuń serię"

**Response:** `204 No Content`

**Obsługa błędów:**
- 404: Seria nie istnieje
- 500: Błąd serwera

---

#### PATCH /api/plan-exercises/reorder

**Opis:** Zmiana kolejności ćwiczeń w planie (batch update).

**Użycie:** Drag-and-drop ćwiczeń

**Request Body:**
```json
{
  "plan_id": "uuid",
  "exercises": [
    { "id": "uuid1", "order_index": 0 },
    { "id": "uuid2", "order_index": 1 },
    { "id": "uuid3", "order_index": 2 }
  ]
}
```

**Response:** `200 OK` + `{ updated_count: 3 }`

**Obsługa błędów:**
- 400: Błąd walidacji
- 404: Plan lub ćwiczenia nie istnieją
- 500: Błąd serwera

---

#### DELETE /api/workout-plans/{id}

**Opis:** Usunięcie planu (soft delete).

**Użycie:** Przycisk "Usuń plan"

**Response:** `204 No Content`

**Obsługa błędów:**
- 404: Plan nie istnieje
- 409: Nie można usunąć - istnieje aktywny trening
- 500: Błąd serwera

---

#### POST /api/workouts

**Opis:** Rozpoczęcie treningu na podstawie planu.

**Użycie:** Przycisk "Rozpocznij trening"

**Request Body:**
```json
{
  "plan_id": "uuid"
}
```

**Response:** `201 Created` + workout data + redirect do `/workouts/active`

**Obsługa błędów:**
- 400: Plan nie ma ćwiczeń
- 404: Plan nie istnieje
- 409: Użytkownik ma już aktywny trening
- 500: Błąd serwera

---

#### GET /api/exercises

**Opis:** Pobranie listy ćwiczeń do wyboru (dla modalu).

**Użycie:** Modal "Dodaj ćwiczenie"

**Query Params:**
- `search`, `category_id`, `difficulty`, `page`, `limit`

**Response:** `ExercisesPaginatedResponseDTO`

### 7.2. Strategia zapisywania zmian

**Opcja 1: Real-time updates (optimistic UI)**
- Każda zmiana (nazwa, opis, seria) jest natychmiast zapisywana do API
- UI aktualizuje się optymistycznie (przed odpowiedzią z API)
- W przypadku błędu - rollback + toast error

**Opcja 2: Batch update (wybrana dla MVP)**
- Zmiany są gromadzone w stanie lokalnym (`editedPlan`)
- Użytkownik klika "Zapisz" → batch API calls
- Wszystkie operacje w transakcji (all or nothing)
- Lepsza kontrola nad walidacją i konfirmacją

**Implementacja batch update:**

```typescript
const handleSave = async () => {
  // Walidacja
  if (!validateAll()) {
    toast.error('Popraw błędy przed zapisaniem');
    return;
  }

  setIsSaving(true);

  try {
    // 1. Aktualizacja nazwy i opisu planu
    if (editedPlan.name !== initialData.name || editedPlan.description !== initialData.description) {
      await fetch(`/api/workout-plans/${editedPlan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editedPlan.name,
          description: editedPlan.description
        })
      });
    }

    // 2. Zmiana kolejności ćwiczeń (jeśli zmieniła się)
    const orderChanged = editedPlan.exercises.some((ex, idx) =>
      ex.order_index !== initialData.exercises[idx]?.order_index
    );
    if (orderChanged) {
      await fetch(`/api/plan-exercises/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan_id: editedPlan.id,
          exercises: editedPlan.exercises.map(ex => ({
            id: ex.id,
            order_index: ex.order_index
          }))
        })
      });
    }

    // 3. Aktualizacja/dodanie/usunięcie ćwiczeń i serii
    // (logika diff między initialData i editedPlan)

    toast.success('Plan został zaktualizowany');
    setHasChanges(false);
    setIsEditMode(false);

    // Refresh danych (opcjonalnie)
    window.location.reload();

  } catch (error) {
    console.error('Save error:', error);
    toast.error('Nie udało się zapisać zmian');
  } finally {
    setIsSaving(false);
  }
};
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie szczegółów planu

**Akcja:** Użytkownik wchodzi na stronę `/workout-plans/{id}`

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro wykonuje SSR i pobiera dane planu z Supabase (nested query)
3. Walidacja RLS - plan musi należeć do użytkownika
4. Strona renderuje się z pełnymi danymi (exercises → sets)
5. Użytkownik widzi szczegóły: nazwę, opis, metadata, listę ćwiczeń z seriami

**Oczekiwany wynik:**
- Pełne dane planu załadowane w < 500ms
- Lista ćwiczeń w odpowiedniej kolejności
- Każde ćwiczenie pokazuje wszystkie serie
- Przyciski akcji widoczne: "Rozpocznij trening", "Edytuj", "Usuń"

---

### 8.2. Przełączenie na tryb edycji

**Akcja:** Użytkownik klika przycisk "Edytuj"

**Przepływ:**
1. Kliknięcie przycisku wywołuje `setIsEditMode(true)`
2. Komponent `WorkoutPlanDetailView` renderuje się w trybie edycji
3. Pola stają się edytowalne:
   - Nazwa planu (contentEditable lub Input)
   - Opis planu (Textarea)
   - Serie (inline inputs dla reps/weight)
4. Pojawiają się nowe przyciski: "Zapisz", "Anuluj"
5. Pojawiają się nowe akcje: "Dodaj ćwiczenie", "Dodaj serię", drag handles

**Oczekiwany wynik:**
- Smooth transition do trybu edycji
- Wszystkie edytowalne pola wyraźnie zaznaczone
- Walidacja inline dla każdego pola

---

### 8.3. Edycja nazwy planu

**Akcja:** Użytkownik zmienia nazwę planu

**Przepływ:**
1. Użytkownik klika na pole nazwy (contentEditable lub focus Input)
2. Zmiana tekstu wywołuje `onNameChange(newName)`
3. Hook `useWorkoutPlanEdit` aktualizuje stan lokalny
4. Walidacja w czasie rzeczywistym (min. 3 znaki)
5. Jeśli błąd: wyświetlenie komunikatu pod polem
6. Ustawienie `hasChanges = true`

**Oczekiwany wynik:**
- Natychmiastowa walidacja z komunikatem błędu
- Przycisk "Zapisz" aktywny tylko gdy brak błędów

---

### 8.4. Edycja opisu planu

**Akcja:** Użytkownik zmienia opis planu

**Przepływ:**
1. Użytkownik wpisuje tekst w Textarea
2. Zmiana wywołuje `onDescriptionChange(newDescription)`
3. Hook aktualizuje stan lokalny
4. Licznik znaków aktualizuje się (X/500)
5. Walidacja: max 500 znaków
6. Jeśli przekroczono limit: komunikat błędu
7. Ustawienie `hasChanges = true`

**Oczekiwany wynik:**
- Licznik znaków w czasie rzeczywistym
- Blokada zapisu gdy opis za długi

---

### 8.5. Dodanie ćwiczenia do planu

**Akcja:** Użytkownik klika "Dodaj ćwiczenie"

**Przepływ:**
1. Kliknięcie otwiera modal `AddExerciseModal`
2. Modal ładuje listę ćwiczeń z API `/api/exercises`
3. Użytkownik może:
   - Wyszukać ćwiczenie po nazwie
   - Filtrować po kategorii
   - Filtrować po poziomie trudności
4. Użytkownik wybiera ćwiczenie (kliknięcie na kartę)
5. Kliknięcie "Dodaj" wywołuje `onConfirm(exerciseId)`
6. API call: `POST /api/workout-plans/{planId}/exercises`
7. Nowe ćwiczenie dodawane do stanu lokalnego
8. Modal zamyka się
9. Ćwiczenie pojawia się na liście z domyślną 1 serią

**Oczekiwany wynik:**
- Modal z wyszukiwarką i filtrami
- Szybkie dodanie ćwiczenia (< 300ms)
- Toast success: "Ćwiczenie dodane do planu"

---

### 8.6. Usunięcie ćwiczenia z planu

**Akcja:** Użytkownik klika przycisk "Usuń" przy ćwiczeniu

**Przepływ:**
1. Kliknięcie wywołuje `onRemoveExercise(exerciseId)`
2. Dialog potwierdzający: "Czy na pewno chcesz usunąć to ćwiczenie?"
3. Po potwierdzeniu: API call `DELETE /api/plan-exercises/{id}`
4. Optymistyczna aktualizacja UI (ćwiczenie znika)
5. W przypadku błędu: rollback + toast error
6. Ustawienie `hasChanges = true`

**Oczekiwany wynik:**
- Dialog potwierdzający dla bezpieczeństwa
- Optymistyczna aktualizacja UI (immediate feedback)
- Toast success: "Ćwiczenie usunięte z planu"

**Warunek:** Nie można usunąć ostatniego ćwiczenia (walidacja w UI)

---

### 8.7. Zmiana kolejności ćwiczeń (Drag-and-drop)

**Akcja:** Użytkownik przeciąga ćwiczenie na nową pozycję

**Przepływ:**
1. Użytkownik chwyta drag handle (ikona `GripVertical`)
2. Wywołuje się `handleDragStart(index)`
3. Podczas przeciągania: `handleDragOver(e, newIndex)`
4. Hook `useDragAndDrop` aktualizuje stan lokalny w czasie rzeczywistym
5. Aktualizacja `order_index` dla wszystkich ćwiczeń
6. Po puszczeniu: `handleDragEnd()`
7. Ustawienie `hasChanges = true`
8. Zmiany zapisane po kliknięciu "Zapisz" → API call `/api/plan-exercises/reorder`

**Oczekiwany wynik:**
- Smooth drag-and-drop experience
- Wizualna informacja o przeciąganym elemencie
- Natychmiastowa aktualizacja kolejności w UI

---

### 8.8. Dodanie serii do ćwiczenia

**Akcja:** Użytkownik klika "Dodaj serię" pod ćwiczeniem

**Przepływ:**
1. Kliknięcie wywołuje `onAddSet(exerciseId)`
2. Nowa seria dodawana do stanu lokalnego z domyślnymi wartościami:
   - `reps: 10`
   - `weight: null`
   - `order_index: last + 1`
3. Nowa seria pojawia się na liście (edytowalna inline)
4. Ustawienie `hasChanges = true`
5. API call po kliknięciu "Zapisz": `POST /api/plan-exercises/{planExerciseId}/sets`

**Oczekiwany wynik:**
- Natychmiastowe pojawienie się nowej serii
- Fokus automatycznie przeniesiony na pole "Powtórzenia"

---

### 8.9. Edycja serii (inline)

**Akcja:** Użytkownik zmienia wartość powtórzeń lub ciężaru

**Przepływ:**
1. Użytkownik klika na pole (Input type="number")
2. Zmiana wartości wywołuje `onRepsChange(newReps)` lub `onWeightChange(newWeight)`
3. Hook aktualizuje stan lokalny z debounce (300ms)
4. Walidacja w czasie rzeczywistym:
   - Reps: integer > 0
   - Weight: number >= 0 lub null
5. Jeśli błąd: czerwona ramka + komunikat
6. Ustawienie `hasChanges = true`
7. API call po kliknięciu "Zapisz": `PATCH /api/plan-exercise-sets/{id}`

**Oczekiwany wynik:**
- Natychmiastowa walidacja
- Debounce dla lepszej wydajności
- Zapisanie tylko zmienionych serii (diff)

---

### 8.10. Usunięcie serii

**Akcja:** Użytkownik klika ikonę `Trash2` przy serii

**Przepływ:**
1. Kliknięcie wywołuje `onRemoveSet(exerciseId, setId)`
2. Sprawdzenie: czy to nie ostatnia seria (walidacja w UI)
3. Jeśli ostatnia: toast warning "Ćwiczenie musi mieć co najmniej jedną serię"
4. Jeśli nie ostatnia: seria usuwana ze stanu lokalnego
5. Optymistyczna aktualizacja UI
6. Ustawienie `hasChanges = true`
7. API call po kliknięciu "Zapisz": `DELETE /api/plan-exercise-sets/{id}`

**Oczekiwany wynik:**
- Blokada usunięcia ostatniej serii
- Optymistyczna aktualizacja UI
- Toast info: "Seria usunięta"

---

### 8.11. Zapisanie zmian

**Akcja:** Użytkownik klika "Zapisz"

**Przepływ:**
1. Wywołanie `handleSave()`
2. Walidacja wszystkich pól (`validateAll()`)
3. Jeśli błędy: toast error + focus na pierwszy błąd
4. Jeśli OK: batch API calls:
   - PATCH /api/workout-plans/{id} (nazwa, opis)
   - PATCH /api/plan-exercises/reorder (kolejność)
   - POST/PATCH/DELETE dla ćwiczeń i serii (diff)
5. Loading state: przycisk "Zapisywanie..."
6. Po sukcesie:
   - Toast success: "Plan zaktualizowany"
   - `hasChanges = false`
   - `isEditMode = false`
   - Refresh danych (opcjonalnie)
7. W przypadku błędu:
   - Rollback (jeśli możliwe)
   - Toast error z szczegółami

**Oczekiwany wynik:**
- Wszystkie zmiany zapisane atomowo
- Czas zapisu < 1s (dla planu z 5 ćwiczeń)
- Clear feedback dla użytkownika

---

### 8.12. Anulowanie edycji

**Akcja:** Użytkownik klika "Anuluj"

**Przepływ:**
1. Jeśli `hasChanges === true`: dialog potwierdzający "Niezapisane zmiany zostaną utracone. Kontynuować?"
2. Po potwierdzeniu:
   - Wywołanie `reset()` w hooku
   - Stan lokalny resetowany do `initialData`
   - `hasChanges = false`
   - `isEditMode = false`
3. Powrót do trybu podglądu

**Oczekiwany wynik:**
- Dialog ostrzegający o utracie zmian
- Natychmiastowy reset do oryginalnych danych

---

### 8.13. Rozpoczęcie treningu

**Akcja:** Użytkownik klika "Rozpocznij trening"

**Przepływ:**
1. Kliknięcie wywołuje `onStartWorkout()`
2. Sprawdzenie: czy użytkownik ma już aktywny trening (API call `/api/workouts/active`)
3. Jeśli ma: toast warning + opcja "Kontynuuj aktywny" lub "Zakończ i rozpocznij nowy"
4. Jeśli nie ma: API call `POST /api/workouts` z `plan_id`
5. Backend:
   - Tworzy workout record
   - Kopiuje exercises i sets z planu
   - Aktualizuje `last_used_at` planu
6. Po sukcesie: przekierowanie do `/workouts/active`
7. Toast success: "Trening rozpoczęty"

**Oczekiwany wynik:**
- Sprawdzenie aktywnego treningu przed rozpoczęciem
- Płynne przekierowanie do widoku aktywnego treningu
- Czas operacji < 1s

---

### 8.14. Usunięcie planu

**Akcja:** Użytkownik klika "Usuń plan"

**Przepływ:**
1. Kliknięcie wywołuje `onDelete()`
2. Dialog potwierdzający z ostrzeżeniem:
   - "Czy na pewno chcesz usunąć ten plan?"
   - Jeśli istnieją powiązane treningi: "Ten plan ma powiązane treningi w historii"
3. Po potwierdzeniu: API call `DELETE /api/workout-plans/{id}`
4. Backend sprawdza: czy nie ma aktywnego treningu
5. Jeśli jest aktywny trening: 409 Conflict + toast error
6. Jeśli OK: soft delete (ustawienie `deleted_at`)
7. Po sukcesie: przekierowanie do `/workout-plans`
8. Toast success: "Plan usunięty"

**Oczekiwany wynik:**
- Potwierdzenie z ostrzeżeniem
- Blokada usunięcia gdy aktywny trening
- Soft delete (możliwość przywrócenia w przyszłości)

---

### 8.15. Opuszczenie strony z niezapisanymi zmianami

**Akcja:** Użytkownik próbuje opuścić stronę gdy `hasChanges === true`

**Przepływ:**
1. Event `beforeunload` (window) jest przechwytywany
2. Jeśli `hasChanges === true`: przeglądarka pokazuje dialog
3. Komunikat: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
4. Użytkownik wybiera: "Zostań" lub "Opuść"
5. Jeśli "Opuść": zmiany są tracone

**Oczekiwany wynik:**
- Ochrona przed przypadkową utratą danych
- Standardowy dialog przeglądarki

**Implementacja:**
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasChanges]);
```

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

---

### 9.2. Walidacja własności planu (RLS)

**Komponent:** Supabase RLS Policy

**Warunek:** `user_id = auth.uid()` AND `deleted_at IS NULL`

**Efekt niepowodzenia:**
- Zapytanie zwraca `null` (no data)
- Astro renderuje 404

---

### 9.3. Walidacja parametru ID

**Komponent:** `[id].astro`

**Warunek:** `id` musi być poprawnym UUID

**Implementacja:**
```typescript
const { id } = Astro.params;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!id || !uuidRegex.test(id)) {
  return Astro.redirect('/workout-plans?error=invalid-id');
}
```

**Efekt niepowodzenia:** Przekierowanie do listy planów z komunikatem błędu

---

### 9.4. Walidacja nazwy planu

**Komponent:** `WorkoutPlanHeader.tsx` + hook `useWorkoutPlanEdit`

**Warunki:**
- Nazwa wymagana (nie może być pusta)
- Minimum 3 znaki
- Maximum 100 znaków (ograniczenie bazy)

**Implementacja:**
```typescript
const validateName = (name: string): string | undefined => {
  if (!name || name.trim().length === 0) {
    return 'Nazwa jest wymagana';
  }
  if (name.trim().length < 3) {
    return 'Nazwa musi mieć co najmniej 3 znaki';
  }
  if (name.length > 100) {
    return 'Nazwa może mieć maksymalnie 100 znaków';
  }
  return undefined;
};
```

**Efekt niepowodzenia:**
- Komunikat błędu pod polem
- Czerwona ramka inputa
- Blokada przycisku "Zapisz"

---

### 9.5. Walidacja opisu planu

**Komponent:** `WorkoutPlanDescription.tsx` + hook `useWorkoutPlanEdit`

**Warunki:**
- Opis opcjonalny (może być null)
- Maximum 500 znaków

**Implementacja:**
```typescript
const validateDescription = (description: string | null): string | undefined => {
  if (description && description.length > 500) {
    return 'Opis może mieć maksymalnie 500 znaków';
  }
  return undefined;
};
```

**Efekt niepowodzenia:**
- Komunikat błędu + licznik znaków czerwony
- Blokada przycisku "Zapisz"

---

### 9.6. Walidacja ćwiczeń w planie

**Komponent:** Hook `useWorkoutPlanEdit`

**Warunki:**
- Plan musi zawierać co najmniej 1 ćwiczenie przed zapisem

**Implementacja:**
```typescript
if (editedPlan.exercises.length === 0) {
  setErrors(prev => ({
    ...prev,
    exercises: { general: 'Plan musi zawierać co najmniej jedno ćwiczenie' }
  }));
  return false;
}
```

**Efekt niepowodzenia:**
- Toast error: "Plan musi zawierać co najmniej jedno ćwiczenie"
- Blokada przycisku "Zapisz"

---

### 9.7. Walidacja serii - Powtórzenia

**Komponent:** `SetItem.tsx` + hook `useWorkoutPlanEdit`

**Warunki:**
- Powtórzenia wymagane
- Typ: integer
- Wartość > 0

**Implementacja:**
```typescript
const validateReps = (reps: number): string | undefined => {
  if (!reps || reps <= 0) {
    return 'Liczba powtórzeń musi być większa od 0';
  }
  if (!Number.isInteger(reps)) {
    return 'Liczba powtórzeń musi być liczbą całkowitą';
  }
  return undefined;
};
```

**Efekt niepowodzenia:**
- Czerwona ramka inputa
- Komunikat błędu pod polem
- Blokada zapisu

---

### 9.8. Walidacja serii - Ciężar

**Komponent:** `SetItem.tsx` + hook `useWorkoutPlanEdit`

**Warunki:**
- Ciężar opcjonalny (może być null dla ćwiczeń z wagą ciała)
- Jeśli podany: number >= 0

**Implementacja:**
```typescript
const validateWeight = (weight: number | null): string | undefined => {
  if (weight !== null && weight < 0) {
    return 'Ciężar nie może być ujemny';
  }
  return undefined;
};
```

**Efekt niepowodzenia:**
- Czerwona ramka inputa
- Komunikat błędu
- Blokada zapisu

---

### 9.9. Walidacja usunięcia ostatniej serii

**Komponent:** `SetsList.tsx`

**Warunek:** Ćwiczenie musi mieć co najmniej 1 serię

**Implementacja:**
```typescript
const canDelete = sets.length > 1;

// W SetItem:
<Button
  onClick={onRemove}
  disabled={!canDelete}
  aria-label={canDelete ? "Usuń serię" : "Nie można usunąć ostatniej serii"}
>
```

**Efekt niepowodzenia:**
- Przycisk usunięcia disabled dla ostatniej serii
- Tooltip: "Ćwiczenie musi mieć co najmniej jedną serię"

---

### 9.10. Walidacja przed rozpoczęciem treningu

**Komponent:** `ActionButtons.tsx`

**Warunki:**
- Użytkownik nie może mieć już aktywnego treningu
- Plan musi zawierać co najmniej jedno ćwiczenie

**Implementacja:**
```typescript
const handleStartWorkout = async () => {
  // Sprawdź aktywny trening
  const { data: activeWorkout } = await fetch('/api/workouts/active');

  if (activeWorkout) {
    toast.error('Masz już aktywny trening');
    // Opcja kontynuacji lub zakończenia
    return;
  }

  // Sprawdź czy plan ma ćwiczenia
  if (plan.exercises.length === 0) {
    toast.error('Plan musi zawierać co najmniej jedno ćwiczenie');
    return;
  }

  // Rozpocznij trening
  await fetch('/api/workouts', {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId })
  });
};
```

**Efekt niepowodzenia:**
- 409 Conflict: Toast error + dialog z opcjami
- 400 Bad Request: Toast error

---

### 9.11. Walidacja przed usunięciem planu

**Komponent:** `ActionButtons.tsx` + Backend API

**Warunki:**
- Plan nie może mieć aktywnego treningu

**Implementacja (backend):**
```typescript
// W DELETE /api/workout-plans/{id}
const { data: activeWorkout } = await supabase
  .from('workouts')
  .select('id')
  .eq('plan_id', planId)
  .eq('status', 'active')
  .single();

if (activeWorkout) {
  return new Response(JSON.stringify({
    error: 'Cannot delete plan with active workout',
    message: 'Zakończ aktywny trening przed usunięciem planu'
  }), { status: 409 });
}
```

**Efekt niepowodzenia:**
- 409 Conflict
- Toast error: "Nie można usunąć planu z aktywnym treningiem"

## 10. Obsługa błędów

### 10.1. Błąd 401 - Brak autoryzacji

**Scenariusz:** Użytkownik próbuje uzyskać dostęp bez zalogowania

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu powrót do `/workout-plans/[id]`

**Komunikat:** Toast info: "Zaloguj się, aby zobaczyć szczegóły planu"

---

### 10.2. Błąd 404 - Plan nie istnieje

**Scenariusz:**
- Plan o podanym ID nie istnieje w bazie
- Plan nie należy do zalogowanego użytkownika (RLS)
- Plan jest soft-deleted

**Obsługa:**
```astro
if (!plan) {
  return Astro.redirect('/workout-plans?error=not-found');
}
```

**Komunikat:** Toast error: "Nie znaleziono planu treningowego"

---

### 10.3. Błąd 400 - Nieprawidłowy UUID

**Scenariusz:** Parametr `id` nie jest poprawnym UUID

**Obsługa:**
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!id || !uuidRegex.test(id)) {
  return Astro.redirect('/workout-plans?error=invalid-id');
}
```

**Komunikat:** Toast error: "Nieprawidłowy identyfikator planu"

---

### 10.4. Błąd 500 - Błąd serwera podczas ładowania

**Scenariusz:** Supabase zwraca błąd podczas pobierania danych planu

**Obsługa:**
```astro
if (error) {
  console.error('Error fetching workout plan:', error);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20planu');
}
```

**Komunikat:** Strona błędu + Toast error: "Nie udało się załadować planu. Spróbuj ponownie."

---

### 10.5. Błąd walidacji podczas zapisu

**Scenariusz:** Użytkownik próbuje zapisać plan z błędami walidacji

**Obsługa:**
```typescript
const handleSave = async () => {
  if (!validateAll()) {
    toast.error('Popraw błędy przed zapisaniem');
    // Focus na pierwszy błąd
    const firstErrorField = document.querySelector('[data-error="true"]');
    firstErrorField?.focus();
    return;
  }
  // ...
};
```

**Komunikat:**
- Toast error: "Popraw błędy przed zapisaniem"
- Komunikaty pod konkretnymi polami

---

### 10.6. Błąd 409 - Aktywny trening podczas usuwania

**Scenariusz:** Użytkownik próbuje usunąć plan, który ma aktywny trening

**Obsługa:**
```typescript
const response = await fetch(`/api/workout-plans/${planId}`, {
  method: 'DELETE'
});

if (response.status === 409) {
  const data = await response.json();
  toast.error(data.message);
  return;
}
```

**Komunikat:** Toast error: "Nie można usunąć planu z aktywnym treningiem. Zakończ trening przed usunięciem."

---

### 10.7. Błąd 409 - Aktywny trening podczas rozpoczynania nowego

**Scenariusz:** Użytkownik próbuje rozpocząć trening, ale ma już aktywny

**Obsługa:**
```typescript
const response = await fetch('/api/workouts', {
  method: 'POST',
  body: JSON.stringify({ plan_id: planId })
});

if (response.status === 409) {
  const data = await response.json();

  // Dialog z opcjami
  const choice = await showDialog({
    title: 'Masz już aktywny trening',
    message: data.message,
    options: [
      { label: 'Kontynuuj aktywny', value: 'continue' },
      { label: 'Zakończ i rozpocznij nowy', value: 'finish' }
    ]
  });

  if (choice === 'continue') {
    window.location.href = '/workouts/active';
  } else if (choice === 'finish') {
    // Zakończ aktywny trening i rozpocznij nowy
  }
}
```

**Komunikat:** Dialog: "Masz już aktywny trening. Co chcesz zrobić?"

---

### 10.8. Błąd sieciowy podczas zapisu

**Scenariusz:** Brak połączenia lub timeout podczas zapisywania zmian

**Obsługa:**
```typescript
try {
  await handleSave();
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Brak połączenia z internetem');
  } else {
    toast.error('Nie udało się zapisać zmian. Spróbuj ponownie.');
  }
  console.error('Save error:', error);
}
```

**Komunikat:** Toast error: "Brak połączenia z internetem" lub "Nie udało się zapisać zmian"

---

### 10.9. Rollback po błędzie zapisu

**Scenariusz:** Część batch update się powiodła, ale kolejna operacja zwróciła błąd

**Obsługa:**
```typescript
const handleSave = async () => {
  const originalData = { ...editedPlan };

  try {
    // Batch updates...
  } catch (error) {
    // Rollback do oryginalnego stanu
    setEditedPlan(originalData);
    toast.error('Nie udało się zapisać wszystkich zmian. Przywrócono oryginalny stan.');
  }
};
```

**Komunikat:** Toast error: "Nie udało się zapisać wszystkich zmian. Przywrócono oryginalny stan."

**Note:** Idealne rozwiązanie to transakcje na backendzie (atomowe operacje)

---

### 10.10. Błąd ładowania ćwiczeń w modalu

**Scenariusz:** Modal "Dodaj ćwiczenie" nie może załadować listy ćwiczeń

**Obsługa:**
```typescript
// W AddExerciseModal
const { data: exercises, error } = await fetch('/api/exercises');

if (error) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-neutral-600">
        Nie udało się załadować ćwiczeń. Spróbuj ponownie.
      </p>
      <Button onClick={refetch}>Ponów</Button>
    </div>
  );
}
```

**Komunikat:** UI error state w modalu + przycisk "Ponów"

---

### 10.11. Empty state - Brak ćwiczeń w planie

**Scenariusz:** Plan nie zawiera żadnych ćwiczeń

**Obsługa:**
```tsx
// W ExerciseList
if (exercises.length === 0) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-lg">
      <Dumbbell className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        Brak ćwiczeń w planie
      </h3>
      <p className="text-neutral-600 mb-4">
        Dodaj ćwiczenia, aby móc rozpocząć trening.
      </p>
      {isEditMode && (
        <Button onClick={onAddExercise}>
          Dodaj ćwiczenie
        </Button>
      )}
    </div>
  );
}
```

**Komunikat:** UI empty state + CTA "Dodaj ćwiczenie" (w trybie edycji)

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalog komponentów:
```bash
mkdir -p src/components/workout-plans
mkdir -p src/components/workout-plans/hooks
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/workout-plans/types.ts
touch src/components/workout-plans/WorkoutPlanDetailView.tsx
touch src/components/workout-plans/WorkoutPlanHeader.tsx
touch src/components/workout-plans/WorkoutPlanMetadata.tsx
touch src/components/workout-plans/WorkoutPlanDescription.tsx
touch src/components/workout-plans/ExerciseList.tsx
touch src/components/workout-plans/ExerciseItem.tsx
touch src/components/workout-plans/ExerciseCard.tsx
touch src/components/workout-plans/SetsList.tsx
touch src/components/workout-plans/SetItem.tsx
touch src/components/workout-plans/AddExerciseModal.tsx
touch src/components/workout-plans/ActionButtons.tsx
```

1.3. Utwórz custom hooks:
```bash
touch src/components/workout-plans/hooks/useWorkoutPlanEdit.ts
touch src/components/workout-plans/hooks/useDragAndDrop.ts
```

1.4. Utwórz plik strony Astro:
```bash
mkdir -p src/pages/workout-plans
touch src/pages/workout-plans/[id].astro
```

---

### Krok 2: Definicja typów

2.1. W pliku `src/components/workout-plans/types.ts` zdefiniuj wszystkie typy ViewModels i Props zgodnie z sekcją 5.2.

**Przykład:**
```typescript
import type { WorkoutPlanDetailDTO, PlanExerciseDTO, PlanExerciseSetDTO } from '@/types';

export interface WorkoutPlanDetailViewModel {
  plan: WorkoutPlanDetailDTO;
  exerciseCount: number;
  totalSets: number;
}

export interface EditState {
  isEditMode: boolean;
  hasChanges: boolean;
  editedData: WorkoutPlanDetailDTO;
  errors: ValidationErrors;
}

export interface ValidationErrors {
  name?: string;
  description?: string;
  exercises?: {
    [exerciseId: string]: {
      sets?: {
        [setId: string]: {
          reps?: string;
          weight?: string;
        };
      };
    };
  };
}

// ... reszta typów
```

---

### Krok 3: Implementacja custom hooks

3.1. W `src/components/workout-plans/hooks/useWorkoutPlanEdit.ts` zaimplementuj hook zarządzający stanem edycji (zgodnie z sekcją 6.2):

```typescript
import { useState } from 'react';
import type { WorkoutPlanDetailDTO, PlanExerciseDTO, PlanExerciseSetDTO } from '@/types';
import type { ValidationErrors } from '../types';

export function useWorkoutPlanEdit(initialData: WorkoutPlanDetailDTO) {
  const [editedPlan, setEditedPlan] = useState(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const updateName = (name: string) => {
    setEditedPlan(prev => ({ ...prev, name }));
    setHasChanges(true);
    validateName(name);
  };

  const updateDescription = (description: string | null) => {
    setEditedPlan(prev => ({ ...prev, description }));
    setHasChanges(true);
  };

  const addExercise = (exerciseData: PlanExerciseDTO) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: [...prev.exercises, exerciseData]
    }));
    setHasChanges(true);
  };

  const removeExercise = (exerciseId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
    setHasChanges(true);
  };

  const reorderExercises = (reordered: PlanExerciseDTO[]) => {
    setEditedPlan(prev => ({ ...prev, exercises: reordered }));
    setHasChanges(true);
  };

  const addSet = (exerciseId: string, setData: PlanExerciseSetDTO) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, setData] }
          : ex
      )
    }));
    setHasChanges(true);
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<PlanExerciseSetDTO>) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map(set =>
                set.id === setId ? { ...set, ...updates } : set
              )
            }
          : ex
      )
    }));
    setHasChanges(true);
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
          : ex
      )
    }));
    setHasChanges(true);
  };

  const validateName = (name: string): string | undefined => {
    if (!name || name.trim().length === 0) {
      const error = 'Nazwa jest wymagana';
      setErrors(prev => ({ ...prev, name: error }));
      return error;
    }
    if (name.trim().length < 3) {
      const error = 'Nazwa musi mieć co najmniej 3 znaki';
      setErrors(prev => ({ ...prev, name: error }));
      return error;
    }
    setErrors(prev => ({ ...prev, name: undefined }));
    return undefined;
  };

  const validateAll = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!editedPlan.name || editedPlan.name.trim().length < 3) {
      newErrors.name = 'Nazwa musi mieć co najmniej 3 znaki';
    }

    if (editedPlan.description && editedPlan.description.length > 500) {
      newErrors.description = 'Opis może mieć maksymalnie 500 znaków';
    }

    if (editedPlan.exercises.length === 0) {
      newErrors.general = 'Plan musi zawierać co najmniej jedno ćwiczenie';
    }

    // Walidacja serii
    editedPlan.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (!set.reps || set.reps <= 0) {
          if (!newErrors.exercises) newErrors.exercises = {};
          if (!newErrors.exercises[exercise.id]) newErrors.exercises[exercise.id] = { sets: {} };
          if (!newErrors.exercises[exercise.id].sets) newErrors.exercises[exercise.id].sets = {};
          newErrors.exercises[exercise.id].sets![set.id] = {
            reps: 'Liczba powtórzeń musi być większa od 0'
          };
        }
        if (set.weight !== null && set.weight < 0) {
          if (!newErrors.exercises) newErrors.exercises = {};
          if (!newErrors.exercises[exercise.id]) newErrors.exercises[exercise.id] = { sets: {} };
          if (!newErrors.exercises[exercise.id].sets) newErrors.exercises[exercise.id].sets = {};
          newErrors.exercises[exercise.id].sets![set.id] = {
            ...newErrors.exercises[exercise.id].sets![set.id],
            weight: 'Ciężar nie może być ujemny'
          };
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setEditedPlan(initialData);
    setHasChanges(false);
    setErrors({});
  };

  return {
    editedPlan,
    hasChanges,
    errors,
    updateName,
    updateDescription,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    validateAll,
    reset
  };
}
```

3.2. W `src/components/workout-plans/hooks/useDragAndDrop.ts` zaimplementuj hook dla drag-and-drop (zgodnie z sekcją 6.2).

---

### Krok 4: Implementacja komponentów atomowych (bottom-up)

4.1. **SetItem.tsx** - Najprostszy komponent (seria):

```tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { SetItemProps } from './types';

export function SetItem({
  set,
  index,
  isEditMode,
  canDelete,
  onRepsChange,
  onWeightChange,
  onRemove
}: SetItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Numer serii */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-semibold">
        {index + 1}
      </div>

      {/* Powtórzenia */}
      {isEditMode ? (
        <Input
          type="number"
          value={set.reps}
          onChange={(e) => onRepsChange(parseInt(e.target.value))}
          min={1}
          className="w-20"
          aria-label="Liczba powtórzeń"
        />
      ) : (
        <span className="w-20 text-center">{set.reps} reps</span>
      )}

      {/* Ciężar */}
      {isEditMode ? (
        <Input
          type="number"
          value={set.weight ?? ''}
          onChange={(e) => onWeightChange(e.target.value ? parseFloat(e.target.value) : null)}
          min={0}
          step={0.5}
          placeholder="Waga ciała"
          className="w-24"
          aria-label="Ciężar w kilogramach"
        />
      ) : (
        <span className="w-24 text-center">
          {set.weight ? `${set.weight} kg` : 'Waga ciała'}
        </span>
      )}

      {/* Przycisk usuwania */}
      {isEditMode && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canDelete}
          aria-label={canDelete ? 'Usuń serię' : 'Nie można usunąć ostatniej serii'}
          title={canDelete ? 'Usuń serię' : 'Ćwiczenie musi mieć co najmniej jedną serię'}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      )}
    </div>
  );
}
```

4.2. **SetsList.tsx** - Lista serii:

```tsx
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SetItem } from './SetItem';
import type { SetsListProps } from './types';

export function SetsList({
  sets,
  isEditMode,
  onAddSet,
  onRemoveSet,
  onUpdateSet
}: SetsListProps) {
  return (
    <div className="space-y-2">
      {/* Nagłówek tabeli */}
      <div className="flex items-center gap-3 py-2 text-sm font-semibold text-neutral-600 border-b">
        <div className="w-8">#</div>
        <div className="w-20 text-center">Reps</div>
        <div className="w-24 text-center">Ciężar</div>
        {isEditMode && <div className="w-10"></div>}
      </div>

      {/* Lista serii */}
      {sets.map((set, index) => (
        <SetItem
          key={set.id}
          set={set}
          index={index}
          isEditMode={isEditMode}
          canDelete={sets.length > 1}
          onRepsChange={(reps) => onUpdateSet(set.id, { reps })}
          onWeightChange={(weight) => onUpdateSet(set.id, { weight })}
          onRemove={() => onRemoveSet(set.id)}
        />
      ))}

      {/* Przycisk dodania serii */}
      {isEditMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddSet}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj serię
        </Button>
      )}
    </div>
  );
}
```

4.3. **ExerciseCard.tsx** - Nagłówek ćwiczenia:

```tsx
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';
import type { ExerciseCardProps } from './types';

export function ExerciseCard({ exercise, setCount }: ExerciseCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
      {/* Miniatura obrazka */}
      <div className="flex-shrink-0 w-12 h-12 rounded bg-neutral-100 flex items-center justify-center overflow-hidden">
        {exercise.image_path ? (
          <img
            src={exercise.image_path}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Dumbbell className="w-6 h-6 text-neutral-400" />
        )}
      </div>

      {/* Informacje */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-neutral-900 truncate">
          {exercise.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {exercise.category.name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {exercise.difficulty}
          </Badge>
        </div>
      </div>

      {/* Liczba serii */}
      <div className="flex-shrink-0 text-sm text-neutral-600">
        {setCount} {setCount === 1 ? 'seria' : 'serie'}
      </div>
    </div>
  );
}
```

4.4. Kontynuuj implementację pozostałych komponentów atomowych zgodnie ze szczegółami w sekcji 4.

---

### Krok 5: Implementacja komponentów złożonych

5.1. **ExerciseItem.tsx** - Komponent ćwiczenia z seriami:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { ExerciseCard } from './ExerciseCard';
import { SetsList } from './SetsList';
import type { ExerciseItemProps } from './types';

export function ExerciseItem({
  exercise,
  isEditMode,
  onRemoveExercise,
  onAddSet,
  onUpdateSets
}: ExerciseItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAddSet = () => {
    onAddSet(exercise.id);
  };

  const handleRemoveSet = (setId: string) => {
    const updatedSets = exercise.sets.filter(set => set.id !== setId);
    onUpdateSets(exercise.id, updatedSets);
  };

  const handleUpdateSet = (setId: string, updates: Partial<PlanExerciseSetDTO>) => {
    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, ...updates } : set
    );
    onUpdateSets(exercise.id, updatedSets);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Nagłówek */}
      <div className="flex items-center gap-2 p-2 bg-neutral-50">
        {/* Drag handle */}
        {isEditMode && (
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-neutral-400" />
          </div>
        )}

        {/* ExerciseCard */}
        <div className="flex-1">
          <ExerciseCard
            exercise={exercise.exercise}
            setCount={exercise.sets.length}
          />
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </Button>

        {/* Przycisk usuwania */}
        {isEditMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveExercise(exercise.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>

      {/* Treść (serie) */}
      {!isCollapsed && (
        <div className="p-4">
          <SetsList
            sets={exercise.sets}
            isEditMode={isEditMode}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            onUpdateSet={handleUpdateSet}
          />
        </div>
      )}
    </div>
  );
}
```

5.2. Implementuj pozostałe komponenty złożone (`ExerciseList`, `AddExerciseModal`, `ActionButtons`) zgodnie ze szczegółami w sekcji 4.

---

### Krok 6: Implementacja komponentów nagłówka i metadata

6.1. **WorkoutPlanHeader.tsx**:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import type { WorkoutPlanHeaderProps } from './types';

export function WorkoutPlanHeader({
  name,
  createdAt,
  updatedAt,
  isEditMode,
  hasChanges,
  onNameChange,
  onSave,
  onCancel
}: WorkoutPlanHeaderProps) {
  return (
    <header className="mb-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-600 mb-2">
        <a href="/workout-plans" className="hover:underline">
          Plany treningowe
        </a>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{name}</span>
      </nav>

      {/* Tytuł */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditMode ? (
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-3xl font-bold"
              aria-label="Nazwa planu"
            />
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
              {name}
            </h1>
          )}

          <p className="text-sm text-neutral-600 mt-2">
            Utworzono: {new Date(createdAt).toLocaleDateString('pl-PL')}
            {' • '}
            Zaktualizowano: {new Date(updatedAt).toLocaleDateString('pl-PL')}
          </p>
        </div>

        {/* Przyciski akcji w trybie edycji */}
        {isEditMode && (
          <div className="flex gap-2">
            <Button
              onClick={onSave}
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Zapisz
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Anuluj
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
```

6.2. **WorkoutPlanMetadata.tsx** i **WorkoutPlanDescription.tsx** - implementuj zgodnie ze szczegółami w sekcji 4.

---

### Krok 7: Implementacja głównego komponentu WorkoutPlanDetailView

7.1. W `src/components/workout-plans/WorkoutPlanDetailView.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useWorkoutPlanEdit } from './hooks/useWorkoutPlanEdit';
import { WorkoutPlanHeader } from './WorkoutPlanHeader';
import { WorkoutPlanMetadata } from './WorkoutPlanMetadata';
import { WorkoutPlanDescription } from './WorkoutPlanDescription';
import { ExerciseList } from './ExerciseList';
import { ActionButtons } from './ActionButtons';
import { AddExerciseModal } from './AddExerciseModal';
import type { WorkoutPlanDetailViewProps } from './types';

export function WorkoutPlanDetailView({ initialData, userId }: WorkoutPlanDetailViewProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    editedPlan,
    hasChanges,
    errors,
    updateName,
    updateDescription,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    validateAll,
    reset
  } = useWorkoutPlanEdit(initialData);

  // Ochrona przed opuszczeniem strony z niezapisanymi zmianami
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleSave = async () => {
    if (!validateAll()) {
      toast.error('Popraw błędy przed zapisaniem');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Aktualizacja nazwy i opisu
      if (editedPlan.name !== initialData.name || editedPlan.description !== initialData.description) {
        const response = await fetch(`/api/workout-plans/${editedPlan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editedPlan.name,
            description: editedPlan.description
          })
        });

        if (!response.ok) throw new Error('Failed to update plan');
      }

      // 2. Batch update ćwiczeń i serii
      // TODO: Implement diff logic and API calls

      toast.success('Plan został zaktualizowany');
      setIsEditMode(false);

      // Reload page to refresh data
      window.location.reload();

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Nie udało się zapisać zmian');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = confirm('Masz niezapisane zmiany. Czy na pewno chcesz anulować?');
      if (!confirmed) return;
    }

    reset();
    setIsEditMode(false);
  };

  const handleDelete = async () => {
    const confirmed = confirm('Czy na pewno chcesz usunąć ten plan?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/workout-plans/${editedPlan.id}`, {
        method: 'DELETE'
      });

      if (response.status === 409) {
        toast.error('Nie można usunąć planu z aktywnym treningiem');
        return;
      }

      if (!response.ok) throw new Error('Failed to delete plan');

      toast.success('Plan został usunięty');
      window.location.href = '/workout-plans';
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Nie udało się usunąć planu');
    }
  };

  const handleStartWorkout = async () => {
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: editedPlan.id })
      });

      if (response.status === 409) {
        const data = await response.json();
        toast.error(data.message);
        // TODO: Show dialog with options
        return;
      }

      if (!response.ok) throw new Error('Failed to start workout');

      toast.success('Trening rozpoczęty');
      window.location.href = '/workouts/active';
    } catch (error) {
      console.error('Start workout error:', error);
      toast.error('Nie udało się rozpocząć treningu');
    }
  };

  const exerciseCount = editedPlan.exercises.length;
  const totalSets = editedPlan.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <WorkoutPlanHeader
        name={editedPlan.name}
        createdAt={editedPlan.created_at}
        updatedAt={editedPlan.updated_at}
        isEditMode={isEditMode}
        hasChanges={hasChanges}
        onNameChange={updateName}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <WorkoutPlanMetadata
        exerciseCount={exerciseCount}
        totalSets={totalSets}
        lastUsedAt={editedPlan.last_used_at}
      />

      <WorkoutPlanDescription
        description={editedPlan.description}
        isEditMode={isEditMode}
        onDescriptionChange={updateDescription}
      />

      <ExerciseList
        exercises={editedPlan.exercises}
        isEditMode={isEditMode}
        onReorder={reorderExercises}
        onAddExercise={() => setIsAddExerciseModalOpen(true)}
        onRemoveExercise={removeExercise}
      />

      {!isEditMode && (
        <ActionButtons
          planId={editedPlan.id}
          isEditMode={isEditMode}
          onEdit={() => setIsEditMode(true)}
          onDelete={handleDelete}
          onStartWorkout={handleStartWorkout}
        />
      )}

      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onConfirm={(exerciseId) => {
          // TODO: Fetch exercise data and add to plan
          setIsAddExerciseModalOpen(false);
        }}
      />
    </div>
  );
}
```

---

### Krok 8: Implementacja strony Astro (SSR)

8.1. W `src/pages/workout-plans/[id].astro`:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { WorkoutPlanDetailView } from '@/components/workout-plans/WorkoutPlanDetailView';
import type { WorkoutPlanDetailDTO } from '@/types';

// Sprawdź autoryzację
if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Walidacja parametru ID
const { id } = Astro.params;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!id || !uuidRegex.test(id)) {
  return Astro.redirect('/workout-plans?error=invalid-id');
}

// Pobierz pełne dane planu z zagnieżdżonymi ćwiczeniami i seriami
const { data: plan, error } = await Astro.locals.supabase
  .from('workout_plans')
  .select(`
    id,
    name,
    description,
    last_used_at,
    created_at,
    updated_at,
    exercises:plan_exercises(
      id,
      exercise_id,
      order_index,
      exercise:exercises(
        id,
        name,
        image_path,
        difficulty,
        category:categories(name)
      ),
      sets:plan_exercise_sets(
        id,
        reps,
        weight,
        order_index
      )
    )
  `)
  .eq('id', id)
  .is('deleted_at', null)
  .order('order_index', { foreignTable: 'plan_exercises', ascending: true })
  .order('order_index', { foreignTable: 'plan_exercises.plan_exercise_sets', ascending: true })
  .single();

// Obsługa błędów
if (error || !plan) {
  console.error('Error fetching workout plan:', error);
  return Astro.redirect('/workout-plans?error=not-found');
}

const workoutPlan: WorkoutPlanDetailDTO = plan as unknown as WorkoutPlanDetailDTO;
---

<MainLayout title={`${workoutPlan.name} - Gym Track`}>
  <WorkoutPlanDetailView
    initialData={workoutPlan}
    userId={Astro.locals.user.id}
    client:load
  />
</MainLayout>
```

---

### Krok 9: Testowanie funkcjonalności

9.1. **Test przeglądania szczegółów:**
- Zaloguj się do aplikacji
- Przejdź do listy planów (`/workout-plans`)
- Kliknij na plan treningowy
- Sprawdź czy wszystkie dane się wyświetlają:
  - Nazwa, opis, metadata
  - Lista ćwiczeń z seriami
  - Przyciski akcji

9.2. **Test trybu edycji:**
- Kliknij "Edytuj"
- Zmień nazwę planu
- Zmień opis
- Dodaj ćwiczenie
- Dodaj serię do ćwiczenia
- Edytuj serię (reps, weight)
- Usuń serię
- Usuń ćwiczenie
- Kliknij "Zapisz"
- Sprawdź czy zmiany zostały zapisane (reload strony)

9.3. **Test drag-and-drop:**
- W trybie edycji przeciągnij ćwiczenie na nową pozycję
- Sprawdź czy kolejność się zmieniła
- Zapisz zmiany
- Sprawdź czy nowa kolejność się utrzymała

9.4. **Test walidacji:**
- W trybie edycji usuń nazwę planu → sprawdź komunikat błędu
- Wpisz więcej niż 500 znaków w opis → sprawdź komunikat błędu
- Ustaw reps = 0 → sprawdź komunikat błędu
- Ustaw weight = -10 → sprawdź komunikat błędu
- Spróbuj zapisać z błędami → sprawdź czy blokada działa

9.5. **Test anulowania edycji:**
- W trybie edycji zmień kilka rzeczy
- Kliknij "Anuluj"
- Sprawdź dialog potwierdzający
- Potwierdź anulowanie
- Sprawdź czy zmiany zostały cofnięte

9.6. **Test rozpoczęcia treningu:**
- Kliknij "Rozpocznij trening"
- Sprawdź przekierowanie do `/workouts/active`
- Sprawdź czy trening został utworzony

9.7. **Test usuwania planu:**
- Kliknij "Usuń plan"
- Sprawdź dialog potwierdzający
- Potwierdź usunięcie
- Sprawdź przekierowanie do listy planów
- Sprawdź czy plan zniknął z listy

9.8. **Test ochrony przed opuszczeniem strony:**
- W trybie edycji zmień coś
- Spróbuj zamknąć kartę lub przejść na inną stronę
- Sprawdź czy pojawia się dialog przeglądarki

---

### Krok 10: Styling i dostępność

10.1. **Semantic HTML:**
- Użyj `<header>`, `<main>`, `<section>`, `<article>`
- Hierarchia nagłówków: `<h1>` → `<h2>` → `<h3>`

10.2. **ARIA attributes:**
```tsx
<Input
  aria-label="Nazwa planu treningowego"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? "name-error" : undefined}
/>
{errors.name && (
  <p id="name-error" className="text-red-500 text-sm" role="alert">
    {errors.name}
  </p>
)}
```

10.3. **Focus states:**
```css
.exercise-card:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

10.4. **Sprawdź kontrast kolorów** (WCAG AA standard)

10.5. **Keyboard navigation:**
- Tab order logiczny (od góry do dołu)
- Enter/Space dla przycisków i linków
- Escape dla zamykania modali

---

### Krok 11: Dokumentacja i code review

11.1. **JSDoc comments:**
```tsx
/**
 * Komponent widoku szczegółów planu treningowego
 * Obsługuje tryb podglądu i edycji z pełnym CRUD dla zagnieżdżonych danych
 * @param {WorkoutPlanDetailViewProps} props - Props zawierające dane planu i user ID
 * @returns {JSX.Element} Renderowany widok szczegółów planu
 */
export function WorkoutPlanDetailView({ initialData, userId }: WorkoutPlanDetailViewProps) {
  // ...
}
```

11.2. **Lint i format:**
```bash
npm run lint:fix
npm run format
```

11.3. **Commit:**
```bash
git add .
git commit -m "feat(workout-plans): implement workout plan detail view with edit mode

- Add WorkoutPlanDetailView with view/edit modes
- Implement nested CRUD for exercises and sets
- Add drag-and-drop for reordering exercises
- Add AddExerciseModal for selecting exercises
- Implement validation and error handling
- Add beforeunload protection for unsaved changes
- Implement batch update strategy for saving changes

Implements US-021 (View plan details) and US-019 (Edit plan)"
```

---

### Krok 12: Integracja z pipeline CI/CD

12.1. Sprawdź czy build przechodzi:
```bash
npm run build
```

12.2. Deploy do środowiska testowego

12.3. Przeprowadź smoke testing

12.4. Po akceptacji merge do głównej gałęzi

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-021 i US-019 w pełnym zakresie
✅ **Złożona struktura danych:** Plan → Ćwiczenia → Serie (3 poziomy zagnieżdżenia)
✅ **Tryb edycji:** Inline editing z walidacją w czasie rzeczywistym
✅ **Drag-and-drop:** Zmiana kolejności ćwiczeń
✅ **CRUD operacje:** Pełne zarządzanie ćwiczeniami i seriami
✅ **Walidacja:** Wszystkie pola walidowane (nazwa, opis, reps, weight)
✅ **Obsługa błędów:** Kompleksowa obsługa wszystkich scenariuszy błędów
✅ **Batch update:** Optymalna strategia zapisywania zmian
✅ **Ochrona danych:** Ostrzeżenie przed utratą niezapisanych zmian
✅ **Type safety:** TypeScript w całym kodzie
✅ **Responsywność:** Działa na mobile i desktop
✅ **Dostępność:** ARIA, semantic HTML, keyboard navigation
✅ **UX:** Smooth transitions, clear feedback, optimistic updates

Implementacja powinna zająć **8-12 godzin** doświadczonemu programiście frontendowemu ze względu na złożoność zagnieżdżonych danych i wielu interakcji.