# Plan Testów - Gym Track

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cele testowania
Głównym celem testowania aplikacji Gym Track jest zapewnienie wysokiej jakości, niezawodności oraz bezpieczeństwa systemu do śledzenia treningów siłowych. Plan testów koncentruje się na weryfikacji:
- Poprawności działania funkcjonalności biznesowych (planowanie, wykonywanie i śledzenie treningów)
- Bezpieczeństwa uwierzytelniania i autoryzacji użytkowników (Supabase Auth + RLS)
- Wydajności aplikacji przy typowych i szczytowych obciążeniach
- Integracji komponentów frontend-backend oraz z usługami zewnętrznymi (Supabase, AI)

### 1.2 Zakres projektu
Gym Track to aplikacja webowa do zarządzania treningami siłowymi, zbudowana w architekturze hybrydowej z wykorzystaniem:
- **Frontend**: Astro 5 (SSR) + React 19 + TypeScript 5
- **Backend**: Supabase (PostgreSQL + Auth + RLS) + Astro API routes
- **UI**: Tailwind CSS 4 + Shadcn/ui
- **Integracje**: OpenRouter.ai (modele AI)

## 2. Zakres Testów

### 2.1 Komponenty objęte testami
✅ **W zakresie testowania:**
- Autentykacja i autoryzacja użytkowników (rejestracja, logowanie, sesje)
- Middleware Astro (ochrona tras, zarządzanie klientem Supabase)
- API endpoints (`/api/auth/*`, `/api/workouts/*`, `/api/workout-plans/*`, `/api/exercises/*`, `/api/categories/*`)
- Serwisy biznesowe (`workouts.service.ts`, `workout-plans.service.ts`, `exercises.service.ts`, `categories.service.ts`)
- Walidacja danych wejściowych (Zod schemas)
- Komponenty React (formularze, listy, modale, filtry, wykresy)
- Custom hooks React (`useWorkoutTimer`, `useDebounce`)
- Row Level Security (RLS) policies w bazie danych
- Integracje z Supabase (baza danych, auth, storage)
- Responsywność UI (mobile, tablet, desktop)
- Wydajność (ładowanie, renderowanie, operacje na dużych zbiorach)

❌ **Poza zakresem:**
- Infrastruktura hostingowa (DigitalOcean, GitHub Actions CI/CD)
- Testy bezpieczeństwa penetracyjne (pentesting)
- Testy obciążeniowe powyżej 1000 równoczesnych użytkowników
- Kompatybilność z przeglądarkami starszymi niż 2 lata

### 2.2 Funkcjonalności kluczowe
Priorytet testowania (P0 = krytyczne, P1 = wysokie, P2 = średnie):

**P0 - Krytyczne:**
1. Rejestracja i logowanie użytkowników
2. Tworzenie i edycja planów treningowych
3. Rozpoczynanie i wykonywanie treningów
4. Zapisywanie wyników treningów (serie, powtórzenia, ciężary)
5. Zabezpieczenia RLS (użytkownicy widzą tylko swoje dane)

**P1 - Wysokie:**
6. Przeglądanie kategorii i ćwiczeń
7. Historia treningów i statystyki
8. Anulowanie i usuwanie treningów/planów
9. Filtrowanie i wyszukiwanie ćwiczeń
10. Wykresy postępów (wolumen, czas)

**P2 - Średnie:**
11. Drag & drop przy układaniu ćwiczeń w planie
12. Responsywność interfejsu
13. Optymalizacje wydajności (lazy loading, memoization)

## 3. Typy Testów do Przeprowadzenia

### 3.1 Testy Jednostkowe (Unit Tests)
**Narzędzie:** Vitest 2.x
**Zakres:**
- Walidacja schematów Zod (auth, workouts, workout-plans, exercises, categories)
- Funkcje pomocnicze (utils: `cn()`, `auth-errors`, `dates`)
- Custom hooks React (`useWorkoutTimer`, `useDebounce`)
- Logika biznesowa w serwisach (bez rzeczywistego Supabase, z mockami)

**Cel:** Weryfikacja poprawności pojedynczych jednostek kodu w izolacji (funkcje, metody, hooki).

**Pokrycie docelowe:** ≥80% dla warstwy logiki biznesowej i walidacji.

### 3.2 Testy Integracyjne (Integration Tests)
**Narzędzia:** Vitest 2.x + React Testing Library 16.x
**Zakres:**
- Integracja komponentów React z API endpoints (fetch calls)
- Testy formularzy (LoginForm, RegisterForm) z walidacją po stronie klienta
- Interakcje między komponentami (WorkoutPlanDetail → API → aktualizacja UI)
- Middleware Astro z rzeczywistymi żądaniami HTTP (mock Supabase)
- API routes z mockami serwisów i bazy danych
- Integracja serwisów z mockiem klienta Supabase

**Cel:** Sprawdzenie współpracy modułów i przepływu danych między warstwami aplikacji.

**Środowisko:** Testowa instancja Supabase lub lokalny PostgreSQL z seed data.

### 3.3 Testy End-to-End (E2E Tests)
**Narzędzie:** Playwright 1.50+
**Zakres:**
- Pełne ścieżki użytkownika (user flows):
  1. Rejestracja → Logowanie → Dashboard
  2. Tworzenie planu → Dodanie ćwiczeń → Rozpoczęcie treningu → Zakończenie
  3. Przeglądanie historii → Wyświetlanie statystyk → Wykresy
  4. Edycja planu → Usunięcie planu
  5. Wyszukiwanie ćwiczeń → Filtrowanie po kategorii i trudności
- Cross-browser (Chrome, Firefox, Safari)
- Cross-device (desktop 1920x1080, tablet 768x1024, mobile 375x667)
- Happy paths + podstawowe error paths

**Cel:** Walidacja kompletnych scenariuszy użytkownika w środowisku zbliżonym do produkcyjnego.

**Środowisko:** Staging/testowe Supabase z danymi testowymi.

### 3.4 Testy Komponentów UI (Component Tests)
**Narzędzie:** React Testing Library 16.x + Vitest
**Zakres:**
- Komponenty Shadcn/ui (Button, Card, Dialog, Select, Checkbox, Badge, Skeleton, ScrollArea)
- Komponenty biznesowe:
  - `WorkoutPlanCard`, `WorkoutPlansList`, `WorkoutPlanDetail`
  - `ExerciseCard`, `ExercisesGrid`, `ExercisesFilters`
  - `WorkoutHistoryItem`, `WorkoutHistoryTimeline`, `WorkoutDetailModal`
  - `DashboardHero`, `ActiveWorkoutBanner`, `VolumeChart`, `QuickActions`
  - `LoginForm`, `RegisterForm`, `LogoutButton`
- Renderowanie z różnymi props i stanami (loading, error, success)
- Interakcje użytkownika (kliknięcia, wpisywanie tekstu, submit formularza)
- Warunki brzegowe (puste listy, długie nazwy, brak danych)

**Cel:** Weryfikacja poprawności renderowania i interaktywności komponentów React.

