# Plan implementacji widoku podsumowania treningu

## 1. Przegląd

Widok podsumowania treningu jest prezentowany użytkownikowi natychmiast po zakończeniu sesji treningowej. Ma na celu dostarczenie motywującego feedbacku oraz kluczowych statystyk dotyczących wykonanego treningu. Widok jest tylko do odczytu (read-only) i nie pozwala na edycję danych.

Wyświetla komunikat gratulacyjny, karty ze statystykami (nazwa planu, czas trwania, liczba ćwiczeń, serii, powtórzeń, maksymalny ciężar, całkowita objętość treningowa), listę wykonanych ćwiczeń oraz przyciski nawigacyjne.

Widok realizuje historyjkę użytkownika US-029 i jest integralną częścią przepływu logowania treningu (US-027, US-028).

## 2. Routing widoku

**Ścieżka:** `/workouts/[id]/summary`

**Typ renderowania:** Server-side rendering (domyślne dla Astro w trybie `output: "server"`)

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

**Parametry dynamiczne:** `[id]` - UUID zakończonego treningu

## 3. Struktura komponentów

```
src/pages/workouts/[id]/summary.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/workouts/
    ├── WorkoutSummaryHeader.tsx (React - Gratulacje i nazwa planu)
    ├── WorkoutStatsGrid.tsx (React - Grid z kartami statystyk)
    │   └── StatCard.tsx (React - Pojedyncza karta statystyki)
    ├── CompletedExercisesList.tsx (React - Lista wykonanych ćwiczeń)
    │   └── CompletedExerciseItem.tsx (React - Pojedyncze ćwiczenie z liczbą serii)
    └── WorkoutSummaryActions.tsx (React - Przyciski nawigacyjne)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do pobrania danych treningu z API
- `WorkoutSummaryHeader` jako React component - prezentacyjny komponent z animacjami
- `WorkoutStatsGrid` jako React component - kontener dla kart statystyk
- `StatCard` jako React component - reużywalny komponent do wyświetlania pojedynczej metryki
- `CompletedExercisesList` jako React component - lista z możliwością rozwinięcia szczegółów
- `WorkoutSummaryActions` jako React component - interaktywne przyciski nawigacji

## 4. Szczegóły komponentów

### 4.1. summary.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku podsumowania
- Pobranie danych treningu z API `/api/workouts/{id}`
- Walidację czy trening ma status `completed`
- Walidację czy użytkownik jest właścicielem treningu (RLS)
- Obsługę błędów ładowania danych
- Przekazanie danych do komponentów React

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Wywołanie `GET /api/workouts/{id}` przez fetch
- Walidacja statusu treningu (`status === 'completed'`)
- Sekcja `<main>` z kontenerem na komponenty
- Conditional rendering w przypadku błędów
- Przekazanie danych przez props do komponentów React

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- `id` musi być poprawnym UUID
- Trening musi istnieć i należeć do użytkownika (RLS)
- Trening musi mieć status `completed`
- Statystyki treningu muszą być obliczone (`stats` istnieje)

**Typy:**
- `WorkoutDetailDTO` - szczegóły treningu z API
- `WorkoutStatsDTO` - statystyki treningu

**Propsy:**
Brak (główna strona Astro)

---

### 4.2. WorkoutSummaryHeader.tsx

**Opis komponentu:**
Komponent nagłówka wyświetlający komunikat gratulacyjny oraz nazwę użytego planu treningowego. Może zawierać animowaną ikonę lub emoji (opcjonalnie).

**Główne elementy:**
- `<header>` z klasą dla stylowania
- Ikona gratulacji (np. 🎉 lub `<Trophy />` z Lucide)
- `<h1>` - komunikat "Świetna robota!"
- `<p>` - "Zakończyłeś trening: {plan_name}"
- Stylowanie z Tailwind CSS
- Opcjonalna animacja fade-in

**Obsługiwane zdarzenia:**
- Brak (komponent prezentacyjny)

**Warunki walidacji:**
- `planName` musi być niepustym stringiem

**Typy:**
- `planName: string`
- `completedAt: string` (opcjonalnie - data zakończenia)

**Propsy:**
```typescript
interface WorkoutSummaryHeaderProps {
  planName: string;
  completedAt?: string;
}
```

---

### 4.3. WorkoutStatsGrid.tsx

**Opis komponentu:**
Główny kontener wyświetlający karty ze statystykami treningu w układzie grid (responsywnym). Renderuje komponenty `StatCard` dla każdej metryki.

**Główne elementy:**
- `<div>` kontener z responsive grid (2 kolumny mobile, 3-4 desktop)
- Mapowanie statystyk na komponenty `StatCard`
- Klasy Tailwind dla responsywności (`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`)

**Obsługiwane zdarzenia:**
- Brak (delegowane do `StatCard`)

**Warunki walidacji:**
- `stats` musi być obiektem typu `WorkoutStatsDTO`
- Wszystkie metryki muszą być liczbami >= 0

**Typy:**
- `WorkoutStatsDTO` - statystyki treningu
- `startedAt: string` - data i godzina rozpoczęcia
- `completedAt: string` - data i godzina zakończenia

**Propsy:**
```typescript
interface WorkoutStatsGridProps {
  stats: WorkoutStatsDTO;
  startedAt: string;
  completedAt: string;
}
```

---

### 4.4. StatCard.tsx

**Opis komponentu:**
Reużywalny komponent karty wyświetlający pojedynczą statystykę z ikoną, etykietą i wartością. Wspiera różne typy danych (liczba, czas, waga).

**Główne elementy:**
- `<div>` kontener karty z padding i border
- Ikona (z Lucide React) reprezentująca metrykę
- `<p>` - etykieta (np. "Czas trwania")
- `<p>` - wartość (np. "1h 30min", "8500 kg")
- Formatowanie wartości zależnie od typu

**Obsługiwane zdarzenia:**
- Brak (komponent prezentacyjny)

**Warunki walidacji:**
- `value` musi istnieć (liczba lub string)
- `label` musi być niepustym stringiem
- `icon` musi być poprawnym komponentem Lucide

**Typy:**
- `label: string`
- `value: string | number`
- `unit?: string` (opcjonalna jednostka, np. "kg", "min")
- `icon: LucideIcon`
- `formatType?: 'number' | 'duration' | 'weight'`

**Propsy:**
```typescript
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  formatType?: 'number' | 'duration' | 'weight';
}
```

---

### 4.5. CompletedExercisesList.tsx

**Opis komponentu:**
Komponent wyświetlający listę wykonanych ćwiczeń z liczbą serii dla każdego. Opcjonalnie może być rozwijany (accordion) do pokazania szczegółów serii.

**Główne elementy:**
- `<div>` kontener listy
- `<h2>` - nagłówek "Wykonane ćwiczenia"
- Mapowanie ćwiczeń na `CompletedExerciseItem`
- Licznik: "Wykonałeś {totalExercises} ćwiczeń"
- Empty state (jeśli brak wykonanych ćwiczeń)

**Obsługiwane zdarzenia:**
- Brak bezpośrednio w tym komponencie (delegowane do `CompletedExerciseItem`)

**Warunki walidacji:**
- `exercises` musi być tablicą
- Jeśli `exercises.length === 0`, wyświetl komunikat

**Typy:**
- `WorkoutExerciseDTO[]` - tablica wykonanych ćwiczeń z setami

**Propsy:**
```typescript
interface CompletedExercisesListProps {
  exercises: WorkoutExerciseDTO[];
}
```

---

### 4.6. CompletedExerciseItem.tsx

**Opis komponentu:**
Pojedynczy element listy reprezentujący wykonane ćwiczenie. Wyświetla nazwę ćwiczenia oraz liczbę wykonanych serii.

**Główne elementy:**
- `<div>` kontener elementu listy
- `<p>` - nazwa ćwiczenia
- Badge z liczbą wykonanych serii (np. "3 serie")
- Opcjonalnie: miniatury obrazka ćwiczenia
- Stylowanie z hover effect

**Obsługiwane zdarzenia:**
- Opcjonalnie: `onClick` - rozwinięcie szczegółów serii (accordion)

**Warunki walidacji:**
- `exerciseName` musi być niepustym stringiem
- `completedSetsCount` musi być liczbą >= 0

**Typy:**
- `exerciseName: string`
- `completedSetsCount: number`
- `imagePath?: string | null` (opcjonalnie)

**Propsy:**
```typescript
interface CompletedExerciseItemProps {
  exerciseName: string;
  completedSetsCount: number;
  imagePath?: string | null;
}
```

---

### 4.7. WorkoutSummaryActions.tsx

**Opis komponentu:**
Komponent zawierający przyciski nawigacyjne umożliwiające powrót do strony głównej lub przejście do historii treningów.

**Główne elementy:**
- `<div>` kontener przycisków (flex layout)
- `<Button>` - "Wróć do strony głównej" (primary action)
- `<Button>` - "Zobacz historię treningów" (secondary action)
- Responsywny układ (stack na mobile, row na desktop)

**Obsługiwane zdarzenia:**
- `onClick` na pierwszym przycisku - nawigacja do `/`
- `onClick` na drugim przycisku - nawigacja do `/workouts/history`

**Warunki walidacji:**
- Brak (przyciski są zawsze aktywne)

**Typy:**
- Brak dodatkowych propsów

**Propsy:**
```typescript
interface WorkoutSummaryActionsProps {
  // Brak propsów - statyczne przyciski
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Typ szczegółów treningu - już zdefiniowany
export type WorkoutDetailDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
  exercises: WorkoutExerciseDTO[];
};

