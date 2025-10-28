# Testing Guide - Gym Track

Przewodnik po testowaniu w projekcie Gym Track.

## Spis treści

- [Przegląd](#przegląd)
- [Instalacja](#instalacja)
- [Testy jednostkowe (Vitest)](#testy-jednostkowe-vitest)
- [Testy E2E (Playwright)](#testy-e2e-playwright)
- [Uruchamianie testów](#uruchamianie-testów)
- [Struktura projektu testowego](#struktura-projektu-testowego)
- [Best practices](#best-practices)

## Przegląd

Projekt wykorzystuje następujący stack testowy:

- **Vitest 2.x** - Testy jednostkowe i integracyjne (z happy-dom)
- **React Testing Library 16.x** - Testowanie komponentów React
- **Playwright 1.50+** - Testy end-to-end (Chromium)

**Cel pokrycia kodu:** ≥80% dla logiki biznesowej i walidacji

## Instalacja

Wszystkie zależności testowe są już zainstalowane. Aby zainstalować przeglądarki dla Playwright:

```bash
npm run playwright:install
```

## Testy jednostkowe (Vitest)

### Uruchamianie testów

```bash
# Uruchom wszystkie testy jednostkowe
npm run test

# Tryb watch (automatyczne ponowne uruchamianie)
npm run test:watch

# UI mode (wizualna nawigacja po testach)
npm run test:ui

# Pokrycie kodu (coverage)
npm run test:coverage
```

### Struktura testów jednostkowych

Testy jednostkowe powinny być umieszczone obok testowanego kodu z rozszerzeniem `.test.ts` lub `.test.tsx`:

```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts          # Testy dla utils.ts
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       └── LoginForm.test.tsx  # Testy dla LoginForm.tsx
└── test/
    ├── setup.ts               # Globalna konfiguracja testów
    └── utils.tsx              # Pomocnicze funkcje dla testów
```

### Przykład testu jednostkowego

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn() utility function", () => {
  it("should merge class names correctly", () => {
    // Arrange
    const class1 = "text-red-500";
    const class2 = "font-bold";

    // Act
    const result = cn(class1, class2);

    // Assert
    expect(result).toBe("text-red-500 font-bold");
  });
});
```

### Przykład testu komponentu React

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm Component", () => {
  it("should render login form with all fields", () => {
    // Act
    render(<LoginForm />);

    // Assert - using semantic queries
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should submit form with valid credentials", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);

    // Act
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePass123!");
    await user.click(screen.getByRole("button", { name: /login/i }));

    // Assert
    // ... verify API call or state change
  });
});
```

### Mockowanie w Vitest

```typescript
import { vi } from "vitest";

// Mock funkcji
const mockFn = vi.fn();
mockFn.mockReturnValue("mocked value");

// Mock modułu
vi.mock("@/lib/services/workouts.service", () => ({
  workoutsService: {
    getWorkouts: vi.fn().mockResolvedValue({ data: [], pagination: {} }),
  },
}));

// Mock globalnych obiektów
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: [] }),
});
```

## Testy E2E (Playwright)

### Konfiguracja użytkownika testowego

Niektóre testy E2E wymagają użytkownika testowego w bazie danych. Dodaj dane testowe do `.env`:

```bash
# E2E Test User Credentials
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-secure-password
```

**Więcej informacji:** Zobacz `e2e/README.md`

### Uruchamianie testów E2E

```bash
# Uruchom wszystkie testy E2E (headless)
npm run test:e2e

# UI mode (wizualna nawigacja i debugging)
npm run test:e2e:ui

# Debug mode (krok po kroku)
npm run test:e2e:debug

# Tryb headed (widoczna przeglądarka)
npm run test:e2e:headed

# Test generator (nagrywanie testów)
npm run test:e2e:codegen
```

### Struktura testów E2E

```
e2e/
├── fixtures/              # Dane testowe
│   └── auth.ts
├── pages/                 # Page Object Model classes
│   ├── LoginPage.ts
│   └── DashboardPage.ts
└── auth-login.spec.ts     # Test specs
```

### Page Object Model (POM)

Testy E2E używają wzorca Page Object Model dla lepszej maintainability:

```typescript
// e2e/pages/LoginPage.ts
import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole("button", { name: /login/i });
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Przykład testu E2E

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication - Login", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login("test@example.com", "SecurePass123!");

    // Assert
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

## Uruchamianie testów

### W development

```bash
# Terminal 1: Uruchom serwer deweloperski
npm run dev

# Terminal 2: Uruchom testy
npm run test:watch          # Unit tests w trybie watch
npm run test:e2e:headed     # E2E tests z widoczną przeglądarką
```

### W CI/CD

```bash
# Uruchom wszystkie testy
npm run test && npm run test:e2e
```

## Struktura projektu testowego

```
gym-track/
├── src/
│   ├── test/
│   │   ├── setup.ts           # Vitest global setup
│   │   └── utils.tsx          # Test utilities
│   ├── lib/
│   │   ├── utils.ts
│   │   └── utils.test.ts      # Unit tests
│   └── components/
│       └── auth/
│           ├── LoginForm.tsx
│           └── LoginForm.test.tsx
├── e2e/
│   ├── fixtures/              # Test data
│   ├── pages/                 # Page Object Models
│   └── *.spec.ts              # E2E test specs
├── vitest.config.ts           # Vitest configuration
├── playwright.config.ts       # Playwright configuration
└── TESTING.md                 # Ta dokumentacja
```

## Best Practices

### Vitest (Unit Tests)

1. **Używaj `vi` object dla mocków**
   ```typescript
   import { vi } from "vitest";
   const mockFn = vi.fn();
   ```

2. **Struktura testów: Arrange-Act-Assert**
   ```typescript
   it("should do something", () => {
     // Arrange - prepare test data
     const input = "test";

     // Act - execute the code
     const result = someFunction(input);

     // Assert - verify the result
     expect(result).toBe("expected");
   });
   ```

3. **Używaj describe dla grupowania testów**
   ```typescript
   describe("Feature Name", () => {
     describe("specific behavior", () => {
       it("should ...", () => {});
     });
   });
   ```

4. **Semantyczne zapytania w RTL**
   ```typescript
   // ✅ Dobre - semantyczne zapytania
   screen.getByRole("button", { name: /submit/i });
   screen.getByLabelText(/email/i);

   // ❌ Złe - implementacyjne szczegóły
   screen.getByClassName("submit-btn");
   screen.getByTestId("email-input");
   ```

### Playwright (E2E Tests)

1. **Używaj Page Object Model**
   - Enkapsuluj logikę strony w klasach POM
   - Używaj semantic locators (`getByRole`, `getByLabel`)

2. **Izolacja testów**
   - Każdy test powinien być niezależny
   - Używaj `test.beforeEach` dla setup

3. **Wykorzystaj auto-wait**
   - Playwright automatycznie czeka na elementy
   - Unikaj `page.waitForTimeout()` - użyj `waitFor` na elementach

4. **Visual regression tests**
   ```typescript
   await expect(page).toHaveScreenshot("page-name.png");
   ```

5. **Trace viewer dla debugowania**
   - Po failure, sprawdź trace: `npx playwright show-trace trace.zip`

## Przydatne komendy

```bash
# Vitest
npm run test                    # Uruchom testy
npm run test:watch              # Watch mode
npm run test:ui                 # UI mode
npm run test:coverage           # Code coverage

# Playwright
npm run test:e2e                # Uruchom E2E (headless)
npm run test:e2e:ui             # UI mode
npm run test:e2e:debug          # Debug mode
npm run test:e2e:headed         # Headed mode
npm run test:e2e:codegen        # Test generator
npm run playwright:install      # Zainstaluj przeglądarki
```

## Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Plan testów projektu](./.ai/test-plan.md)
