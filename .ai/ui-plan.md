# Architektura UI dla Gym Track

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji Gym Track została zaprojektowana w oparciu o podejście **mobile-first**, z myślą o głównym scenariuszu użycia – na siłowni. Interfejs jest w pełni responsywny, transformując się z układu zoptymalizowanego dla urządzeń mobilnych (z dolną nawigacją) do bardziej rozbudowanego widoku na tabletach i komputerach stacjonarnych (z nawigacją boczną/górną).

Struktura opiera się na kompozycji widoków (stron Astro) oraz interaktywnych komponentów (React), co pozwala na optymalne połączenie wydajności renderowania po stronie serwera z dynamicznym interfejsem użytkownika. Kluczowe aspekty, takie jak zarządzanie stanem aktywnego treningu, obsługa błędów i stany ładowania, zostały starannie zaplanowane, aby zapewnić płynne i niezawodne doświadczenie. Architektura kładzie silny nacisk na **dostępność (a11y)**, **bezpieczeństwo** (zgodnie z RLS Supabase) oraz **doskonałe doświadczenie użytkownika (UX)**.

## 2. Lista widoków

### Widoki Główne

- **Nazwa widoku:** Dashboard (Strona główna)
  - **Ścieżka widoku:** `/`
  - **Główny cel:** Szybki przegląd aktywności, motywowanie do działania i zapewnienie centralnego punktu startowego.
  - **Kluczowe informacje do wyświetlenia:**
    - Sekcja "Hero" z informacją o aktywnym treningu i CTA "Kontynuuj trening" (jeśli dotyczy).
    - Podsumowanie ostatniego zakończonego treningu (data, nazwa planu, kluczowe statystyki).
    - Wykres objętości treningowej z ostatnich 4 tygodni.
    - Przyciski szybkich akcji ("Rozpocznij trening", "Zobacz historię").
  - **Kluczowe komponenty widoku:** `ActiveWorkoutBanner`, `WorkoutSummaryCard`, `VolumeChart` (Recharts), `Button`.
  - **UX, dostępność i względy bezpieczeństwa:** Czytelne CTA, dynamiczne dane ogłaszane czytnikom ekranu (`aria-live`), responsywny wykres, dane ładowane po stronie serwera z uwzględnieniem RLS.

- **Nazwa widoku:** Plany treningowe
  - **Ścieżka widoku:** `/workout-plans`
  - **Główny cel:** Umożliwienie użytkownikowi przeglądania, tworzenia i zarządzania swoimi planami treningowymi.
  - **Kluczowe informacje do wyświetlenia:** Lista planów użytkownika z nazwą, opisem, liczbą ćwiczeń.
  - **Kluczowe komponenty widoku:** `Card` dla każdego planu, `Input` (wyszukiwanie), `Button` ("Utwórz nowy plan"), `DropdownMenu` (akcje: Edytuj, Usuń, Rozpocznij).
  - **UX, dostępność i względy bezpieczeństwa:** Wyszukiwanie po stronie klienta lub serwera, szkieletowe ekrany ładowania (`Skeleton`), dialogi potwierdzające usunięcie, ochrona przed usunięciem planu powiązanego z aktywnym treningiem.

- **Nazwa widoku:** Baza ćwiczeń
  - **Ścieżka widoku:** `/exercises`
  - **Główny cel:** Umożliwienie użytkownikowi eksploracji dostępnych ćwiczeń i poznania ich szczegółów.
  - **Kluczowe informacje do wyświetlenia:** Siatka lub lista ćwiczeń z obrazkiem, nazwą i kategorią. Filtry (kategoria, poziom trudności) i wyszukiwarka.
  - **Kluczowe komponenty widoku:** `ExerciseCard`, `Input` (wyszukiwanie), `Select` (filtr kategorii), `Checkbox` (filtr trudności), `Sheet` (szczegóły na mobile), `Dialog` (szczegóły na desktop).
  - **UX, dostępność i względy bezpieczeństwa:** Filtrowanie po stronie serwera dla wydajności, leniwe ładowanie obrazków, pełna obsługa z klawiatury, semantyczne etykiety dla filtrów.