### 3.5 Testy API (API Tests)
**Narzędzie:** Vitest + supertest (lub fetch API w testach)
**Zakres:**
- Wszystkie endpointy API:
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
  - `GET /api/workouts`, `POST /api/workouts`, `GET /api/workouts/:id`, `PATCH /api/workouts/:id`, `POST /api/workouts/:id/complete`
  - `GET /api/workout-plans`, `POST /api/workout-plans`, `GET /api/workout-plans/:id`, `PATCH /api/workout-plans/:id`, `DELETE /api/workout-plans/:id`
  - `GET /api/exercises`, `GET /api/exercises/:id`, `POST /api/exercises`, `PATCH /api/exercises/:id`, `DELETE /api/exercises/:id`
  - `GET /api/categories`, `GET /api/categories/:id`
  - Endpointy zestawów i serii: `/api/workout-sets/:id`, `/api/plan-exercises/*`
- Status codes (200, 201, 400, 401, 403, 404, 409, 500)
- Struktury odpowiedzi (zgodność z typami DTO)
- Walidacja danych wejściowych (Zod errors 400)
- Autoryzacja (brak tokena → 401, dane innego użytkownika → 403/404)

**Cel:** Sprawdzenie poprawności kontraktów API i obsługi błędów.

### 3.6 Testy Bezpieczeństwa (Security Tests)
**Narzędzia:** Vitest (testy RLS), Playwright (testy sesji), manualne audyty
**Zakres:**
- **Row Level Security (RLS):**
  - Użytkownik A nie może zobaczyć/modyfikować danych użytkownika B
  - Testy na tabelach: `workout_plans`, `workouts`, `plan_exercises`, `workout_sets`, `workout_stats`
- **Uwierzytelnianie:**
  - Poprawność tokenów JWT (Supabase Auth)
  - Wygasanie sesji (refresh tokens)
  - Logout usuwa sesję i przekierowuje
- **Autoryzacja:**
  - Middleware Astro blokuje nieuwierzytelnione żądania do chronionych tras
  - API endpoints sprawdzają `locals.user` przed operacjami
- **Walidacja danych:**
  - XSS prevention (sanityzacja wejść w Zod, React escape HTML)
  - SQL Injection prevention (Supabase client, parametryzowane zapytania)
  - Limity długości pól (Zod max() constraints)
- **HTTPS & Cookies:**
  - Secure, HttpOnly, SameSite flags na ciasteczkach sesji (Supabase SSR)

**Cel:** Zapewnienie, że aplikacja chroni dane użytkowników i spełnia podstawowe standardy bezpieczeństwa.

### 3.7 Testy Wydajnościowe (Performance Tests)
**Narzędzia:** Playwright (Performance API), Lighthouse CI, custom benchmarki
**Zakres:**
- **Czas ładowania stron:**
  - Dashboard (z wykresami): FCP < 1.5s, LCP < 2.5s
  - Lista planów/treningów: FCP < 1s, LCP < 2s
  - Szczegóły planu: FCP < 1.2s, LCP < 2.5s
- **Responsywność UI:**
  - Reagowanie na kliknięcia: < 100ms
  - Renderowanie list (100+ treningów): < 300ms
  - Infinite scroll / paginacja: płynne (60 FPS)
- **Operacje bazodanowe:**
  - Pobranie listy 100 treningów: < 500ms
  - Utworzenie treningu z kopiowaniem 10 ćwiczeń i 30 serii: < 2s
  - Zapytanie z joinami (workout details): < 800ms
- **Bundle size:**
  - Initial bundle: < 200KB (gzipped)
  - React lazy loading dla ciężkich komponentów (wykresy Recharts)
- **Metryki Lighthouse:**
  - Performance: ≥90
  - Best Practices: ≥95
  - SEO: ≥90

**Cel:** Optymalizacja UX poprzez szybkie ładowanie i płynną interakcję.

### 3.8 Testy Regresyjne (Regression Tests)
**Narzędzia:** Playwright (automated E2E suite), Vitest (unit/integration CI)
**Zakres:**
- Automatyczne uruchomienie pełnej suity testów po każdym merge do `master`
- Sprawdzenie funkcjonalności krytycznych (P0) przed każdym release
- Smoke tests po wdrożeniu na staging/production (podstawowe ścieżki: login, create plan, start workout)

**Cel:** Wykrycie nieplanowanych zmian (regresji) po wprowadzeniu nowych funkcji lub poprawek.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 Moduł Autentykacji

#### TC-AUTH-001: Rejestracja użytkownika (Happy Path)
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Brak aktywnej sesji
- **Kroki:**
  1. Przejdź na `/auth/register`
  2. Wpisz email: `testuser@example.com`
  3. Wpisz hasło: `SecurePass123!`
  4. Wpisz potwierdzenie hasła: `SecurePass123!`
  5. Kliknij "Zarejestruj się"
- **Oczekiwany wynik:**
  - Użytkownik zostaje przekierowany na `/dashboard`
  - Wyświetla się komunikat powitalny
  - Sesja jest utworzona (ciasteczko Supabase)
- **Dane testowe:** Email nieistniejący w bazie

#### TC-AUTH-002: Rejestracja z istniejącym emailem
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Email `existing@example.com` już istnieje
- **Kroki:**
  1. Przejdź na `/auth/register`
  2. Wpisz email: `existing@example.com`
  3. Wpisz hasło: `SecurePass123!`
  4. Wpisz potwierdzenie hasła: `SecurePass123!`
  5. Kliknij "Zarejestruj się"
- **Oczekiwany wynik:**
  - Wyświetla się błąd: "Email jest już zarejestrowany"
  - Użytkownik pozostaje na stronie rejestracji
  - Sesja nie jest tworzona

#### TC-AUTH-003: Logowanie użytkownika (Happy Path)
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Użytkownik `testuser@example.com` istnieje
- **Kroki:**
  1. Przejdź na `/auth/login`
  2. Wpisz email: `testuser@example.com`
  3. Wpisz hasło: `SecurePass123!`
  4. Kliknij "Zaloguj się"
- **Oczekiwany wynik:**
  - Przekierowanie na `/dashboard` (lub `?redirect` URL jeśli podany)
  - Wyświetla się dashboard z danymi użytkownika
  - Sesja jest utworzona

