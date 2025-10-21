# Exercises API - Testing Guide

## Środowisko

### ✅ Wymagania wstępne
- [x] Tabele `exercises` i `categories` w Supabase
- [x] Dane seed (minimum 50 ćwiczeń)
- [x] Plik `.env` z SUPABASE_URL i SUPABASE_KEY
- [ ] RLS policies włączone i zweryfikowane
- [ ] Indeksy w bazie danych

### Weryfikacja RLS Policies

**Sprawdź w Supabase Dashboard:**

1. Przejdź do: Database → Policies
2. Zweryfikuj policy dla tabeli `exercises`:

```sql
-- Policy: Allow authenticated users to read exercises
CREATE POLICY "Allow authenticated users to read exercises"
ON exercises FOR SELECT
TO authenticated
USING (true);
```

3. Zweryfikuj policy dla tabeli `categories`:

```sql
-- Policy: Allow authenticated users to read categories
CREATE POLICY "Allow authenticated users to read categories"
ON categories FOR SELECT
TO authenticated
USING (true);
```

### Weryfikacja Indeksów

**Sprawdź czy istnieją w Supabase Dashboard → Database → Indexes:**

```sql
-- Exercises indexes
idx_exercises_category       ON exercises(category_id)
idx_exercises_difficulty     ON exercises(difficulty)
idx_exercises_name_gin       ON exercises USING GIN(name gin_trgm_ops)

-- Categories indexes
idx_categories_slug          ON categories(slug)
idx_categories_order_index   ON categories(order_index)
```

**Jeśli brakuje GIN index (dla wyszukiwania):**

```sql
-- Włącz extension pg_trgm (jeśli nie jest włączone)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Utwórz GIN index dla wyszukiwania
CREATE INDEX IF NOT EXISTS idx_exercises_name_gin
ON exercises USING GIN(name gin_trgm_ops);
```

---

## Testowanie Manualne

### Krok 1: Uruchom serwer deweloperski

```bash
npm run dev
```

Serwer powinien działać na: `http://localhost:4321`

### Krok 2: Zaloguj się do aplikacji

1. Otwórz przeglądarkę: `http://localhost:4321`
2. Zaloguj się używając istniejącego konta
3. Otwórz DevTools → Application → Cookies
4. Skopiuj wartości ciasteczek sesji Supabase

**Ciasteczka do skopiowania:**
- `sb-access-token`
- `sb-refresh-token`

### Krok 3: Uruchom automatyczny test

```bash
./scripts/test-exercises-api.sh
```

Ten skrypt przetestuje:
- ✅ Czy serwer działa
- ✅ Czy endpoint wymaga autentykacji (401)
- ✅ Walidację UUID
- ✅ Walidację difficulty
- ✅ Walidację limitów paginacji

### Krok 4: Testy manualne z autentykacją

#### Test 1: Lista wszystkich ćwiczeń

```bash
curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  http://localhost:4321/api/exercises \
  | python3 -m json.tool
```

