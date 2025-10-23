# Plan implementacji widoku tworzenia planu treningowego (Multi-step)

## 1. Przegląd

Widok tworzenia planu treningowego umożliwia użytkownikom stworzenie nowego planu treningowego poprzez intuicyjny, wieloetapowy formularz (wizard). Proces podzielony jest na 3 kroki:
1. **Krok 1:** Wprowadzenie nazwy i opisu planu
2. **Krok 2:** Dodawanie i uszeregowanie ćwiczeń z bazy
3. **Krok 3:** Definiowanie serii (powtórzenia, ciężar) dla każdego ćwiczenia

Widok realizuje historyjki użytkownika US-012 (tworzenie planu), US-013 (dodawanie ćwiczeń), US-015 (dodawanie serii), US-014 (zmiana kolejności ćwiczeń). Wykorzystuje multi-step wizard pattern z persystencją stanu między krokami, walidacją na każdym etapie oraz integracją z wieloma endpointami API.

## 2. Routing widoku

**Ścieżka:** `/workout-plans/new`

**Sub-routes (opcjonalne):**
- `/workout-plans/new/step-1` - Nazwa i opis
- `/workout-plans/new/step-2` - Wybór ćwiczeń
- `/workout-plans/new/step-3` - Definiowanie serii

**Typ renderowania:** Hybrid - Astro SSR dla głównej strony + React dla interaktywnego wizarda

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

**Edycja planu:** `/workout-plans/[id]/edit` - wykorzystuje te same komponenty z pre-wypełnionymi danymi

## 3. Struktura komponentów

```
src/pages/workout-plans/new.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/workout-plans/
    ├── CreateWorkoutPlanWizard.tsx (React - główny kontener wizarda)
    │   ├── Stepper.tsx (React - wskaźnik kroków)
    │   ├── Step1BasicInfo.tsx (React - Krok 1: Nazwa i opis)
    │   ├── Step2SelectExercises.tsx (React - Krok 2: Wybór ćwiczeń)
    │   │   ├── ExerciseSelector.tsx (React - Interfejs wyboru ćwiczeń)
    │   │   │   ├── ExerciseSearchBar.tsx (React - Wyszukiwanie)
    │   │   │   ├── ExerciseFilters.tsx (React - Filtry: kategoria, trudność)
    │   │   │   └── ExerciseCard.tsx (React - Karta ćwiczenia do wyboru)
    │   │   └── SelectedExercisesList.tsx (React - Lista wybranych ćwiczeń)
    │   │       └── SelectedExerciseItem.tsx (React - Element z drag-and-drop)
    │   └── Step3DefineSets.tsx (React - Krok 3: Definiowanie serii)
    │       └── ExerciseSetsEditor.tsx (React - Edytor serii dla ćwiczenia)
    │           └── SetInputRow.tsx (React - Wiersz z powtórzeniami i ciężarem)
    ├── hooks/
    │   ├── useWorkoutPlanWizard.ts (Custom hook - zarządzanie stanem wizarda)
    │   ├── useExerciseSelection.ts (Custom hook - logika wyboru ćwiczeń)
    │   └── usePlanExerciseSets.ts (Custom hook - zarządzanie seriami)
    └── types.ts (TypeScript types dla wizarda)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR dla initial load i pobrania danych ćwiczeń
- `CreateWorkoutPlanWizard` jako React component - zarządza stanem całego wizarda i nawigacją między krokami
- `Stepper` jako React component - wizualna reprezentacja postępu
- Każdy krok jako osobny React component - izolacja logiki i możliwość reużycia
- Custom hooks - separacja logiki biznesowej od UI
- Drag-and-drop dla zmiany kolejności ćwiczeń (US-014)

## 4. Szczegóły komponentów

### 4.1. new.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku
- Pobranie listy ćwiczeń z bazy (potrzebne w kroku 2)
- Walidację autoryzacji użytkownika
- Inicjalizację wizarda z pustym stanem (lub pre-wypełnionym dla edycji)
- Przekazanie danych do `CreateWorkoutPlanWizard`

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Wywołanie Supabase client dla pobrania ćwiczeń i kategorii
- Sekcja `<main>` z kontenerem na wizard
- Przekazanie danych przez props do `CreateWorkoutPlanWizard`

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- Zapytanie do bazy musi się powieść
- Ćwiczenia muszą istnieć w bazie (minimum 50 w MVP)

**Typy:**
- `ExerciseListItemDTO[]` - lista ćwiczeń z kategorią
- `CategoryDTO[]` - lista kategorii dla filtrów
- `SupabaseClient` - klient Supabase z kontekstu

**Propsy:**
Brak (główna strona Astro)

**Przykład implementacji:**
```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { CreateWorkoutPlanWizard } from '@/components/workout-plans/CreateWorkoutPlanWizard';

if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Pobierz ćwiczenia z kategoriami
const { data: exercises, error: exercisesError } = await Astro.locals.supabase
  .from('exercises')
  .select(`
    id,
    name,
    description,
    image_path,
    image_alt,
    difficulty,
    category:categories(id, name, slug)
  `)
  .order('name');

// Pobierz kategorie dla filtrów
const { data: categories, error: categoriesError } = await Astro.locals.supabase
  .from('categories')
  .select('*')
  .order('order_index');

if (exercisesError || categoriesError) {
  console.error('Error fetching data:', exercisesError || categoriesError);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20danych');
}
---

<MainLayout title="Tworzenie planu treningowego - Gym Track">
  <main class="container mx-auto px-4 py-8 max-w-5xl">
    <CreateWorkoutPlanWizard
      exercises={exercises || []}
      categories={categories || []}
      client:load
    />
  </main>
</MainLayout>
```

---

### 4.2. CreateWorkoutPlanWizard.tsx

**Opis komponentu:**
Główny kontener wizarda zarządzający:
- Stanem całego formularza (wszystkie 3 kroki)
- Nawigacją między krokami
- Walidacją na każdym etapie
- Zapisywaniem stanu do localStorage (persystencja)
- Komunikacją z API (tworzenie planu, dodawanie ćwiczeń, dodawanie serii)
- Obsługą błędów i komunikatów toast

**Główne elementy:**
- `Stepper` - wskaźnik postępu
- Renderowanie warunkowe aktualnego kroku
- Przyciski nawigacji: "Wstecz", "Dalej", "Utwórz plan"
- Loading states podczas zapisywania
- Error states z komunikatami

**Obsługiwane zdarzenia:**
- `onNext()` - przejście do następnego kroku z walidacją
- `onPrevious()` - powrót do poprzedniego kroku
- `onSubmit()` - finalne utworzenie planu (krok 3)
- `onSaveToLocalStorage()` - zapis stanu przy każdej zmianie
- `beforeunload` - ostrzeżenie przed opuszczeniem strony

**Warunki walidacji:**
- **Krok 1:** Nazwa min. 3 znaki (wymagane), opis max 500 znaków (opcjonalne)
- **Krok 2:** Co najmniej 1 ćwiczenie wybrane
- **Krok 3:** Każde ćwiczenie ma co najmniej 1 serię, każda seria ma powtórzenia > 0

**Typy:**
```typescript
interface WizardState {
  step: 1 | 2 | 3;
  planName: string;
  planDescription: string | null;
  selectedExercises: SelectedExercise[];
  planId: string | null; // Po utworzeniu planu w kroku 1
}

interface SelectedExercise {
  exerciseId: string;
  exercise: ExerciseListItemDTO;
  orderIndex: number;
  planExerciseId: string | null; // Po dodaniu do planu
  sets: PlanSet[];
}

