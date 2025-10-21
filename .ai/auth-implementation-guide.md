# Przewodnik Implementacji Autentykacji - Gym Track

## Przegląd

Gym Track używa **Supabase Auth** jako jedynego systemu zarządzania użytkownikami i autentykacji. Wszystkie dane użytkowników są automatycznie powiązane z ich kontem poprzez `user_id` pochodzące z Supabase Auth.

## Architektura Autentykacji

### 1. Supabase Auth jako Źródło Prawdy

- **Tabela użytkowników**: `auth.users` (zarządzana przez Supabase)
- **User ID**: UUID generowane przez Supabase przy rejestracji
- **Sesje**: Zarządzane przez Supabase (tokeny JWT, refresh tokens)
- **Dostęp**: Via `auth.uid()` w RLS policies i `context.locals.user` w Astro

### 2. Powiązanie Danych z Użytkownikami

Każda tabela zawierająca dane użytkownika ma kolumnę `user_id`:

```sql
-- Przykład: workout_plans
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- ← Powiązanie z auth.users via auth.uid()
  name VARCHAR(200) NOT NULL,
  ...
);
```

**KLUCZOWA ZASADA**: `user_id` **ZAWSZE** pochodzi z Supabase Auth - nigdy nie jest ustawiany ręcznie.

## Implementacja w Astro

### 3. Middleware Autentykacji

Stwórz middleware w `src/middleware/index.ts`:

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient(
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

  // Pobierz zalogowanego użytkownika
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Udostępnij user i supabase client w context.locals
  context.locals.user = user;
  context.locals.supabase = supabase;

  return next();
});
```

### 4. Typy TypeScript

Rozszerz `src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null;
    supabase: import('@supabase/supabase-js').SupabaseClient;
  }
}
```

## Wzorce API Routes

### 5. Chronione Endpoint (Protected Route)

**ZAWSZE** sprawdzaj autentykację na początku:

```typescript
// src/pages/api/workout-plans/index.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  // 1. Sprawdź autentykację
  if (!locals.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Użyj authenticated client
  const { data, error } = await locals.supabase
    .from('workout_plans')
    .select('*');
    // RLS automatycznie filtruje: WHERE user_id = auth.uid()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### 6. Tworzenie Zasobów (INSERT)

Przy INSERT **MUSISZ** ustawić `user_id`:

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const body = await request.json();

  // Walidacja z Zod
  const schema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid input', details: validation.error }),
      { status: 400 }
    );
  }

  // INSERT z user_id
  const { data, error } = await locals.supabase
    .from('workout_plans')
    .insert({
      ...validation.data,
      user_id: locals.user.id, // ✅ Z Supabase Auth
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
```

### 7. Aktualizacja Zasobów (UPDATE)

RLS automatycznie sprawdza właściciela:

```typescript
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const { id } = params;
  const body = await request.json();

  // UPDATE - RLS sprawdzi ownership
  const { data, error } = await locals.supabase
    .from('workout_plans')
    .update({
      name: body.name,
      description: body.description,
      // ❌ NIGDY nie aktualizuj user_id
    })
    .eq('id', id)
    .select()
    .single();

  // Jeśli RLS zablokuje (nie jesteś właścicielem), data będzie null
  if (!data && !error) {
    return new Response(
      JSON.stringify({ error: 'Not found or unauthorized' }),
      { status: 404 }
    );
  }

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
};
```

### 8. Usuwanie Zasobów (DELETE)

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const { id } = params;

  // DELETE - RLS sprawdzi ownership
  const { error } = await locals.supabase
    .from('workout_plans')
    .delete()
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(null, { status: 204 });
};
```

## Row Level Security (RLS)

### 9. Jak Działają Polityki RLS

RLS policies są automatycznie stosowane przez PostgreSQL:

```sql
-- Policy dla SELECT
CREATE POLICY "authenticated_users_can_read_own_workout_plans"
  ON workout_plans
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);
```

**W praktyce:**

```typescript
// W aplikacji:
const { data } = await supabase.from('workout_plans').select('*');

// PostgreSQL automatycznie wykonuje:
// SELECT * FROM workout_plans
// WHERE user_id = auth.uid() AND deleted_at IS NULL;
```

### 10. Polityki dla Różnych Operacji

#### SELECT (Odczyt)
```sql
USING (user_id = auth.uid())
```
- Użytkownik widzi tylko swoje rekordy

#### INSERT (Tworzenie)
```sql
WITH CHECK (user_id = auth.uid())
```
- Użytkownik może tworzyć tylko rekordy ze swoim `user_id`

#### UPDATE (Aktualizacja)
```sql
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())
```
- USING: Sprawdza czy możesz modyfikować (jesteś właścicielem)
- WITH CHECK: Sprawdza czy nowa wartość jest prawidłowa

#### DELETE (Usuwanie)
```sql
USING (user_id = auth.uid())
```
- Użytkownik może usuwać tylko swoje rekordy

## Autentykacja w Frontend (React Components)

### 11. Logowanie

```typescript
// src/components/LoginForm.tsx
import { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      window.location.href = '/dashboard';
    } else {
      const error = await response.json();
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 12. API Endpoint dla Logowania

```typescript
// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const body = await request.json();

  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid input', details: validation.error }),
      { status: 400 }
    );
  }

  const { email, password } = validation.data;

  const { data, error } = await locals.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
    });
  }

  return new Response(JSON.stringify({ user: data.user }), { status: 200 });
};
```

### 13. Rejestracja

```typescript
// src/pages/api/auth/register.ts
export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid input' }),
      { status: 400 }
    );
  }

  const { email, password } = validation.data;

  const { data, error } = await locals.supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ user: data.user }), { status: 201 });
};
```

### 14. Wylogowanie

```typescript
// src/pages/api/auth/logout.ts
export const POST: APIRoute = async ({ locals }) => {
  const { error } = await locals.supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(null, { status: 204 });
};
```

## Ochrona Stron (Page Protection)

### 15. Middleware dla Chronionych Stron

Rozszerz middleware o przekierowania:

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // ... (setup supabase client)

  const {
    data: { user },
  } = await supabase.auth.getUser();

  context.locals.user = user;
  context.locals.supabase = supabase;

  // Chronione ścieżki
  const protectedPaths = ['/dashboard', '/workouts', '/plans'];
  const isProtectedPath = protectedPaths.some((path) =>
    context.url.pathname.startsWith(path)
  );

  // Przekieruj niezalogowanych
  if (isProtectedPath && !user) {
    return context.redirect('/login');
  }

  // Przekieruj zalogowanych z /login do /dashboard
  if (context.url.pathname === '/login' && user) {
    return context.redirect('/dashboard');
  }

  return next();
});
```

