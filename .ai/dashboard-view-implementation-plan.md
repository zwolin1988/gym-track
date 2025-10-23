# Plan implementacji widoku Dashboard (Strona główna)

## 1. Przegląd

Widok Dashboard (strona główna) jest centralnym punktem startowym aplikacji po zalogowaniu użytkownika. Zapewnia szybki przegląd najważniejszych informacji: aktywnego treningu (jeśli istnieje), ostatnio zakończonego treningu, wykresu objętości treningowej z ostatnich 4 tygodni oraz szybkich akcji do rozpoczęcia treningu lub przeglądania historii.

Widok realizuje kluczowe funkcjonalności:
- Motywowanie użytkownika do działania (CTA do kontynuacji/rozpoczęcia treningu)
- Wizualizacja postępów (wykres objętości)
- Szybki dostęp do najważniejszych funkcji
- Kontekst ostatniej aktywności treningowej

Widok wspiera historyjki użytkownika US-030 (kontynuacja aktywnego treningu), US-022 (rozpoczęcie treningu), US-029 (podsumowanie treningu), US-035 (wykres objętości).

## 2. Routing widoku

**Ścieżka:** `/`

**Typ renderowania:** Server-side rendering (domyślne dla Astro w trybie `output: "server"`)

**Ochrona trasy:** Wymaga autoryzacji (chronione przez middleware `src/middleware/index.ts`)

## 3. Struktura komponentów

```
src/pages/index.astro (Główna strona Astro - SSR)
├── src/layouts/MainLayout.astro (Layout z nawigacją)
└── src/components/dashboard/
    ├── DashboardHero.tsx (React - Hero section z aktywnym treningiem lub CTA)
    │   └── ActiveWorkoutBanner.tsx (React - Banner z aktywnym treningiem)
    ├── LastWorkoutSummary.tsx (React - Podsumowanie ostatniego treningu)
    │   └── WorkoutSummaryCard.tsx (React - Reużywalna karta z metrykami)
    ├── VolumeChart.tsx (React - Wykres objętości z Recharts)
    └── QuickActions.tsx (React - Szybkie akcje)
```

**Uzasadnienie strategii komponentów:**
- Strona główna jako Astro component - wykorzystuje SSR do pobrania danych (aktywny trening, ostatni trening, statystyki)
- `DashboardHero` jako React component - warunkowe renderowanie (aktywny vs. brak aktywnego treningu)
- `ActiveWorkoutBanner` jako React component - wyświetlany na wszystkich stronach gdy trening aktywny (sticky)
- `LastWorkoutSummary` jako React component - prezentacja danych z możliwością interakcji (link do szczegółów)
- `VolumeChart` jako React component - interaktywny wykres Recharts z tooltipami
- `QuickActions` jako React component - interaktywne przyciski z nawigacją

## 4. Szczegóły komponentów

### 4.1. index.astro (Strona główna)

**Opis komponentu:**
Główna strona Astro odpowiedzialna za:
- Server-side rendering widoku Dashboard
- Pobranie aktywnego treningu (GET /api/workouts/active)
- Pobranie ostatniego zakończonego treningu (GET /api/workouts?status=completed&limit=1&sort=completed_at&order=desc)
- Pobranie statystyk do wykresu (GET /api/workouts/stats?period=4w)
- Walidację autoryzacji użytkownika
- Obsługę błędów ładowania danych
- Przekazanie danych do komponentów React

**Główne elementy:**
- Import layoutu `MainLayout.astro`
- Trzy równoległe wywołania API (Promise.all dla wydajności)
- Sekcja `<main>` z responsive containerem
- Conditional rendering dla różnych stanów (nowy użytkownik, aktywny trening, standardowy widok)
- Przekazanie danych przez props do komponentów React

**Obsługiwane zdarzenia:**
- Brak (strona SSR, zdarzenia obsługiwane w komponentach React)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (`locals.user` istnieje)
- Zapytania do API/bazy muszą się powieść (obsługa `error`)
- Dane mogą być puste dla nowych użytkowników (empty states)

**Typy:**
- `WorkoutDetailDTO | null` - aktywny trening
- `WorkoutListItemDTO | null` - ostatni zakończony trening
- `WorkoutStatsAggregateDTO` - dane do wykresu
- `SupabaseClient` - klient Supabase z kontekstu

**Propsy:**
Brak (główna strona Astro)

---

### 4.2. DashboardHero.tsx

**Opis komponentu:**
Sekcja Hero Dashboard wyświetlająca:
- Banner z aktywnym treningiem i CTA "Kontynuuj trening" (jeśli trening aktywny)
- Motywujący komunikat i CTA "Rozpocznij trening" (jeśli brak aktywnego treningu)

**Główne elementy:**
- Conditional rendering na podstawie `activeWorkout`
- Jeśli `activeWorkout` istnieje:
  - Wyświetl `ActiveWorkoutBanner` z danymi treningu
  - CTA Button do `/workouts/active`
- Jeśli brak:
  - Motywujący nagłówek H1 (np. "Gotowy na trening?")
  - Opis zachęcający do działania
  - CTA Button do wyboru planu i rozpoczęcia treningu
- Gradient background lub obrazek hero
- Responsywny layout (vertical mobile, horizontal desktop)

**Obsługiwane zdarzenia:**
- `onClick` na CTA - nawigacja do odpowiedniego widoku

**Warunki walidacji:**
- `activeWorkout` może być `null` (nowy użytkownik lub brak aktywnego treningu)
- Jeśli `activeWorkout` istnieje, musi zawierać `id`, `plan_name`, `started_at`

**Typy:**
- `activeWorkout: WorkoutDetailDTO | null`

**Propsy:**
```typescript
interface DashboardHeroProps {
  activeWorkout: WorkoutDetailDTO | null;
}
```

---

### 4.3. ActiveWorkoutBanner.tsx

**Opis komponentu:**
Sticky banner wyświetlany na wszystkich stronach aplikacji gdy użytkownik ma aktywny trening. Pokazuje kluczowe informacje i CTA do kontynuacji.

**Główne elementy:**
- Sticky positioning (top lub bottom w zależności od UX)
- Nazwa planu treningowego
- Czas trwania treningu (live timer lub czas od rozpoczęcia)
- Liczba wykonanych/wszystkich serii (np. "8/15 serii wykonanych")
- CTA Button "Kontynuuj trening" → `/workouts/active`
- Przycisk zamknięcia banera (opcjonalnie, z localStorage do zapamiętania)
- Wyróżniająca się kolorystyka (np. gradient, accent color)

**Obsługiwane zdarzenia:**
- `onClick` CTA - nawigacja do `/workouts/active`
- `onClick` zamknięcie - ukrycie banera (zapamiętanie w localStorage)