interface PlanSet {
  reps: number;
  weight: number | null;
  orderIndex: number;
  id: string | null; // Po zapisaniu w API
}
```

**Propsy:**
```typescript
interface CreateWorkoutPlanWizardProps {
  exercises: ExerciseListItemDTO[];
  categories: CategoryDTO[];
  editMode?: boolean;
  existingPlanId?: string;
}
```

**Przykład implementacji (szkielet):**
```tsx
export function CreateWorkoutPlanWizard({
  exercises,
  categories,
  editMode = false,
  existingPlanId
}: CreateWorkoutPlanWizardProps) {
  const {
    state,
    currentStep,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    updateBasicInfo,
    addExercise,
    removeExercise,
    reorderExercises,
    updateExerciseSets,
    submitPlan,
    isLoading,
    error
  } = useWorkoutPlanWizard({ exercises, categories, editMode, existingPlanId });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <Stepper currentStep={currentStep} totalSteps={3} />

      {currentStep === 1 && (
        <Step1BasicInfo
          name={state.planName}
          description={state.planDescription}
          onChange={updateBasicInfo}
        />
      )}

      {currentStep === 2 && (
        <Step2SelectExercises
          exercises={exercises}
          categories={categories}
          selectedExercises={state.selectedExercises}
          onAdd={addExercise}
          onRemove={removeExercise}
          onReorder={reorderExercises}
        />
      )}

      {currentStep === 3 && (
        <Step3DefineSets
          selectedExercises={state.selectedExercises}
          onUpdateSets={updateExerciseSets}
        />
      )}

      {/* Nawigacja */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={goPrevious}
          disabled={!canGoPrevious || isLoading}
        >
          Wstecz
        </Button>

        {currentStep < 3 ? (
          <Button onClick={goNext} disabled={!canGoNext || isLoading}>
            Dalej
          </Button>
        ) : (
          <Button onClick={submitPlan} disabled={!canGoNext || isLoading}>
            {isLoading ? 'Tworzenie planu...' : 'Utwórz plan'}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          {error}
        </Alert>
      )}
    </div>
  );
}
```

---

### 4.3. Stepper.tsx

**Opis komponentu:**
Wizualny wskaźnik postępu wizarda wyświetlający:
- Numery kroków (1, 2, 3)
- Nazwy kroków
- Status: ukończony, aktywny, nieaktywny
- Połączenia między krokami (linie)

**Główne elementy:**
- Lista kroków z numeracją
- Ikony statusu (checkmark dla ukończonych)
- Linie łączące kroki
- Responsywny układ (vertical na mobile, horizontal na desktop)

**Obsługiwane zdarzenia:**
- Brak (komponent prezentacyjny)

**Warunki walidacji:**
- `currentStep` musi być w zakresie 1-3
- `totalSteps` musi być równe 3

**Typy:**
```typescript
interface StepperProps {
  currentStep: 1 | 2 | 3;
  totalSteps: 3;
}
```

**Przykład implementacji:**
```tsx
export function Stepper({ currentStep, totalSteps }: StepperProps) {
  const steps = [
    { number: 1, label: 'Nazwa i opis' },
    { number: 2, label: 'Wybór ćwiczeń' },
    { number: 3, label: 'Definiowanie serii' }
  ];

  return (
    <nav aria-label="Postęp tworzenia planu" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li key={step.number} className="flex-1 relative">
            <div className={cn(
              "flex items-center",
              index < steps.length - 1 && "after:content-[''] after:w-full after:h-1 after:border-b after:border-neutral-200 after:inline-block after:ml-4"
            )}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                  step.number < currentStep && "bg-green-500 text-white",
                  step.number === currentStep && "bg-blue-600 text-white",
                  step.number > currentStep && "bg-neutral-200 text-neutral-600"
                )}>
                  {step.number < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={cn(
                  "mt-2 text-sm font-medium",
                  step.number === currentStep ? "text-blue-600" : "text-neutral-600"
                )}>
                  {step.label}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

---

### 4.4. Step1BasicInfo.tsx

**Opis komponentu:**
Pierwszy krok wizarda - formularz z polami:
- Nazwa planu (wymagane, min. 3 znaki)
- Opis planu (opcjonalne, max 500 znaków)

Walidacja w czasie rzeczywistym z komunikatami błędów.

**Główne elementy:**
- `Input` dla nazwy
- `Textarea` dla opisu
- Licznik znaków dla opisu (X/500)
- Komunikaty walidacji pod polami
- Label z gwiazdką (*) dla wymaganego pola

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja stanu w parent component
- `onBlur` - walidacja po opuszczeniu pola

**Warunki walidacji:**
- Nazwa: wymagane, min. 3 znaki, max 100 znaków
- Opis: opcjonalne, max 500 znaków

**Typy:**
```typescript
interface Step1BasicInfoProps {
  name: string;
  description: string | null;
  onChange: (name: string, description: string | null) => void;
}
```

**Przykład implementacji:**
```tsx
export function Step1BasicInfo({ name, description, onChange }: Step1BasicInfoProps) {
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const validateName = (value: string) => {
    if (value.length < 3) {
      return 'Nazwa musi mieć co najmniej 3 znaki';
    }
    if (value.length > 100) {
      return 'Nazwa może mieć maksymalnie 100 znaków';
    }
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onChange(newName, description);

    const error = validateName(newName);
    setErrors(prev => ({ ...prev, name: error || undefined }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDesc = e.target.value;
    if (newDesc.length <= 500) {
      onChange(name, newDesc || null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="plan-name">
          Nazwa planu <span className="text-red-500">*</span>
        </Label>
        <Input
          id="plan-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="np. Push Day, Full Body Workout"
          className={cn(errors.name && "border-red-500")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-red-500 mt-1">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="plan-description">Opis planu (opcjonalnie)</Label>
        <Textarea
          id="plan-description"
          value={description || ''}
          onChange={handleDescriptionChange}
          placeholder="Krótki opis planu treningowego..."
          rows={4}
          maxLength={500}
        />
        <p className="text-sm text-neutral-500 mt-1 text-right">
          {description?.length || 0}/500
        </p>
      </div>
    </div>
  );
}
```

---

### 4.5. Step2SelectExercises.tsx

**Opis komponentu:**
Drugi krok wizarda - interfejs wyboru ćwiczeń składający się z:
- `ExerciseSelector` - wyszukiwanie i filtrowanie ćwiczeń z bazy
- `SelectedExercisesList` - lista wybranych ćwiczeń z możliwością zmiany kolejności i usunięcia

**Główne elementy:**
- Grid 2 kolumny (desktop) lub stack (mobile)
- Lewy panel: `ExerciseSelector`
- Prawy panel: `SelectedExercisesList`
- Licznik wybranych ćwiczeń
- Komunikat walidacji (minimum 1 ćwiczenie)

**Obsługiwane zdarzenia:**
- `onAdd` - dodanie ćwiczenia do listy
- `onRemove` - usunięcie ćwiczenia z listy
- `onReorder` - zmiana kolejności (drag-and-drop)

**Warunki walidacji:**
- Co najmniej 1 ćwiczenie musi być wybrane
- To samo ćwiczenie może być dodane wielokrotnie (różne warianty)

**Typy:**
```typescript
interface Step2SelectExercisesProps {
  exercises: ExerciseListItemDTO[];
  categories: CategoryDTO[];
  selectedExercises: SelectedExercise[];
  onAdd: (exerciseId: string) => void;
  onRemove: (index: number) => void;
  onReorder: (newOrder: SelectedExercise[]) => void;
}
```

**Przykład implementacji:**
```tsx
export function Step2SelectExercises({
  exercises,
  categories,
  selectedExercises,
  onAdd,
  onRemove,
  onReorder
}: Step2SelectExercisesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel wyboru ćwiczeń */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dostępne ćwiczenia</h3>
        <ExerciseSelector
          exercises={exercises}
          categories={categories}
          selectedExerciseIds={selectedExercises.map(e => e.exerciseId)}
          onSelect={onAdd}
        />
      </div>

      {/* Panel wybranych ćwiczeń */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Wybrane ćwiczenia ({selectedExercises.length})
        </h3>
        {selectedExercises.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Wybierz co najmniej jedno ćwiczenie z lewego panelu.
            </AlertDescription>
          </Alert>
        ) : (
          <SelectedExercisesList
            exercises={selectedExercises}
            onRemove={onRemove}
            onReorder={onReorder}
          />
        )}
      </div>
    </div>
  );
}
```

---

### 4.6. ExerciseSelector.tsx

**Opis komponentu:**
Interfejs wyboru ćwiczeń z funkcjami:
- Wyszukiwanie po nazwie (live search)
- Filtrowanie po kategorii
- Filtrowanie po poziomie trudności
- Lista wyników w formie kart
- Oznaczenie już wybranych ćwiczeń

**Główne elementy:**
- `ExerciseSearchBar` - pole wyszukiwania
- `ExerciseFilters` - dropdown kategorii, checkboxy trudności
- Grid z kartami `ExerciseCard`
- Empty state gdy brak wyników
- Loading state podczas filtrowania

**Obsługiwane zdarzenia:**
- `onSearch` - wyszukiwanie w czasie rzeczywistym (debounce)
- `onFilterCategory` - zmiana filtru kategorii
- `onFilterDifficulty` - zmiana filtru trudności
- `onSelect` - kliknięcie na ćwiczenie (dodanie do planu)

**Warunki walidacji:**
- Brak (komponent prezentacyjny z logiką filtrowania)

**Typy:**
```typescript
interface ExerciseSelectorProps {
  exercises: ExerciseListItemDTO[];
  categories: CategoryDTO[];
  selectedExerciseIds: string[];
  onSelect: (exerciseId: string) => void;
}
```

**Przykład implementacji:**
```tsx
export function ExerciseSelector({
  exercises,
  categories,
  selectedExerciseIds,
  onSelect
}: ExerciseSelectorProps) {
  const {
    filteredExercises,
    searchQuery,
    selectedCategory,
    selectedDifficulties,
    setSearchQuery,
    setSelectedCategory,
    toggleDifficulty
  } = useExerciseSelection(exercises);

  return (
    <div className="space-y-4">
      <ExerciseSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <ExerciseFilters
        categories={categories}
        selectedCategory={selectedCategory}
        selectedDifficulties={selectedDifficulties}
        onCategoryChange={setSelectedCategory}
        onDifficultyToggle={toggleDifficulty}
      />

      <div className="max-h-[500px] overflow-y-auto space-y-2">
        {filteredExercises.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">
            Nie znaleziono ćwiczeń
          </p>
        ) : (
          filteredExercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isSelected={selectedExerciseIds.includes(exercise.id)}
              onSelect={() => onSelect(exercise.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

---

### 4.7. SelectedExercisesList.tsx

**Opis komponentu:**
Lista wybranych ćwiczeń z funkcjami:
- Drag-and-drop do zmiany kolejności (US-014)
- Przycisk usunięcia ćwiczenia
- Wizualna numeracja (1, 2, 3...)
- Responsywny układ

**Główne elementy:**
- Lista z komponentami `SelectedExerciseItem`
- Drag handles (ikona gripu)
- Przyciski usuwania
- Animacje podczas przesuwania

**Obsługiwane zdarzenia:**
- `onDragEnd` - zmiana kolejności
- `onRemove` - usunięcie ćwiczenia

**Warunki walidacji:**
- `exercises` nie może być pustą tablicą

**Typy:**
```typescript
interface SelectedExercisesListProps {
  exercises: SelectedExercise[];
  onRemove: (index: number) => void;
  onReorder: (newOrder: SelectedExercise[]) => void;
}
```

**Przykład implementacji (z @dnd-kit/core):**
```tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function SelectedExercisesList({
  exercises,
  onRemove,
  onReorder
}: SelectedExercisesListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex(e => e.exerciseId === active.id);
      const newIndex = exercises.findIndex(e => e.exerciseId === over.id);
      const reordered = arrayMove(exercises, oldIndex, newIndex).map((e, idx) => ({
        ...e,
        orderIndex: idx
      }));
      onReorder(reordered);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={exercises.map(e => e.exerciseId)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {exercises.map((exercise, index) => (
            <SelectedExerciseItem
              key={exercise.exerciseId}
              exercise={exercise}
              index={index}
              onRemove={() => onRemove(index)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
```

---

### 4.8. SelectedExerciseItem.tsx

**Opis komponentu:**
Pojedynczy element listy wybranych ćwiczeń z:
- Numerem kolejności
- Nazwą ćwiczenia
- Kategorią
- Gripem do drag-and-drop
- Przyciskiem usunięcia

**Główne elementy:**
- Drag handle (ikona `GripVertical`)
- Numer ćwiczenia
- Obrazek ćwiczenia (thumbnail)
- Nazwa i kategoria
- Przycisk `X` (usuwanie)

**Obsługiwane zdarzenia:**
- Drag events (obsługiwane przez @dnd-kit)
- `onRemove` - kliknięcie przycisku usuwania

**Warunki walidacji:**
- Brak

**Typy:**
```typescript
interface SelectedExerciseItemProps {
  exercise: SelectedExercise;
  index: number;
  onRemove: () => void;
}
```

**Przykład implementacji:**
```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

export function SelectedExerciseItem({
  exercise,
  index,
  onRemove
}: SelectedExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: exercise.exerciseId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Numer */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Obrazek */}
      {exercise.exercise.image_path && (
        <img
          src={exercise.exercise.image_path}
          alt={exercise.exercise.name}
          className="w-12 h-12 rounded object-cover"
        />
      )}

      {/* Nazwa i kategoria */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 truncate">
          {exercise.exercise.name}
        </p>
        <p className="text-sm text-neutral-500 truncate">
          {exercise.exercise.category.name}
        </p>
      </div>

      {/* Przycisk usuwania */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-500 hover:text-red-700"
      >
        <X className="w-4 h-4" />
      </Button>
    </li>
  );
}
```

---

### 4.9. Step3DefineSets.tsx

**Opis komponentu:**
Trzeci krok wizarda - definiowanie serii dla każdego wybranego ćwiczenia.
Wyświetla listę ćwiczeń w formie akordeonów, każdy z edytorem serii.

**Główne elementy:**
- `Accordion` z panelami dla każdego ćwiczenia
- `ExerciseSetsEditor` wewnątrz każdego panelu
- Licznik serii dla każdego ćwiczenia
- Komunikat walidacji (każde ćwiczenie musi mieć minimum 1 serię)

**Obsługiwane zdarzenia:**
- `onUpdateSets` - aktualizacja serii dla ćwiczenia

**Warunki walidacji:**
- Każde ćwiczenie musi mieć co najmniej 1 serię
- Każda seria musi mieć powtórzenia > 0
- Ciężar musi być >= 0 (jeśli podany)

**Typy:**
```typescript
interface Step3DefineSetsProps {
  selectedExercises: SelectedExercise[];
  onUpdateSets: (exerciseIndex: number, sets: PlanSet[]) => void;
}
```

**Przykład implementacji:**
```tsx
export function Step3DefineSets({
  selectedExercises,
  onUpdateSets
}: Step3DefineSetsProps) {
  const hasValidSets = selectedExercises.every(e => e.sets.length > 0);

  return (
    <div className="space-y-4">
      {!hasValidSets && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Każde ćwiczenie musi mieć co najmniej jedną serię.
          </AlertDescription>
        </Alert>
      )}

      <Accordion type="multiple" className="space-y-3">
        {selectedExercises.map((exercise, index) => (
          <AccordionItem key={exercise.exerciseId} value={`exercise-${index}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left w-full">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center text-sm">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900">
                    {exercise.exercise.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {exercise.sets.length} {exercise.sets.length === 1 ? 'seria' : 'serie'}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ExerciseSetsEditor
                exerciseName={exercise.exercise.name}
                sets={exercise.sets}
                onUpdate={(newSets) => onUpdateSets(index, newSets)}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
```

---

### 4.10. ExerciseSetsEditor.tsx

**Opis komponentu:**
Edytor serii dla pojedynczego ćwiczenia. Pozwala na:
- Dodawanie nowych serii
- Usuwanie serii
- Edycję powtórzeń i ciężaru każdej serii
- Walidację danych w czasie rzeczywistym

**Główne elementy:**
- Lista komponentów `SetInputRow`
- Przycisk "Dodaj serię"
- Komunikaty walidacji
- Numeracja serii (1, 2, 3...)

**Obsługiwane zdarzenia:**
- `onAddSet` - dodanie nowej serii
- `onRemoveSet` - usunięcie serii
- `onUpdateSet` - aktualizacja powtórzeń/ciężaru

**Warunki walidacji:**
- Minimum 1 seria
- Powtórzenia > 0 (wymagane)
- Ciężar >= 0 (opcjonalne)

**Typy:**
```typescript
interface ExerciseSetsEditorProps {
  exerciseName: string;
  sets: PlanSet[];
  onUpdate: (sets: PlanSet[]) => void;
}
```

**Przykład implementacji:**
```tsx
export function ExerciseSetsEditor({
  exerciseName,
  sets,
  onUpdate
}: ExerciseSetsEditorProps) {
  const handleAddSet = () => {
    const newSet: PlanSet = {
      reps: 10,
      weight: null,
      orderIndex: sets.length,
      id: null
    };
    onUpdate([...sets, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    const updated = sets.filter((_, i) => i !== index).map((set, idx) => ({
      ...set,
      orderIndex: idx
    }));
    onUpdate(updated);
  };

  const handleUpdateSet = (index: number, updates: Partial<PlanSet>) => {
    const updated = sets.map((set, i) =>
      i === index ? { ...set, ...updates } : set
    );
    onUpdate(updated);
  };

  return (
    <div className="space-y-3 pt-4">
      {/* Nagłówek tabeli */}
      <div className="grid grid-cols-12 gap-3 text-sm font-medium text-neutral-600 px-2">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Powtórzenia</div>
        <div className="col-span-5">Ciężar (kg)</div>
        <div className="col-span-2"></div>
      </div>

      {/* Lista serii */}
      {sets.map((set, index) => (
        <SetInputRow
          key={index}
          setNumber={index + 1}
          reps={set.reps}
          weight={set.weight}
          onUpdateReps={(reps) => handleUpdateSet(index, { reps })}
          onUpdateWeight={(weight) => handleUpdateSet(index, { weight })}
          onRemove={() => handleRemoveSet(index)}
          canRemove={sets.length > 1}
        />
      ))}

      {/* Przycisk dodawania serii */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddSet}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Dodaj serię
      </Button>
    </div>
  );
}
```

---

### 4.11. SetInputRow.tsx

**Opis komponentu:**
Pojedynczy wiersz edycji serii z polami:
- Numer serii (tylko wyświetlanie)
- Input dla powtórzeń (wymagane, > 0)
- Input dla ciężaru (opcjonalne, >= 0)
- Przycisk usunięcia serii

**Główne elementy:**
- Numeryczne inputy z walidacją
- Przyciski +/- do szybkiej zmiany wartości (opcjonalnie)
- Przycisk usuwania (ikona X)
- Inline error messages

**Obsługiwane zdarzenia:**
- `onUpdateReps` - zmiana powtórzeń
- `onUpdateWeight` - zmiana ciężaru
- `onRemove` - usunięcie serii

**Warunki walidacji:**
- Powtórzenia: liczba całkowita > 0
- Ciężar: liczba >= 0 lub null

**Typy:**
```typescript
interface SetInputRowProps {
  setNumber: number;
  reps: number;
  weight: number | null;
  onUpdateReps: (reps: number) => void;
  onUpdateWeight: (weight: number | null) => void;
  onRemove: () => void;
  canRemove: boolean;
}
```

**Przykład implementacji:**
```tsx
export function SetInputRow({
  setNumber,
  reps,
  weight,
  onUpdateReps,
  onUpdateWeight,
  onRemove,
  canRemove
}: SetInputRowProps) {
  const [repsError, setRepsError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setRepsError('Powtórzenia muszą być większe od 0');
    } else {
      setRepsError(null);
      onUpdateReps(value);
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    if (value !== null && (isNaN(value) || value < 0)) {
      setWeightError('Ciężar musi być liczbą >= 0');
    } else {
      setWeightError(null);
      onUpdateWeight(value);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-start">
      {/* Numer serii */}
      <div className="col-span-1 flex items-center justify-center pt-2">
        <span className="font-semibold text-neutral-700">{setNumber}</span>
      </div>

      {/* Powtórzenia */}
      <div className="col-span-4">
        <Input
          type="number"
          min="1"
          value={reps}
          onChange={handleRepsChange}
          className={cn(repsError && "border-red-500")}
          aria-invalid={!!repsError}
        />
        {repsError && (
          <p className="text-xs text-red-500 mt-1">{repsError}</p>
        )}
      </div>

      {/* Ciężar */}
      <div className="col-span-5">
        <Input
          type="number"
          min="0"
          step="0.5"
          value={weight ?? ''}
          onChange={handleWeightChange}
          placeholder="Brak"
          className={cn(weightError && "border-red-500")}
          aria-invalid={!!weightError}
        />
        {weightError && (
          <p className="text-xs text-red-500 mt-1">{weightError}</p>
        )}
      </div>

      {/* Przycisk usuwania */}
      <div className="col-span-2 flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-red-500 hover:text-red-700 disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

---

### 4.12. useWorkoutPlanWizard.ts (Custom Hook)

**Opis:**
Główny custom hook zarządzający całą logiką wizarda:
- Stan formularza (wszystkie 3 kroki)
- Nawigacja między krokami
- Walidacja na każdym etapie
- Persystencja do localStorage
- Komunikacja z API (POST do 3 różnych endpointów)
- Obsługa błędów

**Główne funkcje:**
- `goNext()` - walidacja i przejście do następnego kroku
- `goPrevious()` - powrót do poprzedniego kroku
- `updateBasicInfo()` - aktualizacja nazwy i opisu
- `addExercise()` - dodanie ćwiczenia do listy
- `removeExercise()` - usunięcie ćwiczenia
- `reorderExercises()` - zmiana kolejności
- `updateExerciseSets()` - aktualizacja serii ćwiczenia
- `submitPlan()` - finalne utworzenie planu (wywołanie API)

**Przykład implementacji (szkielet):**
```typescript
export function useWorkoutPlanWizard({
  exercises,
  categories,
  editMode,
  existingPlanId
}: UseWorkoutPlanWizardProps) {
  const [state, setState] = useState<WizardState>(() => {
    // Załaduj stan z localStorage lub utwórz nowy
    const saved = localStorage.getItem('workout-plan-wizard-state');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      step: 1,
      planName: '',
      planDescription: null,
      selectedExercises: [],
      planId: null
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zapisz stan do localStorage przy każdej zmianie
  useEffect(() => {
    localStorage.setItem('workout-plan-wizard-state', JSON.stringify(state));
  }, [state]);

  // Walidacja kroku 1
  const validateStep1 = () => {
    if (state.planName.length < 3) {
      setError('Nazwa planu musi mieć co najmniej 3 znaki');
      return false;
    }
    if (state.planDescription && state.planDescription.length > 500) {
      setError('Opis może mieć maksymalnie 500 znaków');
      return false;
    }
    return true;
  };

  // Walidacja kroku 2
  const validateStep2 = () => {
    if (state.selectedExercises.length === 0) {
      setError('Wybierz co najmniej jedno ćwiczenie');
      return false;
    }
    return true;
  };

  // Walidacja kroku 3
  const validateStep3 = () => {
    for (const exercise of state.selectedExercises) {
      if (exercise.sets.length === 0) {
        setError(`Ćwiczenie "${exercise.exercise.name}" musi mieć co najmniej jedną serię`);
        return false;
      }
      for (const set of exercise.sets) {
        if (set.reps < 1) {
          setError('Wszystkie serie muszą mieć powtórzenia > 0');
          return false;
        }
        if (set.weight !== null && set.weight < 0) {
          setError('Ciężar nie może być ujemny');
          return false;
        }
      }
    }
    return true;
  };

  // Przejście do następnego kroku
  const goNext = async () => {
    setError(null);

    if (state.step === 1) {
      if (!validateStep1()) return;

      // Utwórz plan w API (POST /api/workout-plans)
      setIsLoading(true);
      try {
        const response = await fetch('/api/workout-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.planName,
            description: state.planDescription
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Nie udało się utworzyć planu');
        }

        const { data: plan } = await response.json();
        setState(prev => ({ ...prev, planId: plan.id, step: 2 }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      } finally {
        setIsLoading(false);
      }
    } else if (state.step === 2) {
      if (!validateStep2()) return;

      // Dodaj ćwiczenia do planu (POST /api/workout-plans/{planId}/exercises)
      setIsLoading(true);
      try {
        const planId = state.planId!;
        const planExercisesPromises = state.selectedExercises.map((exercise, index) =>
          fetch(`/api/workout-plans/${planId}/exercises`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exercise_id: exercise.exerciseId,
              order_index: index
            })
          }).then(res => res.json())
        );

        const results = await Promise.all(planExercisesPromises);

        // Aktualizuj state z planExerciseId
        setState(prev => ({
          ...prev,
          selectedExercises: prev.selectedExercises.map((exercise, index) => ({
            ...exercise,
            planExerciseId: results[index].data.id
          })),
          step: 3
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Powrót do poprzedniego kroku
  const goPrevious = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 }));
    }
  };

  // Finalne utworzenie planu (krok 3)
  const submitPlan = async () => {
    setError(null);
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      // Dodaj serie dla każdego ćwiczenia (POST /api/plan-exercises/{planExerciseId}/sets)
      const setsPromises = state.selectedExercises.flatMap(exercise =>
        exercise.sets.map((set, index) =>
          fetch(`/api/plan-exercises/${exercise.planExerciseId}/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reps: set.reps,
              weight: set.weight,
              order_index: index
            })
          })
        )
      );

      await Promise.all(setsPromises);

      // Wyczyść localStorage
      localStorage.removeItem('workout-plan-wizard-state');

      // Przekieruj do listy planów z komunikatem sukcesu
      window.location.href = `/workout-plans?success=Plan%20utworzony%20pomyślnie`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsLoading(false);
    }
  };

  // Dodaj ćwiczenie
  const addExercise = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newExercise: SelectedExercise = {
      exerciseId,
      exercise,
      orderIndex: state.selectedExercises.length,
      planExerciseId: null,
      sets: []
    };

    setState(prev => ({
      ...prev,
      selectedExercises: [...prev.selectedExercises, newExercise]
    }));
  };

  // Pozostałe funkcje...

  return {
    state,
    currentStep: state.step,
    canGoNext: true, // Można ustawić bardziej złożoną logikę
    canGoPrevious: state.step > 1,
    goNext,
    goPrevious,
    updateBasicInfo: (name: string, description: string | null) => {
      setState(prev => ({ ...prev, planName: name, planDescription: description }));
    },
    addExercise,
    removeExercise: (index: number) => {
      setState(prev => ({
        ...prev,
        selectedExercises: prev.selectedExercises.filter((_, i) => i !== index)
      }));
    },
    reorderExercises: (newOrder: SelectedExercise[]) => {
      setState(prev => ({ ...prev, selectedExercises: newOrder }));
    },
    updateExerciseSets: (exerciseIndex: number, sets: PlanSet[]) => {
      setState(prev => ({
        ...prev,
        selectedExercises: prev.selectedExercises.map((exercise, idx) =>
          idx === exerciseIndex ? { ...exercise, sets } : exercise
        )
      }));
    },
    submitPlan,
    isLoading,
    error
  };
}
```

---

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Typy kategorii i ćwiczeń
export type CategoryDTO = Tables<"categories">;
export type ExerciseListItemDTO = Omit<Tables<"exercises">, "category_id"> & {
  category: ExerciseCategoryMinimalDTO;
};

// Komendy API
export interface CreateWorkoutPlanCommand {
  name: string;
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
```

### 5.2. Nowe typy (ViewModel dla wizarda)

```typescript
// src/components/workout-plans/types.ts

/**
 * Stan wizarda tworzenia planu
 */
export interface WizardState {
  step: 1 | 2 | 3;
  planName: string;
  planDescription: string | null;
  selectedExercises: SelectedExercise[];
  planId: string | null; // UUID po utworzeniu planu w kroku 1
}

/**
 * Wybrane ćwiczenie z seriami
 */
export interface SelectedExercise {
  exerciseId: string;
  exercise: ExerciseListItemDTO;
  orderIndex: number;
  planExerciseId: string | null; // UUID po dodaniu do planu w kroku 2
  sets: PlanSet[];
}

/**
 * Seria w planie
 */
export interface PlanSet {
  reps: number;
  weight: number | null;
  orderIndex: number;
  id: string | null; // UUID po zapisaniu w API (krok 3)
}

/**
 * Props dla głównego wizarda
 */
export interface CreateWorkoutPlanWizardProps {
  exercises: ExerciseListItemDTO[];
  categories: CategoryDTO[];
  editMode?: boolean;
  existingPlanId?: string;
}

/**
 * Zwracane wartości z hooka useWorkoutPlanWizard
 */
export interface UseWorkoutPlanWizardReturn {
  state: WizardState;
  currentStep: 1 | 2 | 3;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goNext: () => Promise<void>;
  goPrevious: () => void;
  updateBasicInfo: (name: string, description: string | null) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (index: number) => void;
  reorderExercises: (newOrder: SelectedExercise[]) => void;
  updateExerciseSets: (exerciseIndex: number, sets: PlanSet[]) => void;
  submitPlan: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** Supabase PostgreSQL

**Zapytania:**

1. **Pobranie ćwiczeń z kategoriami:**
```typescript
const { data: exercises, error } = await supabase
  .from('exercises')
  .select(`
    id,
    name,
    description,
    image_path,
    image_alt,
    difficulty,
    category:categories(id, name, slug)
  `)
  .order('name');
```

2. **Pobranie kategorii dla filtrów:**
```typescript
const { data: categories, error } = await supabase
  .from('categories')
  .select('*')
  .order('order_index');
```

### 6.2. Stan client-side (React)

**Główny stan wizarda** - zarządzany przez `useWorkoutPlanWizard`:
- `WizardState` - obiekt zawierający:
  - `step` - aktualny krok (1, 2, 3)
  - `planName` - nazwa planu
  - `planDescription` - opis planu
  - `selectedExercises` - tablica wybranych ćwiczeń z seriami
  - `planId` - UUID planu po utworzeniu w API

**Persystencja stanu:**
- Zapis do `localStorage` przy każdej zmianie stanu
- Klucz: `'workout-plan-wizard-state'`
- Czyszczenie po pomyślnym utworzeniu planu
- Ostrzeżenie przy opuszczeniu strony (event `beforeunload`)

**Stan lokalny w komponentach:**
- `ExerciseSelector` - stan filtrów (kategoria, trudność, wyszukiwanie)
- `SetInputRow` - błędy walidacji dla pól (reps, weight)
- `CategoryCard` - stan błędu obrazka

**Custom hooks:**
- `useWorkoutPlanWizard` - główna logika wizarda
- `useExerciseSelection` - logika filtrowania ćwiczeń (search, filters)
- `usePlanExerciseSets` - zarządzanie seriami (opcjonalnie)

### 6.3. Diagram przepływu stanu

```
[Krok 1: Nazwa i opis]
  ↓ walidacja (nazwa >= 3 znaki)
  ↓ POST /api/workout-plans
  ↓ otrzymanie planId

[Krok 2: Wybór ćwiczeń]
  ↓ walidacja (min. 1 ćwiczenie)
  ↓ POST /api/workout-plans/{planId}/exercises (dla każdego)
  ↓ otrzymanie planExerciseId dla każdego

[Krok 3: Definiowanie serii]
  ↓ walidacja (każde ćwiczenie ma min. 1 serię, reps > 0)
  ↓ POST /api/plan-exercises/{planExerciseId}/sets (dla każdej serii)
  ↓ sukces → redirect do /workout-plans
```

## 7. Integracja API

### 7.1. Endpoints używane

Widok wykorzystuje 3 różne endpointy API w sekwencji:

**1. POST /api/workout-plans**
- **Kiedy:** Po walidacji kroku 1 (nazwa i opis)
- **Body:**
  ```json
  {
    "name": "Push Day",
    "description": "Chest, shoulders, triceps"
  }
  ```
- **Response:**
  ```json
  {
    "data": {
      "id": "uuid-plan-id",
      "name": "Push Day",
      "description": "...",
      "created_at": "2024-01-20T10:00:00Z"
    }
  }
  ```
- **Obsługa błędów:** 400 (walidacja), 401 (auth), 500 (server)

**2. POST /api/workout-plans/{planId}/exercises**
- **Kiedy:** Po walidacji kroku 2 (wybór ćwiczeń)
- **Wywołania:** Jedno dla każdego wybranego ćwiczenia (Promise.all)
- **Body:**
  ```json
  {
    "exercise_id": "uuid-exercise-id",
    "order_index": 0
  }
  ```
- **Response:**
  ```json
  {
    "data": {
      "id": "uuid-plan-exercise-id",
      "plan_id": "uuid-plan-id",
      "exercise_id": "uuid-exercise-id",
      "order_index": 0
    }
  }
  ```
- **Obsługa błędów:** 400, 404 (exercise not found), 401, 500

**3. POST /api/plan-exercises/{planExerciseId}/sets**
- **Kiedy:** Po walidacji kroku 3 (submit planu)
- **Wywołania:** Jedno dla każdej serii każdego ćwiczenia (Promise.all)
- **Body:**
  ```json
  {
    "reps": 10,
    "weight": 80.0,
    "order_index": 0
  }
  ```
- **Response:**
  ```json
  {
    "data": {
      "id": "uuid-set-id",
      "plan_exercise_id": "uuid-plan-exercise-id",
      "reps": 10,
      "weight": 80.0,
      "order_index": 0
    }
  }
  ```
- **Obsługa błędów:** 400, 404, 401, 500

### 7.2. Strategie wywołań API

**Sequential (sekwencyjne):**
- Krok 1 → Krok 2 → Krok 3 (nie można pominąć)
- Każdy krok czeka na sukces poprzedniego

**Parallel (równoległe w ramach kroku):**
- Dodawanie ćwiczeń (krok 2): `Promise.all` dla wszystkich ćwiczeń
- Dodawanie serii (krok 3): `Promise.all` dla wszystkich serii wszystkich ćwiczeń

**Rollback strategy:**
- Jeśli krok 2 lub 3 zakończy się błędem:
  - Wyświetl komunikat błędu
  - Pozwól użytkownikowi na retry
  - Plan utworzony w kroku 1 pozostaje w bazie (może być edytowany później)
  - Nie kasuj planId ze stanu (pozwól na kontynuację)

### 7.3. Obsługa błędów API

**Scenariusze błędów:**

1. **401 Unauthorized** - użytkownik wylogowany:
   - Wyczyść localStorage
   - Przekieruj do `/auth/login`

2. **400 Bad Request** - błąd walidacji:
   - Wyświetl komunikat błędu w UI
   - Highlight nieprawidłowego pola
   - Zablokuj przycisk "Dalej" do poprawienia

3. **404 Not Found** - ćwiczenie/plan nie istnieje:
   - Toast error: "Nie znaleziono zasobu"
   - Pozwól na retry

4. **500 Internal Server Error**:
   - Toast error: "Wystąpił problem z serwerem"
   - Retry button lub link do support

5. **Network Error** (brak połączenia):
   - Toast error: "Brak połączenia z internetem"
   - Retry button

**Implementacja obsługi błędów:**
```typescript
try {
  const response = await fetch('/api/workout-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();

    if (response.status === 400) {
      // Błędy walidacji
      setError(errorData.message || 'Dane są nieprawidłowe');
      // Opcjonalnie: highlight fields z errorData.details
    } else if (response.status === 401) {
      // Wylogowanie
      localStorage.removeItem('workout-plan-wizard-state');
      window.location.href = '/auth/login';
    } else {
      throw new Error(errorData.message || 'Wystąpił błąd');
    }
    return;
  }

  const { data: result } = await response.json();
  // Sukces - kontynuuj
} catch (err) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    setError('Brak połączenia z internetem. Sprawdź swoje połączenie.');
  } else {
    setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd');
  }
}
```

## 8. Interakcje użytkownika

### 8.1. Rozpoczęcie tworzenia planu

**Akcja:** Użytkownik klika "Utwórz nowy plan" na stronie `/workout-plans`

**Przepływ:**
1. Nawigacja do `/workout-plans/new`
2. Middleware sprawdza autoryzację
3. Astro wykonuje SSR i pobiera ćwiczenia + kategorie
4. Wizard renderuje się w kroku 1
5. Sprawdzenie localStorage - załadowanie zapisanego stanu (jeśli istnieje)

**Oczekiwany wynik:**
- Wyświetlenie wizarda z krokiem 1
- Puste pola (lub zapisany stan z localStorage)
- Stepper pokazuje krok 1/3

---

### 8.2. Wypełnienie kroku 1 (Nazwa i opis)

**Akcja:** Użytkownik wpisuje nazwę i opcjonalnie opis, klika "Dalej"

**Przepływ:**
1. Walidacja w czasie rzeczywistym (onChange)
2. Kliknięcie "Dalej"
3. Walidacja: nazwa >= 3 znaki
4. POST /api/workout-plans
5. Otrzymanie planId
6. Aktualizacja stanu wizarda
7. Zapis do localStorage
8. Przejście do kroku 2

**Oczekiwany wynik:**
- Sukces: Przejście do kroku 2
- Błąd walidacji: Komunikat pod polem, przycisk zablokowany
- Błąd API: Toast error, możliwość retry

---

### 8.3. Wybór ćwiczeń (Krok 2)

**Akcja:** Użytkownik wyszukuje/filtruje ćwiczenia i dodaje je do planu

**Przepływ:**
1. Wpisanie zapytania w search bar
2. Wybór kategorii z dropdown
3. Zaznaczenie poziomów trudności (checkboxy)
4. Kliknięcie na ćwiczenie w `ExerciseCard`
5. Dodanie ćwiczenia do listy po prawej stronie
6. Opcjonalna zmiana kolejności (drag-and-drop)
7. Kliknięcie "Dalej"
8. Walidacja: min. 1 ćwiczenie
9. POST /api/workout-plans/{planId}/exercises (dla każdego)
10. Otrzymanie planExerciseId dla każdego
11. Przejście do kroku 3

**Oczekiwany wynik:**
- Ćwiczenia filtrują się w czasie rzeczywistym
- Wybrane ćwiczenia pojawiają się po prawej
- Możliwość zmiany kolejności drag-and-drop
- Po kliknięciu "Dalej" → krok 3

---

### 8.4. Definiowanie serii (Krok 3)

**Akcja:** Użytkownik definiuje serie (powtórzenia, ciężar) dla każdego ćwiczenia

**Przepływ:**
1. Otworzenie akkordeonu dla ćwiczenia
2. Wyświetlenie domyślnej 1 serii (10 powtórzeń, brak ciężaru)
3. Edycja powtórzeń i ciężaru
4. Dodanie kolejnych serii przyciskiem "Dodaj serię"
5. Powtórzenie dla pozostałych ćwiczeń
6. Kliknięcie "Utwórz plan"
7. Walidacja: każde ćwiczenie ma min. 1 serię, reps > 0
8. POST /api/plan-exercises/{planExerciseId}/sets (dla wszystkich serii)
9. Sukces → wyczyść localStorage
10. Przekierowanie do `/workout-plans?success=true`
11. Wyświetlenie toast success: "Plan utworzony pomyślnie"

**Oczekiwany wynik:**
- Użytkownik może edytować serie dla każdego ćwiczenia
- Walidacja w czasie rzeczywistym
- Po submit → przekierowanie + komunikat sukcesu

---

### 8.5. Zmiana kolejności ćwiczeń (Drag-and-drop)

**Akcja:** Użytkownik przeciąga ćwiczenie w liście wybranych (krok 2)

**Przepływ:**
1. Chwycenie ćwiczenia za grip handle
2. Przeciągnięcie w nowe miejsce
3. Puszczenie
4. Event `onDragEnd` w `SelectedExercisesList`
5. Aktualizacja `orderIndex` dla wszystkich ćwiczeń
6. Aktualizacja stanu
7. Zapis do localStorage

**Oczekiwany wynik:**
- Wizualna zmiana kolejności (animacja)
- Numeracja się aktualizuje
- Stan jest zapisany

---

### 8.6. Powrót do poprzedniego kroku

**Akcja:** Użytkownik klika "Wstecz"

**Przepływ:**
1. Kliknięcie "Wstecz"
2. Sprawdzenie czy `step > 1`
3. Aktualizacja stanu: `step = step - 1`
4. Renderowanie poprzedniego kroku
5. Dane pozostają zachowane (z stanu wizarda)

**Oczekiwany wynik:**
- Przejście do poprzedniego kroku
- Wszystkie dane zachowane
- Stepper aktualizuje się

---

### 8.7. Opuszczenie strony z niezakończonym planem

**Akcja:** Użytkownik próbuje opuścić stronę (zamknięcie karty, nawigacja)

**Przepływ:**
1. Event `beforeunload` się wywołuje
2. Sprawdzenie czy `planId !== null` (plan został rozpoczęty)
3. Wyświetlenie ostrzeżenia przeglądarki
4. Użytkownik może anulować lub potwierdzić

**Oczekiwany wynik:**
- Ostrzeżenie: "Masz niezakończony plan. Czy na pewno chcesz opuścić stronę?"
- Stan pozostaje w localStorage (można wrócić)

---

### 8.8. Wznowienie niezakończonego planu

**Akcja:** Użytkownik wraca na `/workout-plans/new` po opuszczeniu strony

**Przepływ:**
1. Załadowanie stanu z localStorage
2. Sprawdzenie czy `planId` istnieje
3. Jeśli tak: wyświetlenie banneru "Masz niezakończony plan. Czy chcesz kontynuować?"
4. Opcja 1: Kontynuuj → załaduj stan
5. Opcja 2: Rozpocznij nowy → wyczyść localStorage

**Oczekiwany wynik:**
- Użytkownik może kontynuować lub rozpocząć od nowa
- Żadne dane nie są tracone

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

---

### 9.2. Walidacja kroku 1 (Nazwa i opis)

**Komponent:** `Step1BasicInfo.tsx`, `useWorkoutPlanWizard`

**Warunki:**
- `planName.length >= 3` - wymagane
- `planName.length <= 100` - max długość
- `planDescription.length <= 500` - opcjonalne, max długość

**Komunikaty błędów:**
- "Nazwa musi mieć co najmniej 3 znaki"
- "Nazwa może mieć maksymalnie 100 znaków"
- "Opis może mieć maksymalnie 500 znaków"

**Efekt niepowodzenia:**
- Przycisk "Dalej" zablokowany
- Komunikat błędu pod polem
- Czerwona ramka na nieprawidłowym polu

---

### 9.3. Walidacja kroku 2 (Wybór ćwiczeń)

**Komponent:** `Step2SelectExercises.tsx`, `useWorkoutPlanWizard`

**Warunki:**
- `selectedExercises.length >= 1` - wymagane

**Komunikaty błędów:**
- "Wybierz co najmniej jedno ćwiczenie"

**Efekt niepowodzenia:**
- Przycisk "Dalej" zablokowany
- Alert box z komunikatem w prawym panelu

---

### 9.4. Walidacja kroku 3 (Definiowanie serii)

**Komponent:** `Step3DefineSets.tsx`, `useWorkoutPlanWizard`

**Warunki:**
- Dla każdego ćwiczenia: `sets.length >= 1`
- Dla każdej serii: `reps > 0` (integer)
- Dla każdej serii: `weight >= 0` lub `null` (float)

**Komunikaty błędów:**
- "Ćwiczenie '{nazwa}' musi mieć co najmniej jedną serię"
- "Wszystkie serie muszą mieć powtórzenia > 0"
- "Ciężar musi być liczbą >= 0"

**Efekt niepowodzenia:**
- Przycisk "Utwórz plan" zablokowany
- Alert box z komunikatem na górze
- Komunikaty błędów inline w `SetInputRow`

---

### 9.5. Walidacja drag-and-drop

**Komponent:** `SelectedExercisesList.tsx`

**Warunki:**
- Można przeciągać tylko w obrębie listy
- Nie można przeciągać pustych miejsc

**Efekt niepowodzenia:**
- Brak (biblioteka @dnd-kit obsługuje to automatycznie)

---

### 9.6. Walidacja API responses

**Komponent:** `useWorkoutPlanWizard`

**Warunki:**
- Response status 200/201 (sukces)
- Response zawiera `data` object
- `data.id` (UUID) jest niepusty

**Efekt niepowodzenia:**
- Wyświetlenie toast error
- Logowanie błędu do console
- Stan wizarda nie zmienia się (można retry)

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik wylogował się podczas tworzenia planu

**Obsługa:**
- Wyczyść localStorage
- Przekieruj do `/auth/login`
- Po zalogowaniu → powrót do `/workout-plans` (nie do wizarda)

**Komunikat:** Toast info: "Sesja wygasła. Zaloguj się ponownie."

---

### 10.2. Błąd walidacji (400)

**Scenariusz:** API zwraca błąd walidacji (np. nazwa < 3 znaki)

**Obsługa:**
```typescript
if (response.status === 400) {
  const errorData = await response.json();
  setError(errorData.message || 'Dane są nieprawidłowe');

  // Opcjonalnie: highlight konkretnych pól z errorData.details
  if (errorData.details) {
    errorData.details.forEach(detail => {
      // Ustaw błąd dla konkretnego pola
      setFieldError(detail.field, detail.message);
    });
  }
}
```

**Komunikat:**
- Alert box: errorData.message
- Inline: komunikaty pod polami

---

### 10.3. Błąd Not Found (404)

**Scenariusz:** Ćwiczenie/plan nie istnieje w bazie

**Obsługa:**
- Toast error: "Nie znaleziono zasobu"
- Pozwól na retry

**Komunikat:** "Nie znaleziono ćwiczenia. Odśwież stronę i spróbuj ponownie."

---

### 10.4. Błąd serwera (500)

**Scenariusz:** Problem z bazą danych lub błąd serwera

**Obsługa:**
```typescript
if (response.status === 500) {
  setError('Wystąpił problem z serwerem. Spróbuj ponownie później.');
  console.error('Server error:', errorData);
}
```

**Komunikat:** Toast error: "Wystąpił problem z serwerem. Spróbuj ponownie później."

**UI:**
- Przycisk "Spróbuj ponownie"
- Link do wsparcia (opcjonalnie)

---

### 10.5. Błąd sieci (Network Error)

**Scenariusz:** Brak połączenia z internetem

**Obsługa:**
```typescript
try {
  // fetch...
} catch (err) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    setError('Brak połączenia z internetem. Sprawdź swoje połączenie.');
  }
}
```

**Komunikat:** Toast error: "Brak połączenia z internetem. Sprawdź swoje połączenie."

**UI:**
- Ikona offline
- Przycisk "Spróbuj ponownie"

---

### 10.6. Błąd ładowania obrazka ćwiczenia

**Scenariusz:** Obrazek ćwiczenia nie może się załadować

**Obsługa:**
- Event handler `onError` w `<img>`
- Renderowanie placeholder (ikona `Dumbbell` z Lucide)

**Implementacja:**
```tsx
const [imageError, setImageError] = useState(false);

{imageError || !exercise.image_path ? (
  <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center">
    <Dumbbell className="w-6 h-6 text-neutral-400" />
  </div>
) : (
  <img
    src={exercise.image_path}
    alt={exercise.name}
    onError={() => setImageError(true)}
    className="w-12 h-12 rounded object-cover"
  />
)}
```

---

### 10.7. Rollback przy błędzie kroku 2 lub 3

**Scenariusz:** Plan został utworzony (krok 1), ale krok 2 lub 3 zakończył się błędem

**Obsługa:**
- Plan pozostaje w bazie (może być edytowany później)
- Wyświetl komunikat błędu
- Pozwól na retry (przycisk "Spróbuj ponownie")
- Nie czyść localStorage (użytkownik może kontynuować)
- Opcjonalnie: link do edycji planu (`/workout-plans/{planId}/edit`)

**Komunikat:**
```
"Nie udało się dodać ćwiczeń do planu.
Plan został zapisany, możesz kontynuować później.
[Spróbuj ponownie] [Edytuj plan]"
```

---

### 10.8. Konflikt podczas równoległych wywołań API

**Scenariusz:** Jedno z równoległych wywołań (Promise.all) kończy się błędem

**Obsługa:**
```typescript
try {
  const results = await Promise.all(planExercisesPromises);
  // Sukces
} catch (err) {
  // Jeden z requestów się nie powiódł
  setError('Nie udało się dodać niektórych ćwiczeń. Spróbuj ponownie.');
  console.error('Failed to add exercises:', err);

  // Opcjonalnie: retry tylko tych, które się nie powiodły
}
```

**Strategia:**
- Użyj `Promise.allSettled` zamiast `Promise.all`
- Przetwórz wyniki: sukces vs. błąd
- Retry tylko tych, które się nie powiodły

**Przykład z Promise.allSettled:**
```typescript
const results = await Promise.allSettled(planExercisesPromises);

const succeeded = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');

if (failed.length > 0) {
  console.error('Failed to add some exercises:', failed);
  setError(`Nie udało się dodać ${failed.length} ćwiczeń. Spróbuj ponownie.`);

  // Pokaż które ćwiczenia się nie powiodły
  const failedIndexes = failed.map((_, i) => results.findIndex(r => r === failed[i]));
  // Highlight tych ćwiczeń w UI
}

// Aktualizuj stan tylko dla tych, które się powiodły
setState(prev => ({
  ...prev,
  selectedExercises: prev.selectedExercises.map((exercise, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      return { ...exercise, planExerciseId: result.value.data.id };
    }
    return exercise;
  })
}));
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalogi:
```bash
mkdir -p src/components/workout-plans
mkdir -p src/components/workout-plans/hooks
mkdir -p src/pages/workout-plans
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/workout-plans/CreateWorkoutPlanWizard.tsx
touch src/components/workout-plans/Stepper.tsx
touch src/components/workout-plans/Step1BasicInfo.tsx
touch src/components/workout-plans/Step2SelectExercises.tsx
touch src/components/workout-plans/Step3DefineSets.tsx
touch src/components/workout-plans/ExerciseSelector.tsx
touch src/components/workout-plans/ExerciseSearchBar.tsx
touch src/components/workout-plans/ExerciseFilters.tsx
touch src/components/workout-plans/ExerciseCard.tsx
touch src/components/workout-plans/SelectedExercisesList.tsx
touch src/components/workout-plans/SelectedExerciseItem.tsx
touch src/components/workout-plans/ExerciseSetsEditor.tsx
touch src/components/workout-plans/SetInputRow.tsx
touch src/components/workout-plans/types.ts
```

1.3. Utwórz pliki custom hooks:
```bash
touch src/components/workout-plans/hooks/useWorkoutPlanWizard.ts
touch src/components/workout-plans/hooks/useExerciseSelection.ts
```

1.4. Utwórz stronę Astro:
```bash
touch src/pages/workout-plans/new.astro
```

1.5. Zainstaluj zależności (drag-and-drop):
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### Krok 2: Definicja typów

2.1. W `src/components/workout-plans/types.ts` zdefiniuj wszystkie typy (patrz sekcja 5.2)

---

### Krok 3: Implementacja komponentów prezentacyjnych

3.1. Zaimplementuj `Stepper.tsx` (patrz 4.3)

3.2. Zaimplementuj `Step1BasicInfo.tsx` (patrz 4.4)

3.3. Zaimplementuj `ExerciseCard.tsx` (prosty komponent wyświetlający ćwiczenie z przyciskiem "Dodaj")

3.4. Zaimplementuj `SetInputRow.tsx` (patrz 4.11)

---

### Krok 4: Implementacja custom hooks

4.1. Zaimplementuj `useExerciseSelection.ts`:
```typescript
export function useExerciseSelection(exercises: ExerciseListItemDTO[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set());

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Search filter
      if (searchQuery && !exercise.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory && exercise.category.id !== selectedCategory) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulties.size > 0 && !selectedDifficulties.has(exercise.difficulty)) {
        return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedCategory, selectedDifficulties]);

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties(prev => {
      const next = new Set(prev);
      if (next.has(difficulty)) {
        next.delete(difficulty);
      } else {
        next.add(difficulty);
      }
      return next;
    });
  };

  return {
    filteredExercises,
    searchQuery,
    selectedCategory,
    selectedDifficulties,
    setSearchQuery,
    setSelectedCategory,
    toggleDifficulty
  };
}
```

4.2. Zaimplementuj `useWorkoutPlanWizard.ts` (patrz 4.12) - główny hook z logiką wizarda

---

### Krok 5: Implementacja komponentów logicznych

5.1. Zaimplementuj `ExerciseSearchBar.tsx`:
```tsx
interface ExerciseSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExerciseSearchBar({ value, onChange }: ExerciseSearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
      <Input
        type="text"
        placeholder="Szukaj ćwiczenia..."
        value={value}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
}
```

5.2. Zaimplementuj `ExerciseFilters.tsx`:
```tsx
interface ExerciseFiltersProps {
  categories: CategoryDTO[];
  selectedCategory: string | null;
  selectedDifficulties: Set<string>;
  onCategoryChange: (categoryId: string | null) => void;
  onDifficultyToggle: (difficulty: string) => void;
}

export function ExerciseFilters({
  categories,
  selectedCategory,
  selectedDifficulties,
  onCategoryChange,
  onDifficultyToggle
}: ExerciseFiltersProps) {
  const difficulties = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Kategoria */}
      <div className="flex-1">
        <Label htmlFor="category-filter">Kategoria</Label>
        <Select
          value={selectedCategory || 'all'}
          onValueChange={(value) => onCategoryChange(value === 'all' ? null : value)}
        >
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trudność */}
      <div className="flex-1">
        <Label>Poziom trudności</Label>
        <div className="flex gap-3 mt-2">
          {difficulties.map(diff => (
            <label key={diff} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedDifficulties.has(diff)}
                onCheckedChange={() => onDifficultyToggle(diff)}
              />
              <span className="text-sm">{diff}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
```

5.3. Zaimplementuj `ExerciseSelector.tsx` (patrz 4.6)

5.4. Zaimplementuj `SelectedExerciseItem.tsx` (patrz 4.8)

5.5. Zaimplementuj `SelectedExercisesList.tsx` (patrz 4.7)

5.6. Zaimplementuj `ExerciseSetsEditor.tsx` (patrz 4.10)

---

### Krok 6: Implementacja komponentów kroków wizarda

6.1. Zaimplementuj `Step2SelectExercises.tsx` (patrz 4.5)

6.2. Zaimplementuj `Step3DefineSets.tsx` (patrz 4.9)

---

### Krok 7: Implementacja głównego wizarda

7.1. Zaimplementuj `CreateWorkoutPlanWizard.tsx` (patrz 4.2)

---

### Krok 8: Implementacja strony Astro

8.1. Zaimplementuj `src/pages/workout-plans/new.astro` (patrz 4.1)

---

### Krok 9: Dodaj ostrzeżenie przy opuszczaniu strony

9.1. W `CreateWorkoutPlanWizard.tsx` dodaj useEffect:
```tsx
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (state.planId) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [state.planId]);
```

---

### Krok 10: Dodaj obsługę wznowienia niezakończonego planu

10.1. W `useWorkoutPlanWizard` dodaj logikę:
```tsx
const [showResumeDialog, setShowResumeDialog] = useState(false);

useEffect(() => {
  const saved = localStorage.getItem('workout-plan-wizard-state');
  if (saved) {
    const savedState = JSON.parse(saved);
    if (savedState.planId && savedState.step > 1) {
      setShowResumeDialog(true);
    }
  }
}, []);

const resumePlan = () => {
  // Załaduj zapisany stan
  setShowResumeDialog(false);
};

const startNew = () => {
  localStorage.removeItem('workout-plan-wizard-state');
  setState({
    step: 1,
    planName: '',
    planDescription: null,
    selectedExercises: [],
    planId: null
  });
  setShowResumeDialog(false);
};
```

10.2. Renderuj dialog:
```tsx
{showResumeDialog && (
  <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Niezakończony plan</DialogTitle>
        <DialogDescription>
          Masz niezakończony plan treningowy. Czy chcesz kontynuować?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={startNew}>
          Rozpocznij nowy
        </Button>
        <Button onClick={resumePlan}>
          Kontynuuj
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

---

### Krok 11: Testowanie

11.1. **Test manualny pełnego przepływu:**
- Zaloguj się
- Przejdź do `/workout-plans/new`
- Wypełnij krok 1 (nazwa i opis) → kliknij "Dalej"
- Sprawdź czy plan został utworzony w bazie (developer tools)
- Wybierz co najmniej 2 ćwiczenia → zmień kolejność → kliknij "Dalej"
- Sprawdź czy ćwiczenia zostały dodane do planu
- Zdefiniuj serie dla każdego ćwiczenia (różna liczba) → kliknij "Utwórz plan"
- Sprawdź czy serie zostały zapisane
- Sprawdź przekierowanie do `/workout-plans`
- Sprawdź czy plan wyświetla się na liście

11.2. **Test walidacji:**
- Krok 1: Spróbuj przejść dalej z nazwą < 3 znaki → sprawdź komunikat błędu
- Krok 1: Wpisz opis > 500 znaków → sprawdź czy pole blokuje
- Krok 2: Spróbuj przejść dalej bez wyboru ćwiczeń → sprawdź alert
- Krok 3: Usuń wszystkie serie z ćwiczenia → sprawdź komunikat błędu
- Krok 3: Wpisz powtórzenia < 1 → sprawdź inline error
- Krok 3: Wpisz ciężar < 0 → sprawdź inline error

11.3. **Test drag-and-drop:**
- Wybierz 3 ćwiczenia
- Przeciągnij pierwsze na ostatnie miejsce → sprawdź numerację
- Sprawdź animację podczas przeciągania

11.4. **Test persystencji:**
- Wypełnij krok 1 i przejdź do kroku 2
- Odśwież stronę
- Sprawdź czy stan jest zachowany (krok 2, dane z kroku 1)
- Opuść stronę i wróć → sprawdź dialog wznowienia

11.5. **Test błędów API:**
- Symuluj błąd 500 (wyłącz serwer) → sprawdź komunikat błędu
- Symuluj błąd 401 (wyloguj się w innej karcie) → sprawdź redirect
- Symuluj błąd sieci (offline mode) → sprawdź komunikat

11.6. **Test responsywności:**
- Sprawdź widok na mobile (< 640px)
- Sprawdź widok na tablet (640-1024px)
- Sprawdź widok na desktop (> 1024px)
- Sprawdź czy grid w kroku 2 się zmienia (1 kolumna → 2 kolumny)

11.7. **Test dostępności:**
- Nawigacja tylko klawiaturą (Tab, Enter, Escape)
- Sprawdź focus states
- Sprawdź ARIA attributes (DevTools > Accessibility)
- Sprawdź kontrast kolorów (WCAG AA)

---

### Krok 12: Styling i UX polish

12.1. Dodaj smooth transitions:
```css
.wizard-step {
  transition: opacity 300ms ease-in-out;
}
```

12.2. Dodaj loading states:
- Skeleton loader dla ćwiczeń (krok 2)
- Spinner podczas zapisywania (przyciski)
- Disabled state dla przycisków podczas API calls

12.3. Dodaj empty states:
- Brak wyników wyszukiwania (krok 2)
- Brak wybranych ćwiczeń (krok 2)

12.4. Dodaj tooltips (opcjonalnie):
- Ikona "i" przy "Ciężar (kg)" z wyjaśnieniem

---

### Krok 13: Optymalizacja wydajności

13.1. Użyj `React.memo` dla komponentów list:
```tsx
export const ExerciseCard = React.memo(function ExerciseCard({ ... }) {
  // ...
});
```

13.2. Użyj `useCallback` dla event handlers:
```tsx
const handleAddExercise = useCallback((exerciseId: string) => {
  addExercise(exerciseId);
}, [addExercise]);
```

13.3. Debounce wyszukiwania:
```tsx
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useMemo(
  () => debounce((value: string) => setSearchQuery(value), 300),
  []
);
```

---

### Krok 14: Dokumentacja i code review

14.1. Dodaj komentarze JSDoc do wszystkich komponentów i funkcji

14.2. Sprawdź zgodność z `CLAUDE.md`:
- Używanie Astro dla SSR
- React tylko tam gdzie potrzebna interaktywność
- TypeScript dla wszystkich plików
- Tailwind dla stylów
- Shadcn/ui dla komponentów bazowych

14.3. Uruchom linter i formatter:
```bash
npm run lint:fix
npm run format
```

14.4. Commit zmian:
```bash
git add .
git commit -m "feat: implement multi-step workout plan creation wizard

- Add 3-step wizard with Stepper component
- Implement step 1: Basic info (name, description)
- Implement step 2: Exercise selection with search and filters
- Implement step 3: Sets definition with validation
- Add drag-and-drop for exercise reordering
- Add state persistence to localStorage
- Add resume dialog for unfinished plans
- Integrate with 3 API endpoints (POST plan, exercises, sets)
- Add comprehensive error handling and validation
- Support keyboard navigation and accessibility

Resolves US-012, US-013, US-014, US-015"
```

---

### Krok 15: Integracja z pozostałymi widokami

15.1. Dodaj link "Utwórz nowy plan" na stronie `/workout-plans`:
```tsx
<Button asChild>
  <a href="/workout-plans/new">
    <Plus className="w-4 h-4 mr-2" />
    Utwórz nowy plan
  </a>
</Button>
```

15.2. Dodaj success message po przekierowaniu:
- W `/workout-plans.astro` sprawdź query param `?success=true`
- Wyświetl toast success: "Plan utworzony pomyślnie"

15.3. Dodaj możliwość edycji planu:
- Utwórz stronę `/workout-plans/[id]/edit.astro`
- Wykorzystaj te same komponenty wizarda
- Pre-wypełnij stan danymi z API

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-012, US-013, US-014, US-015
✅ **Multi-step wizard:** 3 kroki z nawigacją i walidacją
✅ **Persystencja stanu:** localStorage + dialog wznowienia
✅ **Drag-and-drop:** Zmiana kolejności ćwiczeń (@dnd-kit)
✅ **Integracja API:** 3 endpointy (POST plan, exercises, sets)
✅ **Walidacja:** Real-time validation na każdym etapie
✅ **Obsługa błędów:** Comprehensive error handling z retry
✅ **Dostępność:** ARIA, keyboard navigation, focus states
✅ **Responsywność:** Mobile-first z responsive grid
✅ **Type safety:** TypeScript w całym kodzie
✅ **UX:** Smooth transitions, loading states, empty states
✅ **Code quality:** ESLint, Prettier, JSDoc comments

Implementacja powinna zająć **12-20 godzin** doświadczonemu programiście fullstack (frontend + backend integration).

**Kluczowe różnice w porównaniu do widoku kategorii:**
- Znacznie większa złożoność (11 komponentów vs 3)
- Multi-step wizard pattern
- 3 różne endpointy API (vs 1 read-only query)
- Persystencja stanu między krokami
- Drag-and-drop functionality
- Złożona walidacja na wielu poziomach
- Rollback strategy przy błędach