#### TC-AUTH-004: Logowanie z błędnym hasłem
- **Priorytet:** P1
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/auth/login`
  2. Wpisz email: `testuser@example.com`
  3. Wpisz hasło: `WrongPassword`
  4. Kliknij "Zaloguj się"
- **Oczekiwany wynik:**
  - Wyświetla się błąd: "Nieprawidłowy email lub hasło"
  - Użytkownik pozostaje na stronie logowania
  - Sesja nie jest tworzona

#### TC-AUTH-005: Wylogowanie użytkownika
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Użytkownik jest zalogowany
- **Kroki:**
  1. Kliknij na dropdown z avatarem/menu użytkownika
  2. Kliknij "Wyloguj się"
- **Oczekiwany wynik:**
  - Przekierowanie na `/auth/login`
  - Sesja zostaje usunięta (ciasteczko)
  - Próba dostępu do `/dashboard` przekierowuje na login

#### TC-AUTH-006: Ochrona chronionych tras (Middleware)
- **Priorytet:** P0
- **Typ:** Integration
- **Warunki wstępne:** Brak aktywnej sesji
- **Kroki:**
  1. Spróbuj uzyskać dostęp do `/dashboard` bez logowania
- **Oczekiwany wynik:**
  - Przekierowanie na `/auth/login?redirect=%2Fdashboard`
  - Użytkownik nie widzi treści dashboardu

#### TC-AUTH-007: Przekierowanie zalogowanego użytkownika z auth pages
- **Priorytet:** P1
- **Typ:** Integration
- **Warunki wstępne:** Użytkownik jest zalogowany
- **Kroki:**
  1. Spróbuj przejść na `/auth/login` lub `/auth/register`
- **Oczekiwany wynik:**
  - Automatyczne przekierowanie na `/dashboard`

### 4.2 Moduł Planów Treningowych

#### TC-PLAN-001: Utworzenie nowego planu treningowego
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Użytkownik jest zalogowany
- **Kroki:**
  1. Przejdź na `/workout-plans`
  2. Kliknij "Stwórz nowy plan"
  3. Wpisz nazwę: "Plan Full Body A"
  4. Wpisz opis: "Trening całego ciała 3x w tygodniu"
  5. Kliknij "Zapisz"
- **Oczekiwany wynik:**
  - Plan zostaje utworzony i pojawia się na liście
  - Przekierowanie na `/workout-plans/:id`
  - Wyświetla się komunikat sukcesu (toast)

#### TC-PLAN-002: Dodanie ćwiczenia do planu
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Plan treningowy istnieje, użytkownik jest na stronie edycji planu
- **Kroki:**
  1. Kliknij "Dodaj ćwiczenie"
  2. Wybierz ćwiczenie "Wyciskanie sztangi na ławce płaskiej"
  3. Dodaj 3 serie:
     - Seria 1: 10 powtórzeń, 60 kg
     - Seria 2: 8 powtórzeń, 70 kg
     - Seria 3: 6 powtórzeń, 80 kg
  4. Kliknij "Zapisz"
- **Oczekiwany wynik:**
  - Ćwiczenie pojawia się w liście ćwiczeń planu
  - Serie są wyświetlone prawidłowo
  - Plan został zaktualizowany (total_sets, exercise_count)

#### TC-PLAN-003: Zmiana kolejności ćwiczeń (Drag & Drop)
- **Priorytet:** P2
- **Typ:** E2E
- **Warunki wstępne:** Plan zawiera ≥2 ćwiczenia
- **Kroki:**
  1. Przejdź do edycji planu
  2. Przeciągnij ćwiczenie z pozycji 1 na pozycję 3
  3. Zapisz zmiany
- **Oczekiwany wynik:**
  - Kolejność ćwiczeń zostaje zaktualizowana
  - Po odświeżeniu strony kolejność się utrzymuje
  - API endpoint `/api/plan-exercises/reorder` zostaje wywołany

#### TC-PLAN-004: Usunięcie planu treningowego
- **Priorytet:** P1
- **Typ:** E2E
- **Warunki wstępne:** Plan treningowy istnieje, NIE ma aktywnego treningu
- **Kroki:**
  1. Przejdź na `/workout-plans/:id`
  2. Kliknij "Usuń plan" w sekcji "Strefa niebezpieczna"
  3. Potwierdź usunięcie w modalu
- **Oczekiwany wynik:**
  - Plan zostaje soft-deleted (`deleted_at` ustawione)
  - Przekierowanie na `/workout-plans`
  - Plan nie pojawia się na liście

#### TC-PLAN-005: Próba usunięcia planu z aktywnym treningiem
- **Priorytet:** P0
- **Typ:** Integration
- **Warunki wstępne:** Plan ma aktywny trening (status = 'active')
- **Kroki:**
  1. Wywołaj `DELETE /api/workout-plans/:id`
- **Oczekiwany wynik:**
  - Status 409 Conflict
  - Komunikat: "Nie można usunąć planu z aktywnym treningiem"
  - Plan NIE zostaje usunięty

#### TC-PLAN-006: Edycja nazwy i opisu planu
- **Priorytet:** P1
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/workout-plans/:id/edit`
  2. Zmień nazwę na "Plan Full Body B (Updated)"
  3. Zmień opis na "Nowy opis"
  4. Kliknij "Zapisz"
- **Oczekiwany wynik:**
  - Zmiany zostają zapisane
  - Przekierowanie na `/workout-plans/:id`
  - Nazwa i opis są zaktualizowane

#### TC-PLAN-007: Walidacja - próba utworzenia planu bez nazwy
- **Priorytet:** P1
- **Typ:** Unit + E2E
- **Kroki:**
  1. Przejdź na formularz tworzenia planu
  2. Pozostaw pole "Nazwa" puste
  3. Kliknij "Zapisz"
- **Oczekiwany wynik:**
  - Wyświetla się błąd walidacji: "Nazwa jest wymagana"
  - Plan nie zostaje utworzony
  - Użytkownik pozostaje na formularzu

### 4.3 Moduł Treningów (Workouts)

#### TC-WORKOUT-001: Rozpoczęcie treningu z planu
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Plan treningowy zawiera ≥1 ćwiczenie, użytkownik NIE ma aktywnego treningu
- **Kroki:**
  1. Przejdź na `/workout-plans/:id`
  2. Kliknij "Rozpocznij trening"
- **Oczekiwany wynik:**
  - Trening zostaje utworzony (status = 'active')
  - Przekierowanie na `/workouts/active`
  - Wyświetla się lista ćwiczeń do wykonania z seriami
  - Timer treningu zaczyna odliczać czas

#### TC-WORKOUT-002: Próba rozpoczęcia treningu gdy już istnieje aktywny
- **Priorytet:** P0
- **Typ:** E2E + API
- **Warunki wstępne:** Użytkownik ma już jeden aktywny trening
- **Kroki:**
  1. Przejdź na `/workout-plans/:id`
  2. Kliknij "Rozpocznij trening"
- **Oczekiwany wynik:**
  - Status 409 Conflict z API
  - Komunikat: "Masz już aktywny trening. Zakończ go przed rozpoczęciem nowego."
  - Przekierowanie na `/workouts/active` lub modal z opcjami

#### TC-WORKOUT-003: Zapisanie wyniku serii (set)
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Trening jest aktywny (`/workouts/active`)
- **Kroki:**
  1. W pierwszym ćwiczeniu, pierwszej serii:
     - Wpisz actual_reps: 12
     - Wpisz actual_weight: 65
  2. Oznacz serię jako ukończoną (checkbox/button)
- **Oczekiwany wynik:**
  - Seria jest zapisana z actual_reps=12, actual_weight=65, completed=true
  - UI pokazuje serię jako ukończoną (np. zielony kolor)
  - API endpoint `/api/workout-sets/:id` zostaje wywołany (PATCH)