**Warunki walidacji:**
- `workout.id` - niepusty string
- `workout.started_at` - valid ISO date string
- `completedSets` i `totalSets` - liczby >= 0

**Typy:**
- `workout: WorkoutDetailDTO`
- `completedSets: number`
- `totalSets: number`

**Propsy:**
```typescript
interface ActiveWorkoutBannerProps {
  workout: WorkoutDetailDTO;
}
```

---

### 4.4. LastWorkoutSummary.tsx

**Opis komponentu:**
Podsumowanie ostatniego zakończonego treningu. Wyświetla kluczowe metryki i link do szczegółów treningu. Służy jako punkt odniesienia i motywacji.

**Główne elementy:**
- `<section>` z nagłówkiem "Ostatni trening"
- Jeśli `lastWorkout` istnieje:
  - Wyświetl `WorkoutSummaryCard` z metrykami
  - Link "Zobacz szczegóły" → `/workouts/{id}/summary`
- Jeśli brak:
  - Empty state z komunikatem "Nie wykonałeś jeszcze żadnego treningu"
  - CTA "Rozpocznij pierwszy trening"
- Data i godzina treningu
- Nazwa planu
- Kluczowe statystyki (czas, objętość, serie, powtórzenia)

**Obsługiwane zdarzenia:**
- `onClick` na link/kartę - nawigacja do szczegółów treningu

**Warunki walidacji:**
- `lastWorkout` może być `null` (nowy użytkownik)
- Jeśli istnieje, musi zawierać `id`, `started_at`, `stats`

**Typy:**
- `lastWorkout: WorkoutListItemDTO | null`

**Propsy:**
```typescript
interface LastWorkoutSummaryProps {
  lastWorkout: WorkoutListItemDTO | null;
}
```

---

### 4.5. WorkoutSummaryCard.tsx

**Opis komponentu:**
Reużywalna karta do wyświetlania podsumowania treningu. Używana w Dashboard, historii treningów i innych miejscach. Prezentuje metryki w czytelnej formie.

**Główne elementy:**
- Card component z shadcn/ui
- Grid lub flex layout dla metryk
- Ikony Lucide dla każdej metryki:
  - Clock - czas trwania
  - Dumbbell - objętość
  - Hash - liczba serii
  - Repeat - liczba powtórzeń
  - Weight - maksymalny ciężar (opcjonalnie)
- Formatowanie wartości (np. 90 min → "1h 30min")
- Wyróżnienie głównej metryki (objętość)
- Opcjonalny link do szczegółów

**Obsługiwane zdarzenia:**
- `onClick` (jeśli klikalna) - nawigacja do szczegółów

**Warunki walidacji:**
- `stats` musi zawierać wszystkie wymagane pola
- Wartości liczbowe muszą być >= 0

**Typy:**
- `stats: WorkoutStatsDTO`
- `planName: string`
- `date: string` (ISO 8601)
- `workoutId?: string` (opcjonalny, dla linku)

**Propsy:**
```typescript
interface WorkoutSummaryCardProps {
  stats: WorkoutStatsDTO;
  planName: string;
  date: string;
  workoutId?: string;
  onClick?: () => void;
}
```

---

### 4.6. VolumeChart.tsx

**Opis komponentu:**
Interaktywny wykres liniowy lub słupkowy pokazujący objętość treningową w czasie. Używa biblioteki Recharts. Wyświetla dane z ostatnich 4 tygodni (domyślnie).

**Główne elementy:**
- Import Recharts: `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`
- ResponsiveContainer dla adaptacyjnej szerokości
- XAxis - formatowanie dat (dd.MM)
- YAxis - objętość w kg
- Tooltip - szczegóły przy najechaniu (data, plan, objętość)
- Grid dla lepszej czytelności
- Gradient lub accent color dla linii/słupków
- Empty state gdy brak danych ("Wykonaj trening, aby zobaczyć wykres")
- Legenda (opcjonalnie)

**Obsługiwane zdarzenia:**
- `onMouseOver` na punktach wykresu - wyświetlenie tooltip
- `onClick` na punkt (opcjonalnie) - nawigacja do szczegółów treningu

**Warunki walidacji:**
- `data` może być pustą tablicą (nowy użytkownik)
- Każdy element `data` musi zawierać `date`, `total_volume`

**Typy:**
- `data: WorkoutStatsDataPointDTO[]`
- `period: string` (np. "4w")

**Propsy:**
```typescript
interface VolumeChartProps {
  data: WorkoutStatsDataPointDTO[];
  period?: string;
}
```