- **Nazwa widoku:** Historia treningów
  - **Ścieżka widoku:** `/workouts/history`
  - **Główny cel:** Przeglądanie i analiza zakończonych treningów.
  - **Kluczowe informacje do wyświetlenia:** Lista historycznych treningów w formie osi czasu (timeline) z datą, nazwą planu i kluczowymi statystykami (objętość, czas trwania).
  - **Kluczowe komponenty widoku:** `WorkoutHistoryItem`, filtry (zakres dat, plan), opcjonalny przełącznik widoku (lista/kalendarz).
  - **UX, dostępność i względy bezpieczeństwa:** Czytelna prezentacja danych historycznych, dostęp do szczegółów każdego treningu, paginacja lub nieskończone przewijanie dla długich list.


### Widoki Funkcyjne i Przepływy

- **Nazwa widoku:** Tworzenie/Edycja Planu (Multi-step)
  - **Ścieżka widoku:** `/workout-plans/new` (kroki 1-3), `/workout-plans/[id]/edit`
  - **Główny cel:** Prowadzenie użytkownika przez proces tworzenia lub modyfikacji planu treningowego.
  - **Kluczowe informacje do wyświetlenia:**
    1.  **Krok 1:** Formularz nazwy i opisu.
    2.  **Krok 2:** Interfejs dodawania i kolejkowania ćwiczeń z bazy.
    3.  **Krok 3:** Interfejs definiowania serii (powtórzenia, ciężar) dla każdego ćwiczenia.
  - **Kluczowe komponenty widoku:** `Stepper`, `Input`, `Textarea`, `ExerciseCard`, `SetInput`, przyciski strzałek do zmiany kolejności.
  - **UX, dostępność i względy bezpieczeństwa:** Podział złożonego zadania na mniejsze kroki, walidacja na każdym etapie, zapisywanie stanu między krokami, wyraźne CTA.

- **Nazwa widoku:** Aktywny Trening
  - **Ścieżka widoku:** `/workouts/active`
  - **Główny cel:** Logowanie postępów w czasie rzeczywistym podczas sesji treningowej.
  - **Kluczowe informacje do wyświetlenia:** Nazwa planu, stoper, lista ćwiczeń i serii, pola do wprowadzania rzeczywistych wyników, przycisk zakończenia.
  - **Kluczowe komponenty widoku:** `WorkoutTimer`, `SetInput` (hybrydowy), `Checkbox` (44x44px), `Accordion` (dla ćwiczeń), przełącznik trybu "Focus".
  - **UX, dostępność i względy bezpieczeństwa:** Duże cele dotykowe, natychmiastowy feedback wizualny (optimistic updates), ochrona przed przypadkowym zamknięciem strony (`beforeunload`), stan treningu zapisywany w `localStorage`.

- **Nazwa widoku:** Podsumowanie Treningu
  - **Ścieżka widoku:** `/workouts/[id]/summary`
  - **Główny cel:** Prezentacja kluczowych statystyk bezpośrednio po zakończeniu treningu.
  - **Kluczowe informacje do wyświetlenia:** Komunikat gratulacyjny, podsumowanie statystyk (czas, objętość, maks. ciężar itp.), lista wykonanych ćwiczeń.
  - **Kluczowe komponenty widoku:** `Card` ze statystykami, `Button` ("Wróć do strony głównej").
  - **UX, dostępność i względy bezpieczeństwa:** Jasna i motywująca prezentacja osiągnięć.

- **Nazwa widoku:** Logowanie / Rejestracja
  - **Ścieżka widoku:** `/auth/login`, `/auth/register`
  - **Główny cel:** Uwierzytelnienie użytkownika.
  - **Kluczowe informacje do wyświetlenia:** Formularze z polami na e-mail i hasło.
  - **Kluczowe komponenty widoku:** `Form`, `Input`, `Button`, `Label`.
  - **UX, dostępność i względy bezpieczeństwa:** Walidacja w czasie rzeczywistym, komunikaty o błędach powiązane z polami (`aria-describedby`), ochrona przed atakami CSRF/XSS (obsługiwane przez Astro/Supabase).

## 3. Mapa podróży użytkownika