#### TC-WORKOUT-004: Dodanie dodatkowej serii podczas treningu
- **Priorytet:** P1
- **Typ:** E2E
- **Warunki wstępne:** Trening jest aktywny
- **Kroki:**
  1. W wybranym ćwiczeniu kliknij "Dodaj serię"
  2. Wpisz planned_reps: 10, planned_weight: 50
  3. Zapisz
- **Oczekiwany wynik:**
  - Nowa seria pojawia się na liście
  - Użytkownik może zapisać wyniki dla tej serii
  - API endpoint `/api/workout-exercises/:id/sets` (POST) zostaje wywołany

#### TC-WORKOUT-005: Zakończenie treningu
- **Priorytet:** P0
- **Typ:** E2E
- **Warunki wstępne:** Trening jest aktywny, ≥1 seria ukończona
- **Kroki:**
  1. Przejdź na `/workouts/active`
  2. Kliknij "Zakończ trening"
  3. Potwierdź w modalu (jeśli jest)
- **Oczekiwany wynik:**
  - Trening zmienia status na 'completed'
  - Zapisuje się `completed_at` (timestamp)
  - Obliczane są statystyki treningu (duration, total_volume, total_sets, total_reps)
  - Przekierowanie na `/workouts/history` lub `/dashboard`
  - Wyświetla się podsumowanie treningu

#### TC-WORKOUT-006: Anulowanie treningu
- **Priorytet:** P1
- **Typ:** E2E
- **Warunki wstępne:** Trening jest aktywny
- **Kroki:**
  1. Przejdź na `/workouts/active`
  2. Kliknij "Anuluj trening"
  3. Potwierdź w modalu
- **Oczekiwany wynik:**
  - Trening zmienia status na 'cancelled'
  - Statystyki NIE są obliczane
  - Przekierowanie na `/dashboard`
  - Trening pojawia się w historii jako "Anulowany"

#### TC-WORKOUT-007: Wyświetlanie timera treningu
- **Priorytet:** P1
- **Typ:** Component + E2E
- **Warunki wstępne:** Trening jest aktywny
- **Kroki:**
  1. Przejdź na `/workouts/active`
  2. Obserwuj timer
- **Oczekiwany wynik:**
  - Timer pokazuje czas od `started_at` do teraz
  - Timer aktualizuje się co 1 sekundę
  - Format: "HH:MM:SS" lub "MM:SS"

#### TC-WORKOUT-008: Historia treningów - paginacja
- **Priorytet:** P1
- **Typ:** E2E + API
- **Warunki wstępne:** Użytkownik ma >20 treningów
- **Kroki:**
  1. Przejdź na `/workouts/history`
  2. Przewiń do końca listy
  3. Kliknij "Załaduj więcej" lub paginacja automatyczna
- **Oczekiwany wynik:**
  - API endpoint `/api/workouts?page=2&limit=20` zostaje wywołany
  - Kolejne 20 treningów pojawia się na liście
  - Brak duplikatów

#### TC-WORKOUT-009: Filtrowanie historii po planie treningowym
- **Priorytet:** P2
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/workouts/history`
  2. Wybierz plan z listy rozwijanej (np. "Plan Full Body A")
  3. Kliknij "Filtruj"
- **Oczekiwany wynik:**
  - Wyświetlane są tylko treningi z wybranego planu
  - API endpoint `/api/workouts?plan_id=...` zostaje wywołany

#### TC-WORKOUT-010: Szczegóły ukończonego treningu
- **Priorytet:** P1
- **Typ:** E2E
- **Warunki wstępne:** Użytkownik ma ukończony trening
- **Kroki:**
  1. Przejdź na `/workouts/history`
  2. Kliknij na wybrany trening
- **Oczekiwany wynik:**
  - Wyświetla się modal lub strona z detalami:
    - Nazwa planu, data, czas trwania
    - Lista ćwiczeń z seriami (planned vs actual)
    - Statystyki (total_volume, max_weight)

### 4.4 Moduł Ćwiczeń i Kategorii

#### TC-EXERCISE-001: Przeglądanie kategorii ćwiczeń
- **Priorytet:** P1
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/categories`
- **Oczekiwany wynik:**
  - Wyświetla się siatka kategorii (klatka piersiowa, plecy, nogi, itd.)
  - Każda karta kategorii ma nazwę, opis, ikonę/obraz
  - Kliknięcie na kategorię przekierowuje na `/categories/:id`

#### TC-EXERCISE-002: Przeglądanie ćwiczeń w kategorii
- **Priorytet:** P1
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/categories/:id` (np. "Klatka piersiowa")
- **Oczekiwany wynik:**
  - Wyświetla się lista ćwiczeń z tej kategorii
  - Każde ćwiczenie ma nazwę, trudność, ikonę/obraz
  - Kliknięcie na ćwiczenie przekierowuje na `/exercises/:id`

#### TC-EXERCISE-003: Wyszukiwanie ćwiczeń
- **Priorytet:** P1
- **Typ:** E2E + Component
- **Kroki:**
  1. Przejdź na `/exercises`
  2. Wpisz w search bar: "wyciskanie"
  3. Poczekaj na debounce (300ms)
- **Oczekiwany wynik:**
  - Lista ćwiczeń zostaje przefiltrowana
  - API endpoint `/api/exercises?search=wyciskanie` zostaje wywołany
  - Wyświetlają się tylko ćwiczenia zawierające "wyciskanie" w nazwie

#### TC-EXERCISE-004: Filtrowanie po trudności
- **Priorytet:** P2
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/exercises`
  2. Wybierz filtr trudności: "Średni"
- **Oczekiwany wynik:**
  - Wyświetlają się tylko ćwiczenia o trudności "Średni"
  - API endpoint `/api/exercises?difficulty=medium` zostaje wywołany