**Implementacja Recharts:**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="date"
      tickFormatter={(value) => new Date(value).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
    />
    <YAxis
      label={{ value: 'Objętość (kg)', angle: -90, position: 'insideLeft' }}
    />
    <Tooltip
      labelFormatter={(value) => new Date(value).toLocaleDateString('pl-PL')}
      formatter={(value: number) => [`${value} kg`, 'Objętość']}
    />
    <Line
      type="monotone"
      dataKey="total_volume"
      stroke="#3b82f6"
      strokeWidth={2}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
    />
  </LineChart>
</ResponsiveContainer>
```

---

### 4.7. QuickActions.tsx

**Opis komponentu:**
Sekcja z szybkimi akcjami do najważniejszych funkcji aplikacji. Ułatwia nawigację i zachęca do działania.

**Główne elementy:**
- Grid lub flex layout (2 kolumny mobile, 3-4 desktop)
- Przyciski/karty z ikonami i tekstem:
  - "Rozpocznij trening" → `/workout-plans` (wybór planu)
  - "Zobacz historię" → `/workouts/history`
  - "Moje plany" → `/workout-plans`
  - "Przeglądaj ćwiczenia" → `/exercises`
- Ikony Lucide odpowiednie do akcji
- Wyróżnienie głównej akcji (większy przycisk lub accent color)
- Hover effects

**Obsługiwane zdarzenia:**
- `onClick` na każdym przycisku - nawigacja do odpowiedniego widoku

**Warunki walidacji:**
- Brak (komponent prezentacyjny z hardcoded links)

**Typy:**
Brak zewnętrznych propsów

**Propsy:**
```typescript
interface QuickActionsProps {
  // Opcjonalnie: można przekazać flagę czy użytkownik ma plany treningowe
  hasWorkoutPlans?: boolean;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Typy już zdefiniowane w projekcie

export type WorkoutDetailDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
  exercises: WorkoutExerciseDTO[];
};

export type WorkoutListItemDTO = Omit<Tables<"workouts">, "user_id"> & {
  plan_name: string;
  stats?: WorkoutStatsDTO;
};

export type WorkoutStatsDTO = Omit<Tables<"workout_stats">, "id" | "user_id" | "workout_id" | "created_at">;
// {
//   duration_minutes: number;
//   total_exercises: number;
//   total_sets: number;
//   total_reps: number;
//   max_weight: number;
//   total_volume: number;
// }

export interface WorkoutStatsDataPointDTO {
  id: string;
  date: string;
  plan_name: string;
  duration_minutes: number;
  total_volume: number;
  total_sets: number;
  total_reps: number;
}

export interface WorkoutStatsAggregateDTO {
  period: string;
  start_date: string;
  end_date: string;
  workouts: WorkoutStatsDataPointDTO[];
  summary: WorkoutStatsSummaryDTO;
}

export interface WorkoutStatsSummaryDTO {
  total_workouts: number;
  total_volume: number;
  avg_duration_minutes: number;
  avg_volume_per_workout: number;
}
```

### 5.2. Nowe typy (ViewModel)

```typescript
// src/components/dashboard/types.ts

import type {
  WorkoutDetailDTO,
  WorkoutListItemDTO,
  WorkoutStatsDataPointDTO,
  WorkoutStatsDTO
} from '@/types';

/**
 * Props dla DashboardHero
 */
export interface DashboardHeroProps {
  activeWorkout: WorkoutDetailDTO | null;
}

/**
 * Props dla ActiveWorkoutBanner
 */
export interface ActiveWorkoutBannerProps {
  workout: WorkoutDetailDTO;
}

/**
 * Props dla LastWorkoutSummary
 */
export interface LastWorkoutSummaryProps {
  lastWorkout: WorkoutListItemDTO | null;
}

/**
 * Props dla WorkoutSummaryCard
 */
export interface WorkoutSummaryCardProps {
  stats: WorkoutStatsDTO;
  planName: string;
  date: string;
  workoutId?: string;
  onClick?: () => void;
}

/**
 * Props dla VolumeChart
 */
export interface VolumeChartProps {
  data: WorkoutStatsDataPointDTO[];
  period?: string;
}

/**
 * Props dla QuickActions
 */
export interface QuickActionsProps {
  hasWorkoutPlans?: boolean;
}

/**
 * ViewModel dla Dashboard - agreguje wszystkie dane
 */
export interface DashboardViewModel {
  activeWorkout: WorkoutDetailDTO | null;
  lastWorkout: WorkoutListItemDTO | null;
  volumeChartData: WorkoutStatsDataPointDTO[];
  hasWorkoutPlans: boolean;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan server-side (Astro)

**Źródło danych:** Supabase PostgreSQL + API endpoints

**Zapytania (równoległe dla wydajności):**
```typescript
// Promise.all dla równoległego pobrania danych
const [activeWorkoutResponse, lastWorkoutResponse, statsResponse] = await Promise.all([
  // 1. Aktywny trening
  fetch(`${Astro.url.origin}/api/workouts/active`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  }),

  // 2. Ostatni zakończony trening
  fetch(`${Astro.url.origin}/api/workouts?status=completed&limit=1&sort=completed_at&order=desc`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  }),

  // 3. Statystyki do wykresu (ostatnie 4 tygodnie)
  fetch(`${Astro.url.origin}/api/workouts/stats?period=4w`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  })
]);

// Parse responses
const activeWorkout: WorkoutDetailDTO | null = activeWorkoutResponse.status === 200
  ? (await activeWorkoutResponse.json()).data
  : null;

const lastWorkoutData = lastWorkoutResponse.ok ? await lastWorkoutResponse.json() : null;
const lastWorkout: WorkoutListItemDTO | null = lastWorkoutData?.data?.[0] || null;

const statsData = statsResponse.ok ? await statsResponse.json() : null;
const volumeChartData: WorkoutStatsDataPointDTO[] = statsData?.data?.workouts || [];
```

**Transformacja danych:**
```typescript
// Dane są już w odpowiednim formacie DTO z API
// Nie wymaga transformacji, poza obsługą null dla nowych użytkowników

const dashboardData: DashboardViewModel = {
  activeWorkout,
  lastWorkout,
  volumeChartData,
  hasWorkoutPlans: false // TODO: dodać zapytanie do planów jeśli potrzebne
};
```

### 6.2. Stan client-side (React)

**Brak globalnego stanu** - dane są przekazywane przez props z Astro do React.

**Stan lokalny w ActiveWorkoutBanner:**
- `timeElapsed: string` - czas trwania treningu (live timer)
- `isBannerDismissed: boolean` - czy użytkownik zamknął banner (localStorage)
- Stan zarządzany przez `useState` i `useEffect` (interval dla timera)

**Stan lokalny w VolumeChart:**
- Brak (Recharts zarządza stanem wewnętrznie dla tooltipów i interakcji)

**Custom hook `useWorkoutTimer`:**
```typescript
// src/components/hooks/useWorkoutTimer.ts
import { useState, useEffect } from 'react';

export function useWorkoutTimer(startedAt: string) {
  const [timeElapsed, setTimeElapsed] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startedAt);
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      setTimeElapsed(hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return timeElapsed;
}
```

## 7. Integracja API

### 7.1. Endpointy używane

**1. GET /api/workouts/active**

**Endpoint:** `/api/workouts/active`

**Metoda:** GET

**Typ:** Read-only

**Query Parameters:** Brak

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
        "exercise": {
          "name": "Barbell Bench Press"
        },
        "sets": [
          {
            "id": "uuid",
            "planned_reps": 10,
            "actual_reps": 10,
            "completed": true
          }
        ]
      }
    ]
  }
}
```

**Response (204 No Content):**
Brak aktywnego treningu (nowy użytkownik lub trening zakończony)

**Autoryzacja:** Wymagane (Bearer token w cookies)

---

**2. GET /api/workouts?status=completed&limit=1&sort=completed_at&order=desc**

**Endpoint:** `/api/workouts`

**Metoda:** GET

**Query Parameters:**
- `status=completed` - tylko zakończone treningi
- `limit=1` - tylko ostatni trening
- `sort=completed_at` - sortowanie po dacie zakończenia
- `order=desc` - od najnowszych

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "plan_name": "Push Day",
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
  ],
  "pagination": {
    "page": 1,
    "limit": 1,
    "total": 25,
    "total_pages": 25
  }
}
```

**Autoryzacja:** Wymagane

---

**3. GET /api/workouts/stats?period=4w**

**Endpoint:** `/api/workouts/stats`

**Metoda:** GET

**Query Parameters:**
- `period=4w` - ostatnie 4 tygodnie

