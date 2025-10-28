# Test Utilities

Ten folder zawiera pomocnicze narzędzia i konfigurację dla testów jednostkowych i integracyjnych.

## Pliki

### `setup.ts`
Globalna konfiguracja Vitest, która uruchamia się przed wszystkimi testami:
- Rozszerza `expect` o matchers z `@testing-library/jest-dom`
- Czyści DOM po każdym teście (`cleanup`)
- Mockuje globalne obiekty (`fetch`, `IntersectionObserver`, `ResizeObserver`, `matchMedia`)
- Ustawia zmienne środowiskowe dla testów

### `utils.tsx`
Reużywalne funkcje pomocnicze dla testów:
- `renderWithProviders()` - Custom render z providerami (Router, Theme, Auth)
- `createMockUser()` - Generator mock użytkowników Supabase
- `createMockSupabaseClient()` - Mock klienta Supabase
- `createMockWorkoutPlan()` - Generator mock planów treningowych
- `createMockExercise()` - Generator mock ćwiczeń
- `createMockWorkout()` - Generator mock treningów
- `mockFetchResponse()` - Helper do mockowania fetch API
- `wait()` - Funkcja oczekiwania dla async operacji

## Użycie

### Import utilities w testach

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockUser, createMockSupabaseClient } from "@/test/utils";

describe("My Component", () => {
  it("should render with mock data", () => {
    const mockUser = createMockUser({ email: "test@example.com" });
    const mockClient = createMockSupabaseClient();

    render(<MyComponent user={mockUser} supabase={mockClient} />);

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });
});
```

### Mockowanie Supabase

```typescript
import { vi } from "vitest";
import { createMockSupabaseClient } from "@/test/utils";

// Mock całego modułu Supabase
vi.mock("@/db/supabase.client", () => ({
  createClient: () => createMockSupabaseClient(),
}));

// Lub mock specific metod
const mockSupabase = createMockSupabaseClient();
mockSupabase.from = vi.fn().mockReturnValue({
  select: vi.fn().mockResolvedValue({ data: [], error: null }),
});
```

### Mockowanie fetch

```typescript
import { vi } from "vitest";
import { mockFetchResponse } from "@/test/utils";

global.fetch = vi.fn().mockResolvedValue(
  mockFetchResponse({ data: [] }, { status: 200 })
);
```

## Best Practices

1. **Reużywaj mock factories** - używaj `createMock*()` functions dla spójności
2. **Czyść mocki między testami** - użyj `vi.clearAllMocks()` w `beforeEach`
3. **Mockuj tylko to, co potrzebne** - nie mockuj całego świata
4. **Testuj zachowanie, nie implementację** - użyj semantic queries
5. **Używaj TypeScript** - wszystkie mocki powinny zachować typy oryginałów
