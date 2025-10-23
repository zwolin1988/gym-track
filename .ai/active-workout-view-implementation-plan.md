# Plan implementacji widoku aktywnego treningu

## 1. Przegląd

Widok aktywnego treningu (`/workouts/active`) to kluczowy komponent aplikacji Gym Track, umożliwiający użytkownikom logowanie postępów w czasie rzeczywistym podczas sesji treningowej. Widok zapewnia intuicyjny interfejs do oznaczania wykonanych serii, modyfikowania parametrów (powtórzenia, ciężar), dodawania notatek oraz zarządzania przebiegiem treningu.

Widok realizuje historyjki użytkownika:
- **US-022:** Rozpoczęcie treningu na podstawie planu
- **US-023:** Logowanie wykonanej serii podczas treningu
- **US-024:** Dodawanie notatki do serii
- **US-025:** Dodawanie dodatkowych serii
- **US-026:** Przejście do poprzedniego/następnego ćwiczenia
- **US-027:** Zakończenie treningu
- **US-030:** Kontynuacja aktywnego treningu

Kluczowe cechy:
- Stoper treningu (workout timer) działający w czasie rzeczywistym
- Lista ćwiczeń z seriami (accordion na mobile dla lepszej czytelności)
- Duże cele dotykowe (44x44px) dla checkboxów oznaczania serii
- Edycja inline z optimistic updates dla płynnego UX
- Dodawanie dodatkowych serii podczas treningu
- Notatki per seria (max 200 znaków)
- Ochrona przed przypadkowym zamknięciem strony (`beforeunload`)
- Persystencja stanu w `localStorage`
- Opcjonalny tryb Focus Mode (minimalistyczny widok)

## 2. Routing widoku

**Ścieżka:** `/workouts/active`

**Typ renderowania:** Hybrid - Server-side rendering z client-side interaktivity (React)

**Ochrona trasy:** Wymaga autoryzacji + sprawdzenie czy istnieje aktywny trening

**Przekierowania:**
- Jeśli użytkownik niezalogowany → `/auth/login`
- Jeśli brak aktywnego treningu → `/workout-plans` z toast info: "Brak aktywnego treningu"

## 3. Struktura komponentów

```
src/pages/workouts/active.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją - opcjonalnie ukryta na mobile)
└── src/components/workouts/
    ├── ActiveWorkoutContainer.tsx (React - Główny kontener z state management)
    │   ├── WorkoutHeader.tsx (React - Nagłówek z nazwą planu i timerem)
    │   │   └── WorkoutTimer.tsx (React - Stoper z useEffect)
    │   ├── WorkoutControls.tsx (React - Przyciski: Zakończ, Focus Mode, etc.)
    │   ├── ExerciseList.tsx (React - Lista ćwiczeń)
    │   │   └── ExerciseAccordion.tsx (React - Accordion item dla pojedynczego ćwiczenia)
    │   │       ├── ExerciseHeader.tsx (React - Header accordiona z nazwą ćwiczenia)
    │   │       ├── SetsList.tsx (React - Lista serii dla ćwiczenia)
    │   │       │   └── SetItem.tsx (React - Pojedyncza seria z checkboxem i inputami)
    │   │       │       ├── SetCheckbox.tsx (React - 44x44px checkbox)
    │   │       │       ├── SetInput.tsx (React - Input dla reps/weight z +/- buttons)
    │   │       │       └── SetNote.tsx (React - Textarea dla notatki)
    │   │       └── AddSetButton.tsx (React - Przycisk dodawania dodatkowej serii)
    │   └── CompleteWorkoutDialog.tsx (React - Modal potwierdzenia zakończenia)
    └── hooks/
        ├── useActiveWorkout.ts (Custom hook - state management, API calls)
        ├── useWorkoutTimer.ts (Custom hook - logika stopera)
        ├── useBeforeUnload.ts (Custom hook - ochrona przed zamknięciem)
        └── useLocalStorage.ts (Custom hook - persystencja stanu)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do sprawdzenia istnienia aktywnego treningu
- `ActiveWorkoutContainer` jako główny React component - zarządza całym stanem treningu
- Podział na mniejsze komponenty dla czytelności i reużywalności
- Custom hooks dla separacji logiki biznesowej od UI
- `localStorage` dla persystencji stanu w przypadku odświeżenia strony

## 4. Szczegóły komponentów

### 4.1. active.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku
- Pobranie danych aktywnego treningu z API
- Walidację autoryzacji i istnienia aktywnego treningu
- Obsługę przekierowań
- Przekazanie początkowych danych do React container

**Główne elementy:**
- Import layoutu `MainLayout.astro` (opcjonalnie z uproszczoną nawigacją)
- Wywołanie `GET /api/workouts/active` przez Supabase client
- Walidacja istnienia aktywnego treningu
- Conditional rendering w przypadku błędów
- Przekazanie `WorkoutDetailDTO` do `ActiveWorkoutContainer`

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w React)

**Warunki walidacji:**
- `locals.user` musi istnieć
- Musi istnieć aktywny trening (status = 'active')
- Dane treningu muszą zawierać ćwiczenia i serie

**Typy:**
- `WorkoutDetailDTO` - szczegóły aktywnego treningu
- `SupabaseClient` - klient Supabase z kontekstu

**Propsy:**
- Brak (główna strona Astro)

**Kod przykładowy:**
```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { ActiveWorkoutContainer } from '@/components/workouts/ActiveWorkoutContainer';

if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Pobierz aktywny trening
const { data: activeWorkout, error } = await Astro.locals.supabase
  .from('workouts')
  .select(`
    *,
    plan:workout_plans!inner(name),
    exercises:workout_exercises(
      id,
      exercise_id,
      order_index,
      exercise:exercises!inner(id, name, image_path),
      sets:workout_sets(
        id,
        planned_reps,
        planned_weight,
        actual_reps,
        actual_weight,
        completed,
        note,
        order_index
      )
    )
  `)
  .eq('status', 'active')
  .single();

if (error || !activeWorkout) {
  return Astro.redirect('/workout-plans');
}

const workoutData = {
  ...activeWorkout,
  plan_name: activeWorkout.plan.name,
  exercises: activeWorkout.exercises.map(ex => ({
    ...ex,
    exercise: ex.exercise,
    sets: ex.sets.sort((a, b) => a.order_index - b.order_index)
  })).sort((a, b) => a.order_index - b.order_index)
};
---

<MainLayout title="Aktywny Trening - Gym Track" minimal={true}>
  <ActiveWorkoutContainer initialWorkout={workoutData} client:load />
</MainLayout>
```

---

### 4.2. ActiveWorkoutContainer.tsx

**Opis komponentu:**
Główny kontener zarządzający całym stanem aktywnego treningu. Wykorzystuje custom hook `useActiveWorkout` do zarządzania stanem i API calls. Odpowiada za orkiestrację wszystkich podkomponentów.

**Główne elementy:**
- Stan treningu (zarządzany przez `useActiveWorkout` hook)
- Stan UI (Focus Mode, expanded exercises, dialog states)
- Obsługa optimistic updates
- Persystencja stanu w localStorage
- Ochrona przed przypadkowym zamknięciem (`beforeunload`)
- Layout z headerem, listą ćwiczeń i kontrolkami

**Obsługiwane zdarzenia:**
- Toggle Focus Mode
- Otwieranie/zamykanie Complete Workout Dialog
- Obsługa błędów API

**Warunki walidacji:**
- `initialWorkout` musi być prawidłowym `WorkoutDetailDTO`
- Workout status musi być 'active'

**Typy:**
```typescript
interface ActiveWorkoutContainerProps {
  initialWorkout: WorkoutDetailDTO;
}

interface WorkoutState {
  workout: WorkoutDetailDTO;
  isLoading: boolean;
  error: string | null;
}
```

**Propsy:**
```typescript
interface ActiveWorkoutContainerProps {
  initialWorkout: WorkoutDetailDTO;
}
```

**Kod przykładowy:**
```tsx
import { useState } from 'react';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutControls } from './WorkoutControls';
import { ExerciseList } from './ExerciseList';
import { CompleteWorkoutDialog } from './CompleteWorkoutDialog';
import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import type { WorkoutDetailDTO } from '@/types';

interface ActiveWorkoutContainerProps {
  initialWorkout: WorkoutDetailDTO;
}