**Response (200 OK):**
```json
{
  "data": {
    "period": "4w",
    "start_date": "2023-12-21",
    "end_date": "2024-01-20",
    "workouts": [
      {
        "id": "uuid",
        "date": "2024-01-15",
        "plan_name": "Push Day",
        "duration_minutes": 90,
        "total_volume": 8500.0,
        "total_sets": 15,
        "total_reps": 120
      }
    ],
    "summary": {
      "total_workouts": 8,
      "total_volume": 65000.0,
      "avg_duration_minutes": 87,
      "avg_volume_per_workout": 8125.0
    }
  }
}
```

**Autoryzacja:** Wymagane

---

### 7.2. Obsługa błędów API

**Scenariusze błędów:**
1. Błąd autoryzacji (401) - użytkownik niezalogowany
2. Błąd serwera (500) - problem z API/bazą
3. Brak danych (204/empty array) - nowy użytkownik

**Obsługa:**
```typescript
// Obsługa 401
if (activeWorkoutResponse.status === 401) {
  return Astro.redirect('/auth/login');
}

// Obsługa 500
if (activeWorkoutResponse.status === 500) {
  console.error('API error: Failed to fetch active workout');
  // Kontynuuj z null, wyświetl toast error w UI
}

// Obsługa 204 (brak danych)
const activeWorkout = activeWorkoutResponse.status === 200
  ? (await activeWorkoutResponse.json()).data
  : null;
```

## 8. Interakcje użytkownika

### 8.1. Wejście na Dashboard

**Akcja:** Użytkownik loguje się lub wchodzi na `/`

**Przepływ:**
1. Middleware sprawdza autoryzację
2. Astro wykonuje SSR i pobiera dane z 3 endpointów równolegle
3. Strona renderuje się z danymi
4. Użytkownik widzi hero section, ostatni trening, wykres i quick actions

**Oczekiwany wynik:**
- Dashboard załadowany < 2s
- Wszystkie sekcje wyświetlone poprawnie
- Jeśli aktywny trening - banner sticky widoczny

### 8.2. Kontynuacja aktywnego treningu

**Akcja:** Użytkownik klika "Kontynuuj trening" w hero lub bannerze

**Przepływ:**
1. Kliknięcie CTA w `DashboardHero` lub `ActiveWorkoutBanner`
2. Nawigacja do `/workouts/active`
3. Widok aktywnego treningu ładuje się z danymi

**Oczekiwany wynik:**
- Przekierowanie do widoku aktywnego treningu
- Stan treningu zachowany (serie oznaczone jako wykonane pozostają wykonane)

### 8.3. Rozpoczęcie nowego treningu

**Akcja:** Użytkownik klika "Rozpocznij trening" (brak aktywnego treningu)

**Przepływ:**
1. Kliknięcie CTA w `DashboardHero` lub `QuickActions`
2. Nawigacja do `/workout-plans` (lista planów)
3. Użytkownik wybiera plan i rozpoczyna trening

**Oczekiwany wynik:**
- Przekierowanie do wyboru planu
- Po wyborze planu - utworzenie aktywnego treningu

### 8.4. Przeglądanie wykresu objętości

**Akcja:** Użytkownik najeżdża kursorem na punkty wykresu

**Przepływ:**
1. Hover nad punktem w `VolumeChart`
2. Tooltip Recharts wyświetla się z danymi (data, plan, objętość)
3. Punkt powiększa się (activeDot)

**Oczekiwany wynik:**
- Smooth tooltip animation
- Czytelne informacje w tooltipie
- Wizualny feedback (powiększony punkt)

### 8.5. Nawigacja do szczegółów ostatniego treningu

**Akcja:** Użytkownik klika na kartę ostatniego treningu lub link "Zobacz szczegóły"

**Przepływ:**
1. Kliknięcie na `WorkoutSummaryCard` lub link w `LastWorkoutSummary`
2. Nawigacja do `/workouts/{id}/summary`
3. Widok szczegółów treningu ładuje się

**Oczekiwany wynik:**
- Przekierowanie do podsumowania treningu
- Wszystkie szczegóły treningu widoczne

### 8.6. Empty states dla nowych użytkowników

**Akcja:** Nowy użytkownik (bez treningów) wchodzi na Dashboard

**Przepływ:**
1. API zwraca null/puste tablice dla wszystkich zapytań
2. Dashboard renderuje się z empty states:
   - Hero: Motywujący komunikat + CTA "Rozpocznij pierwszy trening"
   - Ostatni trening: "Nie wykonałeś jeszcze żadnego treningu"
   - Wykres: "Wykonaj trening, aby zobaczyć wykres postępów"

**Oczekiwany wynik:**
- Czytelne komunikaty zachęcające do działania
- CTA wyraźnie widoczne
- Brak broken UI (wszystkie sekcje renderują się poprawnie)

## 9. Warunki i walidacja

### 9.1. Walidacja autoryzacji

**Komponent:** Middleware (`src/middleware/index.ts`)

**Warunek:** `locals.user` musi istnieć

**Efekt niepowodzenia:** Przekierowanie do `/auth/login`

### 9.2. Walidacja danych z API

**Komponent:** `index.astro`

**Warunki:**
- `activeWorkout` może być `null` (OK dla nowych użytkowników lub gdy trening zakończony)
- `lastWorkout` może być `null` (OK dla nowych użytkowników)
- `volumeChartData` może być pustą tablicą `[]` (OK dla nowych użytkowników)
- Jeśli API zwraca błąd (500), loguj i kontynuuj z null/pustymi danymi

**Efekt niepowodzenia:**
- Jeśli 401: Przekierowanie do `/auth/login`
- Jeśli 500: Toast error + wyświetlenie empty states
- Jeśli brak danych (nowy użytkownik): Wyświetlenie empty states

### 9.3. Walidacja propsów komponentów

**Komponent:** `ActiveWorkoutBanner.tsx`

**Warunki:**
- `workout.id` - niepusty string (UUID)
- `workout.started_at` - valid ISO 8601 date string
- `workout.plan_name` - niepusty string

**Efekt niepowodzenia:**
- Console warning (dev mode)
- Komponent nie renderuje się (return null)

**Implementacja:**
```typescript
if (!workout?.id || !workout?.started_at || !workout?.plan_name) {
  console.warn('Invalid workout data for ActiveWorkoutBanner:', workout);
  return null;
}
```

**Komponent:** `VolumeChart.tsx`

**Warunki:**
- `data` może być pustą tablicą (wyświetl empty state)
- Każdy element `data` musi zawierać `date` i `total_volume`

**Efekt niepowodzenia:**
- Jeśli `data.length === 0`: Wyświetl empty state
- Jeśli invalid data: Console error + nie renderuj wykresu

### 9.4. Walidacja dat i czasu

**Komponent:** `useWorkoutTimer` hook

**Warunek:** `startedAt` musi być valid ISO 8601 date string

