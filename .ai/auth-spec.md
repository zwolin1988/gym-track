# Specyfikacja Techniczna - Moduł Autentykacji i Autoryzacji
## Gym Track MVP v1.0

---

## Spis treści

1. [Wprowadzenie](#1-wprowadzenie)
2. [Architektura Interfejsu Użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika Backendowa](#3-logika-backendowa)
4. [System Autentykacji](#4-system-autentykacji)
5. [Walidacja i Obsługa Błędów](#5-walidacja-i-obsługa-błędów)
6. [Bezpieczeństwo i RLS](#6-bezpieczeństwo-i-rls)
7. [Przepływ Danych](#7-przepływ-danych)
8. [Kontrakty i Typy](#8-kontrakty-i-typy)

---

## 1. Wprowadzenie

### 1.1. Cel dokumentu

Niniejszy dokument zawiera szczegółową specyfikację techniczną modułu autentykacji i autoryzacji dla aplikacji Gym Track. Specyfikacja obejmuje implementację historyjek użytkownika US-001 do US-005 z PRD, zgodnie z wymaganiami kursowymi oraz architekturą opartą na Astro 5, React 19, TypeScript 5, Tailwind CSS 4 i Supabase.

### 1.2. Zakres funkcjonalny

Moduł autentykacji zapewnia:

- **US-001**: Rejestrację nowych użytkowników (email + hasło)
- **US-002**: Logowanie istniejących użytkowników z zarządzaniem sesjami
- **US-003**: Wylogowanie użytkowników
- **US-004**: Ochronę chronionych tras (route protection)
- **US-005**: Row Level Security (RLS) dla izolacji danych użytkowników

### 1.3. Założenia architektoniczne

1. **Server-side rendering (SSR)**: Aplikacja wykorzystuje Astro w trybie `output: "server"` z adapterem Node.js (`@astrojs/node` w trybie `standalone`)
2. **Hybrid rendering**: Strony są renderowane po stronie serwera domyślnie, z możliwością pre-renderowania statycznego (`export const prerender = true`)
3. **Rozdzielenie odpowiedzialności**:
   - **Astro components (.astro)** → Strony, layouty, statyczna zawartość
   - **React components (.tsx)** → Interaktywne formularze i komponenty wymagające state management
4. **Middleware-first approach**: Całą logikę autentykacji obsługuje Astro middleware, które wstrzykuje `supabase` i `user` do `context.locals`
5. **Backend-as-a-Service**: Supabase obsługuje autentykację, bazę danych, RLS i sesje

---

## 2. Architektura Interfejsu Użytkownika

### 2.1. Struktura stron i tras

#### 2.1.1. Nowe strony Astro (public, non-authenticated)

Wszystkie strony autentykacji są dostępne publicznie i renderowane server-side:

```
src/pages/
├── auth/
│   ├── register.astro      # Strona rejestracji (US-001)
│   ├── login.astro          # Strona logowania (US-002)
│   └── reset-password.astro # Strona odzyskiwania hasła (future scope)
```

**Charakterystyka stron autentykacji:**

- **Renderowanie**: Server-side (SSR) z `output: "server"`
- **Layout**: Wykorzystują dedykowany `AuthLayout.astro` (minimalistyczny, bez nawigacji aplikacji)
- **Logika**: Server-side sprawdzanie czy użytkownik jest już zalogowany → jeśli tak, przekierowanie do `/dashboard`
- **Komponenty**: Zawierają interaktywne formularze React z `client:load` directive
- **Responsywność**: Pełna responsywność z Tailwind CSS (mobile-first)

#### 2.1.2. Strony chronione (protected, authenticated)

Istniejące i przyszłe strony wymagające autoryzacji:

```
src/pages/
├── dashboard.astro          # Strona główna po zalogowaniu (nowa)
├── plans/
│   ├── index.astro         # Lista planów treningowych (future)
│   ├── [id].astro          # Szczegóły planu (future)
│   └── new.astro           # Tworzenie planu (future)
├── workouts/
│   ├── index.astro         # Historia treningów (future)
│   ├── [id].astro          # Szczegóły treningu (future)
│   └── active.astro        # Aktywny trening (future)
└── profile.astro            # Profil użytkownika (future)
```

**Charakterystyka stron chronionych:**

- **Renderowanie**: Server-side (SSR)
- **Layout**: Wykorzystują główny `Layout.astro` z nawigacją i informacją o użytkowniku
- **Ochrona**: Middleware sprawdza `context.locals.user` → jeśli `null`, przekierowanie do `/auth/login`
- **Dostęp do danych**: Wykorzystują `context.locals.supabase` (pre-authenticated client)

#### 2.1.3. Strona główna (landing page)

```
src/pages/
└── index.astro              # Landing page / strona główna (istniejąca)
```

**Charakterystyka:**

- **Renderowanie**: Server-side (SSR)
- **Logika warunkowa**:
  - Jeśli użytkownik zalogowany (`context.locals.user !== null`) → przekierowanie do `/dashboard`
  - Jeśli użytkownik niezalogowany → wyświetlenie landing page z przyciskami "Zaloguj się" i "Zarejestruj się"

### 2.2. Layouty Astro

#### 2.2.1. AuthLayout.astro (nowy)

Dedykowany layout dla stron autentykacji (rejestracja, logowanie).

**Lokalizacja**: `src/layouts/AuthLayout.astro`

**Struktura:**

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | Gym Track</title>
    {description && <meta name="description" content={description} />}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <main class="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold tracking-tight">Gym Track</h1>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Śledź swoje postępy treningowe
          </p>
        </div>
        <slot />
      </div>
    </main>
  </body>
</html>
```

**Odpowiedzialność:**

- Minimalistyczny layout bez nawigacji głównej aplikacji
- Centrowanie formularza na ekranie
- Responsywny kontener (`max-w-md`)
- Branding aplikacji (logo, nazwa)

#### 2.2.2. Layout.astro (rozszerzenie istniejącego)

Główny layout dla stron chronionych, zawierający nawigację i informacje o użytkowniku.

**Lokalizacja**: `src/layouts/Layout.astro`

**Rozszerzenia:**

1. **Komponent nawigacji**: Dodanie `<Navigation />` (React component) z informacją o zalogowanym użytkowniku
2. **Przycisk wylogowania**: Dostępny w nawigacji
3. **Warunkowe renderowanie**: Layout sprawdza `Astro.locals.user` i wyświetla odpowiednie elementy

**Przykładowa struktura nawigacji:**

```typescript
// src/components/Navigation.tsx
interface NavigationProps {
  user: {
    email: string;
  };
}

export function Navigation({ user }: NavigationProps) {
  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="text-xl font-bold">Gym Track</a>
          <div className="hidden md:flex gap-4">
            <a href="/plans">Plany</a>
            <a href="/workouts">Treningi</a>
            <a href="/history">Historia</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-600">{user.email}</span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
```

### 2.3. Komponenty React (client-side)

#### 2.3.1. RegisterForm.tsx (nowy)

Formularz rejestracji użytkownika.

**Lokalizacja**: `src/components/auth/RegisterForm.tsx`

**Odpowiedzialność:**

- Zarządzanie stanem formularza (email, password, confirmPassword)
- Walidacja po stronie klienta (real-time)
- Wysłanie żądania POST do `/api/auth/register`
- Wyświetlanie komunikatów błędów i sukcesów (toast notifications)
- Automatyczne przekierowanie po udanej rejestracji

**Props:**

```typescript
interface RegisterFormProps {
  redirectUrl?: string; // Domyślnie: "/dashboard"
}
```

**Stan komponentu:**

```typescript
interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
}
```

**Walidacja kliencka:**

- Email: format email (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
- Hasło: minimum 8 znaków
- Potwierdzenie hasła: zgodność z hasłem
- Walidacja on blur + on submit

**Struktura UI:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Utwórz konto</CardTitle>
    <CardDescription>
      Wprowadź swoje dane, aby założyć konto w Gym Track
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.com"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 8 znaków"
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Powtórz hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Powtórz hasło"
            required
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Tworzenie konta..." : "Zarejestruj się"}
        </Button>
      </div>
    </form>
  </CardContent>
  <CardFooter>
    <p className="text-sm text-neutral-600">
      Masz już konto?{" "}
      <a href="/auth/login" className="font-medium text-primary hover:underline">
        Zaloguj się
      </a>
    </p>
  </CardFooter>
</Card>
```

**Logika obsługi formularza:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setErrors({});

  // Walidacja kliencka
  const validationErrors = validateForm({ email, password, confirmPassword });
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Rejestracja nie powiodła się");
    }

    // Sukces - wyświetl toast i przekieruj
    toast.success("Konto utworzone pomyślnie! Witamy w Gym Track.");
    window.location.href = redirectUrl || "/dashboard";
  } catch (error) {
    setErrors({ general: error.message });
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

#### 2.3.2. LoginForm.tsx (nowy)

Formularz logowania użytkownika.

**Lokalizacja**: `src/components/auth/LoginForm.tsx`

**Odpowiedzialność:**

- Zarządzanie stanem formularza (email, password)
- Walidacja po stronie klienta
- Wysłanie żądania POST do `/api/auth/login`
- Wyświetlanie komunikatów błędów (toast notifications)
- Przekierowanie po udanym logowaniu (do przekazanego `redirectUrl` lub `/dashboard`)

**Props:**

```typescript
interface LoginFormProps {
  redirectUrl?: string; // URL do przekierowania po zalogowaniu
}
```

**Stan komponentu:**

```typescript
interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}
```

**Walidacja kliencka:**

- Email: wymagane
- Hasło: wymagane
- Walidacja on blur + on submit

**Struktura UI:**

Analogiczna do `RegisterForm.tsx`, ale z uproszczonymi polami (bez confirmPassword) i linkiem do odzyskiwania hasła.

**Dodatkowe elementy:**

```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center">
    <Checkbox id="remember" />
    <Label htmlFor="remember" className="ml-2 text-sm">
      Zapamiętaj mnie
    </Label>
  </div>
  <a
    href="/auth/reset-password"
    className="text-sm font-medium text-primary hover:underline"
  >
    Zapomniałeś hasła?
  </a>
</div>
```

**Logika obsługi formularza:**

Analogiczna do `RegisterForm`, ale endpoint to `/api/auth/login`.

#### 2.3.3. LogoutButton.tsx (nowy)

Przycisk wylogowania użytkownika.

**Lokalizacja**: `src/components/auth/LogoutButton.tsx`

**Odpowiedzialność:**

- Wysłanie żądania POST do `/api/auth/logout`
- Wyświetlenie toast notification po wylogowaniu
- Przekierowanie do `/auth/login`

**Props:**

```typescript
interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline";
  children?: React.ReactNode;
}
```

**Struktura:**

```tsx
export function LogoutButton({ variant = "ghost", children }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Wylogowanie nie powiodło się");
      }

      toast.info("Zostałeś wylogowany");
      window.location.href = "/auth/login";
    } catch (error) {
      toast.error("Wystąpił błąd podczas wylogowywania");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Wylogowywanie..." : children || "Wyloguj"}
    </Button>
  );
}
```

### 2.4. Komponenty UI z Shadcn/ui (wykorzystane)

Komponenty wykorzystane w formularzach autentykacji:

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (`src/components/ui/card.tsx`)
- `Input` (`src/components/ui/input.tsx`)
- `Label` (`src/components/ui/label.tsx`)
- `Button` (`src/components/ui/button.tsx`)
- `Checkbox` (`src/components/ui/checkbox.tsx`)

**Instalacja komponentów:**

```bash
npx shadcn@latest add card input label button checkbox
```

### 2.5. Toast Notifications

Wykorzystanie biblioteki `sonner` dla toast notifications (US-037).

**Instalacja:**

```bash
npm install sonner
npx shadcn@latest add sonner
```

**Integracja:**

Dodanie `<Toaster />` do głównego layoutu (`Layout.astro`) i layoutu autentykacji (`AuthLayout.astro`):

```astro
---
import { Toaster } from "@/components/ui/sonner";
---

<body>
  <!-- ... -->
  <Toaster position="top-right" richColors closeButton />
</body>
```

**Użycie w komponentach React:**

```typescript
import { toast } from "sonner";

// Success
toast.success("Konto utworzone pomyślnie!");

// Error
toast.error("Nieprawidłowy email lub hasło");

// Info
toast.info("Zostałeś wylogowany");

// Warning
toast.warning("Sesja wygasła. Zaloguj się ponownie.");
```

### 2.6. Responsywność i UX mobilny (US-041, US-042)

**Zasady projektowania:**

1. **Mobile-first approach**: Tailwind CSS z breakpointami (`sm:`, `md:`, `lg:`)
2. **Touch-friendly UI**:
   - Przyciski minimum `44x44px` (Tailwind: `min-h-11 px-8`)
   - Pola formularza z odpowiednimi odstępami (`space-y-4`)
3. **Responsywne layouty**:
   - Formularze: `max-w-md` (maksymalna szerokość 28rem)
   - Centrowanie na wszystkich urządzeniach
4. **Klawiatury mobilne**:
   - `type="email"` → klawiatura emailowa
   - `type="password"` → ukrywanie znaków
5. **Auto-focus**: Pole email w formularzu logowania/rejestracji ma `autofocus`

---

## 3. Logika Backendowa

### 3.1. Endpointy API

Wszystkie endpointy autentykacji znajdują się w katalogu `src/pages/api/auth/`.

#### 3.1.1. POST /api/auth/register (US-001)

**Lokalizacja**: `src/pages/api/auth/register.ts`

**Odpowiedzialność:**

- Walidacja danych wejściowych (email, password) za pomocą Zod
- Rejestracja użytkownika w Supabase Auth
- Automatyczne zalogowanie użytkownika po rejestracji
- Ustawienie cookies sesji
- Zwrócenie odpowiedzi JSON z danymi użytkownika lub błędem

**Kontrakt żądania:**

```typescript
interface RegisterRequest {
  email: string;    // Format email, wymagane
  password: string; // Minimum 8 znaków, wymagane
}
```

**Schemat walidacji Zod:**

```typescript
import { z } from "zod";

const registerSchema = z.object({
  email: z
    .string()
    .email("Nieprawidłowy format adresu email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

**Kontrakt odpowiedzi:**

**Sukces (201 Created):**

```typescript
interface RegisterSuccessResponse {
  user: {
    id: string;
    email: string;
  };
  message: string;
}
```

**Błąd (400 Bad Request, 409 Conflict, 500 Internal Server Error):**

```typescript
interface RegisterErrorResponse {
  error: string;
}
```

**Implementacja (pseudokod):**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parsowanie body
    const body = await request.json();

    // 2. Walidacja Zod
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return new Response(
        JSON.stringify({ error: firstError || "Nieprawidłowe dane" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // 3. Rejestracja użytkownika w Supabase Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Obsługa błędów Supabase (np. email już istnieje)
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "Ten adres email jest już zarejestrowany" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    if (!data.user) {
      throw new Error("Nie udało się utworzyć użytkownika");
    }

    // 4. Zwrócenie odpowiedzi sukcesu
    // Cookies sesji są automatycznie ustawiane przez middleware (@supabase/ssr)
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: "Konto utworzone pomyślnie",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Register error:", error);
    return new Response(
      JSON.stringify({ error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Obsługa błędów:**

| Kod | Scenariusz | Komunikat |
|-----|------------|-----------|
| 400 | Nieprawidłowe dane (walidacja Zod) | Szczegóły błędu walidacji |
| 409 | Email już zarejestrowany | "Ten adres email jest już zarejestrowany" |
| 500 | Błąd serwera / Supabase | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." |

#### 3.1.2. POST /api/auth/login (US-002)

**Lokalizacja**: `src/pages/api/auth/login.ts`

**Odpowiedzialność:**

- Walidacja danych wejściowych (email, password)
- Logowanie użytkownika w Supabase Auth
- Ustawienie cookies sesji
- Zwrócenie odpowiedzi JSON z danymi użytkownika lub błędem

**Kontrakt żądania:**

```typescript
interface LoginRequest {
  email: string;    // Wymagane
  password: string; // Wymagane
}
```

**Schemat walidacji Zod:**

```typescript
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});
```

**Kontrakt odpowiedzi:**

**Sukces (200 OK):**

```typescript
interface LoginSuccessResponse {
  user: {
    id: string;
    email: string;
  };
  message: string;
}
```

**Błąd (400 Bad Request, 401 Unauthorized, 500 Internal Server Error):**

```typescript
interface LoginErrorResponse {
  error: string;
}
```

**Implementacja (pseudokod):**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parsowanie body
    const body = await request.json();

    // 2. Walidacja Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return new Response(
        JSON.stringify({ error: firstError || "Nieprawidłowe dane" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // 3. Logowanie użytkownika w Supabase Auth
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Obsługa błędów Supabase (nieprawidłowe dane)
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy email lub hasło" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.user) {
      throw new Error("Nie udało się zalogować użytkownika");
    }

    // 4. Zwrócenie odpowiedzi sukcesu
    // Cookies sesji są automatycznie ustawiane przez middleware (@supabase/ssr)
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: "Zalogowano pomyślnie",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Obsługa błędów:**

| Kod | Scenariusz | Komunikat |
|-----|------------|-----------|
| 400 | Nieprawidłowe dane (walidacja Zod) | Szczegóły błędu walidacji |
| 401 | Nieprawidłowy email lub hasło | "Nieprawidłowy email lub hasło" |
| 500 | Błąd serwera / Supabase | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." |

#### 3.1.3. POST /api/auth/logout (US-003)

**Lokalizacja**: `src/pages/api/auth/logout.ts`

**Odpowiedzialność:**

- Wylogowanie użytkownika z Supabase Auth
- Usunięcie cookies sesji
- Zwrócenie odpowiedzi JSON potwierdzającej wylogowanie

**Kontrakt żądania:**

Brak body (metoda POST bez danych).

**Kontrakt odpowiedzi:**

**Sukces (200 OK):**

```typescript
interface LogoutSuccessResponse {
  message: string;
}
```

**Błąd (500 Internal Server Error):**

```typescript
interface LogoutErrorResponse {
  error: string;
}
```

**Implementacja (pseudokod):**

```typescript
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    // 1. Wylogowanie użytkownika w Supabase Auth
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // 2. Zwrócenie odpowiedzi sukcesu
    // Cookies sesji są automatycznie usuwane przez middleware (@supabase/ssr)
    return new Response(
      JSON.stringify({ message: "Wylogowano pomyślnie" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(
      JSON.stringify({ error: "Wystąpił błąd podczas wylogowywania" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Obsługa błędów:**

| Kod | Scenariusz | Komunikat |
|-----|------------|-----------|
| 500 | Błąd serwera / Supabase | "Wystąpił błąd podczas wylogowywania" |

### 3.2. Middleware Astro (US-004)

#### 3.2.1. Rozszerzenie istniejącego middleware

**Lokalizacja**: `src/middleware/index.ts`

**Aktualna funkcjonalność:**

- Tworzenie Supabase client z obsługą cookies (`@supabase/ssr`)
- Pobieranie zalogowanego użytkownika (`supabase.auth.getUser()`)
- Wstrzykiwanie `supabase` i `user` do `context.locals`

**Rozszerzenia dla US-004 (Route Protection):**

1. **Definicja chronionych tras**: Lista ścieżek wymagających autoryzacji
2. **Sprawdzenie autoryzacji**: Jeśli użytkownik próbuje uzyskać dostęp do chronionej trasy bez zalogowania → przekierowanie do `/auth/login`
3. **Przekazanie `redirectUrl`**: Po zalogowaniu użytkownik jest przekierowywany z powrotem do pierwotnie żądanej strony

**Implementacja (pseudokod):**

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Tworzenie Supabase client z obsługą cookies (istniejąca logika)
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => {
          context.cookies.set(key, value, options);
        },
        remove: (key, options) => {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  // 2. Pobieranie zalogowanego użytkownika (istniejąca logika)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Wstrzykiwanie do context.locals (istniejąca logika)
  context.locals.supabase = supabase;
  context.locals.user = user;

  // 4. NOWE: Ochrona chronionych tras (US-004)
  const pathname = context.url.pathname;

  // Definicja chronionych tras
  const protectedPaths = [
    "/dashboard",
    "/plans",
    "/workouts",
    "/history",
    "/profile",
  ];

  // Sprawdzenie czy ścieżka jest chroniona
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    // Użytkownik niezalogowany próbuje uzyskać dostęp do chronionej strony
    // Przekierowanie do logowania z parametrem redirectUrl
    const redirectUrl = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/auth/login?redirect=${redirectUrl}`);
  }

  // 5. NOWE: Przekierowanie zalogowanych użytkowników ze stron auth
  const authPaths = ["/auth/login", "/auth/register"];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  if (isAuthPath && user) {
    // Zalogowany użytkownik próbuje uzyskać dostęp do strony logowania/rejestracji
    // Przekierowanie do dashboard
    return context.redirect("/dashboard");
  }

  // 6. Kontynuacja przetwarzania
  return next();
});
```

**Zachowanie middleware:**

| Ścieżka | Użytkownik | Akcja |
|---------|------------|-------|
| `/dashboard` | Niezalogowany | Przekierowanie do `/auth/login?redirect=%2Fdashboard` |
| `/dashboard` | Zalogowany | Renderowanie strony |
| `/auth/login` | Niezalogowany | Renderowanie strony |
| `/auth/login` | Zalogowany | Przekierowanie do `/dashboard` |
| `/` | Niezalogowany | Renderowanie landing page |
| `/` | Zalogowany | Przekierowanie do `/dashboard` (logika w `index.astro`) |

### 3.3. Renderowanie stron server-side

#### 3.3.1. Strona /auth/login.astro

**Odpowiedzialność:**

- Sprawdzenie czy użytkownik jest już zalogowany (server-side)
- Jeśli zalogowany → przekierowanie do `/dashboard` (obsługiwane przez middleware)
- Pobranie parametru `redirect` z URL query
- Renderowanie `LoginForm` z przekazaniem `redirectUrl`

**Implementacja (pseudokod):**

```astro
---
// src/pages/auth/login.astro
import AuthLayout from "@/layouts/AuthLayout.astro";
import LoginForm from "@/components/auth/LoginForm";

// Pobranie parametru redirect z URL
const redirectUrl = Astro.url.searchParams.get("redirect") || "/dashboard";
---

<AuthLayout title="Logowanie" description="Zaloguj się do Gym Track">
  <LoginForm client:load redirectUrl={redirectUrl} />
</AuthLayout>
```

**Obsługa `redirectUrl`:**

- Po zalogowaniu użytkownik jest przekierowywany do `redirectUrl` (przekazane z middleware)
- Domyślnie: `/dashboard`
- Przykład: Użytkownik próbuje uzyskać dostęp do `/plans/new` → przekierowanie do `/auth/login?redirect=%2Fplans%2Fnew` → po zalogowaniu przekierowanie do `/plans/new`

#### 3.3.2. Strona /auth/register.astro

**Odpowiedzialność:**

- Sprawdzenie czy użytkownik jest już zalogowany (server-side)
- Jeśli zalogowany → przekierowanie do `/dashboard` (obsługiwane przez middleware)
- Renderowanie `RegisterForm`

**Implementacja (pseudokod):**

```astro
---
// src/pages/auth/register.astro
import AuthLayout from "@/layouts/AuthLayout.astro";
import RegisterForm from "@/components/auth/RegisterForm";
---

<AuthLayout title="Rejestracja" description="Utwórz konto w Gym Track">
  <RegisterForm client:load />
</AuthLayout>
```

#### 3.3.3. Strona /dashboard.astro (nowa)

**Odpowiedzialność:**

- Wyświetlenie strony głównej po zalogowaniu
- Dostęp do `Astro.locals.user` (gwarantowany przez middleware)
- Wyświetlenie powitania użytkownika

**Implementacja (pseudokod):**

```astro
---
// src/pages/dashboard.astro
import Layout from "@/layouts/Layout.astro";

const user = Astro.locals.user;

// user jest gwarantowany przez middleware (chroniona trasa)
if (!user) {
  return Astro.redirect("/auth/login");
}
---

<Layout title="Dashboard">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold">Witaj, {user.email}!</h1>
    <p class="mt-4 text-neutral-600">
      To jest twój panel główny. Tutaj będą wyświetlane statystyki i szybkie akcje.
    </p>
    <!-- Przyszłe komponenty: aktywny trening, ostatnie treningi, statystyki -->
  </div>
</Layout>
```

#### 3.3.4. Strona /index.astro (modyfikacja istniejącej)

**Rozszerzenia:**

- Sprawdzenie czy użytkownik jest zalogowany (`Astro.locals.user`)
- Jeśli zalogowany → przekierowanie do `/dashboard`
- Jeśli niezalogowany → wyświetlenie landing page

**Implementacja (pseudokod):**

```astro
---
// src/pages/index.astro
import Layout from "@/layouts/Layout.astro";

const user = Astro.locals.user;

// Jeśli użytkownik zalogowany, przekieruj do dashboard
if (user) {
  return Astro.redirect("/dashboard");
}
---

<Layout title="Gym Track - Śledź swoje postępy treningowe">
  <div class="container mx-auto px-4 py-16 text-center">
    <h1 class="text-5xl font-bold tracking-tight">
      Śledź swoje postępy treningowe
    </h1>
    <p class="mt-4 text-lg text-neutral-600">
      Gym Track to prosta aplikacja do zarządzania planami treningowymi i logowania sesji na siłowni.
    </p>
    <div class="mt-8 flex justify-center gap-4">
      <a
        href="/auth/register"
        class="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground hover:bg-primary/90"
      >
        Rozpocznij za darmo
      </a>
      <a
        href="/auth/login"
        class="rounded-lg border border-neutral-300 px-8 py-3 font-medium hover:bg-neutral-100"
      >
        Zaloguj się
      </a>
    </div>
  </div>
</Layout>
```

---

## 4. System Autentykacji

### 4.1. Supabase Auth - Konfiguracja

#### 4.1.1. Inicjalizacja projektu Supabase

Projekt Supabase jest już skonfigurowany (obecność `SUPABASE_URL` i `SUPABASE_KEY` w `.env`).

**Wymagane kroki konfiguracyjne w panelu Supabase:**

1. **Authentication → Providers**: Upewnić się, że Email provider jest włączony
2. **Authentication → Email Templates**: Dostosować szablony emaili (opcjonalne)
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) / produkcyjna domena (prod)
   - Redirect URLs: Dodać dozwolone URL przekierowań

#### 4.1.2. Zarządzanie sesjami (JWT Tokens)

Supabase Auth wykorzystuje JWT (JSON Web Tokens) do zarządzania sesjami:

- **Access Token**: Krótkotrwały token (domyślnie 1 godzina), używany do autoryzacji żądań
- **Refresh Token**: Długotrwały token (domyślnie 30 dni), używany do odświeżania access token

**Mechanizm:**

1. Po zalogowaniu/rejestracji Supabase zwraca `access_token` i `refresh_token`
2. `@supabase/ssr` automatycznie zapisuje tokeny w cookies (via middleware)
3. Middleware przy każdym żądaniu:
   - Odczytuje tokeny z cookies
   - Sprawdza ważność access token
   - Jeśli access token wygasł, automatycznie odświeża go za pomocą refresh token
   - Aktualizuje cookies z nowymi tokenami
4. Pobiera dane użytkownika z Supabase Auth (`supabase.auth.getUser()`)
5. Wstrzykuje `user` do `context.locals`

**Cookies ustawiane przez Supabase:**

- `sb-<project-ref>-auth-token`: Zawiera access_token i refresh_token (httpOnly, secure, sameSite)
- Cookies są automatycznie zarządzane przez `@supabase/ssr`

#### 4.1.3. Flow autentykacji

**Rejestracja (US-001):**

```
1. Użytkownik wypełnia formularz rejestracji (email, password)
   ↓
2. RegisterForm wysyła POST /api/auth/register
   ↓
3. Endpoint waliduje dane (Zod)
   ↓
4. Endpoint wywołuje supabase.auth.signUp({ email, password })
   ↓
5. Supabase tworzy użytkownika w auth.users
   ↓
6. Supabase zwraca { user, session }
   ↓
7. @supabase/ssr automatycznie ustawia cookies sesji
   ↓
8. Endpoint zwraca 201 Created z danymi użytkownika
   ↓
9. RegisterForm wyświetla toast success i przekierowuje do /dashboard
   ↓
10. Middleware pobiera user z sesji → dostęp do /dashboard
```

**Logowanie (US-002):**

```
1. Użytkownik wypełnia formularz logowania (email, password)
   ↓
2. LoginForm wysyła POST /api/auth/login
   ↓
3. Endpoint waliduje dane (Zod)
   ↓
4. Endpoint wywołuje supabase.auth.signInWithPassword({ email, password })
   ↓
5. Supabase weryfikuje dane uwierzytelniające
   ↓
6. Supabase zwraca { user, session }
   ↓
7. @supabase/ssr automatycznie ustawia cookies sesji
   ↓
8. Endpoint zwraca 200 OK z danymi użytkownika
   ↓
9. LoginForm wyświetla toast success i przekierowuje do redirectUrl
   ↓
10. Middleware pobiera user z sesji → dostęp do chronionej strony
```

**Wylogowanie (US-003):**

```
1. Użytkownik klika przycisk "Wyloguj"
   ↓
2. LogoutButton wysyła POST /api/auth/logout
   ↓
3. Endpoint wywołuje supabase.auth.signOut()
   ↓
4. Supabase unieważnia sesję
   ↓
5. @supabase/ssr automatycznie usuwa cookies sesji
   ↓
6. Endpoint zwraca 200 OK
   ↓
7. LogoutButton wyświetla toast info i przekierowuje do /auth/login
   ↓
8. Middleware nie znajduje user w sesji → brak dostępu do chronionych stron
```

**Ochrona tras (US-004):**

```
1. Użytkownik niezalogowany próbuje uzyskać dostęp do /dashboard
   ↓
2. Middleware sprawdza context.locals.user → null
   ↓
3. Middleware wykrywa że /dashboard jest chroniona
   ↓
4. Middleware przekierowuje do /auth/login?redirect=%2Fdashboard
   ↓
5. Użytkownik loguje się
   ↓
6. LoginForm przekierowuje do redirectUrl (/dashboard)
   ↓
7. Middleware sprawdza context.locals.user → user object
   ↓
8. Użytkownik ma dostęp do /dashboard
```

### 4.2. Integracja z Astro

#### 4.2.1. Wykorzystanie context.locals

**Dostęp w Astro pages:**

```astro
---
// src/pages/dashboard.astro
const user = Astro.locals.user;
const supabase = Astro.locals.supabase;

// Przykład: pobranie planów treningowych użytkownika
const { data: plans, error } = await supabase
  .from("workout_plans")
  .select("*")
  .eq("user_id", user.id);
---
```

**Dostęp w API routes:**

```typescript
// src/pages/api/workouts.ts
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { data, error } = await locals.supabase
    .from("workouts")
    .select("*");
    // RLS automatycznie filtruje po user_id = auth.uid()

  return new Response(JSON.stringify(data), { status: 200 });
};
```

#### 4.2.2. Server-side rendering z autentykacją

**Kluczowe zasady:**

1. **Middleware zawsze wykonuje się przed renderowaniem strony** → `context.locals.user` jest dostępny w każdej stronie
2. **Strony chronione sprawdzają `Astro.locals.user`** → jeśli `null`, renderują błąd 401 lub przekierowują (obsługiwane przez middleware)
3. **API routes sprawdzają `locals.user`** → jeśli `null`, zwracają 401 Unauthorized
4. **RLS w bazie danych jest ostatnią warstwą ochrony** → nawet jeśli aplikacja źle sprawdza autoryzację, RLS blokuje dostęp do danych

---

## 5. Walidacja i Obsługa Błędów

### 5.1. Walidacja po stronie klienta (React components)

#### 5.1.1. RegisterForm - Walidacja kliencka

**Reguły walidacji:**

| Pole | Reguła | Komunikat błędu |
|------|--------|-----------------|
| Email | Format email (regex) | "Nieprawidłowy format adresu email" |
| Email | Wymagane | "Email jest wymagany" |
| Hasło | Minimum 8 znaków | "Hasło musi mieć minimum 8 znaków" |
| Hasło | Wymagane | "Hasło jest wymagane" |
| Potwierdzenie hasła | Zgodność z hasłem | "Hasła muszą być identyczne" |
| Potwierdzenie hasła | Wymagane | "Potwierdzenie hasła jest wymagane" |

**Moment walidacji:**

- **On blur**: Po opuszczeniu pola (natychmiastowa informacja zwrotna)
- **On submit**: Przed wysłaniem formularza (ostateczna walidacja)

**Funkcja walidacji:**

```typescript
interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateRegisterForm(data: {
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  // Email validation
  if (!data.email) {
    errors.email = "Email jest wymagany";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Nieprawidłowy format adresu email";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Hasło jest wymagane";
  } else if (data.password.length < 8) {
    errors.password = "Hasło musi mieć minimum 8 znaków";
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = "Potwierdzenie hasła jest wymagane";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Hasła muszą być identyczne";
  }

  return errors;
}
```

#### 5.1.2. LoginForm - Walidacja kliencka

**Reguły walidacji:**

| Pole | Reguła | Komunikat błędu |
|------|--------|-----------------|
| Email | Format email (regex) | "Nieprawidłowy format adresu email" |
| Email | Wymagane | "Email jest wymagany" |
| Hasło | Wymagane | "Hasło jest wymagane" |

**Funkcja walidacji:**

```typescript
interface ValidationErrors {
  email?: string;
  password?: string;
}

function validateLoginForm(data: {
  email: string;
  password: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  // Email validation
  if (!data.email) {
    errors.email = "Email jest wymagany";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Nieprawidłowy format adresu email";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Hasło jest wymagane";
  }

  return errors;
}
```

### 5.2. Walidacja po stronie serwera (Zod)

#### 5.2.1. Schemat rejestracji

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email"),
  password: z
    .string({ required_error: "Hasło jest wymagane" })
    .min(8, "Hasło musi mieć minimum 8 znaków"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

#### 5.2.2. Schemat logowania

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email"),
  password: z
    .string({ required_error: "Hasło jest wymagane" })
    .min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

#### 5.2.3. Wykorzystanie schematów w endpointach

```typescript
const validationResult = registerSchema.safeParse(body);

if (!validationResult.success) {
  // Formatowanie błędów Zod
  const errors = validationResult.error.flatten().fieldErrors;
  const firstError = Object.values(errors)[0]?.[0];

  return new Response(
    JSON.stringify({ error: firstError || "Nieprawidłowe dane" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

const { email, password } = validationResult.data; // Type-safe!
```

### 5.3. Obsługa błędów Supabase

#### 5.3.1. Błędy rejestracji

| Kod błędu Supabase | Scenariusz | Komunikat dla użytkownika |
|-------------------|------------|---------------------------|
| `User already registered` | Email już istnieje | "Ten adres email jest już zarejestrowany" |
| `Invalid email` | Nieprawidłowy format email | "Nieprawidłowy format adresu email" |
| `Password too short` | Hasło za krótkie | "Hasło musi mieć minimum 8 znaków" |
| Inne | Nieoczekiwany błąd | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." |

#### 5.3.2. Błędy logowania

| Kod błędu Supabase | Scenariusz | Komunikat dla użytkownika |
|-------------------|------------|---------------------------|
| `Invalid login credentials` | Nieprawidłowy email lub hasło | "Nieprawidłowy email lub hasło" |
| `Email not confirmed` | Email nie został potwierdzony | "Potwierdź swój adres email, aby się zalogować" |
| Inne | Nieoczekiwany błąd | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." |

**WAŻNE**: Ze względów bezpieczeństwa, NIE rozróżniamy komunikatów "nieprawidłowy email" vs "nieprawidłowe hasło" → zawsze zwracamy ogólny komunikat "Nieprawidłowy email lub hasło".

### 5.4. Toast Notifications (US-037)

#### 5.4.1. Typy toastów

```typescript
import { toast } from "sonner";

// Success - operacja zakończona sukcesem
toast.success("Konto utworzone pomyślnie!");

// Error - błąd operacji
toast.error("Nieprawidłowy email lub hasło");

// Info - informacje dla użytkownika
toast.info("Zostałeś wylogowany");

// Warning - ostrzeżenia
toast.warning("Sesja wygasła. Zaloguj się ponownie.");
```

#### 5.4.2. Konfiguracja toastów

```tsx
// W layoutach (AuthLayout.astro, Layout.astro)
<Toaster
  position="top-right"
  richColors
  closeButton
  duration={5000}
  toastOptions={{
    classNames: {
      toast: "font-sans",
      title: "text-sm font-medium",
      description: "text-sm",
    },
  }}
/>
```

#### 5.4.3. Użycie w komponentach React

**RegisterForm:**

```typescript
// Sukces
toast.success("Konto utworzone pomyślnie! Witamy w Gym Track.");

// Błąd
toast.error("Ten adres email jest już zarejestrowany");
```

**LoginForm:**

```typescript
// Sukces
toast.success("Zalogowano pomyślnie");

// Błąd
toast.error("Nieprawidłowy email lub hasło");
```

**LogoutButton:**

```typescript
// Sukces
toast.info("Zostałeś wylogowany");

// Błąd
toast.error("Wystąpił błąd podczas wylogowywania");
```

### 5.5. Obsługa błędów sieciowych (US-038)

#### 5.5.1. Retry logic

Implementacja automatycznego ponowienia żądania dla przejściowych błędów sieciowych.

**Funkcja pomocnicza:**

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      // Jeśli sukces lub błąd klienta (4xx), nie ponawiaj
      if (response.ok || response.status < 500) {
        return response;
      }

      // Błąd serwera (5xx) - ponów próbę
      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error as Error;

      // Jeśli to ostatnia próba, rzuć błąd
      if (i === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw lastError!;
}
```

**Użycie w komponentach:**

```typescript
try {
  const response = await fetchWithRetry("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  // ...
} catch (error) {
  // Po 3 nieudanych próbach
  toast.error("Wystąpił problem z połączeniem. Spróbuj ponownie później.");
}
```

#### 5.5.2. Wykrywanie braku połączenia

```typescript
if (!navigator.onLine) {
  toast.error("Brak połączenia z internetem. Sprawdź swoje połączenie.");
  return;
}

// Kontynuacja żądania
```

---

## 6. Bezpieczeństwo i RLS

### 6.1. Row Level Security (RLS) - US-005

#### 6.1.1. Zasada działania RLS

Row Level Security (RLS) to mechanizm PostgreSQL, który filtruje wiersze w tabeli na podstawie użytkownika wykonującego zapytanie. W kontekście Supabase Auth:

- Każdy użytkownik ma unikalny UUID w tabeli `auth.users`
- Funkcja `auth.uid()` zwraca UUID aktualnie zalogowanego użytkownika
- Polityki RLS wykorzystują `auth.uid()` do filtrowania danych

**Korzyści:**

1. **Ochrona na poziomie bazy danych** - nawet jeśli aplikacja ma błąd, RLS chroni dane
2. **Automatyczna filtracja** - nie trzeba ręcznie dodawać `WHERE user_id = X` w zapytaniach
3. **Bezpieczeństwo zero-trust** - każde zapytanie jest filtrowane przez polityki

#### 6.1.2. Polityki RLS dla tabel użytkownika

Wszystkie tabele z `user_id` muszą mieć włączone RLS i odpowiednie polityki.

**Tabele wymagające RLS:**

- `workout_plans`
- `plan_exercises`
- `plan_exercise_sets`
- `workouts`
- `workout_exercises`
- `workout_sets`
- `workout_stats`

**Tabele NIE wymagające RLS (publiczne):**

- `categories` (dostępne dla wszystkich użytkowników, read-only)
- `exercises` (dostępne dla wszystkich użytkowników, read-only)

#### 6.1.3. Przykładowe polityki RLS

**Tabela: workout_plans**

```sql
-- Włączenie RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: Użytkownicy widzą tylko swoje plany
CREATE POLICY "Users can view their own workout plans"
  ON workout_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Polityka INSERT: Użytkownicy mogą tworzyć plany tylko dla siebie
CREATE POLICY "Users can insert their own workout plans"
  ON workout_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: Użytkownicy mogą aktualizować tylko swoje plany
CREATE POLICY "Users can update their own workout plans"
  ON workout_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: Użytkownicy mogą usuwać tylko swoje plany
CREATE POLICY "Users can delete their own workout plans"
  ON workout_plans
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Tabela: workouts**

```sql
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);
```

**Tabela: categories (publiczna, read-only)**

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Wszyscy mogą czytać kategorie
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);
```

**Tabela: exercises (publiczna, read-only)**

```sql
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Wszyscy mogą czytać ćwiczenia
CREATE POLICY "Exercises are publicly readable"
  ON exercises FOR SELECT
  USING (true);
```

#### 6.1.4. Weryfikacja RLS

**Test 1: Użytkownik A nie widzi danych użytkownika B**

```sql
-- Jako użytkownik A
SELECT * FROM workout_plans WHERE user_id = '<user_b_id>';
-- Wynik: 0 wierszy (zablokowane przez RLS)

-- Jako użytkownik A
SELECT * FROM workout_plans;
-- Wynik: Tylko plany użytkownika A (automatycznie filtrowane przez RLS)
```

**Test 2: Próba wstawienia danych dla innego użytkownika**

```sql
-- Jako użytkownik A, próba utworzenia planu dla użytkownika B
INSERT INTO workout_plans (name, user_id)
VALUES ('Plan B', '<user_b_id>');
-- Wynik: Błąd - polityka WITH CHECK nie zezwala
```

### 6.2. Constraints bazy danych (US-044)

#### 6.2.1. Constraints dla workout_plans

```sql
ALTER TABLE workout_plans
  ADD CONSTRAINT workout_plans_name_min_length
    CHECK (char_length(name) >= 3);

ALTER TABLE workout_plans
  ADD CONSTRAINT workout_plans_description_max_length
    CHECK (description IS NULL OR char_length(description) <= 500);

ALTER TABLE workout_plans
  ALTER COLUMN user_id SET NOT NULL;
```

#### 6.2.2. Constraints dla plan_exercise_sets

```sql
ALTER TABLE plan_exercise_sets
  ADD CONSTRAINT plan_exercise_sets_reps_positive
    CHECK (reps > 0);

ALTER TABLE plan_exercise_sets
  ADD CONSTRAINT plan_exercise_sets_weight_non_negative
    CHECK (weight IS NULL OR weight >= 0);

ALTER TABLE plan_exercise_sets
  ALTER COLUMN user_id SET NOT NULL;
```

#### 6.2.3. Constraints dla workout_sets

```sql
ALTER TABLE workout_sets
  ADD CONSTRAINT workout_sets_planned_reps_positive
    CHECK (planned_reps > 0);

ALTER TABLE workout_sets
  ADD CONSTRAINT workout_sets_actual_reps_positive
    CHECK (actual_reps IS NULL OR actual_reps > 0);

ALTER TABLE workout_sets
  ADD CONSTRAINT workout_sets_planned_weight_non_negative
    CHECK (planned_weight IS NULL OR planned_weight >= 0);

ALTER TABLE workout_sets
  ADD CONSTRAINT workout_sets_actual_weight_non_negative
    CHECK (actual_weight IS NULL OR actual_weight >= 0);

ALTER TABLE workout_sets
  ADD CONSTRAINT workout_sets_note_max_length
    CHECK (note IS NULL OR char_length(note) <= 200);

ALTER TABLE workout_sets
  ALTER COLUMN user_id SET NOT NULL;
```

### 6.3. Foreign Keys (integralność relacji)

Wszystkie foreign keys są już zdefiniowane w `database.types.ts` (wygenerowane przez Supabase CLI). Przykłady:

```sql
-- plan_exercises -> workout_plans
ALTER TABLE plan_exercises
  ADD CONSTRAINT plan_exercises_plan_id_fkey
    FOREIGN KEY (plan_id)
    REFERENCES workout_plans(id)
    ON DELETE CASCADE;

-- plan_exercises -> exercises
ALTER TABLE plan_exercises
  ADD CONSTRAINT plan_exercises_exercise_id_fkey
    FOREIGN KEY (exercise_id)
    REFERENCES exercises(id)
    ON DELETE RESTRICT;

-- workouts -> workout_plans
ALTER TABLE workouts
  ADD CONSTRAINT workouts_plan_id_fkey
    FOREIGN KEY (plan_id)
    REFERENCES workout_plans(id)
    ON DELETE RESTRICT;
```

**Strategia ON DELETE:**

- `CASCADE`: Usunięcie planu usuwa powiązane plan_exercises, plan_exercise_sets
- `RESTRICT`: Nie można usunąć planu jeśli istnieją powiązane workouts (ochrona historii)

### 6.4. Bezpieczeństwo cookies

Cookies sesji Supabase są automatycznie ustawiane przez `@supabase/ssr` z bezpiecznymi flagami:

- **httpOnly**: `true` - cookies niedostępne z JavaScript (ochrona przed XSS)
- **secure**: `true` (produkcja) - cookies tylko przez HTTPS
- **sameSite**: `lax` - ochrona przed CSRF
- **path**: `/` - cookies dostępne w całej aplikacji

---

## 7. Przepływ Danych

### 7.1. Diagram przepływu rejestracji (US-001)

```
[Użytkownik]
    |
    | 1. Wypełnia formularz rejestracji
    v
[RegisterForm.tsx]
    |
    | 2. Walidacja kliencka (email, password, confirmPassword)
    |
    | 3. POST /api/auth/register { email, password }
    v
[/api/auth/register.ts]
    |
    | 4. Walidacja Zod (registerSchema)
    |
    | 5. supabase.auth.signUp({ email, password })
    v
[Supabase Auth]
    |
    | 6a. Sprawdzenie czy email istnieje
    | 6b. Hashowanie hasła (bcrypt)
    | 6c. Utworzenie użytkownika w auth.users
    | 6d. Wygenerowanie JWT tokens (access_token, refresh_token)
    |
    | 7. Zwrócenie { user, session }
    v
[@supabase/ssr] (via middleware)
    |
    | 8. Ustawienie cookies sesji (httpOnly, secure, sameSite)
    v
[/api/auth/register.ts]
    |
    | 9. Zwrócenie 201 Created { user, message }
    v
[RegisterForm.tsx]
    |
    | 10. toast.success("Konto utworzone pomyślnie!")
    | 11. window.location.href = "/dashboard"
    v
[Middleware]
    |
    | 12. Odczyt cookies sesji
    | 13. supabase.auth.getUser() → user object
    | 14. context.locals.user = user
    v
[/dashboard.astro]
    |
    | 15. Renderowanie strony dashboard z danymi użytkownika
    v
[Użytkownik] - Widzi dashboard
```

### 7.2. Diagram przepływu logowania (US-002)

```
[Użytkownik]
    |
    | 1. Wypełnia formularz logowania
    v
[LoginForm.tsx]
    |
    | 2. Walidacja kliencka (email, password)
    |
    | 3. POST /api/auth/login { email, password }
    v
[/api/auth/login.ts]
    |
    | 4. Walidacja Zod (loginSchema)
    |
    | 5. supabase.auth.signInWithPassword({ email, password })
    v
[Supabase Auth]
    |
    | 6a. Znalezienie użytkownika po email
    | 6b. Weryfikacja hasła (bcrypt.compare)
    | 6c. Wygenerowanie JWT tokens
    |
    | 7. Zwrócenie { user, session }
    v
[@supabase/ssr] (via middleware)
    |
    | 8. Ustawienie cookies sesji
    v
[/api/auth/login.ts]
    |
    | 9. Zwrócenie 200 OK { user, message }
    v
[LoginForm.tsx]
    |
    | 10. toast.success("Zalogowano pomyślnie")
    | 11. window.location.href = redirectUrl || "/dashboard"
    v
[Middleware]
    |
    | 12. Odczyt cookies sesji
    | 13. supabase.auth.getUser() → user object
    | 14. context.locals.user = user
    v
[/dashboard.astro lub redirectUrl]
    |
    | 15. Renderowanie chronionej strony
    v
[Użytkownik] - Widzi dashboard lub pierwotnie żądaną stronę
```

### 7.3. Diagram przepływu ochrony tras (US-004)

```
[Użytkownik niezalogowany]
    |
    | 1. Próba dostępu do /dashboard
    v
[Middleware]
    |
    | 2. supabase.auth.getUser() → null
    | 3. context.locals.user = null
    |
    | 4. Sprawdzenie: czy /dashboard jest chroniona? TAK
    | 5. Czy user === null? TAK
    |
    | 6. Przekierowanie: /auth/login?redirect=%2Fdashboard
    v
[/auth/login.astro]
    |
    | 7. Pobranie parametru redirect (%2Fdashboard)
    | 8. Renderowanie LoginForm z redirectUrl="/dashboard"
    v
[Użytkownik]
    |
    | 9. Logowanie
    v
[LoginForm.tsx]
    |
    | 10. Po zalogowaniu: window.location.href = "/dashboard"
    v
[Middleware]
    |
    | 11. supabase.auth.getUser() → user object
    | 12. context.locals.user = user
    |
    | 13. Sprawdzenie: czy /dashboard jest chroniona? TAK
    | 14. Czy user !== null? TAK
    |
    | 15. Kontynuacja renderowania
    v
[/dashboard.astro]
    |
    | 16. Użytkownik ma dostęp do dashboard
```

### 7.4. Diagram przepływu wylogowania (US-003)

```
[Użytkownik zalogowany]
    |
    | 1. Kliknięcie przycisku "Wyloguj"
    v
[LogoutButton.tsx]
    |
    | 2. POST /api/auth/logout
    v
[/api/auth/logout.ts]
    |
    | 3. supabase.auth.signOut()
    v
[Supabase Auth]
    |
    | 4a. Unieważnienie sesji
    | 4b. Usunięcie refresh_token z bazy
    v
[@supabase/ssr] (via middleware)
    |
    | 5. Usunięcie cookies sesji
    v
[/api/auth/logout.ts]
    |
    | 6. Zwrócenie 200 OK { message }
    v
[LogoutButton.tsx]
    |
    | 7. toast.info("Zostałeś wylogowany")
    | 8. window.location.href = "/auth/login"
    v
[Middleware]
    |
    | 9. supabase.auth.getUser() → null (brak cookies)
    | 10. context.locals.user = null
    v
[/auth/login.astro]
    |
    | 11. Użytkownik widzi formularz logowania
```

---

## 8. Kontrakty i Typy

### 8.1. Typy użytkownika

```typescript
// src/types/auth.types.ts

import type { User } from "@supabase/supabase-js";

// Typ użytkownika Supabase (już zdefiniowany w @supabase/supabase-js)
export type AuthUser = User;

// Uproszczony typ użytkownika dla UI
export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
}

// Typ dla context.locals.user (może być null)
export type AuthenticatedUser = User | null;
```

### 8.2. Typy żądań i odpowiedzi API

```typescript
// src/types/api.types.ts

// ============================================
// POST /api/auth/register
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterSuccessResponse {
  user: {
    id: string;
    email: string;
  };
  message: string;
}

export interface RegisterErrorResponse {
  error: string;
}

// ============================================
// POST /api/auth/login
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSuccessResponse {
  user: {
    id: string;
    email: string;
  };
  message: string;
}

export interface LoginErrorResponse {
  error: string;
}

// ============================================
// POST /api/auth/logout
// ============================================

export interface LogoutSuccessResponse {
  message: string;
}

export interface LogoutErrorResponse {
  error: string;
}

// ============================================
// Generic API Error Response
// ============================================

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>; // Zod validation errors
}
```

### 8.3. Typy dla środowiska Astro

```typescript
// src/env.d.ts (już istniejący, rozszerzony)

/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { TypedSupabaseClient } from "./db/supabase.client";

declare namespace App {
  interface Locals {
    supabase: TypedSupabaseClient;
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 8.4. Typy dla komponentów React

```typescript
// src/components/auth/types.ts

export interface AuthFormState {
  isLoading: boolean;
  errors: Record<string, string>;
}

export interface RegisterFormState extends AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormState extends AuthFormState {
  email: string;
  password: string;
}

export interface RegisterFormProps {
  redirectUrl?: string;
}

export interface LoginFormProps {
  redirectUrl?: string;
}

export interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline";
  children?: React.ReactNode;
}
```

### 8.5. Schemy walidacji Zod

```typescript
// src/lib/validation/auth.schemas.ts

import { z } from "zod";

/**
 * Schemat walidacji dla rejestracji użytkownika
 */
export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email"),
  password: z
    .string({ required_error: "Hasło jest wymagane" })
    .min(8, "Hasło musi mieć minimum 8 znaków"),
});

/**
 * Schemat walidacji dla logowania użytkownika
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .email("Nieprawidłowy format adresu email"),
  password: z
    .string({ required_error: "Hasło jest wymagane" })
    .min(1, "Hasło jest wymagane"),
});

// Wyeksportowane typy TypeScript na podstawie schematów
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

---

## 9. Podsumowanie

### 9.1. Komponenty do implementacji

#### Frontend (Astro pages)

- [ ] `src/pages/auth/register.astro` - Strona rejestracji
- [ ] `src/pages/auth/login.astro` - Strona logowania
- [ ] `src/pages/dashboard.astro` - Strona główna po zalogowaniu
- [ ] `src/pages/index.astro` - Modyfikacja: przekierowanie zalogowanych użytkowników

#### Frontend (React components)

- [ ] `src/components/auth/RegisterForm.tsx` - Formularz rejestracji
- [ ] `src/components/auth/LoginForm.tsx` - Formularz logowania
- [ ] `src/components/auth/LogoutButton.tsx` - Przycisk wylogowania
- [ ] `src/components/Navigation.tsx` - Nawigacja z informacją o użytkowniku

#### Layouts

- [ ] `src/layouts/AuthLayout.astro` - Layout dla stron autentykacji
- [ ] `src/layouts/Layout.astro` - Rozszerzenie: dodanie nawigacji i obsługi użytkownika

#### Backend (API routes)

- [ ] `src/pages/api/auth/register.ts` - Endpoint rejestracji
- [ ] `src/pages/api/auth/login.ts` - Endpoint logowania
- [ ] `src/pages/api/auth/logout.ts` - Endpoint wylogowania

#### Middleware

- [ ] `src/middleware/index.ts` - Rozszerzenie: ochrona chronionych tras, przekierowania

#### Typy i walidacja

- [ ] `src/types/auth.types.ts` - Typy dla autentykacji
- [ ] `src/types/api.types.ts` - Typy dla API
- [ ] `src/lib/validation/auth.schemas.ts` - Schematy Zod
- [ ] `src/components/auth/types.ts` - Typy dla komponentów React

#### UI (Shadcn/ui components)

- [ ] Instalacja: `card`, `input`, `label`, `button`, `checkbox`
- [ ] Instalacja: `sonner` (toast notifications)

#### Database (Supabase)

- [ ] Włączenie RLS dla wszystkich tabel użytkownika
- [ ] Polityki RLS dla `workout_plans`, `plan_exercises`, `plan_exercise_sets`, `workouts`, `workout_exercises`, `workout_sets`, `workout_stats`
- [ ] Polityki read-only dla `categories`, `exercises`
- [ ] Constraints walidacyjne (min length, max length, positive values)

### 9.2. Sprawdzenie wymagań

| Wymaganie | Status | Komponent |
|-----------|--------|-----------|
| US-001: Rejestracja | ✅ Specyfikacja gotowa | RegisterForm, /api/auth/register |
| US-002: Logowanie | ✅ Specyfikacja gotowa | LoginForm, /api/auth/login |
| US-003: Wylogowanie | ✅ Specyfikacja gotowa | LogoutButton, /api/auth/logout |
| US-004: Ochrona tras | ✅ Specyfikacja gotowa | Middleware (route protection) |
| US-005: RLS | ✅ Specyfikacja gotowa | Polityki RLS w Supabase |
| US-037: Toast notifications | ✅ Specyfikacja gotowa | Sonner integration |
| US-038: Obsługa błędów sieciowych | ✅ Specyfikacja gotowa | Retry logic, toast errors |
| US-039: Walidacja real-time | ✅ Specyfikacja gotowa | Client-side validation |
| US-041: Responsywność | ✅ Specyfikacja gotowa | Tailwind CSS, mobile-first |
| US-044: Walidacja DB | ✅ Specyfikacja gotowa | Constraints, Foreign Keys |

### 9.3. Kolejność implementacji (rekomendacja)

1. **Instalacja zależności**: Shadcn/ui components, sonner
2. **Typy i walidacja**: Schematy Zod, typy TypeScript
3. **Layouts**: AuthLayout, rozszerzenie Layout
4. **Middleware**: Rozszerzenie o route protection
5. **API routes**: Register, Login, Logout
6. **React components**: RegisterForm, LoginForm, LogoutButton
7. **Astro pages**: register.astro, login.astro, dashboard.astro, modyfikacja index.astro
8. **Database**: RLS policies, constraints
9. **Testy**: Testy E2E (Playwright) dla krytycznej ścieżki (US-046, US-047)

---

**Koniec specyfikacji technicznej modułu autentykacji i autoryzacji.**