#### TC-EXERCISE-005: Szczegóły ćwiczenia
- **Priorytet:** P1
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/exercises/:id`
- **Oczekiwany wynik:**
  - Wyświetla się strona z pełnym opisem ćwiczenia
  - Widoczne: nazwa, kategoria, trudność, opis, obraz/video (jeśli dostępne)
  - Opcja dodania do planu treningowego (CTA)

### 4.5 Moduł Dashboard i Statystyk

#### TC-DASHBOARD-001: Wyświetlanie dashboardu
- **Priorytet:** P1
- **Typ:** E2E
- **Warunki wstępne:** Użytkownik zalogowany
- **Kroki:**
  1. Przejdź na `/dashboard`
- **Oczekiwany wynik:**
  - Wyświetla się powitanie z imieniem użytkownika
  - Widoczne Quick Actions (Rozpocznij trening, Stwórz plan)
  - Jeśli jest aktywny trening → banner z linkiem
  - Podsumowanie ostatnich treningów (np. 3 ostatnie)

#### TC-DASHBOARD-002: Banner aktywnego treningu
- **Priorytet:** P1
- **Typ:** E2E
- **Warunki wstępne:** Użytkownik ma aktywny trening
- **Kroki:**
  1. Przejdź na `/dashboard`
- **Oczekiwany wynik:**
  - Wyświetla się banner "Masz aktywny trening: [nazwa planu]"
  - Kliknięcie przekierowuje na `/workouts/active`

#### TC-STATS-001: Wykres wolumenu treningowego (ostatnie 7 dni)
- **Priorytet:** P1
- **Typ:** E2E + Component
- **Kroki:**
  1. Przejdź na `/workouts/stats`
  2. Wybierz okres "Ostatnie 7 dni"
- **Oczekiwany wynik:**
  - Wyświetla się wykres słupkowy/liniowy z total_volume dla każdego dnia
  - API endpoint `/api/workouts/stats?period=7d` zostaje wywołany
  - Oś X: daty, Oś Y: wolumen (kg)
  - Wyświetla się podsumowanie (total_volume, avg_volume_per_workout)

#### TC-STATS-002: Filtrowanie statystyk po planie
- **Priorytet:** P2
- **Typ:** E2E
- **Kroki:**
  1. Przejdź na `/workouts/stats`
  2. Wybierz plan z listy rozwijanej
  3. Wybierz okres "Ostatnie 4 tygodnie"
- **Oczekiwany wynik:**
  - Wykres pokazuje tylko treningi z wybranego planu
  - API endpoint `/api/workouts/stats?period=4w&plan_id=...` zostaje wywołany

## 5. Środowisko Testowe

### 5.1 Wymagania sprzętowe i programowe

**Środowisko deweloperskie (lokalne):**
- **OS:** macOS/Linux/Windows 10+
- **Node.js:** v22.14.0 (zgodnie z `.nvmrc`)
- **npm:** v10+
- **RAM:** ≥8GB
- **Przeglądarka:** Chrome 120+, Firefox 120+, Safari 17+
- **Edytor:** VS Code (zalecany) z ESLint + Prettier

**Środowisko testowe (CI/CD):**
- **CI:** GitHub Actions (Ubuntu latest)
- **Node.js:** v22.14.0
- **Supabase:** Instancja testowa/staging (PostgreSQL 15+)
- **Playwright:** Headless mode (Chrome, Firefox, Safari WebKit)

**Środowisko staging:**
- **Hosting:** DigitalOcean (Docker container)
- **Supabase:** Dedykowana instancja testowa z oddzielnymi danymi
- **URL:** `https://staging.gym-track.app` (przykład)
- **SSL:** Tak (HTTPS)

### 5.2 Konfiguracja bazy danych testowej

**Supabase Test Instance:**
- **PostgreSQL:** v15+
- **Migracje:** Automatyczne (Supabase CLI lub SQL scripts)
- **RLS:** Włączony na wszystkich tabelach (`workout_plans`, `workouts`, `exercises`, `categories`, etc.)
- **Seed data:**
  - 3 użytkowników testowych:
    - `user1@test.com` (hasło: `Test1234!`)
    - `user2@test.com` (hasło: `Test1234!`)
    - `admin@test.com` (hasło: `Admin1234!`)
  - 5 kategorii ćwiczeń (Klatka piersiowa, Plecy, Nogi, Ramiona, Brzuch)
  - 50 ćwiczeń (po 10 na kategorię)
  - 10 planów treningowych (różne użytkownicy)
  - 100 ukończonych treningów z statystykami

**Reset bazy przed testami:**
```bash
# Lokalne Supabase
npx supabase db reset

# Staging (via API/script)
npm run db:seed:test
```

### 5.3 Zmienne środowiskowe

**`.env.test` (dla testów):**
```env
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (test anon key)
OPENROUTER_API_KEY=sk-test-... (test key lub mock)
NODE_ENV=test
```

### 5.4 Narzędzia pomocnicze

- **Supabase CLI:** Zarządzanie lokalną instancją bazy danych
- **Docker:** Lokalne uruchomienie PostgreSQL (jeśli nie używa się Supabase lokalnie)
- **Mock Service Worker (MSW):** Mockowanie API endpoints w testach komponentów (opcjonalnie)
- **Faker.js:** Generowanie danych testowych (nazwy planów, opisy)

## 6. Narzędzia do Testowania

### 6.1 Framework testowy główny
**Vitest 2.x**
- **Rola:** Runner dla testów jednostkowych i integracyjnych
- **Konfiguracja:** `vitest.config.ts`
- **Funkcje:**
  - Natywne wsparcie TypeScript i ESM
  - Hot Module Reload dla testów
  - Code coverage (c8)
  - API kompatybilne z Jest

**Przykładowa komenda:**
```bash
npm run test           # Uruchom wszystkie testy
npm run test:watch     # Watch mode
npm run test:coverage  # Z raportem pokrycia
```

### 6.2 Testowanie komponentów React
**React Testing Library 16.x**
- **Rola:** Testowanie komponentów React z perspektywy użytkownika
- **Funkcje:**
  - Zapytania semantyczne (`getByRole`, `getByLabelText`)
  - User events (`userEvent.click`, `userEvent.type`)
  - Async utilities (`waitFor`, `findBy*`)
  - Custom matchers (`@testing-library/jest-dom`)

**Przykład:**
```typescript
import { render, screen, userEvent } from '@testing-library/react'
import { LoginForm } from '@/components/auth/LoginForm'

test('should submit login form with valid data', async () => {
  render(<LoginForm />)

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
  await userEvent.type(screen.getByLabelText(/hasło/i), 'SecurePass123!')
  await userEvent.click(screen.getByRole('button', { name: /zaloguj/i }))

  expect(await screen.findByText(/powodzenia/i)).toBeInTheDocument()
})
```

### 6.3 Testy E2E
**Playwright 1.50+**
- **Rola:** Testy end-to-end w rzeczywistej przeglądarce
- **Konfiguracja:** `playwright.config.ts`
- **Funkcje:**
  - Cross-browser (Chromium, Firefox, WebKit)
  - Auto-wait (czeka na elementy, żądania sieciowe)
  - Screenshot i video recording przy błędach
  - Network interception
  - Mobile emulation
  - Parallel execution

**Przykładowa komenda:**
```bash
npx playwright test                    # Uruchom wszystkie testy E2E
npx playwright test --headed           # Z widoczną przeglądarką
npx playwright test --project=chromium # Tylko Chrome
npx playwright test --debug            # Debug mode
npx playwright codegen                 # Nagrywanie testów
```

**Przykład testu:**
```typescript
import { test, expect } from '@playwright/test'

test('user can create workout plan', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'SecurePass123!')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')

  await page.click('text=Stwórz plan')
  await page.fill('input[name="name"]', 'Test Plan')
  await page.click('button:has-text("Zapisz")')

  await expect(page.locator('text=Test Plan')).toBeVisible()
})
```

### 6.4 Performance
**Lighthouse CI**
- **Rola:** Audyty wydajności, best practices, SEO
- **Konfiguracja:** `lighthouserc.json`
- **Integracja:** GitHub Actions (sprawdzanie metryk na PR)