**Efekt niepowodzenia:**
- Jeśli `new Date(startedAt)` zwraca Invalid Date: Wyświetl "0min"

**Implementacja:**
```typescript
const start = new Date(startedAt);
if (isNaN(start.getTime())) {
  console.error('Invalid startedAt date:', startedAt);
  return '0min';
}
```

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik próbuje uzyskać dostęp do `/` bez zalogowania

**Obsługa:**
- Middleware przekierowuje do `/auth/login`
- Po zalogowaniu użytkownik wraca do `/`

**Komunikat:** Toast info: "Zaloguj się, aby uzyskać dostęp do aplikacji"

### 10.2. Błąd API (500)

**Scenariusz:** Jeden lub więcej endpointów API zwraca błąd 500

**Obsługa:**
```typescript
if (activeWorkoutResponse.status === 500) {
  console.error('API error: Failed to fetch active workout');
  // Kontynuuj z activeWorkout = null
}

if (statsResponse.status === 500) {
  console.error('API error: Failed to fetch workout stats');
  // Kontynuuj z volumeChartData = []
}
```

**Komunikat:** Toast error: "Wystąpił problem z ładowaniem danych. Odśwież stronę."

**UI Fallback:**
- Aktywny trening: Wyświetl hero bez banneru
- Wykres: Wyświetl empty state "Nie można załadować wykresu"

### 10.3. Nowy użytkownik (brak danych)

**Scenariusz:** Wszystkie API zwracają null/puste tablice (użytkownik nie ma treningów)

**Obsługa:**
- Wyświetlenie empty states we wszystkich sekcjach
- Motywujące komunikaty + CTA do rozpoczęcia treningu

**UI Empty States:**

**Hero:**
```tsx
<div className="text-center py-12">
  <h1 className="text-4xl font-bold mb-4">Witaj w Gym Track!</h1>
  <p className="text-lg text-neutral-600 mb-6">
    Zacznij śledzić swoje postępy treningowe już dziś
  </p>
  <Button asChild size="lg">
    <a href="/workout-plans">Rozpocznij pierwszy trening</a>
  </Button>
</div>
```

**Ostatni trening:**
```tsx
<div className="text-center py-8 bg-neutral-50 rounded-lg">
  <p className="text-neutral-600 mb-4">Nie wykonałeś jeszcze żadnego treningu</p>
  <Button asChild variant="outline">
    <a href="/workout-plans">Rozpocznij trening</a>
  </Button>
</div>
```

**Wykres:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <BarChart className="w-16 h-16 text-neutral-400 mb-4" />
  <p className="text-neutral-600">
    Wykonaj trening, aby zobaczyć wykres postępów
  </p>
</div>
```

### 10.4. Błąd parsowania daty

**Scenariusz:** API zwraca nieprawidłowy format daty

**Obsługa:**
- Try/catch przy parsowaniu dat
- Fallback do aktualnej daty lub "N/A"

**Implementacja:**
```typescript
try {
  const date = new Date(workout.started_at);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  // Użyj daty
} catch (error) {
  console.error('Failed to parse date:', error);
  // Fallback
  const displayDate = 'N/A';
}
```

### 10.5. Błąd Recharts (wykres)

**Scenariusz:** Recharts nie może renderować wykresu (nieprawidłowe dane)

**Obsługa:**
- Error boundary wokół `VolumeChart`
- Fallback UI: "Nie można wyświetlić wykresu"

**Implementacja:**
```tsx
// ErrorBoundary w parent component
<ErrorBoundary fallback={<ChartErrorFallback />}>
  <VolumeChart data={volumeChartData} />
</ErrorBoundary>
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1.1. Utwórz katalog komponentów:
```bash
mkdir -p src/components/dashboard
mkdir -p src/components/hooks
```

1.2. Utwórz pliki komponentów:
```bash
touch src/components/dashboard/DashboardHero.tsx
touch src/components/dashboard/ActiveWorkoutBanner.tsx
touch src/components/dashboard/LastWorkoutSummary.tsx
touch src/components/dashboard/WorkoutSummaryCard.tsx
touch src/components/dashboard/VolumeChart.tsx
touch src/components/dashboard/QuickActions.tsx
touch src/components/dashboard/types.ts
```

1.3. Utwórz custom hook:
```bash
touch src/components/hooks/useWorkoutTimer.ts
```

1.4. Strona główna Astro już istnieje:
```bash
# src/pages/index.astro - modyfikuj istniejący plik
```

---

### Krok 2: Instalacja zależności

2.1. Zainstaluj Recharts:
```bash
npm install recharts
```

2.2. Zainstaluj typy dla Recharts:
```bash
npm install -D @types/recharts
```

---

### Krok 3: Definicja typów

3.1. W pliku `src/components/dashboard/types.ts`:

```typescript
import type {
  WorkoutDetailDTO,
  WorkoutListItemDTO,
  WorkoutStatsDataPointDTO,
  WorkoutStatsDTO
} from '@/types';

export interface DashboardHeroProps {
  activeWorkout: WorkoutDetailDTO | null;
}

export interface ActiveWorkoutBannerProps {
  workout: WorkoutDetailDTO;
}

export interface LastWorkoutSummaryProps {
  lastWorkout: WorkoutListItemDTO | null;
}

export interface WorkoutSummaryCardProps {
  stats: WorkoutStatsDTO;
  planName: string;
  date: string;
  workoutId?: string;
  onClick?: () => void;
}

export interface VolumeChartProps {
  data: WorkoutStatsDataPointDTO[];
  period?: string;
}

export interface QuickActionsProps {
  hasWorkoutPlans?: boolean;
}

export interface DashboardViewModel {
  activeWorkout: WorkoutDetailDTO | null;
  lastWorkout: WorkoutListItemDTO | null;
  volumeChartData: WorkoutStatsDataPointDTO[];
  hasWorkoutPlans: boolean;
}
```

---

### Krok 4: Implementacja custom hook useWorkoutTimer

4.1. W `src/components/hooks/useWorkoutTimer.ts`:

```typescript
import { useState, useEffect } from 'react';

/**
 * Hook do obliczania czasu trwania treningu w czasie rzeczywistym
 * @param startedAt - ISO 8601 date string
 * @returns Sformatowany czas trwania (np. "1h 30min" lub "45min")
 */
export function useWorkoutTimer(startedAt: string): string {
  const [timeElapsed, setTimeElapsed] = useState('0min');

  useEffect(() => {
    // Walidacja daty
    const start = new Date(startedAt);
    if (isNaN(start.getTime())) {
      console.error('Invalid startedAt date:', startedAt);
      return;
    }

    // Funkcja aktualizacji czasu
    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      if (hours > 0) {
        setTimeElapsed(`${hours}h ${minutes}min`);
      } else {
        setTimeElapsed(`${minutes}min`);
      }
    };

    // Inicjalne wywołanie
    updateTime();

    // Interval co sekundę
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return timeElapsed;
}
```