export function ActiveWorkoutContainer({ initialWorkout }: ActiveWorkoutContainerProps) {
  const {
    workout,
    isLoading,
    error,
    updateSet,
    addSet,
    completeWorkout
  } = useActiveWorkout(initialWorkout);

  const [focusMode, setFocusMode] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // Ochrona przed przypadkowym zamknięciem
  useBeforeUnload(true);

  const handleCompleteWorkout = async () => {
    await completeWorkout();
    // Przekierowanie do podsumowania
    window.location.href = `/workouts/${workout.id}/summary`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <WorkoutHeader
        planName={workout.plan_name}
        startedAt={workout.started_at}
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <WorkoutControls
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode(!focusMode)}
          onComplete={() => setCompleteDialogOpen(true)}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <ExerciseList
          exercises={workout.exercises}
          focusMode={focusMode}
          onUpdateSet={updateSet}
          onAddSet={addSet}
          isLoading={isLoading}
        />
      </main>

      <CompleteWorkoutDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        onConfirm={handleCompleteWorkout}
      />
    </div>
  );
}
```

---

### 4.3. WorkoutHeader.tsx

**Opis komponentu:**
Nagłówek widoku aktywnego treningu wyświetlający nazwę planu treningowego oraz działający w czasie rzeczywistym stoper. Sticky na mobile dla stałej widoczności.

**Główne elementy:**
- Nazwa planu treningowego
- `WorkoutTimer` - komponent stopera
- Sticky positioning (top-0 z-10)
- Kompaktowy layout na mobile

**Obsługiwane zdarzenia:**
- Brak (komponent prezentacyjny)

**Warunki walidacji:**
- `planName` - niepusty string
- `startedAt` - prawidłowy ISO 8601 timestamp

**Typy:**
```typescript
interface WorkoutHeaderProps {
  planName: string;
  startedAt: string;
}
```

**Propsy:**
```typescript
interface WorkoutHeaderProps {
  planName: string;
  startedAt: string;
}
```

**Kod przykładowy:**
```tsx
import { WorkoutTimer } from './WorkoutTimer';

interface WorkoutHeaderProps {
  planName: string;
  startedAt: string;
}

export function WorkoutHeader({ planName, startedAt }: WorkoutHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 truncate">
              {planName}
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Aktywny trening
            </p>
          </div>
          <WorkoutTimer startedAt={startedAt} />
        </div>
      </div>
    </header>
  );
}
```

---

### 4.4. WorkoutTimer.tsx

**Opis komponentu:**
Stoper wyświetlający upływający czas od rozpoczęcia treningu. Aktualizowany co 1 sekundę za pomocą `useWorkoutTimer` hook. Format wyświetlania: "1h 23m" lub "45m".

**Główne elementy:**
- Wykorzystanie `useWorkoutTimer` hook
- Display czasu w formacie czytelnym dla użytkownika
- Ikona zegara (Clock z Lucide)
- Auto-update co 1 sekundę

**Obsługiwane zdarzenia:**
- Brak (automatyczne odliczanie)

**Warunki walidacji:**
- `startedAt` - prawidłowy ISO 8601 timestamp

**Typy:**
```typescript
interface WorkoutTimerProps {
  startedAt: string;
}
```

**Propsy:**
```typescript
interface WorkoutTimerProps {
  startedAt: string;
}
```

**Kod przykładowy:**
```tsx
import { Clock } from 'lucide-react';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';

interface WorkoutTimerProps {
  startedAt: string;
}

export function WorkoutTimer({ startedAt }: WorkoutTimerProps) {
  const { hours, minutes, seconds } = useWorkoutTimer(startedAt);

  const displayTime = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
      <Clock className="w-5 h-5 text-neutral-600" />
      <span className="text-lg font-bold text-neutral-900 tabular-nums">
        {displayTime}
      </span>
    </div>
  );
}
```

---

### 4.5. WorkoutControls.tsx

**Opis komponentu:**
Kontrolki treningu zawierające przyciski do zmiany trybu Focus Mode oraz zakończenia treningu. Responsywny layout (column na mobile, row na desktop).

**Główne elementy:**
- Przycisk "Tryb Focus" (toggle)
- Przycisk "Zakończ trening" (primary action)
- Ikony z Lucide (Eye/EyeOff, Check)

**Obsługiwane zdarzenia:**
- `onToggleFocus` - toggle Focus Mode
- `onComplete` - otwiera dialog potwierdzenia zakończenia

**Warunki walidacji:**
- `focusMode` - boolean

**Typy:**
```typescript
interface WorkoutControlsProps {
  focusMode: boolean;
  onToggleFocus: () => void;
  onComplete: () => void;
}
```

**Propsy:**
```typescript
interface WorkoutControlsProps {
  focusMode: boolean;
  onToggleFocus: () => void;
  onComplete: () => void;
}
```

**Kod przykładowy:**
```tsx
import { Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutControlsProps {
  focusMode: boolean;
  onToggleFocus: () => void;
  onComplete: () => void;
}

export function WorkoutControls({ focusMode, onToggleFocus, onComplete }: WorkoutControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <Button
        variant="outline"
        onClick={onToggleFocus}
        className="flex-1 sm:flex-initial"
      >
        {focusMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
        {focusMode ? 'Wyjdź z trybu Focus' : 'Tryb Focus'}
      </Button>

      <Button
        onClick={onComplete}
        className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700"
      >
        <Check className="w-4 h-4 mr-2" />
        Zakończ trening
      </Button>
    </div>
  );
}
```

---

### 4.6. ExerciseList.tsx

**Opis komponentu:**
Lista ćwiczeń w treningu. Renderuje `ExerciseAccordion` dla każdego ćwiczenia. W trybie Focus Mode wyświetla tylko jedno ćwiczenie na raz z nawigacją poprzedni/następny.

**Główne elementy:**
- Mapowanie exercises na `ExerciseAccordion` komponenty
- Nawigacja między ćwiczeniami w Focus Mode
- Progress indicator (np. "Ćwiczenie 2/5")
- Stan expanded dla accordionów

**Obsługiwane zdarzenia:**
- Toggle accordion (expand/collapse)
- Nawigacja poprzedni/następny w Focus Mode
- Delegowanie `onUpdateSet` i `onAddSet` do dzieci

**Warunki walidacji:**
- `exercises` - niepusta tablica `WorkoutExerciseDTO[]`

**Typy:**
```typescript
interface ExerciseListProps {
  exercises: WorkoutExerciseDTO[];
  focusMode: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  isLoading: boolean;
}
```

**Propsy:**
```typescript
interface ExerciseListProps {
  exercises: WorkoutExerciseDTO[];
  focusMode: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  isLoading: boolean;
}
```

**Kod przykładowy:**
```tsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseAccordion } from './ExerciseAccordion';
import type { WorkoutExerciseDTO, WorkoutSetDTO, CreateWorkoutSetCommand } from '@/types';

interface ExerciseListProps {
  exercises: WorkoutExerciseDTO[];
  focusMode: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  isLoading: boolean;
}