**Oczekiwana odpowiedź:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Exercise Name",
      "description": "...",
      "image_path": "/storage/...",
      "image_alt": "...",
      "difficulty": "medium",
      "created_at": "2024-01-15T10:00:00Z",
      "category": {
        "id": "uuid",
        "name": "Chest",
        "slug": "chest"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

#### Test 2: Filtrowanie po kategorii

```bash
# Najpierw pobierz ID kategorii z poprzedniego zapytania
CATEGORY_ID="paste-category-uuid-here"

curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?category_id=${CATEGORY_ID}" \
  | python3 -m json.tool
```

**Weryfikacja:** Wszystkie ćwiczenia powinny należeć do tej samej kategorii.

#### Test 3: Filtrowanie po trudności

```bash
# Pojedyncza trudność
curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?difficulty=medium" \
  | python3 -m json.tool

# Wiele trudności
curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?difficulty=medium,hard" \
  | python3 -m json.tool
```

**Weryfikacja:** Wszystkie ćwiczenia powinny mieć `difficulty` = "medium" lub "hard".

#### Test 4: Wyszukiwanie po nazwie

```bash
curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?search=bench" \
  | python3 -m json.tool
```

**Weryfikacja:** Wszystkie nazwy ćwiczeń powinny zawierać słowo "bench" (case-insensitive).

#### Test 5: Paginacja

```bash
# Strona 1, limit 5
curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?page=1&limit=5" \
  | python3 -m json.tool

# Strona 2, limit 5
curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?page=2&limit=5" \
  | python3 -m json.tool
```

**Weryfikacja:**
- Strona 1 powinna zwrócić pierwsze 5 ćwiczeń
- Strona 2 powinna zwrócić następne 5 ćwiczeń (różne od strony 1)
- `pagination.total` powinno być takie samo
- `pagination.page` powinno się zgadzać

#### Test 6: Kombinacja filtrów

```bash
CATEGORY_ID="paste-category-uuid-here"

curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?category_id=${CATEGORY_ID}&difficulty=medium&search=press&page=1&limit=10" \
  | python3 -m json.tool
```

**Weryfikacja:** Wyniki powinny spełniać wszystkie warunki jednocześnie.

#### Test 7: Pojedyncze ćwiczenie po ID

```bash
# Najpierw pobierz ID ćwiczenia z listy
EXERCISE_ID="paste-exercise-uuid-here"

curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises/${EXERCISE_ID}" \
  | python3 -m json.tool
```

**Oczekiwana odpowiedź:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Barbell Bench Press",
    "description": "Full description...",
    "image_path": "/storage/exercises/bench-press.jpg",
    "image_alt": "Person performing bench press",
    "difficulty": "medium",
    "created_at": "2024-01-15T10:00:00Z",
    "category": {
      "id": "uuid",
      "name": "Chest",
      "slug": "chest",
      "description": "Chest muscle exercises",
      "image_path": "/storage/categories/chest.jpg"
    }
  }
}
```

**Weryfikacja:** Kategoria powinna zawierać pełne informacje (description, image_path).

#### Test 8: Nieistniejące ćwiczenie (404)

```bash
curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises/00000000-0000-0000-0000-000000000000" \
  | python3 -m json.tool
```

**Oczekiwana odpowiedź (404):**
```json
{
  "error": "Not Found",
  "message": "Exercise not found"
}
```

---

## Testy Walidacji (bez autentykacji)

### Test 1: Brak autentykacji (401)

```bash
curl "http://localhost:4321/api/exercises"
```

**Oczekiwana odpowiedź:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Test 2: Nieprawidłowy UUID kategorii (400)

```bash
curl "http://localhost:4321/api/exercises?category_id=not-a-uuid"
```

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation failed",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "category_id",
      "message": "Invalid category ID format"
    }
  ]
}
```

### Test 3: Nieprawidłowa trudność (400)

```bash
curl "http://localhost:4321/api/exercises?difficulty=super-hard"
```

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation failed",
  "message": "Invalid query parameters",
  "details": [...]
}
```

### Test 4: Limit przekracza maksimum (400)

```bash
curl "http://localhost:4321/api/exercises?limit=150"
```

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation failed",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "limit",
      "message": "Limit must not exceed 100"
    }
  ]
}
```

### Test 5: Nieprawidłowy format ID ćwiczenia (400)

```bash
curl "http://localhost:4321/api/exercises/invalid-id"
```

**Oczekiwana odpowiedź:**
```json
{
  "error": "Validation failed",
  "message": "Invalid exercise ID format",
  "details": [...]
}
```

---

## Testy Wydajności

### Test 1: Czas odpowiedzi listy

```bash
time curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises" \
  -o /dev/null -s
```

**Oczekiwany czas:** < 200ms

### Test 2: Czas odpowiedzi wyszukiwania