// Typ statystyk treningu - już zdefiniowany
export type WorkoutStatsDTO = Omit<Tables<"workout_stats">, "id" | "user_id" | "workout_id" | "created_at">;

// Struktura WorkoutStatsDTO:
// {
//   duration_minutes: number;
//   total_exercises: number;
//   total_sets: number;
//   total_reps: number;
//   max_weight: number;
//   total_volume: number;
// }

// Typ ćwiczenia w treningu - już zdefiniowany
export type WorkoutExerciseDTO = Omit<Tables<"workout_exercises">, "user_id" | "workout_id"> & {
  exercise: WorkoutExerciseMinimalDTO;
  sets: WorkoutSetDTO[];
};
```

### 5.2. Nowe typy (ViewModel)

```typescript
// src/components/workouts/types.ts

import type { LucideIcon } from 'lucide-react';
import type { WorkoutDetailDTO, WorkoutStatsDTO, WorkoutExerciseDTO } from '@/types';

/**
 * Props dla komponentu WorkoutSummaryHeader
 */
export interface WorkoutSummaryHeaderProps {
  planName: string;
  completedAt?: string;
}

/**
 * Props dla komponentu WorkoutStatsGrid
 */
export interface WorkoutStatsGridProps {
  stats: WorkoutStatsDTO;
  startedAt: string;
  completedAt: string;
}