export function ExerciseList({
  exercises,
  focusMode,
  onUpdateSet,
  onAddSet,
  isLoading
}: ExerciseListProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  if (focusMode) {
    const currentExercise = exercises[currentExerciseIndex];
    const canGoPrev = currentExerciseIndex > 0;
    const canGoNext = currentExerciseIndex < exercises.length - 1;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Poprzednie
          </Button>

          <span className="text-sm text-neutral-600 font-medium">
            Ćwiczenie {currentExerciseIndex + 1}/{exercises.length}
          </span>

          <Button
            variant="ghost"
            onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
            disabled={!canGoNext}
          >
            Następne
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <ExerciseAccordion
          exercise={currentExercise}
          defaultExpanded={true}
          onUpdateSet={onUpdateSet}
          onAddSet={onAddSet}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exercises.map((exercise, index) => (
        <ExerciseAccordion
          key={exercise.id}
          exercise={exercise}
          defaultExpanded={index === 0}
          onUpdateSet={onUpdateSet}
          onAddSet={onAddSet}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
```

---

### 4.7. ExerciseAccordion.tsx

**Opis komponentu:**
Accordion dla pojedynczego ćwiczenia. Wyświetla header z nazwą ćwiczenia, obrazkiem i podsumowaniem postępu (np. "3/4 serie wykonane"). W expanded state pokazuje listę serii.

**Główne elementy:**
- Accordion z `shadcn/ui` (lub custom implementation)
- `ExerciseHeader` - trigger accordiona
- `SetsList` - zawartość accordiona
- `AddSetButton` - na końcu listy serii
- Progress indicator w headerze

**Obsługiwane zdarzenia:**
- Toggle expand/collapse
- Delegowanie `onUpdateSet` i `onAddSet` do dzieci

**Warunki walidacji:**
- `exercise` - prawidłowy `WorkoutExerciseDTO`
- `exercise.sets` - niepusta tablica

**Typy:**
```typescript
interface ExerciseAccordionProps {
  exercise: WorkoutExerciseDTO;
  defaultExpanded?: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  isLoading: boolean;
}
```

**Propsy:**
```typescript
interface ExerciseAccordionProps {
  exercise: WorkoutExerciseDTO;
  defaultExpanded?: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  isLoading: boolean;
}
```

**Kod przykładowy:**
```tsx
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ExerciseHeader } from './ExerciseHeader';
import { SetsList } from './SetsList';
import { AddSetButton } from './AddSetButton';
import type { WorkoutExerciseDTO, WorkoutSetDTO, CreateWorkoutSetCommand } from '@/types';

interface ExerciseAccordionProps {
  exercise: WorkoutExerciseDTO;
  defaultExpanded?: boolean;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  isLoading: boolean;
}

export function ExerciseAccordion({
  exercise,
  defaultExpanded = false,
  onUpdateSet,
  onAddSet,
  isLoading
}: ExerciseAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const completedSets = exercise.sets.filter(s => s.completed).length;
  const totalSets = exercise.sets.length;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <ExerciseHeader
          name={exercise.exercise.name}
          imagePath={exercise.exercise.image_path}
          completedSets={completedSets}
          totalSets={totalSets}
        />
        <ChevronDown
          className={`w-5 h-5 text-neutral-600 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-200">
          <SetsList
            sets={exercise.sets}
            onUpdateSet={onUpdateSet}
            isLoading={isLoading}
          />
          <AddSetButton
            exerciseId={exercise.id}
            onAddSet={onAddSet}
            lastSet={exercise.sets[exercise.sets.length - 1]}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
```

---

### 4.8. SetItem.tsx

**Opis komponentu:**
Pojedyncza seria w liście. Główny komponent interakcji - zawiera checkbox (44x44px), inputy dla reps i weight, oraz textarea dla notatki. Wykorzystuje optimistic updates dla płynnego UX.

**Główne elementy:**
- `SetCheckbox` - 44x44px touch target
- `SetInput` dla reps (zawsze wyświetlany)
- `SetInput` dla weight (opcjonalny)
- `SetNote` - textarea dla notatki (max 200 znaków)
- Debounced auto-save dla inputów
- Wizualne rozróżnienie completed vs uncompleted (opacity, strikethrough)

**Obsługiwane zdarzenia:**
- Toggle completed (checkbox)
- Update actual_reps (debounced)
- Update actual_weight (debounced)
- Update note (debounced)

**Warunki walidacji:**
- `actual_reps` > 0 jeśli podane
- `actual_weight` >= 0 jeśli podane
- `note` max 200 znaków

**Typy:**
```typescript
interface SetItemProps {
  set: WorkoutSetDTO;
  setNumber: number;
  onUpdate: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  isLoading: boolean;
}
```

**Propsy:**
```typescript
interface SetItemProps {
  set: WorkoutSetDTO;
  setNumber: number;
  onUpdate: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  isLoading: boolean;
}
```

**Kod przykładowy:**
```tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@/components/hooks/useDebounce';
import { SetCheckbox } from './SetCheckbox';
import { SetInput } from './SetInput';
import { SetNote } from './SetNote';
import type { WorkoutSetDTO } from '@/types';

interface SetItemProps {
  set: WorkoutSetDTO;
  setNumber: number;
  onUpdate: (setId: string, updates: Partial<WorkoutSetDTO>) => Promise<void>;
  isLoading: boolean;
}

export function SetItem({ set, setNumber, onUpdate, isLoading }: SetItemProps) {
  // Local state dla optimistic updates
  const [reps, setReps] = useState(set.actual_reps ?? set.planned_reps);
  const [weight, setWeight] = useState(set.actual_weight ?? set.planned_weight);
  const [note, setNote] = useState(set.note ?? '');
  const [completed, setCompleted] = useState(set.completed);

  // Debounced values
  const debouncedReps = useDebounce(reps, 500);
  const debouncedWeight = useDebounce(weight, 500);
  const debouncedNote = useDebounce(note, 1000);

  // Auto-save na zmianę debounced values
  useEffect(() => {
    if (debouncedReps !== (set.actual_reps ?? set.planned_reps)) {
      onUpdate(set.id, { actual_reps: debouncedReps });
    }
  }, [debouncedReps]);

  useEffect(() => {
    if (debouncedWeight !== (set.actual_weight ?? set.planned_weight)) {
      onUpdate(set.id, { actual_weight: debouncedWeight });
    }
  }, [debouncedWeight]);

  useEffect(() => {
    if (debouncedNote !== (set.note ?? '')) {
      onUpdate(set.id, { note: debouncedNote || null });
    }
  }, [debouncedNote]);

  const handleToggleCompleted = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    onUpdate(set.id, { completed: newCompleted });
  };

  return (
    <div className={`p-4 border rounded-lg ${completed ? 'bg-green-50 border-green-200' : 'bg-white border-neutral-200'}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox - 44x44px touch target */}
        <SetCheckbox
          checked={completed}
          onChange={handleToggleCompleted}
          disabled={isLoading}
        />

        <div className="flex-1 space-y-3">
          {/* Numer serii */}
          <div className="font-semibold text-neutral-900">
            Seria {setNumber}
          </div>

          {/* Inputs dla reps i weight */}
          <div className="grid grid-cols-2 gap-3">
            <SetInput
              label="Powtórzenia"
              value={reps}
              onChange={setReps}
              min={1}
              disabled={isLoading}
              planned={set.planned_reps}
            />
            <SetInput
              label="Ciężar (kg)"
              value={weight}
              onChange={setWeight}
              min={0}
              step={2.5}
              disabled={isLoading}
              planned={set.planned_weight}
            />
          </div>

          {/* Notatka */}
          <SetNote
            value={note}
            onChange={setNote}
            maxLength={200}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### 4.9. SetCheckbox.tsx

**Opis komponentu:**
Duży checkbox (44x44px touch target) do oznaczania serii jako wykonanej. Wizualna zmiana po kliknięciu (checkmark, kolor zielony).

**Główne elementy:**
- Input type checkbox z custom styling
- 44x44px touch area
- Ikona checkmark (Check z Lucide)
- Transition dla smooth UX

**Obsługiwane zdarzenia:**
- `onChange` - toggle checked state

**Warunki walidacji:**
- `checked` - boolean

**Typy:**
```typescript
interface SetCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}
```

**Propsy:**
```typescript
interface SetCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}
```

**Kod przykładowy:**
```tsx
import { Check } from 'lucide-react';

interface SetCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function SetCheckbox({ checked, onChange, disabled = false }: SetCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`
        w-11 h-11 rounded-lg border-2 flex items-center justify-center
        transition-all duration-200
        ${checked
          ? 'bg-green-600 border-green-600'
          : 'bg-white border-neutral-300 hover:border-neutral-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={checked ? 'Oznacz jako niewykonaną' : 'Oznacz jako wykonaną'}
    >
      {checked && <Check className="w-6 h-6 text-white" strokeWidth={3} />}
    </button>
  );
}
```

---

### 4.10. SetInput.tsx

**Opis komponentu:**
Input numeryczny z przyciskami +/- dla szybkiej modyfikacji wartości. Wyświetla wartość planowaną jako placeholder lub hint. Auto-select tekstu po focus dla szybkiej edycji.

**Główne elementy:**
- Input type number
- Przyciski +/- (Minus, Plus z Lucide)
- Label z "planowane" wartością
- Touch-friendly buttons (40x40px minimum)

**Obsługiwane zdarzenia:**
- `onChange` - zmiana wartości
- `onIncrement` - +
- `onDecrement` - -

**Warunki walidacji:**
- `value` >= `min`
- `step` - krok inkrementacji (domyślnie 1)

**Typy:**
```typescript
interface SetInputProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  planned?: number | null;
}
```

**Propsy:**
```typescript
interface SetInputProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  planned?: number | null;
}
```

**Kod przykładowy:**
```tsx
import { Minus, Plus } from 'lucide-react';

interface SetInputProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  planned?: number | null;
}

