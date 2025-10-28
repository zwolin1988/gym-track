## Frontend
- Astro 5: Pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript.
- React 19: Zapewnia interaktywność tam, gdzie jest potrzebna, umożliwiając tworzenie dynamicznych komponentów.
- TypeScript 5: Stosowany dla statycznego typowania kodu, co wspiera rozwój i utrzymanie wysokiej jakości kodu.
- Tailwind 4 CSS: Umożliwia wygodne i efektywne stylowanie aplikacji przy użyciu gotowych klas.
- Shadcn/ui: Zapewnia bibliotekę dostępnych komponentów React, która stanowi podstawę UI.

## Backend
- **Supabase**: Kompleksowe rozwiązanie backendowe, które oferuje:
  - Bazę danych **PostgreSQL** z Row Level Security (RLS)
  - **Supabase Auth** - system zarządzania użytkownikami i autentykacji
    - Rejestracja i logowanie użytkowników
    - Zarządzanie sesjami (JWT tokens, refresh tokens)
    - User ID (`auth.uid()`) jako klucz powiązania danych użytkownika
  - **@supabase/ssr** - pakiet dla SSR-compatible authentication w Astro
  - **@supabase/supabase-js** - główny SDK JavaScript/TypeScript
  - SDK w wielu językach działające jako Backend-as-a-Service
  - Możliwość hostowania lokalnie lub na własnym serwerze dzięki rozwiązaniu open source
- **Zod**: Walidacja i parsowanie danych wejściowych w API routes

## AI
- Openrouter.ai: Umożliwia komunikację z modelami AI, oferując dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wielu innych).
  - Pozwala na ustawianie limitów finansowych dla kluczy API, co zapewnia kontrolę nad kosztami

## Testy

### Testy Jednostkowe i Integracyjne
- **Vitest 2.x**: Framework do testów jednostkowych i integracyjnych z natywnym wsparciem TypeScript i ESM
  - Szybkie wykonanie testów dzięki Vite
  - Kompatybilny API z Jest (describe, it, expect, mock)
  - Wbudowane code coverage (c8)
  - Hot Module Reload dla testów
  - Native ESM support
  - Zakres testowania:
    - Walidacja schematów Zod (auth, workouts, workout-plans, exercises, categories)
    - Funkcje pomocnicze (utils: `cn()`, `auth-errors`, `dates`)
    - Custom hooks React (`useWorkoutTimer`, `useDebounce`)
    - Logika biznesowa w serwisach (z mockami Supabase)
    - API endpoints (z mockami serwisów)
  - Cel pokrycia kodu: ≥80% dla warstwy logiki biznesowej i walidacji

- **React Testing Library 16.x**: Testowanie komponentów React z perspektywy użytkownika
  - User-centric testing approach
  - Integracja z Vitest
  - Custom matchers dla DOM (@testing-library/jest-dom)
  - Zapytania semantyczne (`getByRole`, `getByLabelText`, `getByText`)
  - User events (`userEvent.click`, `userEvent.type`)
  - Async utilities (`waitFor`, `findBy*`)
  - Zakres testowania:
    - Komponenty Shadcn/ui (Button, Card, Dialog, Select, Checkbox, etc.)
    - Komponenty biznesowe (WorkoutPlanCard, ExerciseCard, LoginForm, etc.)
    - Renderowanie z różnymi props i stanami (loading, error, success)
    - Interakcje użytkownika (kliknięcia, formularze)
    - Warunki brzegowe (puste listy, długie nazwy)

### Testy End-to-End (E2E)
- **Playwright 1.50+**: Nowoczesne testy end-to-end
  - Cross-browser support:
    - Chromium (Chrome, Edge)
    - Firefox
    - WebKit (Safari)
  - Możliwości:
    - Auto-wait (automatyczne czekanie na elementy i żądania sieciowe)
    - Screenshot i video recording przy błędach
    - Network interception (mockowanie API calls)
    - Mobile emulation (różne urządzenia i rozdzielczości)
    - Parallel execution (równoległe uruchamianie testów)
    - Test generator (codegen) - nagrywanie testów
    - Debugging tools
  - Zakres testowania:
    - Pełne ścieżki użytkownika (user flows):
      - Rejestracja → Logowanie → Dashboard
      - Tworzenie planu → Dodanie ćwiczeń → Rozpoczęcie treningu → Zakończenie
      - Przeglądanie historii → Wyświetlanie statystyk → Wykresy
      - Edycja planu → Usunięcie planu
      - Wyszukiwanie ćwiczeń → Filtrowanie
    - Cross-device testing:
      - Desktop (1920x1080)
      - Tablet (768x1024)
      - Mobile (375x667)
    - Happy paths + error paths
  - Środowisko: Staging/testowe Supabase z danymi testowymi

### Narzędzia Pomocnicze
- **Mock Service Worker (MSW)**: Mockowanie API endpoints w testach komponentów (opcjonalnie)
- **Faker.js**: Generowanie danych testowych (nazwy planów, opisy)
- **Supertest**: Testowanie API endpoints (alternatywa do fetch w testach)

## CI/CD i Hosting
- GitHub Actions: Automatyzuje proces budowy pipeline'ów CI/CD, co przyspiesza wdrażanie zmian.
- DigitalOcean: Hostowanie aplikacji za pośrednictwem obrazów Docker, gwarantujące skalowalność oraz wydajność.