```bash
time curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises?search=bench" \
  -o /dev/null -s
```

**Oczekiwany czas:** < 500ms

### Test 3: Czas odpowiedzi pojedynczego ćwiczenia

```bash
EXERCISE_ID="paste-exercise-uuid-here"

time curl -b "sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  "http://localhost:4321/api/exercises/${EXERCISE_ID}" \
  -o /dev/null -s
```

**Oczekiwany czas:** < 200ms

---

## Checklist Testów

### ✅ Testy Funkcjonalne

- [ ] Lista wszystkich ćwiczeń zwraca dane
- [ ] Paginacja działa poprawnie (page, limit)
- [ ] Filtrowanie po category_id działa
- [ ] Filtrowanie po difficulty działa (single value)
- [ ] Filtrowanie po difficulty działa (multiple values)
- [ ] Wyszukiwanie po nazwie działa (case-insensitive)
- [ ] Kombinacja filtrów działa poprawnie
- [ ] Pojedyncze ćwiczenie po ID zwraca pełne dane
- [ ] Pełne informacje o kategorii w odpowiedzi detail

### ✅ Testy Autentykacji

- [ ] Brak tokenu zwraca 401
- [ ] Nieprawidłowy token zwraca 401
- [ ] Prawidłowy token zwraca 200

### ✅ Testy Walidacji

- [ ] Nieprawidłowy UUID kategorii zwraca 400
- [ ] Nieprawidłowa wartość difficulty zwraca 400
- [ ] Limit > 100 zwraca 400
- [ ] Page < 1 zwraca 400
- [ ] Nieprawidłowy UUID ćwiczenia zwraca 400
- [ ] Nieistniejące ćwiczenie zwraca 404

### ✅ Testy Wydajności

- [ ] Lista < 200ms
- [ ] Wyszukiwanie < 500ms
- [ ] Detail < 200ms
- [ ] 100 równoczesnych requestów nie powoduje błędów

### ✅ Testy Edge Cases

- [ ] Pusta tablica wyników (search bez rezultatów)
- [ ] Ostatnia strona paginacji
- [ ] Limit = 1 działa
- [ ] Limit = 100 działa
- [ ] Special characters w search (ąćęłńóśźż)

---

## Rozwiązywanie Problemów

### Problem: 401 Unauthorized mimo zalogowania

**Rozwiązanie:**
1. Sprawdź czy middleware Supabase jest skonfigurowany w `src/middleware/index.ts`
2. Zweryfikuj czy cookies są prawidłowo przekazywane
3. Sprawdź czy tokeny nie wygasły (odśwież stronę w przeglądarce)

### Problem: 500 Internal Server Error

**Rozwiązanie:**
1. Sprawdź logi serwera deweloperskiego
2. Zweryfikuj połączenie z Supabase (SUPABASE_URL, SUPABASE_KEY)
3. Sprawdź czy tabele istnieją w bazie danych
4. Zweryfikuj czy RLS policies są włączone

### Problem: Puste wyniki mimo istniejących danych

**Rozwiązanie:**
1. Sprawdź RLS policies - czy użytkownik ma uprawnienia SELECT
2. Zweryfikuj czy dane istnieją w tabeli `exercises`
3. Sprawdź czy filtry nie są zbyt restrykcyjne

### Problem: Wyszukiwanie nie działa

**Rozwiązanie:**
1. Sprawdź czy extension `pg_trgm` jest włączone
2. Zweryfikuj czy GIN index istnieje na kolumnie `name`
3. Utwórz index jeśli brakuje:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_exercises_name_gin ON exercises USING GIN(name gin_trgm_ops);
```

---

## Następne Kroki

Po pomyślnym zakończeniu testów:

1. ✅ Zaktualizuj dokumentację API
2. ✅ Dodaj przykłady do README
3. ✅ Przygotuj deployment checklist
4. ✅ Skonfiguruj monitoring dla production
5. ✅ Dodaj rate limiting (post-MVP)