export function SetInput({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  disabled = false,
  planned = null
}: SetInputProps) {
  const displayValue = value ?? planned ?? 0;

  const handleIncrement = () => {
    onChange(displayValue + step);
  };

  const handleDecrement = () => {
    const newValue = displayValue - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {planned !== null && value !== planned && (
          <span className="ml-1 text-xs text-neutral-500">
            (plan: {planned})
          </span>
        )}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || displayValue <= min}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          type="number"
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          step={step}
          className="flex-1 h-10 px-3 text-center border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onFocus={(e) => e.target.select()}
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

---

### 4.11. SetNote.tsx

**Opis komponentu:**
Textarea dla opcjonalnej notatki do serii. Expandable (rośnie z zawartością). Licznik znaków (max 200). Placeholder: "Dodaj notatkę (opcjonalnie)".

**Główne elementy:**
- Textarea z auto-resize
- Licznik znaków (np. "45/200")
- Placeholder
- Walidacja maxLength

**Obsługiwane zdarzenia:**
- `onChange` - zmiana tekstu notatki

**Warunki walidacji:**
- `value.length` <= 200

**Typy:**
```typescript
interface SetNoteProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}
```

**Propsy:**
```typescript
interface SetNoteProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}
```

**Kod przykładowy:**
```tsx
interface SetNoteProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function SetNote({
  value,
  onChange,
  maxLength = 200,
  disabled = false
}: SetNoteProps) {
  const remaining = maxLength - value.length;

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-neutral-700 flex items-center justify-between">
        <span>Notatka</span>
        <span className={`text-xs ${remaining < 20 ? 'text-red-600' : 'text-neutral-500'}`}>
          {value.length}/{maxLength}
        </span>
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        placeholder="Dodaj notatkę (opcjonalnie)"
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={2}
      />
    </div>
  );
}
```

---

### 4.12. AddSetButton.tsx

**Opis komponentu:**
Przycisk do dodawania dodatkowej serii do ćwiczenia podczas treningu. Automatycznie wypełnia wartości z poprzedniej serii (jeśli istnieje).

**Główne elementy:**
- Button z ikoną Plus
- Tekst "Dodaj serię"
- Po kliknięciu wywołuje `onAddSet` z danymi z ostatniej serii

**Obsługiwane zdarzenia:**
- `onClick` - dodanie nowej serii

**Warunki walidacji:**
- `lastSet` - opcjonalny (jeśli nie istnieje, dodaje domyślne wartości)

**Typy:**
```typescript
interface AddSetButtonProps {
  exerciseId: string;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  lastSet?: WorkoutSetDTO;
  isLoading: boolean;
}
```

**Propsy:**
```typescript
interface AddSetButtonProps {
  exerciseId: string;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  lastSet?: WorkoutSetDTO;
  isLoading: boolean;
}
```

**Kod przykładowy:**
```tsx
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkoutSetDTO, CreateWorkoutSetCommand } from '@/types';

interface AddSetButtonProps {
  exerciseId: string;
  onAddSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  lastSet?: WorkoutSetDTO;
  isLoading: boolean;
}

export function AddSetButton({
  exerciseId,
  onAddSet,
  lastSet,
  isLoading
}: AddSetButtonProps) {
  const handleAddSet = () => {
    const newSetData: CreateWorkoutSetCommand = {
      planned_reps: lastSet?.actual_reps ?? lastSet?.planned_reps ?? 10,
      planned_weight: lastSet?.actual_weight ?? lastSet?.planned_weight ?? null,
      actual_reps: null,
      actual_weight: null,
      completed: false,
      note: null
    };

    onAddSet(exerciseId, newSetData);
  };

  return (
    <Button
      variant="outline"
      onClick={handleAddSet}
      disabled={isLoading}
      className="w-full mt-3"
    >
      <Plus className="w-4 h-4 mr-2" />
      Dodaj serię
    </Button>
  );
}
```

---

### 4.13. CompleteWorkoutDialog.tsx

**Opis komponentu:**
Modal potwierdzenia zakończenia treningu. Wyświetla ostrzeżenie i wymaga potwierdzenia akcji. Zapobiega przypadkowemu zakończeniu treningu.

**Główne elementy:**
- Dialog z `shadcn/ui`
- Tytuł "Zakończyć trening?"
- Opis z ostrzeżeniem
- Przyciski: "Anuluj" (secondary) i "Zakończ trening" (primary, destructive style)

**Obsługiwane zdarzenia:**
- `onConfirm` - potwierdzenie zakończenia
- `onClose` - zamknięcie dialogu

**Warunki walidacji:**
- Brak specyficznych warunków (tylko UI)

**Typy:**
```typescript
interface CompleteWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

**Propsy:**
```typescript
interface CompleteWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

**Kod przykładowy:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CompleteWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CompleteWorkoutDialog({
  open,
  onClose,
  onConfirm
}: CompleteWorkoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zakończyć trening?</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz zakończyć ten trening? Zostaną obliczone statystyki
            i zostaniesz przekierowany do podsumowania.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
            Zakończ trening
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Workout Detail DTO - główny typ dla aktywnego treningu
export type WorkoutDetailDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
  exercises: WorkoutExerciseDTO[];
};

// Workout Exercise DTO - ćwiczenie w treningu
export type WorkoutExerciseDTO = Omit<Tables<"workout_exercises">, "user_id" | "workout_id"> & {
  exercise: WorkoutExerciseMinimalDTO;
  sets: WorkoutSetDTO[];
};

// Workout Set DTO - seria w treningu
export type WorkoutSetDTO = Omit<Tables<"workout_sets">, "user_id" | "workout_exercise_id">;

// Create Workout Set Command
export interface CreateWorkoutSetCommand {
  planned_reps: number;
  planned_weight?: number | null;
  actual_reps?: number | null;
  actual_weight?: number | null;
  completed?: boolean;
  note?: string | null;
  order_index?: number;
}

// Update Workout Set Command
export interface UpdateWorkoutSetCommand {
  actual_reps?: number | null;
  actual_weight?: number | null;
  completed?: boolean;
  note?: string | null;
}
```

### 5.2. Nowe typy (ViewModel i Hook)

```typescript
// src/components/workouts/types.ts

/**
 * Stan dla useActiveWorkout hook
 */
export interface ActiveWorkoutState {
  workout: WorkoutDetailDTO;
  isLoading: boolean;
  error: string | null;
}

/**
 * Return type dla useActiveWorkout hook
 */
export interface UseActiveWorkoutReturn {
  workout: WorkoutDetailDTO;
  isLoading: boolean;
  error: string | null;
  updateSet: (setId: string, updates: UpdateWorkoutSetCommand) => Promise<void>;
  addSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  completeWorkout: () => Promise<void>;
  refreshWorkout: () => Promise<void>;
}

/**
 * Return type dla useWorkoutTimer hook
 */
export interface UseWorkoutTimerReturn {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * LocalStorage key dla workout state
 */
export const ACTIVE_WORKOUT_STORAGE_KEY = 'gym-track-active-workout';

/**
 * LocalStorage workout state structure
 */
export interface StoredWorkoutState {
  workoutId: string;
  lastUpdated: string;
  exercises: {
    exerciseId: string;
    sets: {
      setId: string;
      actual_reps: number | null;
      actual_weight: number | null;
      completed: boolean;
      note: string | null;
    }[];
  }[];
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** Supabase PostgreSQL

**Zapytanie:**
```typescript
// Pobranie aktywnego treningu użytkownika
const { data: activeWorkout, error } = await locals.supabase
  .from('workouts')
  .select(`
    id,
    plan_id,
    status,
    started_at,
    completed_at,
    created_at,
    plan:workout_plans!inner(name),
    exercises:workout_exercises(
      id,
      exercise_id,
      order_index,
      created_at,
      exercise:exercises!inner(
        id,
        name,
        image_path
      ),
      sets:workout_sets(
        id,
        planned_reps,
        planned_weight,
        actual_reps,
        actual_weight,
        completed,
        note,
        order_index,
        created_at
      )
    )
  `)
  .eq('status', 'active')
  .single();
```

**Transformacja danych:**
```typescript
const workoutData: WorkoutDetailDTO = {
  id: activeWorkout.id,
  plan_id: activeWorkout.plan_id,
  status: activeWorkout.status,
  started_at: activeWorkout.started_at,
  completed_at: activeWorkout.completed_at,
  created_at: activeWorkout.created_at,
  plan_name: activeWorkout.plan.name,
  exercises: activeWorkout.exercises
    .map(ex => ({
      id: ex.id,
      exercise_id: ex.exercise_id,
      order_index: ex.order_index,
      created_at: ex.created_at,
      exercise: {
        id: ex.exercise.id,
        name: ex.exercise.name,
        image_path: ex.exercise.image_path
      },
      sets: ex.sets
        .sort((a, b) => a.order_index - b.order_index)
        .map(set => ({
          id: set.id,
          planned_reps: set.planned_reps,
          planned_weight: set.planned_weight,
          actual_reps: set.actual_reps,
          actual_weight: set.actual_weight,
          completed: set.completed,
          note: set.note,
          order_index: set.order_index,
          created_at: set.created_at
        }))
    }))
    .sort((a, b) => a.order_index - b.order_index)
};
```

### 6.2. Stan client-side (React)

**Główny stan (useActiveWorkout hook):**
- `workout: WorkoutDetailDTO` - aktualne dane treningu
- `isLoading: boolean` - czy trwa operacja API
- `error: string | null` - komunikat błędu

**Stan lokalny w komponentach:**
- `SetItem`: Local state dla optimistic updates (reps, weight, note, completed)
- `ExerciseList`: Current exercise index (Focus Mode)
- `ExerciseAccordion`: Expanded state
- `ActiveWorkoutContainer`: Focus Mode toggle, dialog open/close

**Persystencja w localStorage:**
Zapis stanu po każdej zmianie serii:
```typescript
const saveToLocalStorage = (workout: WorkoutDetailDTO) => {
  const storedState: StoredWorkoutState = {
    workoutId: workout.id,
    lastUpdated: new Date().toISOString(),
    exercises: workout.exercises.map(ex => ({
      exerciseId: ex.id,
      sets: ex.sets.map(set => ({
        setId: set.id,
        actual_reps: set.actual_reps,
        actual_weight: set.actual_weight,
        completed: set.completed,
        note: set.note
      }))
    }))
  };

  localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(storedState));
};
```

**Odczyt z localStorage:**
```typescript
const loadFromLocalStorage = (workoutId: string): StoredWorkoutState | null => {
  const stored = localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
  if (!stored) return null;

  const state = JSON.parse(stored) as StoredWorkoutState;
  if (state.workoutId !== workoutId) return null;

  return state;
};
```

**Synchronizacja stanu:**
Po załadowaniu strony, jeśli istnieje stan w localStorage dla tego treningu:
1. Merge localStorage state z server state
2. localStorage ma pierwszeństwo dla `actual_*` pól i `completed`
3. Wyświetl toast info: "Przywrócono niezapisane zmiany"

## 7. Integracja API

### 7.1. Endpointy używane

#### GET /api/workouts/active

**Typ:** Read-only (SELECT)

**Autoryzacja:** Wymaga zalogowania, RLS filtruje po `user_id`

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "plan_name": "Push Day",
    "status": "active",
    "started_at": "2024-01-20T14:00:00Z",
    "exercises": [
      {
        "id": "uuid",
        "exercise_id": "uuid",
        "order_index": 0,
        "exercise": {
          "name": "Barbell Bench Press",
          "image_path": "/storage/exercises/bench-press.jpg"
        },
        "sets": [
          {
            "id": "uuid",
            "planned_reps": 10,
            "planned_weight": 80.0,
            "actual_reps": 10,
            "actual_weight": 80.0,
            "completed": true,
            "note": "Felt strong",
            "order_index": 0
          }
        ]
      }
    ]
  }
}
```

**Response (204 No Content):** Brak aktywnego treningu

---

#### PATCH /api/workout-sets/{id}

**Typ:** Update (PATCH)

**Autoryzacja:** Wymaga zalogowania, RLS filtruje po `user_id`

**Request Body:**
```json
{
  "actual_reps": 12,
  "actual_weight": 82.5,
  "completed": true,
  "note": "Increased weight slightly"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "planned_reps": 10,
    "planned_weight": 80.0,
    "actual_reps": 12,
    "actual_weight": 82.5,
    "completed": true,
    "note": "Increased weight slightly",
    "order_index": 0
  }
}
```

**Error (400 Bad Request):** Validation error lub workout not active

---

#### POST /api/workout-exercises/{workoutExerciseId}/sets

**Typ:** Create (POST)

**Autoryzacja:** Wymaga zalogowania, RLS filtruje po `user_id`

**Request Body:**
```json
{
  "planned_reps": 10,
  "planned_weight": 80.0,
  "actual_reps": 10,
  "actual_weight": 80.0,
  "completed": true,
  "note": "Extra set, felt good"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "workout_exercise_id": "uuid",
    "planned_reps": 10,
    "planned_weight": 80.0,
    "actual_reps": 10,
    "actual_weight": 80.0,
    "completed": true,
    "note": "Extra set, felt good",
    "order_index": 3
  }
}
```

**Error (400 Bad Request):** Validation error lub workout not active

---

#### POST /api/workouts/{id}/complete

**Typ:** Command (POST)

**Autoryzacja:** Wymaga zalogowania, RLS filtruje po `user_id`

**Request Body:** None

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "started_at": "2024-01-20T14:00:00Z",
    "completed_at": "2024-01-20T15:30:00Z",
    "stats": {
      "duration_minutes": 90,
      "total_exercises": 5,
      "total_sets": 15,
      "total_reps": 120,
      "max_weight": 100.0,
      "total_volume": 8500.0
    }
  }
}
```