## Najlepsze Praktyki

### 16. Checklist dla Każdego API Endpoint

- [ ] **Sprawdź autentykację**: `if (!locals.user) return 401`
- [ ] **Użyj `locals.supabase`**: Nie importuj klienta bezpośrednio
- [ ] **Waliduj input**: Użyj Zod lub innej biblioteki
- [ ] **Przy INSERT**: Ustaw `user_id: locals.user.id`
- [ ] **Przy SELECT/UPDATE/DELETE**: Pozwól RLS filtrować
- [ ] **Obsłuż błędy**: Zwróć odpowiednie kody HTTP
- [ ] **Nie duplikuj logiki RLS**: Zaufaj policies w bazie

### 17. Najczęstsze Błędy do Uniknięcia

❌ **ŹLE**: Ręczne filtrowanie po user_id
```typescript
const { data } = await supabase
  .from('workout_plans')
  .select('*')
  .eq('user_id', user.id); // ❌ Niepotrzebne - RLS to robi
```

✅ **DOBRZE**: Pozwól RLS filtrować
```typescript
const { data } = await supabase
  .from('workout_plans')
  .select('*'); // ✅ RLS automatycznie filtruje
```

---

❌ **ŹLE**: Ręczne ustawianie user_id z parametru
```typescript
const { data } = await supabase
  .from('workout_plans')
  .insert({
    name: body.name,
    user_id: body.user_id, // ❌ NIEBEZPIECZNE!
  });
```

✅ **DOBRZE**: Użyj user_id z Supabase Auth
```typescript
const { data } = await supabase
  .from('workout_plans')
  .insert({
    name: body.name,
    user_id: locals.user.id, // ✅ Z authenticated user
  });
```

---

❌ **ŹLE**: Import klienta Supabase bezpośrednio
```typescript
import { supabaseClient } from '@/db/supabase.client';

const { data } = await supabaseClient.from('workout_plans').select('*');
// ❌ Brak kontekstu użytkownika!
```

✅ **DOBRZE**: Użyj klienta z context.locals
```typescript
const { data } = await locals.supabase
  .from('workout_plans')
  .select('*');
// ✅ Pre-authenticated z sesją użytkownika
```

## Podsumowanie

### Kluczowe Zasady:

1. **Supabase Auth = Źródło Prawdy** - Wszystkie user_id pochodzą z `auth.uid()`
2. **Middleware Setup** - Konfiguruj `context.locals.user` i `context.locals.supabase`
3. **Zawsze Sprawdzaj Auth** - `if (!locals.user)` na początku endpoint
4. **INSERT: Ustaw user_id** - `user_id: locals.user.id`
5. **SELECT/UPDATE/DELETE: Ufaj RLS** - Nie filtruj ręcznie
6. **Używaj locals.supabase** - Nigdy nie importuj klienta bezpośrednio
7. **Waliduj Input** - Zod lub inna biblioteka
8. **Obsługuj Błędy** - Zwracaj odpowiednie HTTP status codes

---

**Koniec przewodnika implementacji autentykacji**