/**
 * Props dla komponentu StatCard
 */
export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  formatType?: 'number' | 'duration' | 'weight';
}

/**
 * Props dla komponentu CompletedExercisesList
 */
export interface CompletedExercisesListProps {
  exercises: WorkoutExerciseDTO[];
}

/**
 * Props dla komponentu CompletedExerciseItem
 */
export interface CompletedExerciseItemProps {
  exerciseName: string;
  completedSetsCount: number;
  imagePath?: string | null;
}

/**
 * Typ dla pojedynczej statystyki do wyświetlenia
 */
export interface StatItemViewModel {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  formatType?: 'number' | 'duration' | 'weight';
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** API endpoint `GET /api/workouts/{id}`

**Zapytanie:**
```typescript
// Wywołanie API endpoint z parametrem id z URL
const workoutId = Astro.params.id;

const response = await fetch(`${Astro.url.origin}/api/workouts/${workoutId}`, {
  headers: {
    'Cookie': Astro.request.headers.get('Cookie') || ''
  }
});

if (!response.ok) {
  // Obsługa błędu
  if (response.status === 404) {
    return Astro.redirect('/404');
  }
  if (response.status === 401) {
    return Astro.redirect('/auth/login');
  }
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20treningu');
}

const { data: workout } = await response.json() as { data: WorkoutDetailDTO };
```

**Transformacja danych:**
```typescript
// Przygotowanie danych statystyk jako tablica StatItemViewModel
import { Clock, Dumbbell, Hash, Repeat, Scale, TrendingUp } from 'lucide-react';

const statItems: StatItemViewModel[] = [
  {
    label: 'Czas trwania',
    value: workout.stats?.duration_minutes || 0,
    icon: Clock,
    formatType: 'duration'
  },
  {
    label: 'Liczba ćwiczeń',
    value: workout.stats?.total_exercises || 0,
    icon: Dumbbell,
    formatType: 'number'
  },
  {
    label: 'Wykonane serie',
    value: workout.stats?.total_sets || 0,
    icon: Hash,
    formatType: 'number'
  },
  {
    label: 'Powtórzenia',
    value: workout.stats?.total_reps || 0,
    icon: Repeat,
    formatType: 'number'
  },
  {
    label: 'Maksymalny ciężar',
    value: workout.stats?.max_weight || 0,
    unit: 'kg',
    icon: Scale,
    formatType: 'weight'
  },
  {
    label: 'Całkowita objętość',
    value: workout.stats?.total_volume || 0,
    unit: 'kg',
    icon: TrendingUp,
    formatType: 'weight'
  }
];

// Przygotowanie danych ćwiczeń z liczbą wykonanych serii
const completedExercises = workout.exercises.map(exercise => ({
  exerciseName: exercise.exercise.name,
  completedSetsCount: exercise.sets.filter(set => set.completed).length,
  imagePath: exercise.exercise.image_path
}));
```

### 6.2. Stan client-side (React)

**Brak globalnego stanu** - dane są przekazywane przez props z Astro do React.

**Stan lokalny w StatCard:**
- Brak stanu lokalnego - komponent jest czysty (pure)

**Stan lokalny w CompletedExerciseItem:**
- Opcjonalnie: `isExpanded: boolean` (jeśli implementujemy accordion z detalami serii)

**Nie jest wymagany custom hook** - widok jest read-only i nie wymaga złożonej logiki stanu.

## 7. Integracja API

### 7.1. Endpoint używany

**Endpoint:** `GET /api/workouts/{id}`

**Typ:** Read-only (SELECT)

**Autoryzacja:** Wymaga zalogowania. RLS automatycznie filtruje po `user_id = auth.uid()`

**Parametry:**
- `id` (path parameter) - UUID treningu

### 7.2. Response z API

**Typ odpowiedzi (200 OK):**
```typescript
{
  data: WorkoutDetailDTO
}

// Struktura WorkoutDetailDTO:
// {
//   id: string;
//   plan_id: string;
//   plan_name: string;
//   status: 'completed';
//   started_at: string;
//   completed_at: string;
//   stats: {
//     duration_minutes: number;
//     total_exercises: number;
//     total_sets: number;
//     total_reps: number;
//     max_weight: number;
//     total_volume: number;
//   };
//   exercises: [
//     {
//       id: string;
//       exercise_id: string;
//       order_index: number;
//       exercise: {
//         id: string;
//         name: string;
//         image_path: string | null;
//         category?: {
//           name: string;
//         };
//       };
//       sets: [
//         {
//           id: string;
//           planned_reps: number;
//           planned_weight: number | null;
//           actual_reps: number | null;
//           actual_weight: number | null;
//           completed: boolean;
//           note: string | null;
//           order_index: number;
//         }
//       ]
//     }
//   ]
// }
```

### 7.3. Obsługa błędów

**Scenariusze błędów:**
1. Błąd autoryzacji (401) - użytkownik niezalogowany
2. Trening nie istnieje (404) - nieprawidłowy ID lub użytkownik nie ma dostępu
3. Trening nie jest zakończony (400) - status != 'completed'
4. Błąd serwera (500) - problem z bazą danych
5. Brak statystyk - statystyki nie zostały obliczone

**Obsługa:**
```typescript
// W summary.astro
const workoutId = Astro.params.id;

// Walidacja UUID
if (!workoutId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workoutId)) {
  return Astro.redirect('/404');
}

const response = await fetch(`${Astro.url.origin}/api/workouts/${workoutId}`, {
  headers: {
    'Cookie': Astro.request.headers.get('Cookie') || ''
  }
});

if (!response.ok) {
  if (response.status === 401) {
    return Astro.redirect('/auth/login');
  }
  if (response.status === 404) {
    return Astro.redirect('/404');
  }
  console.error('Error fetching workout:', await response.text());
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20treningu');
}

const { data: workout } = await response.json();

// Walidacja statusu
if (workout.status !== 'completed') {
  return Astro.redirect(`/workouts/active?error=Trening%20nie%20został%20zakończony`);
}

// Walidacja statystyk
if (!workout.stats) {
  console.error('Workout stats missing for completed workout:', workoutId);
  return Astro.redirect('/error?message=Statystyki%20treningu%20nie%20zostały%20obliczone');
}
```

## 8. Interakcje użytkownika

### 8.1. Zakończenie treningu i przekierowanie

**Akcja:** Użytkownik kończy trening w `/workouts/active` i klika "Zakończ trening"

**Przepływ:**
1. POST `/api/workouts/{id}/complete` - zakończenie treningu
2. Backend oblicza statystyki (trigger w bazie)
3. Frontend przekierowuje do `/workouts/{id}/summary`
4. Astro wykonuje SSR i pobiera dane treningu
5. Strona renderuje się z podsumowaniem

**Oczekiwany wynik:**
- Komunikat gratulacyjny
- 6 kart statystyk z wartościami
- Lista wykonanych ćwiczeń
- 2 przyciski nawigacyjne

### 8.2. Bezpośredni dostęp do podsumowania

**Akcja:** Użytkownik wchodzi na `/workouts/{id}/summary` z linku lub historii

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro pobiera dane treningu z API
3. Walidacja: czy trening jest zakończony
4. Renderowanie strony z danymi

**Oczekiwany wynik:**
- Wyświetlenie podsumowania zakończonego treningu
- Jeśli trening nie jest zakończony → przekierowanie z komunikatem błędu

### 8.3. Kliknięcie "Wróć do strony głównej"

**Akcja:** Użytkownik klika przycisk "Wróć do strony głównej"

**Przepływ:**
1. Kliknięcie przycisku w `WorkoutSummaryActions`
2. Nawigacja do `/` (Dashboard)

**Oczekiwany wynik:**
- Przekierowanie do strony głównej
- Dashboard pokazuje ostatni zakończony trening w widgecie

### 8.4. Kliknięcie "Zobacz historię treningów"

**Akcja:** Użytkownik klika przycisk "Zobacz historię treningów"

**Przepływ:**
1. Kliknięcie przycisku w `WorkoutSummaryActions`
2. Nawigacja do `/workouts/history`

**Oczekiwany wynik:**
- Przekierowanie do widoku historii
- Lista treningów z najnowszym na górze

### 8.5. Formatowanie czasu trwania

**Akcja:** Wyświetlenie czasu trwania treningu

**Przepływ:**
1. `StatCard` otrzymuje `duration_minutes` jako wartość
2. Komponent formatuje minuty do formatu "Xh Ymin" lub "Xmin"
3. Przykład: 90 minut → "1h 30min", 45 minut → "45min"

**Oczekiwany wynik:**
- Czytelny format czasu dla użytkownika

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

### 9.2. Walidacja parametru URL

**Komponent:** `summary.astro`

**Warunek:** `Astro.params.id` musi być poprawnym UUID

**Efekt niepowodzenia:** Przekierowanie do `/404`

**Implementacja:**
```typescript
const workoutId = Astro.params.id;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!workoutId || !uuidRegex.test(workoutId)) {
  return Astro.redirect('/404');
}
```

### 9.3. Walidacja statusu treningu

**Komponent:** `summary.astro`

**Warunek:** `workout.status === 'completed'`

**Efekt niepowodzenia:** Przekierowanie do `/workouts/active` z komunikatem błędu

**Implementacja:**
```typescript
if (workout.status !== 'completed') {
  return Astro.redirect(`/workouts/active?error=Trening%20nie%20został%20zakończony`);
}
```

### 9.4. Walidacja statystyk

**Komponent:** `summary.astro`

**Warunek:** `workout.stats` musi istnieć i zawierać wszystkie metryki

**Efekt niepowodzenia:** Przekierowanie do strony błędu

**Implementacja:**
```typescript
if (!workout.stats || typeof workout.stats.duration_minutes !== 'number') {
  console.error('Invalid workout stats:', workout.stats);
  return Astro.redirect('/error?message=Statystyki%20treningu%20są%20niepełne');
}
```

### 9.5. Walidacja propsów komponentów

**Komponent:** `StatCard.tsx`

**Warunki:**
- `label` - niepusty string
- `value` - liczba >= 0 lub string
- `icon` - poprawny komponent Lucide

**Efekt niepowodzenia:**
- Console warning (dev mode)
- Wyświetlenie placeholder "N/A"

**Implementacja:**
```typescript
if (!label || value === undefined || value === null) {
  console.warn('Invalid StatCard props:', { label, value });
  return (
    <div className="stat-card opacity-50">
      <p className="text-sm text-neutral-500">{label || 'Nieznana metryka'}</p>
      <p className="text-2xl font-bold text-neutral-400">N/A</p>
    </div>
  );
}
```

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik próbuje uzyskać dostęp do `/workouts/{id}/summary` bez zalogowania

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu użytkownik wraca do żądanej strony

**Komunikat:** Toast info: "Zaloguj się, aby zobaczyć podsumowanie treningu"

### 10.2. Trening nie istnieje (404)

**Scenariusz:** Nieprawidłowy UUID lub użytkownik nie ma dostępu do tego treningu (RLS)

**Obsługa:**
```typescript
if (response.status === 404) {
  return Astro.redirect('/404');
}
```

**Komunikat:** Strona 404 z komunikatem "Trening nie został znaleziony"

### 10.3. Trening nie jest zakończony (400)

**Scenariusz:** Użytkownik próbuje zobaczyć podsumowanie aktywnego lub anulowanego treningu

**Obsługa:**
```typescript
if (workout.status !== 'completed') {
  if (workout.status === 'active') {
    return Astro.redirect('/workouts/active');
  }
  return Astro.redirect('/?error=Nie%20można%20wyświetlić%20podsumowania%20anulowanego%20treningu');
}
```

**Komunikat:**
- Dla aktywnego: przekierowanie do widoku aktywnego treningu
- Dla anulowanego: Toast error: "Nie można wyświetlić podsumowania anulowanego treningu"

### 10.4. Brak statystyk (500)

**Scenariusz:** Trening jest zakończony, ale statystyki nie zostały obliczone (błąd triggera w bazie)

**Obsługa:**
```typescript
if (!workout.stats) {
  console.error('Missing stats for completed workout:', workoutId);
  return Astro.redirect('/error?message=Statystyki%20treningu%20nie%20zostały%20obliczone');
}
```

**Komunikat:** Strona błędu z komunikatem: "Statystyki treningu nie zostały obliczone. Skontaktuj się z administratorem."

### 10.5. Błąd zapytania API (500)

**Scenariusz:** Błąd serwera podczas pobierania danych treningu

**Obsługa:**
```typescript
if (!response.ok) {
  console.error('API error:', response.status, await response.text());
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20podsumowania');
}
```

**Komunikat:** Toast error: "Nie udało się załadować podsumowania treningu. Spróbuj ponownie później."

### 10.6. Brak wykonanych ćwiczeń

**Scenariusz:** Trening jest zakończony, ale nie ma wykonanych ćwiczeń (teoretycznie niemożliwe, ale obsłużyć należy)

**Obsługa:**
- Renderowanie empty state w `CompletedExercisesList`
- Komunikat: "Brak wykonanych ćwiczeń w tym treningu."

**UI Empty State:**
```tsx
<div className="flex flex-col items-center justify-center py-8 text-center">
  <p className="text-neutral-600">
    Brak wykonanych ćwiczeń w tym treningu.
  </p>
</div>
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalog komponentów:
```bash
mkdir -p src/components/workouts
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/workouts/WorkoutSummaryHeader.tsx
touch src/components/workouts/WorkoutStatsGrid.tsx
touch src/components/workouts/StatCard.tsx
touch src/components/workouts/CompletedExercisesList.tsx
touch src/components/workouts/CompletedExerciseItem.tsx
touch src/components/workouts/WorkoutSummaryActions.tsx
touch src/components/workouts/types.ts
```

1.3. Utwórz katalog i plik strony Astro:
```bash
mkdir -p src/pages/workouts/[id]
touch src/pages/workouts/[id]/summary.astro
```

---

### Krok 2: Definicja typów

2.1. W pliku `src/components/workouts/types.ts` zdefiniuj ViewModele i Props:

```typescript
import type { LucideIcon } from 'lucide-react';
import type { WorkoutDetailDTO, WorkoutStatsDTO, WorkoutExerciseDTO } from '@/types';

export interface WorkoutSummaryHeaderProps {
  planName: string;
  completedAt?: string;
}

export interface WorkoutStatsGridProps {
  stats: WorkoutStatsDTO;
  startedAt: string;
  completedAt: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  formatType?: 'number' | 'duration' | 'weight';
}

export interface CompletedExercisesListProps {
  exercises: WorkoutExerciseDTO[];
}

export interface CompletedExerciseItemProps {
  exerciseName: string;
  completedSetsCount: number;
  imagePath?: string | null;
}

export interface StatItemViewModel {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  formatType?: 'number' | 'duration' | 'weight';
}
```

---

### Krok 3: Implementacja StatCard

3.1. W `src/components/workouts/StatCard.tsx`:

```tsx
import type { StatCardProps } from './types';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, unit, icon: Icon, formatType = 'number' }: StatCardProps) {
  if (!label || value === undefined || value === null) {
    console.warn('Invalid StatCard props:', { label, value });
    return (
      <div className="stat-card opacity-50 bg-white rounded-lg p-4 shadow-sm">
        <p className="text-sm text-neutral-500">{label || 'Nieznana metryka'}</p>
        <p className="text-2xl font-bold text-neutral-400">N/A</p>
      </div>
    );
  }

  // Formatowanie wartości
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (formatType) {
      case 'duration': {
        // Formatowanie minut do "Xh Ymin" lub "Xmin"
        const hours = Math.floor(val / 60);
        const minutes = val % 60;
        if (hours > 0) {
          return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
        }
        return `${minutes}min`;
      }
      case 'weight':
        return val.toFixed(1);
      case 'number':
      default:
        return val.toString();
    }
  };

  const formattedValue = formatValue(value);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 flex flex-col items-center text-center">
      <Icon className="w-8 h-8 text-blue-600 mb-2" aria-hidden="true" />
      <p className="text-sm text-neutral-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-neutral-900">
        {formattedValue}
        {unit && <span className="text-lg text-neutral-600 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
```

---

### Krok 4: Implementacja WorkoutStatsGrid

4.1. W `src/components/workouts/WorkoutStatsGrid.tsx`:

```tsx
import { Clock, Dumbbell, Hash, Repeat, Scale, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import type { WorkoutStatsGridProps, StatItemViewModel } from './types';

export function WorkoutStatsGrid({ stats, startedAt, completedAt }: WorkoutStatsGridProps) {
  const statItems: StatItemViewModel[] = [
    {
      label: 'Czas trwania',
      value: stats.duration_minutes,
      icon: Clock,
      formatType: 'duration'
    },
    {
      label: 'Liczba ćwiczeń',
      value: stats.total_exercises,
      icon: Dumbbell,
      formatType: 'number'
    },
    {
      label: 'Wykonane serie',
      value: stats.total_sets,
      icon: Hash,
      formatType: 'number'
    },
    {
      label: 'Powtórzenia',
      value: stats.total_reps,
      icon: Repeat,
      formatType: 'number'
    },
    {
      label: 'Maksymalny ciężar',
      value: stats.max_weight,
      unit: 'kg',
      icon: Scale,
      formatType: 'weight'
    },
    {
      label: 'Całkowita objętość',
      value: stats.total_volume,
      unit: 'kg',
      icon: TrendingUp,
      formatType: 'weight'
    }
  ];

  return (
    <div>
      {/* Wyświetlenie dat rozpoczęcia i zakończenia */}
      <div className="mb-4 text-sm text-neutral-600">
        <p>
          Rozpoczęto: {new Date(startedAt).toLocaleString('pl-PL', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}
        </p>
        <p>
          Zakończono: {new Date(completedAt).toLocaleString('pl-PL', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}
        </p>
      </div>

      {/* Grid ze statystykami */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statItems.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            icon={stat.icon}
            formatType={stat.formatType}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Krok 5: Implementacja WorkoutSummaryHeader

5.1. W `src/components/workouts/WorkoutSummaryHeader.tsx`:

```tsx
import { Trophy } from 'lucide-react';
import type { WorkoutSummaryHeaderProps } from './types';

export function WorkoutSummaryHeader({ planName, completedAt }: WorkoutSummaryHeaderProps) {
  return (
    <header className="mb-8 text-center">
      <div className="flex items-center justify-center mb-4">
        <Trophy className="w-16 h-16 text-yellow-500" aria-hidden="true" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
        Świetna robota!
      </h1>
      <p className="text-lg text-neutral-600">
        Zakończyłeś trening: <span className="font-semibold">{planName}</span>
      </p>
      {completedAt && (
        <p className="text-sm text-neutral-500 mt-1">
          {new Date(completedAt).toLocaleString('pl-PL', {
            dateStyle: 'long',
            timeStyle: 'short'
          })}
        </p>
      )}
    </header>
  );
}
```

---

### Krok 6: Implementacja CompletedExerciseItem

6.1. W `src/components/workouts/CompletedExerciseItem.tsx`:

```tsx
import { Dumbbell } from 'lucide-react';
import type { CompletedExerciseItemProps } from './types';

export function CompletedExerciseItem({
  exerciseName,
  completedSetsCount,
  imagePath
}: CompletedExerciseItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
      <div className="flex items-center gap-3">
        {/* Miniatura obrazka lub ikona */}
        {imagePath ? (
          <img
            src={imagePath}
            alt={exerciseName}
            className="w-10 h-10 rounded-md object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 bg-neutral-200 rounded-md flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-neutral-500" />
          </div>
        )}

        {/* Nazwa ćwiczenia */}
        <p className="font-medium text-neutral-900">{exerciseName}</p>
      </div>

      {/* Badge z liczbą serii */}
      <div className="inline-flex items-center px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-800">
        <span className="font-semibold">{completedSetsCount}</span>
        <span className="ml-1">{completedSetsCount === 1 ? 'seria' : 'serie'}</span>
      </div>
    </div>
  );
}
```

---

### Krok 7: Implementacja CompletedExercisesList

7.1. W `src/components/workouts/CompletedExercisesList.tsx`:

```tsx
import { CompletedExerciseItem } from './CompletedExerciseItem';
import type { CompletedExercisesListProps } from './types';

export function CompletedExercisesList({ exercises }: CompletedExercisesListProps) {
  // Obliczenie liczby wykonanych ćwiczeń (unikalnych)
  const totalExercises = exercises.length;

  // Przygotowanie danych dla każdego ćwiczenia
  const exercisesData = exercises.map((exercise) => ({
    exerciseName: exercise.exercise.name,
    completedSetsCount: exercise.sets.filter((set) => set.completed).length,
    imagePath: exercise.exercise.image_path
  }));

  if (totalExercises === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-neutral-600">
          Brak wykonanych ćwiczeń w tym treningu.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">
        Wykonane ćwiczenia
      </h2>
      <p className="text-neutral-600 mb-4">
        Wykonałeś {totalExercises} {totalExercises === 1 ? 'ćwiczenie' : 'ćwiczeń'}
      </p>

      <div className="space-y-2">
        {exercisesData.map((exercise, index) => (
          <CompletedExerciseItem
            key={index}
            exerciseName={exercise.exerciseName}
            completedSetsCount={exercise.completedSetsCount}
            imagePath={exercise.imagePath}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Krok 8: Implementacja WorkoutSummaryActions

8.1. W `src/components/workouts/WorkoutSummaryActions.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Home, History } from 'lucide-react';

export function WorkoutSummaryActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
      <Button asChild size="lg" className="flex items-center gap-2">
        <a href="/">
          <Home className="w-5 h-5" />
          Wróć do strony głównej
        </a>
      </Button>

      <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
        <a href="/workouts/history">
          <History className="w-5 h-5" />
          Zobacz historię treningów
        </a>
      </Button>
    </div>
  );
}
```

---

### Krok 9: Implementacja strony Astro (SSR)

9.1. W `src/pages/workouts/[id]/summary.astro`:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { WorkoutSummaryHeader } from '@/components/workouts/WorkoutSummaryHeader';
import { WorkoutStatsGrid } from '@/components/workouts/WorkoutStatsGrid';
import { CompletedExercisesList } from '@/components/workouts/CompletedExercisesList';
import { WorkoutSummaryActions } from '@/components/workouts/WorkoutSummaryActions';
import type { WorkoutDetailDTO } from '@/types';

// Sprawdź autoryzację
if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Pobierz ID treningu z URL
const workoutId = Astro.params.id;

// Walidacja UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!workoutId || !uuidRegex.test(workoutId)) {
  return Astro.redirect('/404');
}

// Pobierz dane treningu z API
const response = await fetch(`${Astro.url.origin}/api/workouts/${workoutId}`, {
  headers: {
    'Cookie': Astro.request.headers.get('Cookie') || ''
  }
});

// Obsługa błędów API
if (!response.ok) {
  if (response.status === 401) {
    return Astro.redirect('/auth/login');
  }
  if (response.status === 404) {
    return Astro.redirect('/404');
  }
  console.error('Error fetching workout:', response.status);
  return Astro.redirect('/error?message=Nie%20udało%20się%20załadować%20podsumowania');
}

const { data: workout } = await response.json() as { data: WorkoutDetailDTO };

// Walidacja statusu treningu
if (workout.status !== 'completed') {
  if (workout.status === 'active') {
    return Astro.redirect('/workouts/active');
  }
  return Astro.redirect('/?error=Nie%20można%20wyświetlić%20podsumowania%20anulowanego%20treningu');
}

// Walidacja statystyk
if (!workout.stats) {
  console.error('Missing stats for completed workout:', workoutId);
  return Astro.redirect('/error?message=Statystyki%20treningu%20nie%20zostały%20obliczone');
}

// Dane dla komponentów
const planName = workout.plan_name;
const stats = workout.stats;
const startedAt = workout.started_at;
const completedAt = workout.completed_at;
const exercises = workout.exercises;
---

<MainLayout title={`Podsumowanie treningu - ${planName} - Gym Track`}>
  <main class="container mx-auto px-4 py-8 max-w-5xl">
    <WorkoutSummaryHeader
      planName={planName}
      completedAt={completedAt}
      client:load
    />

    <WorkoutStatsGrid
      stats={stats}
      startedAt={startedAt}
      completedAt={completedAt}
      client:load
    />

    <div class="mt-12">
      <CompletedExercisesList
        exercises={exercises}
        client:load
      />
    </div>

    <WorkoutSummaryActions client:load />
  </main>
</MainLayout>
```

---

### Krok 10: Testowanie

10.1. **Test manualny:**
- Zaloguj się do aplikacji
- Rozpocznij trening z dowolnego planu
- Oznacz kilka serii jako wykonane (modyfikując ciężar/powtórzenia)
- Zakończ trening (POST `/api/workouts/{id}/complete`)
- Sprawdź czy przekierowuje do `/workouts/{id}/summary`
- Zweryfikuj poprawność statystyk:
  - Czas trwania (format Xh Ymin)
  - Liczba ćwiczeń (unikalnych)
  - Wykonane serie (tylko completed)
  - Powtórzenia (suma)
  - Maksymalny ciężar
  - Całkowita objętość (suma ciężar × powtórzenia)
- Sprawdź listę wykonanych ćwiczeń
- Kliknij "Wróć do strony głównej" → sprawdź przekierowanie
- Kliknij "Zobacz historię treningów" → sprawdź przekierowanie

10.2. **Test błędów:**
- Wyloguj się i spróbuj wejść na `/workouts/{id}/summary` → sprawdź redirect do logowania
- Podaj nieprawidłowy UUID w URL → sprawdź 404
- Podaj UUID treningu innego użytkownika → sprawdź 404 (RLS)
- Podaj UUID aktywnego treningu → sprawdź przekierowanie do `/workouts/active`

10.3. **Test responsywności:**
- Sprawdź widok na mobile (DevTools - 375px)
  - Grid statystyk: 2 kolumny
  - Przyciski akcji: stack (vertical)
- Sprawdź widok na tablet (768px)
  - Grid statystyk: 3 kolumny
- Sprawdź widok na desktop (1024px+)
  - Grid statystyk: 6 kolumn
  - Przyciski akcji: row (horizontal)

10.4. **Test wydajności:**
- Sprawdź czas ładowania strony (< 1s)
- Sprawdź SSR - strona powinna być w pełni renderowana przy pierwszym załadowaniu

---

### Krok 11: Dokumentacja i code review

11.1. Dodaj komentarze JSDoc do komponentów:
```tsx
/**
 * Komponent karty statystyki treningu
 * @param {StatCardProps} props - Props zawierające etykietę, wartość, jednostkę i ikonę
 * @returns {JSX.Element} Renderowana karta statystyki
 */
export function StatCard({ label, value, unit, icon, formatType }: StatCardProps) {
  // ...
}
```

11.2. Sprawdź czy kod jest zgodny z wytycznymi projektu (CLAUDE.md):
- Używa Astro components dla SSR
- Używa React components tylko dla interaktywności
- Type safety (TypeScript)
- Obsługa błędów zgodnie z wytycznymi
- Dostępność (semantic HTML, ARIA)

11.3. Uruchom linter i formatter:
```bash
npm run lint:fix
npm run format
```

11.4. Commit zmian z opisowym komunikatem:
```bash
git add .
git commit -m "feat(workouts): implement workout summary view with stats and completed exercises list"
```

---

### Krok 12: Integracja z przepływem zakończenia treningu

12.1. W widoku aktywnego treningu (`/workouts/active`) po kliknięciu "Zakończ trening":

```typescript
// W komponencie aktywnego treningu
const handleCompleteWorkout = async () => {
  const response = await fetch(`/api/workouts/${workoutId}/complete`, {
    method: 'POST'
  });

  if (response.ok) {
    // Przekieruj do podsumowania
    window.location.href = `/workouts/${workoutId}/summary`;
  } else {
    // Obsłuż błąd
    toast.error('Nie udało się zakończyć treningu');
  }
};
```

12.2. Opcjonalnie: Dodaj link do podsumowania w historii treningów

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-029 (Wyświetlanie podsumowania zakończonego treningu)
✅ **Integracja z API:** Używa `GET /api/workouts/{id}` zgodnie z API Plan (sekcja 2.7)
✅ **Responsywność:** Grid statystyk 2/3/6 kolumn (mobile/tablet/desktop)
✅ **Dostępność:** Semantic HTML, ARIA labels, ikony z tekstowymi etykietami
✅ **Type Safety:** TypeScript w całym kodzie z wykorzystaniem istniejących typów z `src/types.ts`
✅ **Obsługa błędów:** Walidacja autoryzacji, statusu treningu, statystyk, błędów API
✅ **UX:** Motywujący komunikat, czytelne karty statystyk, formatowanie czasu i wag
✅ **Wydajność:** SSR z Astro, minimalna ilość JavaScript na kliencie
✅ **Code Quality:** ESLint, Prettier, komentarze JSDoc
✅ **Read-only:** Widok tylko do odczytu, bez możliwości edycji

Kluczowe funkcjonalności:
- Komunikat gratulacyjny z ikoną trofeum
- 6 kart statystyk: Czas, Ćwiczenia, Serie, Powtórzenia, Max. ciężar, Objętość
- Formatowanie czasu trwania (Xh Ymin)
- Lista wykonanych ćwiczeń z liczbą serii
- Przyciski nawigacyjne: Dashboard i Historia
- Dostępny natychmiast po zakończeniu treningu
- Możliwość bezpośredniego dostępu przez URL (jeśli trening jest zakończony)

Implementacja powinna zająć **3-5 godzin** doświadczonemu programiście frontendowemu.