**Error (400 Bad Request):** Workout not active

**Error (404 Not Found):** Workout does not exist

---

### 7.2. Obsługa błędów API

**Scenariusze błędów:**
1. **401 Unauthorized** - użytkownik niezalogowany → redirect `/auth/login`
2. **404 Not Found** - trening nie istnieje → redirect `/workout-plans` + toast error
3. **400 Bad Request** - błąd walidacji → toast error z detalami
4. **409 Conflict** - trening nie jest aktywny → toast error + refresh
5. **500 Internal Server Error** - błąd serwera → toast error + retry logic

**Implementacja obsługi:**
```typescript
const handleApiError = (error: any) => {
  if (error.status === 401) {
    window.location.href = '/auth/login';
    return;
  }

  if (error.status === 404) {
    toast.error('Trening nie został znaleziony');
    window.location.href = '/workout-plans';
    return;
  }

  if (error.status === 400) {
    const message = error.message || 'Nieprawidłowe dane';
    toast.error(message);
    return;
  }

  if (error.status === 409) {
    toast.error('Trening nie jest już aktywny');
    refreshWorkout();
    return;
  }

  // 500 lub inne
  toast.error('Wystąpił błąd. Spróbuj ponownie.');
};
```

## 8. Interakcje użytkownika

### 8.1. Wejście na stronę aktywnego treningu

**Akcja:** Użytkownik wchodzi na `/workouts/active`

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro wykonuje SSR i pobiera aktywny trening
3. Jeśli brak aktywnego treningu → redirect `/workout-plans` + toast
4. Jeśli istnieje → renderowanie strony z danymi
5. React container ładuje stan z localStorage (jeśli istnieje)
6. Merge localStorage state z server state
7. Rozpoczęcie stopera

**Oczekiwany wynik:**
- Widok aktywnego treningu z wszystkimi ćwiczeniami i seriami
- Stoper pokazuje upływający czas
- Pierwszy accordion expanded (domyślnie)
- Jeśli były niezapisane zmiany w localStorage → toast info

### 8.2. Oznaczenie serii jako wykonanej

**Akcja:** Użytkownik klika checkbox serii

**Przepływ:**
1. Toggle `completed` state lokalnie (optimistic update)
2. Wizualna zmiana (zielone tło, checkmark)
3. Wywołanie `PATCH /api/workout-sets/{id}` z `{ completed: true }`
4. W przypadku sukcesu → stan lokalny pozostaje
5. W przypadku błędu → rollback stanu + toast error

**Oczekiwany wynik:**
- Natychmiastowa wizualna zmiana (zielone tło)
- Smooth transition
- Serie completed są wizualnie odróżnione od uncompleted

### 8.3. Modyfikacja reps/weight

**Akcja:** Użytkownik zmienia wartość reps lub weight

**Przepływ:**
1. Zmiana wartości w local state (natychmiastowo)
2. Debounce 500ms
3. Po debounce → wywołanie `PATCH /api/workout-sets/{id}`
4. W przypadku sukcesu → zapis do localStorage
5. W przypadku błędu → toast error (stan lokalny pozostaje)

**Oczekiwany wynik:**
- Natychmiastowa zmiana wartości w UI
- Auto-save po 500ms bez kliknięcia "Zapisz"
- Loading indicator opcjonalnie (mały spinner)

### 8.4. Dodanie notatki do serii

**Akcja:** Użytkownik wpisuje tekst w textarea notatki

**Przepływ:**
1. Zmiana wartości w local state (natychmiastowo)
2. Debounce 1000ms (dłuższy dla tekstu)
3. Po debounce → wywołanie `PATCH /api/workout-sets/{id}` z `{ note: "..." }`
4. W przypadku sukcesu → zapis do localStorage
5. W przypadku błędu → toast error

**Oczekiwany wynik:**
- Natychmiastowa zmiana tekstu w textarea
- Licznik znaków aktualizuje się na bieżąco
- Auto-save po 1s od ostatniej zmiany

### 8.5. Dodanie dodatkowej serii

**Akcja:** Użytkownik klika "Dodaj serię"

**Przepływ:**
1. Przycisk wywołuje `onAddSet` z danymi z ostatniej serii
2. Wywołanie `POST /api/workout-exercises/{exerciseId}/sets`
3. W przypadku sukcesu:
   - Dodanie nowej serii do stanu
   - Scroll do nowej serii
   - Focus na input reps nowej serii
4. W przypadku błędu → toast error

**Oczekiwany wynik:**
- Nowa seria pojawia się na końcu listy
- Wartości reps/weight skopiowane z poprzedniej serii
- Automatyczny focus na nowej serii dla szybkiej edycji

### 8.6. Przejście do poprzedniego/następnego ćwiczenia (Focus Mode)