1.  **Uwierzytelnianie:** Nowy użytkownik ląduje na `/auth/register`, tworzy konto i jest automatycznie logowany, po czym trafia na Dashboard (`/`). Powracający użytkownik loguje się na `/auth/login`.
2.  **Eksploracja:** Z Dashboardu użytkownik może przejść do `/workout-plans`, aby zobaczyć swoje plany, lub do `/exercises`, aby przeglądać bazę ćwiczeń.
3.  **Tworzenie Planu:** Użytkownik klika "Utwórz nowy plan" i jest przeprowadzany przez 3-etapowy proces (`/workout-plans/new/step-1` → `.../step-2` → `.../step-3`), kończący się zapisaniem planu i powrotem do listy planów.
4.  **Rozpoczęcie Treningu:** Na liście planów (`/workout-plans`) użytkownik klika "Rozpocznij trening". Aplikacja tworzy nową sesję treningową i przekierowuje go do `/workouts/active`.
5.  **Logowanie Treningu:** W widoku `/workouts/active` użytkownik oznacza wykonane serie, modyfikuje ciężary/powtórzenia i dodaje notatki. Zmiany są zapisywane z użyciem optimistic updates.
6.  **Zakończenie i Podsumowanie:** Po zakończeniu treningu użytkownik jest przekierowywany na stronę podsumowania (`/workouts/[id]/summary`), gdzie widzi swoje statystyki.
7.  **Analiza Postępów:** W dowolnym momencie użytkownik może wejść w `/workouts/history`, aby przejrzeć listę swoich poprzednich treningów i analizować postępy na wykresie na Dashboardzie.

## 4. Układ i struktura nawigacji

- **Nawigacja Główna (Mobile):**
  - **Typ:** Dolny pasek nawigacyjny (Bottom Navigation Bar).
  - **Elementy:**
    1.  `Dashboard` (`/`)
    2.  `Plany` (`/workout-plans`)
    3.  `Aktywny Trening` (`/workouts/active`) - *widoczny warunkowo, tylko gdy trening jest w toku.*
    4.  `Ćwiczenia` (`/exercises`)
  - **Uzasadnienie:** Zapewnia łatwy dostęp kciukiem do kluczowych sekcji, co jest kluczowe podczas treningu.

- **Nawigacja Główna (Desktop):**
  - **Typ:** Boczny lub górny pasek nawigacyjny.
  - **Elementy:** Te same co w wersji mobilnej, ale prezentowane w formie listy linków z ikonami i etykietami.
  - **Uzasadnienie:** Lepsze wykorzystanie przestrzeni na większych ekranach.

- **Nawigacja Kontekstowa:**
  - Przyciski "Wstecz", linki "Anuluj" oraz okruszki (breadcrumbs) będą używane wewnątrz złożonych przepływów (np. tworzenie planu), aby ułatwić orientację.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić fundament interfejsu użytkownika:

- **`ActiveWorkoutBanner`:** Sticky banner wyświetlany na wszystkich stronach, gdy trening jest aktywny, z CTA do kontynuacji.
- **`ExerciseCard`:** Karta reprezentująca pojedyncze ćwiczenie w listach i wynikach wyszukiwania.
- **`SetInput`:** Hybrydowy komponent formularza (`Input` numeryczny połączony z przyciskami `+/-`) do szybkiej modyfikacji powtórzeń i ciężaru.
- **`WorkoutTimer`:** Komponent wyświetlający upływający czas aktywnego treningu.
- **`VolumeChart`:** Opakowanie (wrapper) na bibliotekę `Recharts`, skonfigurowane do wyświetlania wykresu objętości z odpowiednimi osiami i tooltipami.
- **`WorkoutSummaryCard`:** Karta do wyświetlania skondensowanych informacji o zakończonym treningu na Dashboardzie lub w historii.
- **`ProtectedRoute` (Middleware):** Logika w middleware Astro, która chroni strony wymagające uwierzytelnienia i przekierowuje niezalogowanych użytkowników do `/auth/login`.
- **Komponenty z `shadcn/ui`:** Szerokie wykorzystanie gotowych, dostępnych i stylowalnych komponentów, takich jak `Button`, `Card`, `Dialog`, `Sheet`, `Input`, `Checkbox`, `Skeleton` w celu zapewnienia spójności wizualnej i przyspieszenia developmentu.
- **`Sonner`:** Biblioteka do obsługi powiadomień typu "toast" dla natychmiastowego feedbacku po akcjach użytkownika.