---

### Krok 5: Implementacja WorkoutSummaryCard (reużywalny)

5.1. W `src/components/dashboard/WorkoutSummaryCard.tsx`:

```tsx
import { Clock, Dumbbell, Hash, Repeat, Weight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkoutSummaryCardProps } from './types';

/**
 * Formatuje czas trwania z minut na czytelny format
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

/**
 * Formatuje datę do polskiego formatu
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function WorkoutSummaryCard({
  stats,
  planName,
  date,
  workoutId,
  onClick
}: WorkoutSummaryCardProps) {
  const Component = onClick || workoutId ? 'button' : 'div';
  const href = workoutId ? `/workouts/${workoutId}/summary` : undefined;

  const content = (
    <>
      <CardHeader>
        <CardTitle className="text-lg">{planName}</CardTitle>
        <p className="text-sm text-neutral-600">{formatDate(date)}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Czas trwania */}
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-sm text-neutral-600">Czas</p>
              <p className="text-lg font-semibold">
                {formatDuration(stats.duration_minutes)}
              </p>
            </div>
          </div>

          {/* Objętość - wyróżniona */}
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-neutral-600">Objętość</p>
              <p className="text-lg font-bold text-blue-600">
                {stats.total_volume.toLocaleString('pl-PL')} kg
              </p>
            </div>
          </div>

          {/* Serie */}
          <div className="flex items-center space-x-2">
            <Hash className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-sm text-neutral-600">Serie</p>
              <p className="text-lg font-semibold">{stats.total_sets}</p>
            </div>
          </div>

          {/* Powtórzenia */}
          <div className="flex items-center space-x-2">
            <Repeat className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-sm text-neutral-600">Powtórzenia</p>
              <p className="text-lg font-semibold">{stats.total_reps}</p>
            </div>
          </div>

          {/* Maks. ciężar (opcjonalnie) */}
          {stats.max_weight > 0 && (
            <div className="flex items-center space-x-2">
              <Weight className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-sm text-neutral-600">Maks. ciężar</p>
                <p className="text-lg font-semibold">{stats.max_weight} kg</p>
              </div>
            </div>
          )}

          {/* Ćwiczenia */}
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-sm text-neutral-600">Ćwiczenia</p>
              <p className="text-lg font-semibold">{stats.total_exercises}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );

  if (href && !onClick) {
    return (
      <Card asChild className="hover:shadow-lg transition-shadow">
        <a href={href}>{content}</a>
      </Card>
    );
  }

  if (onClick) {
    return (
      <Card
        asChild
        className="cursor-pointer hover:shadow-lg transition-shadow"
      >
        <button onClick={onClick} type="button">
          {content}
        </button>
      </Card>
    );
  }

  return <Card>{content}</Card>;
}
```

---

### Krok 6: Implementacja ActiveWorkoutBanner

6.1. W `src/components/dashboard/ActiveWorkoutBanner.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkoutTimer } from '@/components/hooks/useWorkoutTimer';
import type { ActiveWorkoutBannerProps } from './types';

export function ActiveWorkoutBanner({ workout }: ActiveWorkoutBannerProps) {
  // Walidacja danych
  if (!workout?.id || !workout?.started_at || !workout?.plan_name) {
    console.warn('Invalid workout data for ActiveWorkoutBanner:', workout);
    return null;
  }

  const [isDismissed, setIsDismissed] = useState(false);
  const timeElapsed = useWorkoutTimer(workout.started_at);

  // Sprawdź localStorage przy montowaniu
  useEffect(() => {
    const dismissed = localStorage.getItem(`banner-dismissed-${workout.id}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [workout.id]);

  // Oblicz liczbę wykonanych serii
  const totalSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0
  );
  const completedSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`banner-dismissed-${workout.id}`, 'true');
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Play className="w-5 h-5" />
            <div>
              <p className="font-semibold">{workout.plan_name}</p>
              <p className="text-sm text-blue-100">
                {timeElapsed} • {completedSets}/{totalSets} serii wykonanych
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button asChild variant="secondary" size="sm">
              <a href="/workouts/active">Kontynuuj trening</a>
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-blue-500 rounded"
              aria-label="Zamknij banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Krok 7: Implementacja DashboardHero

7.1. W `src/components/dashboard/DashboardHero.tsx`:

```tsx
import { Dumbbell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveWorkoutBanner } from './ActiveWorkoutBanner';
import type { DashboardHeroProps } from './types';

export function DashboardHero({ activeWorkout }: DashboardHeroProps) {
  if (activeWorkout) {
    return (
      <section className="mb-8">
        <ActiveWorkoutBanner workout={activeWorkout} />
      </section>
    );
  }

  return (
    <section className="mb-12 bg-gradient-to-br from-blue-50 to-neutral-50 rounded-lg p-8 md:p-12">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <Dumbbell className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
          Gotowy na trening?
        </h1>

        <p className="text-lg md:text-xl text-neutral-600 mb-8">
          Śledź swoje postępy, buduj mięśnie i osiągaj cele treningowe z Gym Track
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <a href="/workout-plans">
              <Play className="w-5 h-5 mr-2" />
              Rozpocznij trening
            </a>
          </Button>

          <Button asChild variant="outline" size="lg">
            <a href="/workouts/history">
              <TrendingUp className="w-5 h-5 mr-2" />
              Zobacz postępy
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

---

### Krok 8: Implementacja LastWorkoutSummary

8.1. W `src/components/dashboard/LastWorkoutSummary.tsx`:

```tsx
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkoutSummaryCard } from './WorkoutSummaryCard';
import type { LastWorkoutSummaryProps } from './types';