**Akcja:** Użytkownik klika "Poprzednie" lub "Następne" w Focus Mode

**Przepływ:**
1. Zmiana `currentExerciseIndex` w stanie lokalnym
2. Re-render z nowym ćwiczeniem
3. Scroll do top
4. Auto-expand accordiona nowego ćwiczenia

**Oczekiwany wynik:**
- Wyświetlenie tylko nowego ćwiczenia
- Smooth transition
- Progress indicator aktualizuje się ("Ćwiczenie 3/5")

### 8.7. Zakończenie treningu

**Akcja:** Użytkownik klika "Zakończ trening"

**Przepływ:**
1. Otwarcie `CompleteWorkoutDialog`
2. Użytkownik klika "Zakończ trening" w dialogu
3. Wywołanie `POST /api/workouts/{id}/complete`
4. W przypadku sukcesu:
   - Usunięcie stanu z localStorage
   - Przekierowanie do `/workouts/{id}/summary`
5. W przypadku błędu → toast error

**Oczekiwany wynik:**
- Modal potwierdzenia z ostrzeżeniem
- Po potwierdzeniu → loading state
- Przekierowanie do podsumowania z wyliczonymi statystykami

### 8.8. Przypadkowe zamknięcie karty/okna

**Akcja:** Użytkownik próbuje zamknąć kartę lub okno przeglądarki

**Przepływ:**
1. Event `beforeunload` przechwytuje akcję
2. Wyświetlenie natywnego dialogu przeglądarki z ostrzeżeniem
3. Użytkownik może anulować lub potwierdzić wyjście
4. Jeśli potwierdzi → stan pozostaje w localStorage
5. Po ponownym wejściu → odtworzenie stanu

**Oczekiwany wynik:**
- Ochrona przed przypadkową utratą postępu
- Stan zachowany w localStorage
- Możliwość kontynuacji po ponownym wejściu

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

---

### 9.2. Walidacja istnienia aktywnego treningu

**Komponent:** `active.astro`

**Warunek:** Musi istnieć workout ze statusem 'active' dla użytkownika

**Efekt niepowodzenia:**
- Przekierowanie do `/workout-plans`
- Toast info: "Brak aktywnego treningu. Rozpocznij nowy trening."

---

### 9.3. Walidacja danych serii (inputy)

**Komponent:** `SetInput.tsx`

**Warunki:**
- `actual_reps` > 0 jeśli podane
- `actual_weight` >= 0 jeśli podane
- Wartości muszą być liczbami

**Efekt niepowodzenia:**
- Input border czerwony
- Brak możliwości zapisu wartości poniżej minimum
- Przyciski -/+ disabled gdy limit osiągnięty

---

### 9.4. Walidacja notatki

**Komponent:** `SetNote.tsx`

**Warunek:** `note.length` <= 200 znaków

**Efekt niepowodzenia:**
- `maxLength` attribute blokuje wpisywanie powyżej limitu
- Licznik znaków czerwony gdy < 20 znaków pozostało
- Toast warning jeśli użytkownik próbuje przekroczyć limit

---

### 9.5. Walidacja przed zakończeniem treningu

**Komponent:** `ActiveWorkoutContainer.tsx` / `CompleteWorkoutDialog.tsx`

**Warunki opcjonalne (UX):**
- Opcjonalnie: sprawdź czy wszystkie serie są completed
- Jeśli nie wszystkie → dodatkowe ostrzeżenie w dialogu

**Implementacja:**
```typescript
const allSetsCompleted = workout.exercises.every(ex =>
  ex.sets.every(set => set.completed)
);

// W dialogu:
{!allSetsCompleted && (
  <p className="text-amber-600 text-sm mt-2">
    ⚠️ Uwaga: Nie wszystkie serie są oznaczone jako wykonane.
  </p>
)}
```

---

### 9.6. Walidacja stanu w localStorage

**Komponent:** `useActiveWorkout` hook

**Warunki:**
- `workoutId` w localStorage musi odpowiadać aktualnemu workout
- `lastUpdated` nie starszy niż 24h (opcjonalnie)

**Efekt niepowodzenia:**
- Ignorowanie stanu z localStorage
- Użycie wyłącznie server state

---

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik próbuje uzyskać dostęp bez zalogowania lub sesja wygasła

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu użytkownik wraca do `/workouts/active`

**Komunikat:** Toast info: "Zaloguj się, aby kontynuować trening"

---

### 10.2. Brak aktywnego treningu (404 / 204)

**Scenariusz:** Użytkownik wchodzi na `/workouts/active` ale nie ma aktywnego treningu

**Obsługa:**
```typescript
if (error || !activeWorkout) {
  return Astro.redirect('/workout-plans');
}
```

**Komunikat:** Toast info: "Brak aktywnego treningu. Rozpocznij nowy trening z listy planów."

---

### 10.3. Błąd aktualizacji serii (400 / 409)

**Scenariusz:** API zwraca błąd podczas `PATCH /api/workout-sets/{id}`

**Możliwe przyczyny:**
- Workout nie jest już aktywny (409)
- Błąd walidacji (400)
- Błąd sieciowy (500)

**Obsługa:**
```typescript
try {
  await updateSet(setId, updates);
} catch (error) {
  // Rollback optimistic update (opcjonalnie)
  // Wyświetl toast error
  toast.error('Nie udało się zapisać zmiany. Spróbuj ponownie.');

  // Jeśli 409 (conflict) - workout zakończony
  if (error.status === 409) {
    toast.error('Trening został zakończony przez inne urządzenie.');
    window.location.href = '/workouts/history';
  }
}
```

**Komunikat:**
- 400: "Nieprawidłowe dane. Sprawdź wartości."
- 409: "Trening nie jest już aktywny."
- 500: "Wystąpił błąd. Spróbuj ponownie."

---

### 10.4. Błąd dodawania serii (400 / 409)

**Scenariusz:** API zwraca błąd podczas `POST /api/workout-exercises/{id}/sets`

**Obsługa:**
```typescript
try {
  await addSet(exerciseId, setData);
  toast.success('Seria dodana');
} catch (error) {
  toast.error('Nie udało się dodać serii. Spróbuj ponownie.');
}
```

**Komunikat:** Toast error: "Nie udało się dodać serii. Spróbuj ponownie."

---

### 10.5. Błąd zakończenia treningu (400 / 404)

**Scenariusz:** API zwraca błąd podczas `POST /api/workouts/{id}/complete`

**Obsługa:**
```typescript
try {
  await completeWorkout();
  localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
  window.location.href = `/workouts/${workout.id}/summary`;
} catch (error) {
  toast.error('Nie udało się zakończyć treningu. Spróbuj ponownie.');
  setCompleteDialogOpen(false);
}
```

**Komunikat:** Toast error: "Nie udało się zakończyć treningu. Spróbuj ponownie."

---

### 10.6. Błąd sieciowy (offline)

**Scenariusz:** Brak połączenia z internetem podczas operacji API

**Obsługa:**
- Wszystkie zmiany pozostają w local state
- Zapis do localStorage
- Toast warning: "Brak połączenia. Zmiany zostaną zapisane gdy wrócisz online."
- Retry logic z exponential backoff (opcjonalnie)

**Implementacja retry:**
```typescript
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
};
```

---

### 10.7. Konflikt stanu (localStorage vs server)

**Scenariusz:** Stan w localStorage różni się od server state

**Obsługa:**
- Merge z priorytetem dla localStorage dla `actual_*` i `completed`
- Toast info: "Przywrócono niezapisane zmiany"
- Opcja "Odrzuć zmiany" (wyczyść localStorage)

**Implementacja:**
```typescript
const mergeStates = (serverWorkout: WorkoutDetailDTO, localState: StoredWorkoutState) => {
  return {
    ...serverWorkout,
    exercises: serverWorkout.exercises.map(ex => {
      const localEx = localState.exercises.find(e => e.exerciseId === ex.id);
      if (!localEx) return ex;

      return {
        ...ex,
        sets: ex.sets.map(set => {
          const localSet = localEx.sets.find(s => s.setId === set.id);
          if (!localSet) return set;

          return {
            ...set,
            actual_reps: localSet.actual_reps ?? set.actual_reps,
            actual_weight: localSet.actual_weight ?? set.actual_weight,
            completed: localSet.completed,
            note: localSet.note ?? set.note
          };
        })
      };
    })
  };
};
```

---

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików i katalogów

1.1. Utwórz katalogi komponentów:
```bash
mkdir -p src/components/workouts
mkdir -p src/components/hooks
```