**Przykładowa konfiguracja CI:**
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  run: lhci autorun
```

### 6.5 Mocking
**Vitest mocks + Mock Service Worker (MSW)**
- **Vitest:** Mockowanie modułów i funkcji w testach jednostkowych
  ```typescript
  vi.mock('@/lib/services/workouts.service', () => ({
    workoutsService: {
      getWorkouts: vi.fn().mockResolvedValue({ data: [], pagination: {...} })
    }
  }))
  ```
- **MSW:** Interceptowanie żądań HTTP w testach komponentów/integracyjnych
  ```typescript
  import { http, HttpResponse } from 'msw'
  import { setupServer } from 'msw/node'

  const server = setupServer(
    http.get('/api/workouts', () => {
      return HttpResponse.json({ data: mockWorkouts })
    })
  )
  ```

### 6.6 Code Quality
**ESLint + Prettier**
- **Rola:** Linting i formatowanie kodu
- **Pre-commit hooks:** Husky + lint-staged (automatyczne lintowanie przed commitem)

**Komendy:**
```bash
npm run lint       # Sprawdź błędy
npm run lint:fix   # Automatyczne poprawki
npm run format     # Prettier formatting
```

### 6.7 CI/CD
**GitHub Actions**
- **Pipeline testowy:**
  1. Checkout kodu
  2. Setup Node.js (v22.14.0)
  3. Install dependencies (`npm ci`)
  4. Lint (`npm run lint`)
  5. Unit/Integration tests (`npm run test`)
  6. Build (`npm run build`)
  7. E2E tests (`npx playwright test`)
  8. Lighthouse CI (performance audit)
  9. Deploy do staging (po merge do `develop`)

**Przykład workflow:**
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 7. Harmonogram Testów

### 7.1 Faza 1: Setup i przygotowanie (Tydzień 1)
**Cel:** Skonfigurowanie środowiska testowego i narzędzi

| Dzień | Zadanie | Odpowiedzialny |
|-------|---------|----------------|
| 1-2 | Instalacja i konfiguracja Vitest, RTL, Playwright | QA Lead |
| 2-3 | Setup Supabase test instance + seed data | Backend Dev |
| 3-4 | Konfiguracja GitHub Actions CI/CD pipeline | DevOps |
| 4-5 | Napisanie testów smoke (login, create plan, start workout) | QA Engineer |

**Deliverable:** Środowisko testowe gotowe, pierwsze testy działają w CI/CD

### 7.2 Faza 2: Testy jednostkowe i integracyjne (Tydzień 2-3)
**Cel:** Pokrycie logiki biznesowej i API testami

| Tydzień | Zakres | Liczba testów (cel) |
|---------|--------|---------------------|
| 2 | Walidacje Zod, utils, custom hooks | 30-40 testów |
| 2-3 | API endpoints (wszystkie routes) | 50-60 testów |
| 3 | Serwisy biznesowe (z mockami Supabase) | 40-50 testów |
| 3 | Komponenty React (forms, cards, lists) | 60-70 testów |

**Deliverable:** Pokrycie kodu ≥80% dla warstwy logiki i API

### 7.3 Faza 3: Testy E2E (Tydzień 4-5)
**Cel:** Walidacja kompletnych user flows

| Tydzień | Moduł | User flows (cel) |
|---------|-------|------------------|
| 4 | Autentykacja + Dashboard | 8-10 scenariuszy |
| 4-5 | Plany treningowe + Ćwiczenia | 15-20 scenariuszy |
| 5 | Treningi (start, wykonanie, zakończenie) | 12-15 scenariuszy |
| 5 | Statystyki + Historia | 8-10 scenariuszy |

**Deliverable:** 40-50 testów E2E dla krytycznych ścieżek (P0, P1)

### 7.4 Faza 4: Testy wydajnościowe (Tydzień 6)
**Cel:** Optymalizacja wydajności aplikacji

| Dzień | Zadanie | Metryka sukcesu |
|-------|---------|-----------------|
| 1-2 | Audyty Lighthouse (wszystkie główne strony) | Performance ≥90, Best Practices ≥95 |
| 3-4 | Optymalizacje (lazy loading, code splitting, memoization) | LCP < 2.5s, FID < 100ms |
| 5-6 | Testy obciążeniowe (Supabase queries, concurrent users) | API response < 500ms (p95) |

**Deliverable:** Aplikacja spełnia standardy wydajności

### 7.5 Faza 5: Testy bezpieczeństwa (Tydzień 7)
**Cel:** Weryfikacja zabezpieczeń aplikacji

| Dzień | Zadanie | Cel |
|-------|---------|-----|
| 1-2 | Testy RLS policies (próby dostępu do danych innych użytkowników) | 0 wycieków danych |
| 3-4 | Testy autoryzacji (middleware, API endpoints) | 100% chronionych tras wymaga auth |
| 4-5 | Testy walidacji (XSS, SQL injection attempts) | Wszystkie wejścia sanityzowane |
| 6-7 | Audyt bezpieczeństwa dependencies (npm audit) | 0 krytycznych luk |

**Deliverable:** Raport bezpieczeństwa, zero krytycznych podatności

### 7.6 Faza 6: Testy regresyjne i stabilizacja (Tydzień 8)
**Cel:** Ostateczna weryfikacja przed release

| Dzień | Zadanie |
|-------|---------|
| 1-3 | Uruchomienie pełnej suity testów (unit + integration + E2E) |
| 3-5 | Fixy znalezionych bugów + retesty |
| 5-6 | Smoke tests na staging environment |
| 7 | Sign-off QA + przygotowanie release notes |

**Deliverable:** Aplikacja gotowa do wdrożenia (0 P0 bugs, <5 P1 bugs)

### 7.7 Cadence testowania (po release)
**Testy ciągłe:**
- **Daily:** Smoke tests (CI/CD na każdy PR)
- **Weekly:** Pełna suita regression tests (sobota night builds)
- **Per feature:** Unit + Integration tests przed merge
- **Per release:** Full E2E suite + manual exploratory testing

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria wejścia (Entry Criteria)
Testy mogą rozpocząć się, gdy:
- [ ] Środowisko testowe (Supabase, staging) jest skonfigurowane i dostępne
- [ ] Kod funkcjonalności jest zmergowany do branch `develop` / `feature/*`
- [ ] Unit tests przechodzą lokalnie (`npm run test`)
- [ ] Build aplikacji kończy się sukcesem (`npm run build`)
- [ ] Linter nie zgłasza błędów (`npm run lint`)
- [ ] Dokumentacja API jest aktualna (jeśli dotyczy)

### 8.2 Kryteria wyjścia (Exit Criteria)
Testy zakończone powodzeniem, gdy:
- [ ] **Pokrycie kodu:** ≥80% dla logiki biznesowej i API (unit + integration)
- [ ] **Pass rate testów:**
  - 100% testów P0 (krytyczne) przechodzi
  - ≥95% testów P1 (wysokie) przechodzi
  - ≥90% testów P2 (średnie) przechodzi
- [ ] **Brak bugów blokujących:**
  - 0 bugów krytycznych (P0)
  - ≤3 bugi wysokiego priorytetu (P1) - z akceptacją Product Ownera
- [ ] **Wydajność:**
  - Lighthouse Performance ≥90 na głównych stronach
  - API response time p95 < 800ms
- [ ] **Bezpieczeństwo:**
  - Wszystkie RLS policies zweryfikowane (0 wycieków danych)
  - npm audit: 0 krytycznych/wysokich podatności
- [ ] **Regresja:**
  - Pełna suita regression tests przechodzi na staging
  - Smoke tests po deploy na production OK

### 8.3 Kryteria sukcesu dla poszczególnych typów testów

**Unit Tests:**
- [ ] Kod coverage ≥80%
- [ ] 100% testów przechodzi w CI/CD
- [ ] Execution time < 30s dla pełnej suity

**Integration Tests:**
- [ ] Wszystkie API endpoints mają ≥2 testy (happy path + error case)
- [ ] Kluczowe integracje (Supabase auth, RLS) są pokryte testami
- [ ] Execution time < 2min dla pełnej suity

**E2E Tests:**
- [ ] Wszystkie krytyczne user flows (P0) mają testy E2E
- [ ] Testy przechodzą na 3 przeglądarkach (Chrome, Firefox, Safari)
- [ ] Testy przechodzą na 3 rozdzielczościach (desktop, tablet, mobile)
- [ ] Execution time < 15min dla pełnej suity (parallel run)

**Performance Tests:**
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] Lighthouse Performance score ≥90

### 8.4 Definicja "Done" dla User Story
User story jest uznawana za "done", gdy:
1. [ ] Kod jest zaimplementowany zgodnie z AC (Acceptance Criteria)
2. [ ] Unit tests napisane i przechodzą (coverage ≥80% nowego kodu)
3. [ ] Integration/Component tests napisane dla nowych komponentów/API
4. [ ] Code review zakończone (≥1 approval)
5. [ ] Linter + Prettier OK (pre-commit hooks przechodzą)
6. [ ] Manual testing przez QA zakończone (test cases PASS)
7. [ ] E2E test dla głównego flow dodany (jeśli dotyczy P0/P1 feature)
8. [ ] Dokumentacja zaktualizowana (jeśli dotyczy API/architektura)
9. [ ] Brak known bugs P0/P1 związanych z tą story
10. [ ] PR zmergowany do `develop` i deploy na staging OK

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1 QA Lead
**Odpowiedzialności:**
- Tworzenie i utrzymanie planu testów
- Definiowanie strategii testowej i priorytetów
- Nadzór nad execution testów (harmonogram, resource allocation)
- Raportowanie statusu testów do stakeholders (daily standups, sprint reviews)
- Decyzje go/no-go dla release
- Mentoring QA Engineers
- Setup i maintenance środowiska testowego

### 9.2 QA Engineer
**Odpowiedzialności:**
- Pisanie test cases i test scenarios
- Wykonywanie testów manualnych (exploratory, regression)
- Pisanie automated tests (E2E Playwright, component tests)
- Raportowanie bugów w Jira/GitHub Issues
- Retesting po fixach
- Collaboration z Developers (pair testing, bug triaging)
- Participation w refinement/planning (testability review)

### 9.3 Backend Developer
**Odpowiedzialności:**
- Pisanie unit tests dla serwisów biznesowych
- Pisanie integration tests dla API endpoints
- Implementacja i testowanie RLS policies w Supabase
- Code review testów backend
- Fixy bugów znalezionych przez QA
- Setup seed data dla testów
- Performance optimization (optymalizacja queries)

### 9.4 Frontend Developer
**Odpowiedzialności:**
- Pisanie component tests (React Testing Library)
- Pisanie unit tests dla custom hooks i utils
- Code review testów frontend
- Fixy bugów UI/UX
- Performance optimization (lazy loading, memoization)

### 9.5 DevOps Engineer
**Odpowiedzialności:**
- Setup CI/CD pipeline (GitHub Actions)
- Konfiguracja Playwright w CI (browsers, parallelization)
- Monitoring testów w CI/CD (flaky tests detection)
- Maintenance staging environment
- Setup Lighthouse CI
- Backup/restore testowej bazy danych
- Infrastructure as Code (Docker, deployment configs)

### 9.6 Product Owner
**Odpowiedzialności:**
- Definiowanie Acceptance Criteria dla User Stories
- Priorytetyzacja bugów (P0/P1/P2)
- Akceptacja funkcjonalności (UAT - User Acceptance Testing)
- Decyzje o scope (trade-offs między features a quality)
- Sign-off release

### 9.7 Scrum Master / Project Manager
**Odpowiedzialności:**
- Facilitowanie communication między QA a Development
- Tracking test progress (burndown charts, blockers)
- Risk management (delay mitigation)
- Retrospekcje (continuous improvement testing process)

## 10. Procedury Raportowania Błędów

### 10.1 Narzędzie do bug trackingu
**Główne narzędzie:** GitHub Issues (dla projektów open-source/małych zespołów) lub Jira

**Alternatywy:** Linear, Asana, Azure DevOps (w zależności od preferencji zespołu)

### 10.2 Szablon zgłoszenia błędu (Bug Report Template)

```markdown
## Bug Report

### Summary
[Krótki opis problemu w 1-2 zdaniach]

### Priority
- [ ] P0 - Krytyczny (blokuje release, aplikacja nie działa)
- [ ] P1 - Wysoki (poważny bug, workaround możliwy)
- [ ] P2 - Średni (bug bez wpływu na kluczowe funkcje)
- [ ] P3 - Niski (kosmetyczny, edge case)

### Severity
- [ ] Critical - Aplikacja crashuje / utrata danych
- [ ] High - Funkcjonalność nie działa, brak workaround
- [ ] Medium - Funkcjonalność nie działa, workaround możliwy
- [ ] Low - Drobne niedogodności, UI glitch

### Environment
- **URL:** [np. https://staging.gym-track.app/workouts/active]
- **Browser:** [Chrome 120.0.6099.109 / Firefox 121 / Safari 17.2]
- **Device:** [Desktop 1920x1080 / iPhone 14 Pro / iPad Air]
- **OS:** [macOS 14.2 / Windows 11 / iOS 17]
- **User:** [test@example.com lub User ID]

### Steps to Reproduce
1. Zaloguj się jako `test@example.com`
2. Przejdź na `/workout-plans/123`
3. Kliknij "Rozpocznij trening"
4. W pierwszym ćwiczeniu wpisz actual_reps: 10
5. Kliknij "Zapisz serię"

### Expected Result
Seria powinna zostać zapisana z actual_reps=10 i oznaczona jako ukończona (zielony kolor).

### Actual Result
Seria nie zapisuje się. Pojawia się błąd w konsoli: "Failed to update workout set: 500 Internal Server Error".

### Screenshots/Videos
[Załącz screenshot lub link do Loom/CloudApp recording]

### Logs/Error Messages
```
Console error:
POST /api/workout-sets/abc123 500 (Internal Server Error)
Error: Failed to update workout set: Database connection timeout
```

### Additional Context
- Bug pojawia się tylko podczas aktywnego treningu
- Reprodukowalność: 100% (zawsze)
- Regression: Nie występował w poprzedniej wersji (v1.2.0)
- Workaround: Odświeżenie strony i ponowna próba zapisu

### Related Issues/PRs
- Related to #45 (API timeout issues)
- May be caused by PR #78 (workout sets refactor)
```

### 10.3 Priorytetyzacja bugów

| Priorytet | Opis | SLA (czas na fix) | Przykład |
|-----------|------|-------------------|----------|
| **P0 - Krytyczny** | Aplikacja nie działa, utrata danych, poważna luka bezpieczeństwa | <24h (hotfix) | Crash przy logowaniu, RLS leak (dane innych użytkowników widoczne) |
| **P1 - Wysoki** | Kluczowa funkcjonalność nie działa, wpływ na wiele użytkowników | <3 dni | Nie można zakończyć treningu, formularze nie wysyłają się |
| **P2 - Średni** | Bug średniego wpływu, workaround dostępny | <7 dni (następny sprint) | Sortowanie nie działa, wykresy nie ładują się na Safari |
| **P3 - Niski** | Kosmetyczny, edge case, minor UX issue | <14 dni (backlog) | Tooltip jest za małe, padding nieprawidłowy, typo w tekście |

### 10.4 Workflow bugów w GitHub Issues/Jira

**Status flow:**
1. **New** → QA zgłasza bug
2. **Triaged** → Team lead przegląda, przydziela priorytet i assignee
3. **In Progress** → Developer pracuje nad fixem
4. **Code Review** → PR utworzony, czeka na review
5. **Ready for Testing** → PR zmergowany do `develop`, deployed na staging
6. **Testing** → QA testuje fix
7. **Verified** → Fix potwierdzony, bug zamknięty
8. **Reopened** → Jeśli bug nadal występuje, powrót do "In Progress"

**Labels (przykładowe):**
- `bug` - ogólny label dla bugów
- `p0-critical`, `p1-high`, `p2-medium`, `p3-low` - priorytet
- `frontend`, `backend`, `database`, `infra` - obszar
- `auth`, `workouts`, `plans`, `exercises` - moduł
- `regression` - bug, który wcześniej działał
- `security` - podatność bezpieczeństwa
- `performance` - performance issue

### 10.5 Bug triage meeting
**Częstotliwość:** 2x tydzień (poniedziałek, czwartek) lub ad-hoc dla P0

**Uczestnicy:** QA Lead, Tech Lead, Backend/Frontend Lead, Product Owner (opcjonalnie)

**Agenda:**
1. Review nowych bugów (New → Triaged)
2. Przydzielenie priorytetu i severity
3. Assignment do developerów
4. Ustalenie ETA dla fixów P0/P1
5. Dyskusja blokerów

**Czas:** 30min

### 10.6 Retesting i zamykanie bugów
**Proces:**
1. Developer fixuje bug, tworzy PR z linkiem do Issue
2. PR po merge ląduje na staging environment
3. QA dostaje notyfikację (automatyczna lub manual)
4. QA retestuje bug według oryginalnych "Steps to Reproduce"
5. **Jeśli fixed:** QA dodaje komentarz "Verified on staging [link]", zmienia status na "Verified", zamyka Issue
6. **Jeśli nie fixed:** QA dodaje komentarz z detalami, zmienia status na "Reopened", przydziela z powrotem do Developer

### 10.7 Metryki bugów (tracking)
Zespół QA śledzi następujące metryki:

- **Bug detection rate:** Liczba bugów znalezionych / tydzień
- **Bug fix rate:** Liczba bugów naprawionych / tydzień
- **Open bugs by priority:** Liczba otwartych bugów P0/P1/P2/P3
- **Mean time to resolve (MTTR):**
  - P0: <24h (cel)
  - P1: <3 dni (cel)
  - P2: <7 dni (cel)
- **Escaped bugs:** Bugi znalezione na production (post-release) - cel <2/release
- **Flaky tests:** % testów E2E, które fail sporadycznie - cel <5%

**Dashboard:** GitHub Issues Insights lub custom dashboard (Grafana + GitHub API)

---

## 11. Załączniki i Dodatkowe Informacje

### 11.1 Istotne linki do dokumentacji
- **Dokumentacja Astro:** https://docs.astro.build
- **Dokumentacja React:** https://react.dev
- **Supabase Docs:** https://supabase.com/docs
- **Playwright Docs:** https://playwright.dev
- **Vitest Docs:** https://vitest.dev
- **React Testing Library:** https://testing-library.com/react
- **Shadcn/ui Components:** https://ui.shadcn.com

### 11.2 Kluczowe pliki konfiguracyjne w projekcie
- `astro.config.mjs` - konfiguracja Astro (SSR, adaptery)
- `tsconfig.json` - TypeScript config (path aliases)
- `vitest.config.ts` - konfiguracja testów jednostkowych
- `playwright.config.ts` - konfiguracja testów E2E
- `eslint.config.js` - reguły lintingu
- `tailwind.config.js` - konfiguracja Tailwind CSS
- `.env.example` - wymagane zmienne środowiskowe
- `package.json` - dependencies i scripts

### 11.3 Glosariusz terminów
- **RLS (Row Level Security):** Mechanizm PostgreSQL/Supabase zabezpieczający dane na poziomie wierszy (users widzą tylko swoje dane)
- **SSR (Server-Side Rendering):** Renderowanie stron na serwerze (Astro)
- **DTO (Data Transfer Object):** Obiekt używany do transferu danych między warstwami (API → Frontend)
- **Flaky test:** Test, który przechodzi/failuje niestabilnie bez zmian w kodzie
- **Smoke test:** Podstawowy test sprawdzający, czy aplikacja w ogóle działa (login, basic navigation)
- **Regression test:** Test sprawdzający, czy nowe zmiany nie zepsuły istniejących funkcji
- **Happy path:** Główna ścieżka użytkownika bez błędów
- **Edge case:** Rzadki, nietypowy scenariusz użycia

### 11.4 Kontakt do zespołu
- **QA Lead:** qa-lead@gym-track.app
- **Tech Lead:** tech-lead@gym-track.app
- **Product Owner:** po@gym-track.app
- **Slack channel:** #gym-track-testing
- **Escalation:** P0 bugs → ping @tech-lead + @qa-lead w Slack

---

## 12. Zatwierdzenie Planu Testów

| Rola | Imię i Nazwisko | Data | Podpis |
|------|-----------------|------|--------|
| QA Lead | [Do uzupełnienia] | YYYY-MM-DD | _______ |
| Tech Lead | [Do uzupełnienia] | YYYY-MM-DD | _______ |
| Product Owner | [Do uzupełnienia] | YYYY-MM-DD | _______ |
| Project Manager | [Do uzupełnienia] | YYYY-MM-DD | _______ |

---

**Historia zmian:**
| Wersja | Data | Autor | Opis zmian |
|--------|------|-------|------------|
| 1.0 | 2025-10-28 | Claude Code | Utworzenie początkowego planu testów |

---

**Koniec dokumentu**