export function LastWorkoutSummary({ lastWorkout }: LastWorkoutSummaryProps) {
  if (!lastWorkout || !lastWorkout.stats) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Ostatni trening
        </h2>
        <div className="bg-neutral-50 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 mb-4">
            Nie wykonałeś jeszcze żadnego treningu
          </p>
          <Button asChild variant="outline">
            <a href="/workout-plans">Rozpocznij trening</a>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-neutral-900">Ostatni trening</h2>
        <Button asChild variant="link">
          <a href={`/workouts/${lastWorkout.id}/summary`}>
            Zobacz szczegóły →
          </a>
        </Button>
      </div>

      <WorkoutSummaryCard
        stats={lastWorkout.stats}
        planName={lastWorkout.plan_name}
        date={lastWorkout.completed_at || lastWorkout.started_at}
        workoutId={lastWorkout.id}
      />
    </section>
  );
}
```

---

### Krok 9: Implementacja VolumeChart

9.1. W `src/components/dashboard/VolumeChart.tsx`:

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { BarChart } from 'lucide-react';
import type { VolumeChartProps } from './types';

/**
 * Custom Tooltip dla wykresu
 */
function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-neutral-900 mb-1">
        {new Date(data.date).toLocaleDateString('pl-PL', {
          day: '2-digit',
          month: 'long'
        })}
      </p>
      <p className="text-sm text-neutral-600 mb-1">{data.plan_name}</p>
      <p className="text-lg font-bold text-blue-600">
        {data.total_volume.toLocaleString('pl-PL')} kg
      </p>
      <p className="text-sm text-neutral-500">
        {data.total_sets} serii • {data.duration_minutes} min
      </p>
    </div>
  );
}

export function VolumeChart({ data, period = '4w' }: VolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-neutral-50 rounded-lg">
        <BarChart className="w-16 h-16 text-neutral-400 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Brak danych do wykresu
        </h3>
        <p className="text-neutral-600 max-w-md">
          Wykonaj trening, aby zobaczyć wykres postępów objętości treningowej
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Objętość treningowa - ostatnie{' '}
        {period === '4w' ? '4 tygodnie' : period}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: '2-digit'
              })
            }
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />

          <YAxis
            label={{
              value: 'Objętość (kg)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '14px', fill: '#6b7280' }
            }}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="total_volume"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6, fill: '#2563eb' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

### Krok 10: Implementacja QuickActions

10.1. W `src/components/dashboard/QuickActions.tsx`:

```tsx
import { Play, History, Dumbbell, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuickActionsProps } from './types';

export function QuickActions({ hasWorkoutPlans = false }: QuickActionsProps) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">
        Szybkie akcje
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rozpocznij trening */}
        <Button
          asChild
          size="lg"
          className="h-auto flex-col py-6 bg-blue-600 hover:bg-blue-700"
        >
          <a href="/workout-plans">
            <Play className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Rozpocznij trening</span>
            <span className="text-sm text-blue-100 mt-1">
              Wybierz plan i zacznij
            </span>
          </a>
        </Button>

        {/* Zobacz historię */}
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-auto flex-col py-6"
        >
          <a href="/workouts/history">
            <History className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Zobacz historię</span>
            <span className="text-sm text-neutral-600 mt-1">
              Twoje treningi
            </span>
          </a>
        </Button>

        {/* Moje plany */}
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-auto flex-col py-6"
        >
          <a href="/workout-plans">
            <ClipboardList className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Moje plany</span>
            <span className="text-sm text-neutral-600 mt-1">
              Zarządzaj planami
            </span>
          </a>
        </Button>

        {/* Przeglądaj ćwiczenia */}
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-auto flex-col py-6"
        >
          <a href="/exercises">
            <Dumbbell className="w-8 h-8 mb-2" />
            <span className="text-lg font-semibold">Ćwiczenia</span>
            <span className="text-sm text-neutral-600 mt-1">
              Przeglądaj bazę
            </span>
          </a>
        </Button>
      </div>
    </section>
  );
}
```

---

### Krok 11: Implementacja strony Dashboard (index.astro)

11.1. W `src/pages/index.astro`:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { LastWorkoutSummary } from '@/components/dashboard/LastWorkoutSummary';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import type {
  WorkoutDetailDTO,
  WorkoutListItemDTO,
  WorkoutStatsDataPointDTO
} from '@/types';

// Sprawdź autoryzację
if (!Astro.locals.user) {
  return Astro.redirect('/auth/login');
}

// Pobierz dane równolegle dla wydajności
const [activeWorkoutResponse, lastWorkoutResponse, statsResponse] = await Promise.all([
  // 1. Aktywny trening
  fetch(`${Astro.url.origin}/api/workouts/active`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  }),

  // 2. Ostatni zakończony trening
  fetch(
    `${Astro.url.origin}/api/workouts?status=completed&limit=1&sort=completed_at&order=desc`,
    {
      headers: {
        'Cookie': Astro.request.headers.get('Cookie') || ''
      }
    }
  ),

  // 3. Statystyki do wykresu (ostatnie 4 tygodnie)
  fetch(`${Astro.url.origin}/api/workouts/stats?period=4w`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  })
]);

// Obsługa błędów autoryzacji
if (activeWorkoutResponse.status === 401 ||
    lastWorkoutResponse.status === 401 ||
    statsResponse.status === 401) {
  return Astro.redirect('/auth/login');
}

// Parse responses z obsługą błędów
let activeWorkout: WorkoutDetailDTO | null = null;
if (activeWorkoutResponse.status === 200) {
  try {
    const data = await activeWorkoutResponse.json();
    activeWorkout = data.data;
  } catch (error) {
    console.error('Failed to parse active workout:', error);
  }
}

let lastWorkout: WorkoutListItemDTO | null = null;
if (lastWorkoutResponse.ok) {
  try {
    const data = await lastWorkoutResponse.json();
    lastWorkout = data.data?.[0] || null;
  } catch (error) {
    console.error('Failed to parse last workout:', error);
  }
}

let volumeChartData: WorkoutStatsDataPointDTO[] = [];
if (statsResponse.ok) {
  try {
    const data = await statsResponse.json();
    volumeChartData = data.data?.workouts || [];
  } catch (error) {
    console.error('Failed to parse workout stats:', error);
  }
}
---

<MainLayout title="Dashboard - Gym Track">
  <main class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Hero Section -->
    <DashboardHero activeWorkout={activeWorkout} client:load />

    <!-- Grid Layout: Ostatni trening + Wykres -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Ostatni trening -->
      <div>
        <LastWorkoutSummary lastWorkout={lastWorkout} client:load />
      </div>

      <!-- Wykres objętości -->
      <div>
        <VolumeChart data={volumeChartData} period="4w" client:load />
      </div>
    </div>

    <!-- Szybkie akcje -->
    <QuickActions client:load />
  </main>
</MainLayout>
```

---

### Krok 12: Testowanie

12.1. **Test manualny - nowy użytkownik:**
- Zarejestruj nowe konto
- Zaloguj się
- Sprawdź czy Dashboard wyświetla się z empty states:
  - Hero: "Gotowy na trening?" + CTA
  - Ostatni trening: "Nie wykonałeś jeszcze żadnego treningu"
  - Wykres: "Wykonaj trening, aby zobaczyć wykres"
- Kliknij CTA "Rozpocznij trening" → sprawdź czy przekierowuje do `/workout-plans`

12.2. **Test manualny - użytkownik z treningami:**
- Zaloguj się jako użytkownik z historią treningów
- Sprawdź czy Dashboard wyświetla:
  - Kartę ostatniego treningu z poprawnymi metrykami
  - Wykres objętości z danymi z ostatnich 4 tygodni
  - Szybkie akcje