1.2. Utwórz pliki komponentów:
```bash
# Główny kontener i komponenty top-level
touch src/components/workouts/ActiveWorkoutContainer.tsx
touch src/components/workouts/WorkoutHeader.tsx
touch src/components/workouts/WorkoutTimer.tsx
touch src/components/workouts/WorkoutControls.tsx
touch src/components/workouts/CompleteWorkoutDialog.tsx

# Komponenty dla ćwiczeń i serii
touch src/components/workouts/ExerciseList.tsx
touch src/components/workouts/ExerciseAccordion.tsx
touch src/components/workouts/ExerciseHeader.tsx
touch src/components/workouts/SetsList.tsx
touch src/components/workouts/SetItem.tsx
touch src/components/workouts/SetCheckbox.tsx
touch src/components/workouts/SetInput.tsx
touch src/components/workouts/SetNote.tsx
touch src/components/workouts/AddSetButton.tsx

# Typy
touch src/components/workouts/types.ts
```

1.3. Utwórz custom hooks:
```bash
touch src/components/hooks/useActiveWorkout.ts
touch src/components/hooks/useWorkoutTimer.ts
touch src/components/hooks/useBeforeUnload.ts
touch src/components/hooks/useLocalStorage.ts
touch src/components/hooks/useDebounce.ts
```

1.4. Utwórz plik strony Astro:
```bash
mkdir -p src/pages/workouts
touch src/pages/workouts/active.astro
```

---

### Krok 2: Implementacja custom hooks

2.1. **useDebounce.ts** (wykorzystywany przez inne hooki):

```typescript
import { useEffect, useState } from 'react';

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

---

2.2. **useWorkoutTimer.ts**:

```typescript
import { useState, useEffect } from 'react';
import type { UseWorkoutTimerReturn } from '@/components/workouts/types';

export function useWorkoutTimer(startedAt: string): UseWorkoutTimerReturn {
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    const startTime = new Date(startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTotalSeconds(elapsed);
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}
```

---

2.3. **useBeforeUnload.ts**:

```typescript
import { useEffect } from 'react';

export function useBeforeUnload(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome wymaga ustawienia returnValue
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);
}
```

---

2.4. **useLocalStorage.ts**:

```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}
```

---

2.5. **useActiveWorkout.ts** (główny hook zarządzający stanem):

```typescript
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from './useLocalStorage';
import type {
  WorkoutDetailDTO,
  WorkoutSetDTO,
  UpdateWorkoutSetCommand,
  CreateWorkoutSetCommand
} from '@/types';
import type {
  UseActiveWorkoutReturn,
  StoredWorkoutState,
  ACTIVE_WORKOUT_STORAGE_KEY
} from '@/components/workouts/types';

export function useActiveWorkout(
  initialWorkout: WorkoutDetailDTO
): UseActiveWorkoutReturn {
  const [workout, setWorkout] = useState<WorkoutDetailDTO>(initialWorkout);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localState, setLocalState, removeLocalState] = useLocalStorage<StoredWorkoutState | null>(
    ACTIVE_WORKOUT_STORAGE_KEY,
    null
  );

  // Merge localStorage state with initial workout (on mount)
  useEffect(() => {
    if (localState && localState.workoutId === initialWorkout.id) {
      const merged = mergeStates(initialWorkout, localState);
      setWorkout(merged);
      toast.info('Przywrócono niezapisane zmiany');
    }
  }, []);

  // Save to localStorage on workout change
  useEffect(() => {
    const state: StoredWorkoutState = {
      workoutId: workout.id,
      lastUpdated: new Date().toISOString(),
      exercises: workout.exercises.map(ex => ({
        exerciseId: ex.id,
        sets: ex.sets.map(set => ({
          setId: set.id,
          actual_reps: set.actual_reps,
          actual_weight: set.actual_weight,
          completed: set.completed,
          note: set.note
        }))
      }))
    };
    setLocalState(state);
  }, [workout]);

  const updateSet = useCallback(
    async (setId: string, updates: UpdateWorkoutSetCommand) => {
      // Optimistic update
      setWorkout(prev => ({
        ...prev,
        exercises: prev.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(set =>
            set.id === setId ? { ...set, ...updates } : set
          )
        }))
      }));

      try {
        const response = await fetch(`/api/workout-sets/${setId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          throw new Error('Failed to update set');
        }

        const { data } = await response.json();

        // Update with server response (success)
        setWorkout(prev => ({
          ...prev,
          exercises: prev.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(set =>
              set.id === setId ? data : set
            )
          }))
        }));
      } catch (err) {
        // Rollback on error (or keep optimistic update with error toast)
        toast.error('Nie udało się zapisać zmiany');
        setError('Błąd podczas aktualizacji serii');
      }
    },
    [workout]
  );

  const addSet = useCallback(
    async (exerciseId: string, setData: CreateWorkoutSetCommand) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/workout-exercises/${exerciseId}/sets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setData)
        });

        if (!response.ok) {
          throw new Error('Failed to add set');
        }

        const { data } = await response.json();

        setWorkout(prev => ({
          ...prev,
          exercises: prev.exercises.map(ex =>
            ex.id === exerciseId
              ? { ...ex, sets: [...ex.sets, data] }
              : ex
          )
        }));

        toast.success('Seria dodana');
      } catch (err) {
        toast.error('Nie udało się dodać serii');
        setError('Błąd podczas dodawania serii');
      } finally {
        setIsLoading(false);
      }
    },
    [workout]
  );

  const completeWorkout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workouts/${workout.id}/complete`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to complete workout');
      }

      removeLocalState();
      toast.success('Trening zakończony!');
    } catch (err) {
      toast.error('Nie udało się zakończyć treningu');
      setError('Błąd podczas kończenia treningu');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [workout, removeLocalState]);

  const refreshWorkout = useCallback(async () => {
    // Refresh workout data from server
    try {
      const response = await fetch('/api/workouts/active');
      if (!response.ok) throw new Error('Failed to refresh');

      const { data } = await response.json();
      setWorkout(data);
    } catch (err) {
      toast.error('Nie udało się odświeżyć danych');
    }
  }, []);

  return {
    workout,
    isLoading,
    error,
    updateSet,
    addSet,
    completeWorkout,
    refreshWorkout
  };
}

// Helper function to merge states
function mergeStates(
  serverWorkout: WorkoutDetailDTO,
  localState: StoredWorkoutState
): WorkoutDetailDTO {
  return {
    ...serverWorkout,
    exercises: serverWorkout.exercises.map(ex => {
      const localEx = localState.exercises.find(e => e.exerciseId === ex.id);
      if (!localEx) return ex;

      return {
        ...ex,
        sets: ex.sets.map(set => {
          const localSet = localEx.sets.find(s => s.setId === set.id);
          if (!localSet) return set;

          return {
            ...set,
            actual_reps: localSet.actual_reps ?? set.actual_reps,
            actual_weight: localSet.actual_weight ?? set.actual_weight,
            completed: localSet.completed,
            note: localSet.note ?? set.note
          };
        })
      };
    })
  };
}
```

---

### Krok 3: Implementacja komponentów atomowych (SetCheckbox, SetInput, SetNote)

(Kod jak w sekcji 4.9, 4.10, 4.11)

---

### Krok 4: Implementacja SetItem

(Kod jak w sekcji 4.8)

---

### Krok 5: Implementacja SetsList i AddSetButton

5.1. **SetsList.tsx**:

```typescript
import { SetItem } from './SetItem';
import type { WorkoutSetDTO, UpdateWorkoutSetCommand } from '@/types';

interface SetsListProps {
  sets: WorkoutSetDTO[];
  onUpdateSet: (setId: string, updates: UpdateWorkoutSetCommand) => Promise<void>;
  isLoading: boolean;
}

