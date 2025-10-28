# E2E Tests (Playwright)

Ten folder zawiera testy end-to-end dla projektu Gym Track.

## Przed uruchomieniem testów

### Konfiguracja użytkownika testowego

Niektóre testy wymagają istniejącego użytkownika w bazie danych. Aby uruchomić pełny zestaw testów:

1. **Utwórz użytkownika testowego w Supabase:**
   - Email: `demo@demo.pl`
   - Hasło: `demo1234`

2. **Lub zaktualizuj dane testowe** w `e2e/fixtures/auth.ts`:
   ```typescript
   export const TEST_USERS = {
     valid: {
       email: "twoj-email@example.com",  // Zmień na istniejące dane
       password: "twoje-haslo",
     },
     // ...
   };
   ```

3. **Testy wymagające użytkownika (obecnie pominięte przez `.skip()`):**
   - `TC-AUTH-003: should login successfully with valid credentials`
   - `should persist session after page reload`
   - `should logout successfully`

Aby włączyć te testy, usuń `.skip` z odpowiednich linii w `e2e/auth-login.spec.ts`.

## Struktura

```
e2e/
├── fixtures/              # Dane testowe i konfiguracja
│   └── auth.ts           # Fixtures dla autentykacji
├── pages/                # Page Object Model classes
│   ├── LoginPage.ts      # POM dla strony logowania
│   └── DashboardPage.ts  # POM dla dashboardu
└── *.spec.ts             # Pliki testowe
```

## Page Object Model (POM)

Wszystkie testy E2E używają wzorca Page Object Model dla lepszej maintainability:

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
    // Używaj semantic locators (role, label)
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

## Fixtures

Fixtures zawierają dane testowe używane w testach:

```typescript
// e2e/fixtures/auth.ts
export const TEST_USERS = {
  valid: {
    email: "test@example.com",
    password: "SecurePass123!",
  },
};
```

## Pisanie testów

### Podstawowy test E2E

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { TEST_USERS } from "./fixtures/auth";

test.describe("Login Flow", () => {
  test("should login with valid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);

    // Assert
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

### Test hooks

```typescript
test.describe("Feature Tests", () => {
  let loginPage: LoginPage;

  // Setup przed każdym testem
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // Cleanup po każdym teście
  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test("test case 1", async ({ page }) => {
    // test implementation
  });
});
```

### Izolacja kontekstu przeglądarki

```typescript
test("test with isolated context", async ({ browser }) => {
  // Każdy test ma własny context
  const context = await browser.newContext();
  const page = await context.newPage();

  // test implementation

  await context.close();
});
```

## Uruchamianie testów

```bash
# Wszystkie testy (headless)
npm run test:e2e

# UI mode (wizualna nawigacja)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Headed mode (widoczna przeglądarka)
npm run test:e2e:headed

# Specific test file
npm run test:e2e -- auth-login.spec.ts

# Test generator (nagrywanie testów)
npm run test:e2e:codegen
```

## Debugging

### Trace Viewer

Po każdym failed test, Playwright tworzy trace file:

```bash
npx playwright show-trace trace.zip
```

### Debug mode

```bash
npm run test:e2e:debug
```

Otwiera się debugger gdzie możesz:
- Przechodzić test krok po kroku
- Inspektować elementy
- Zobacz console logs
- Zobaczyć network requests

## Visual Regression Testing

Playwright wspiera visual comparison:

```typescript
test("visual snapshot", async ({ page }) => {
  await page.goto("/dashboard");

  // Pierwsze uruchomienie tworzy baseline
  // Kolejne uruchomienia porównują ze zrzutem
  await expect(page).toHaveScreenshot("dashboard.png");
});
```

## Best Practices

### 1. Używaj semantic locators

```typescript
// ✅ Dobre - semantic locators
page.getByRole("button", { name: /submit/i });
page.getByLabel(/email/i);
page.getByText(/welcome/i);

// ❌ Złe - implementacyjne szczegóły
page.locator(".submit-btn");
page.locator("#email-input");
```

### 2. Wykorzystaj auto-wait

```typescript
// ✅ Dobre - Playwright czeka automatycznie
await page.getByRole("button").click();

// ❌ Złe - niepotrzebne oczekiwanie
await page.waitForTimeout(1000);
await page.getByRole("button").click();
```

### 3. Używaj Page Object Model

```typescript
// ✅ Dobre - POM pattern
const loginPage = new LoginPage(page);
await loginPage.login(email, password);

// ❌ Złe - logika bezpośrednio w teście
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await page.click("button");
```

### 4. Izoluj testy

```typescript
// ✅ Dobre - każdy test jest niezależny
test.beforeEach(async ({ page }) => {
  // Setup dla każdego testu
});

// ❌ Złe - testy zależne od siebie
test("create user", async () => {
  // creates user
});
test("login user", async () => {
  // assumes user from previous test exists
});
```

### 5. Używaj fixtures dla danych testowych

```typescript
// ✅ Dobre - dane w fixtures
import { TEST_USERS } from "./fixtures/auth";
await loginPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);

// ❌ Złe - hardcoded dane w testach
await loginPage.login("test@test.com", "password123");
```

## Dokumentacja

- [Playwright Documentation](https://playwright.dev/)
- [Test plan](./../.ai/test-plan.md)
- [Cursor rules](./../.cursor/rules/playwright-e2e-testing.mdc)