12.3. **Test aktywnego treningu:**
- Rozpocznij trening
- Wróć do Dashboard
- Sprawdź czy:
  - `ActiveWorkoutBanner` wyświetla się sticky na górze
  - Timer działa (aktualizuje się co sekundę)
  - Liczba wykonanych serii jest poprawna
  - CTA "Kontynuuj trening" przekierowuje do `/workouts/active`
- Zamknij banner (X) → sprawdź czy nie pojawia się ponownie po odświeżeniu strony

12.4. **Test wykresu:**
- Najedź kursorem na punkty wykresu → sprawdź czy tooltip wyświetla się poprawnie
- Sprawdź responsywność wykresu (zmień szerokość okna)
- Sprawdź czy formatowanie osi X i Y jest prawidłowe

12.5. **Test responsywności:**
- Sprawdź Dashboard na różnych rozmiarach ekranów:
  - Mobile (320px-640px): 1 kolumna
  - Tablet (641px-1024px): 2 kolumny dla sekcji głównych
  - Desktop (1025px+): 2 kolumny + 4 quick actions
- Sprawdź czy wszystkie elementy są czytelne i dostępne

12.6. **Test błędów:**
- Symuluj błąd API (500) → sprawdź czy empty states wyświetlają się poprawnie
- Wyloguj się i spróbuj wejść na `/` → sprawdź redirect do `/auth/login`
- Sprawdź console na błędy

---

### Krok 13: Dodanie ActiveWorkoutBanner do MainLayout (globalny)

13.1. Jeśli `ActiveWorkoutBanner` ma być widoczny na wszystkich stronach (sticky), dodaj go do `MainLayout.astro`:

```astro
---
// src/layouts/MainLayout.astro
import { ActiveWorkoutBanner } from '@/components/dashboard/ActiveWorkoutBanner';

// Pobierz aktywny trening jeśli użytkownik zalogowany
let activeWorkout = null;
if (Astro.locals.user) {
  const response = await fetch(`${Astro.url.origin}/api/workouts/active`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  });
  if (response.status === 200) {
    const data = await response.json();
    activeWorkout = data.data;
  }
}
---

<!DOCTYPE html>
<html lang="pl">
  <head>
    <!-- ... -->
  </head>
  <body>
    <!-- Sticky banner gdy trening aktywny -->
    {activeWorkout && (
      <ActiveWorkoutBanner workout={activeWorkout} client:load />
    )}

    <!-- Nawigacja -->
    <nav>
      <!-- ... -->
    </nav>

    <!-- Główna treść -->
    <slot />
  </body>
</html>
```

---

### Krok 14: Styling i dostępność

14.1. **Semantic HTML:**
- Użyj `<main>`, `<section>`, `<article>` gdzie odpowiednie
- Hierarchia nagłówków: `<h1>` → `<h2>` → `<h3>`

14.2. **ARIA attributes:**
```tsx
// ActiveWorkoutBanner - aria-live dla dynamicznych danych
<div aria-live="polite" aria-atomic="true">
  <p>{timeElapsed} • {completedSets}/{totalSets} serii wykonanych</p>
</div>

// VolumeChart - aria-label dla wykresu
<div role="img" aria-label="Wykres objętości treningowej z ostatnich 4 tygodni">
  <ResponsiveContainer>...</ResponsiveContainer>
</div>
```

14.3. **Focus states dla klawiatury:**
```css
/* Przycisk CTA */
.cta-button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Karta treningu (klikalna) */
.workout-card:focus-visible {
  outline: 2px solid #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

14.4. **Sprawdź kontrast kolorów** (WCAG AA minimum 4.5:1)

---

### Krok 15: Optymalizacja wydajności

15.1. **Lazy loading komponentów React:**
```astro
<!-- Użyj client:load tylko dla krytycznych komponentów -->
<DashboardHero activeWorkout={activeWorkout} client:load />

<!-- Użyj client:visible dla komponentów poniżej fold -->
<VolumeChart data={volumeChartData} client:visible />
```

15.2. **Memoizacja w React:**
```tsx
// WorkoutSummaryCard - memo jeśli często re-renderuje
export const WorkoutSummaryCard = React.memo(({ stats, planName, date, workoutId }: WorkoutSummaryCardProps) => {
  // ...
});
```

15.3. **Debounce dla timera (opcjonalnie):**
Jeśli timer powoduje zbyt częste re-renders, rozważ aktualizację co 10s zamiast co 1s dla Dashboard.

---

### Krok 16: Dokumentacja i code review

16.1. Dodaj komentarze JSDoc do wszystkich komponentów:
```tsx
/**
 * Dashboard Hero - główna sekcja powitalna Dashboard
 * Wyświetla ActiveWorkoutBanner gdy trening aktywny lub motywujący CTA gdy brak
 * @param {DashboardHeroProps} props - Props zawierające dane aktywnego treningu
 * @returns {JSX.Element} Renderowana sekcja hero
 */
export function DashboardHero({ activeWorkout }: DashboardHeroProps) {
  // ...
}
```

16.2. Sprawdź czy kod jest zgodny z wytycznymi projektu (CLAUDE.md)

16.3. Uruchom linter i formatter:
```bash
npm run lint:fix
npm run format
```

16.4. Commit zmian:
```bash
git add .
git commit -m "feat: implement dashboard view with active workout banner, last workout summary, and volume chart"
```

---

### Krok 17: Integracja z pipeline CI/CD

17.1. Sprawdź czy build przechodzi:
```bash
npm run build
```

17.2. Deploy do środowiska testowego

17.3. Przeprowadź smoke testing na deployed version

17.4. Po akceptacji merge do głównej gałęzi

---

## Podsumowanie implementacji

Ten plan implementacji zapewnia:

✅ **Zgodność z PRD:** Realizuje US-030, US-022, US-029, US-035
✅ **Responsywność:** Mobile-first, grid layout adaptacyjny
✅ **Dostępność:** Semantic HTML, ARIA labels, focus states, live regions
✅ **Wydajność:** SSR z Astro, równoległe fetch, lazy loading React
✅ **Obsługa błędów:** Autoryzacja, błędy API, empty states, fallbacks
✅ **Type safety:** TypeScript w całym kodzie
✅ **Code quality:** ESLint, Prettier, komentarze JSDoc
✅ **UX:** Smooth transitions, live timer, interactive chart, clear CTAs
✅ **Reużywalność:** `WorkoutSummaryCard`, `ActiveWorkoutBanner` (globalny)
✅ **Interaktywność:** Recharts, live timer, dismissable banner

Implementacja powinna zająć **4-6 godzin** doświadczonemu programiście frontendowemu.