export function SetsList({ sets, onUpdateSet, isLoading }: SetsListProps) {
  return (
    <div className="space-y-3 mt-4">
      {sets.map((set, index) => (
        <SetItem
          key={set.id}
          set={set}
          setNumber={index + 1}
          onUpdate={onUpdateSet}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
```

(AddSetButton kod jak w sekcji 4.12)

---

### Krok 6: Implementacja ExerciseHeader i ExerciseAccordion

6.1. **ExerciseHeader.tsx**:

```tsx
interface ExerciseHeaderProps {
  name: string;
  imagePath: string | null;
  completedSets: number;
  totalSets: number;
}

export function ExerciseHeader({
  name,
  imagePath,
  completedSets,
  totalSets
}: ExerciseHeaderProps) {
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="flex items-center gap-3 flex-1">
      {imagePath && (
        <img
          src={imagePath}
          alt={name}
          className="w-12 h-12 rounded-lg object-cover"
        />
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-neutral-900 truncate">{name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-neutral-600 font-medium whitespace-nowrap">
            {completedSets}/{totalSets}
          </span>
        </div>
      </div>
    </div>
  );
}
```

(ExerciseAccordion kod jak w sekcji 4.7)

---

### Krok 7: Implementacja ExerciseList

(Kod jak w sekcji 4.6)

---

### Krok 8: Implementacja WorkoutTimer, WorkoutHeader, WorkoutControls

(Kod jak w sekcjach 4.4, 4.3, 4.5)

---

### Krok 9: Implementacja CompleteWorkoutDialog

(Kod jak w sekcji 4.13)

---

### Krok 10: Implementacja ActiveWorkoutContainer

(Kod jak w sekcji 4.2)

---

### Krok 11: Implementacja strony active.astro

(Kod jak w sekcji 4.1)

---

### Krok 12: Dodanie typów (types.ts)

```typescript
// src/components/workouts/types.ts

import type { WorkoutDetailDTO, UpdateWorkoutSetCommand, CreateWorkoutSetCommand } from '@/types';

export interface ActiveWorkoutState {
  workout: WorkoutDetailDTO;
  isLoading: boolean;
  error: string | null;
}

export interface UseActiveWorkoutReturn {
  workout: WorkoutDetailDTO;
  isLoading: boolean;
  error: string | null;
  updateSet: (setId: string, updates: UpdateWorkoutSetCommand) => Promise<void>;
  addSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  completeWorkout: () => Promise<void>;
  refreshWorkout: () => Promise<void>;
}

export interface UseWorkoutTimerReturn {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export const ACTIVE_WORKOUT_STORAGE_KEY = 'gym-track-active-workout';

export interface StoredWorkoutState {
  workoutId: string;
  lastUpdated: string;
  exercises: {
    exerciseId: string;
    sets: {
      setId: string;
      actual_reps: number | null;
      actual_weight: number | null;
      completed: boolean;
      note: string | null;
    }[];
  }[];
}
```

---

### Krok 13: Testowanie

13.1. **Test manualny - Happy path:**
- Zaloguj się do aplikacji
- Rozpocznij trening z planu (z widoku workout-plans)
- Sprawdź czy przekierowuje do `/workouts/active`
- Sprawdź czy stoper działa
- Oznacz kilka serii jako wykonane (checkbox)
- Zmodyfikuj reps i weight kilku serii
- Dodaj notatkę do serii
- Dodaj dodatkową serię do ćwiczenia
- Przetestuj Focus Mode (przełączenie)
- Zakończ trening i sprawdź przekierowanie do summary

13.2. **Test optimistic updates:**
- Oznacz serię jako wykonaną
- Sprawdź czy zmiana jest natychmiastowa (bez opóźnienia)
- Zmodyfikuj weight/reps
- Sprawdź czy wartość zmienia się natychmiastowo
- Odłącz internet
- Wprowadź zmiany
- Sprawdź czy zapisują się do localStorage
- Przywróć internet
- Odśwież stronę
- Sprawdź czy zmiany są przywrócone

13.3. **Test beforeunload:**
- Rozpocznij trening
- Wprowadź kilka zmian
- Spróbuj zamknąć kartę/okno
- Sprawdź czy pojawia się ostrzeżenie przeglądarki

13.4. **Test błędów:**
- Symuluj błąd API (dev tools → Network → Offline)
- Sprawdź czy toast error jest wyświetlany
- Sprawdź czy optimistic updates pozostają w UI

13.5. **Test responsywności:**
- Otwórz DevTools (mobile viewport)
- Sprawdź czy accordion działa poprawnie
- Sprawdź czy checkboxy mają 44x44px (inspect element)
- Sprawdź czy inputy są touch-friendly
- Sprawdź czy Focus Mode działa na mobile

13.6. **Test Focus Mode:**
- Przełącz Focus Mode
- Sprawdź czy wyświetla się tylko jedno ćwiczenie
- Sprawdź nawigację Poprzednie/Następne
- Sprawdź czy progress indicator się aktualizuje

---

### Krok 14: Optymalizacja i dostępność

14.1. **Dodaj ARIA attributes:**
```tsx
// SetCheckbox
<button
  type="button"
  aria-label={checked ? 'Oznacz jako niewykonaną' : 'Oznacz jako wykonaną'}
  aria-pressed={checked}
>

// ExerciseAccordion
<button
  aria-expanded={expanded}
  aria-controls={`exercise-${exercise.id}`}
>

<div id={`exercise-${exercise.id}`} aria-hidden={!expanded}>
```

14.2. **Dodaj focus states:**
```css
/* Globalne style lub Tailwind classes */
.focus-visible:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

14.3. **Optymalizuj re-renders:**
- Wrap `SetItem` w `React.memo()` jeśli potrzebne
- Użyj `useCallback` dla event handlerów przekazywanych jako props
- Użyj `useMemo` dla expensive calculations

---

### Krok 15: Dokumentacja i code review

15.1. **Dodaj komentarze JSDoc:**
```tsx
/**
 * Główny kontener widoku aktywnego treningu.
 * Zarządza stanem treningu, obsługuje optimistic updates,
 * persystencję w localStorage oraz ochronę przed zamknięciem.
 *
 * @param {ActiveWorkoutContainerProps} props - Props zawierające początkowe dane treningu
 * @returns {JSX.Element} Renderowany widok aktywnego treningu
 */
export function ActiveWorkoutContainer({ initialWorkout }: ActiveWorkoutContainerProps) {
  // ...
}
```

15.2. **Sprawdź zgodność z wytycznymi projektu (CLAUDE.md)**

15.3. **Uruchom linter i formatter:**
```bash
npm run lint:fix
npm run format
```

15.4. **Commit zmian:**
```bash
git add .
git commit -m "feat: implement active workout view with optimistic updates and localStorage persistence

- Add ActiveWorkoutContainer with useActiveWorkout hook
- Implement WorkoutTimer with real-time countdown
- Add SetItem with inline editing and debounced auto-save
- Implement optimistic updates for smooth UX
- Add localStorage persistence for workout state
- Implement beforeunload protection
- Add Focus Mode for minimalist view
- Add CompleteWorkoutDialog for confirmation
- Implement responsive accordion for exercises on mobile
- Add 44x44px touch targets for checkboxes
- Integrate with PATCH /api/workout-sets/{id} and POST /api/workout-exercises/{exerciseId}/sets endpoints

Resolves US-022, US-023, US-024, US-025, US-026, US-027, US-030"
```

---

### Krok 16: Integracja z pipeline CI/CD

16.1. **Sprawdź czy testy przechodzą** (jeśli są napisane)

16.2. **Deploy do środowiska testowego**

16.3. **Przeprowadź smoke testing** na production-like environment

16.4. **Merge do głównej gałęzi po akceptacji**

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-022, US-023, US-024, US-025, US-026, US-027, US-030

✅ **Kluczowe funkcje:**
- Stoper treningu działający w czasie rzeczywistym
- Optimistic updates dla płynnego UX
- Debounced auto-save (500ms dla liczb, 1000ms dla tekstu)
- Persystencja stanu w localStorage
- Ochrona przed przypadkowym zamknięciem (`beforeunload`)
- Duże cele dotykowe 44x44px dla checkboxów
- Accordion na mobile dla czytelności
- Focus Mode dla minimalistycznego widoku
- Dodawanie dodatkowych serii podczas treningu
- Notatki per seria (max 200 znaków)

✅ **Responsywność:** Mobile-first design, accordion na mobile, touch-friendly UI

✅ **Dostępność:** ARIA attributes, semantic HTML, focus states, keyboard navigation

✅ **Wydajność:**
- SSR dla początkowego ładowania
- Optimistic updates
- Debounced API calls
- LocalStorage dla offline persistence

✅ **Obsługa błędów:**
- Walidacja autoryzacji
- Walidacja istnienia aktywnego treningu
- Obsługa błędów API (401, 404, 400, 409, 500)
- Retry logic dla błędów sieciowych
- Rollback optimistic updates w przypadku błędu
- Merge localStorage state z server state

✅ **Type safety:** TypeScript w całym kodzie, typy z `src/types.ts`

✅ **Code quality:** ESLint, Prettier, JSDoc, zgodność z CLAUDE.md

✅ **UX:**
- Smooth transitions
- Natychmiastowy feedback wizualny
- Auto-save bez konieczności klikania "Zapisz"
- Progress indicators (timer, completed sets)
- Clear communication (toasts, dialogs)

Implementacja powinna zająć **8-12 godzin** doświadczonemu programiście fullstack, uwzględniając:
- 2-3h: Custom hooks (useActiveWorkout, useWorkoutTimer, etc.)
- 3-4h: Komponenty atomowe (SetItem, SetCheckbox, SetInput, SetNote, etc.)
- 2-3h: Komponenty kontenerowe (ExerciseList, ExerciseAccordion, ActiveWorkoutContainer)
- 1-2h: Strona Astro (SSR) i integracja
- 1-2h: Testowanie, dokumentacja, code review
