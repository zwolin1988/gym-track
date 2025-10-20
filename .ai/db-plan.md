# Schemat Bazy Danych - Gym Track MVP

## 1. Tabele

### 1.1. Tabele Globalne (Współdzielone)

#### `categories`
Tabela przechowująca kategorie mięśniowe dla ćwiczeń.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator kategorii |
| `name` | VARCHAR(100) | NOT NULL | Nazwa kategorii (np. "Klatka piersiowa") |
| `slug` | VARCHAR(100) | NOT NULL UNIQUE | URL-friendly identyfikator (np. "chest") |
| `description` | TEXT | NULL | Opis kategorii |
| `image_path` | VARCHAR(500) | NULL | Ścieżka relatywna do obrazka w Supabase Storage |
| `image_alt` | TEXT | NULL | Tekst alternatywny dla obrazka (accessibility) |
| `order_index` | SMALLINT | NOT NULL DEFAULT 0 | Kolejność wyświetlania kategorii |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |

**Indeksy:**
- `idx_categories_slug` ON `slug`
- `idx_categories_order_index` ON `order_index`

---

#### `exercises`
Predefiniowana baza ćwiczeń (minimum 50 w MVP).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator ćwiczenia |
| `name` | VARCHAR(200) | NOT NULL | Nazwa ćwiczenia (np. "Wyciskanie sztangi leżąc") |
| `description` | TEXT | NULL | Opis techniki wykonania |
| `image_path` | VARCHAR(500) | NULL | Ścieżka relatywna do obrazka w Supabase Storage |
| `image_alt` | TEXT | NULL | Tekst alternatywny dla obrazka (accessibility) |
| `difficulty` | difficulty_level | NOT NULL | Poziom trudności (Easy, Medium, Hard) |
| `category_id` | UUID | NOT NULL REFERENCES categories(id) ON DELETE RESTRICT | Kategoria ćwiczenia |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |

**ENUM Type:**
```sql
CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
```

**Indeksy:**
- `idx_exercises_category` ON `category_id`
- `idx_exercises_difficulty` ON `difficulty`
- `idx_exercises_name_gin` GIN(`name` gin_trgm_ops) -- dla efektywnego wyszukiwania tekstowego (wymaga extension pg_trgm)

---

### 1.2. Tabele Planów Treningowych

#### `workout_plans`
Plany treningowe użytkowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator planu |
| `user_id` | UUID | NOT NULL | ID użytkownika (Supabase Auth) |
| `name` | VARCHAR(200) | NOT NULL CHECK(LENGTH(name) >= 3) | Nazwa planu (min. 3 znaki) |
| `description` | VARCHAR(500) | NULL | Opcjonalny opis planu (max 500 znaków) |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete timestamp |
| `last_used_at` | TIMESTAMPTZ | NULL | Data ostatniego użycia planu do treningu |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej modyfikacji |

**Indeksy:**
- `idx_workout_plans_user` ON `user_id` WHERE `deleted_at IS NULL`
- `idx_workout_plans_user_updated` ON `(user_id, updated_at DESC)` WHERE `deleted_at IS NULL`

---

#### `plan_exercises`
Tabela łącznikowa reprezentująca instancję ćwiczenia w planie (1:N z plan_exercise_sets).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator instancji ćwiczenia |
| `plan_id` | UUID | NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE | Plan treningowy |
| `exercise_id` | UUID | NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT | Ćwiczenie z globalnej bazy |
| `order_index` | SMALLINT | NOT NULL DEFAULT 0 | Kolejność ćwiczenia w planie |
| `user_id` | UUID | NOT NULL | ID użytkownika (dla RLS) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data dodania do planu |

**Indeksy:**
- `idx_plan_exercises_plan` ON `(plan_id, order_index)`
- `idx_plan_exercises_user` ON `user_id`

---

#### `plan_exercise_sets`
Serie planowane dla każdej instancji ćwiczenia w planie.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator serii |
| `plan_exercise_id` | UUID | NOT NULL REFERENCES plan_exercises(id) ON DELETE CASCADE | Instancja ćwiczenia w planie |
| `reps` | SMALLINT | NOT NULL CHECK(reps > 0) | Planowana liczba powtórzeń |
| `weight` | NUMERIC(6,2) | NULL CHECK(weight IS NULL OR weight >= 0) | Planowany ciężar w kg (nullable) |
| `order_index` | SMALLINT | NOT NULL DEFAULT 0 | Kolejność serii w ćwiczeniu |
| `user_id` | UUID | NOT NULL | ID użytkownika (dla RLS) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |

**Indeksy:**
- `idx_plan_exercise_sets_plan_exercise` ON `(plan_exercise_id, order_index)`
- `idx_plan_exercise_sets_user` ON `user_id`

---

### 1.3. Tabele Treningów

#### `workouts`
Sesje treningowe użytkowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator treningu |
| `user_id` | UUID | NOT NULL | ID użytkownika (Supabase Auth) |
| `plan_id` | UUID | NOT NULL REFERENCES workout_plans(id) ON DELETE RESTRICT | Plan na podstawie którego wykonano trening |
| `status` | workout_status | NOT NULL DEFAULT 'active' | Status treningu |
| `started_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data i godzina rozpoczęcia |
| `completed_at` | TIMESTAMPTZ | NULL CHECK(completed_at IS NULL OR completed_at >= started_at) | Data i godzina zakończenia |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia rekordu |

**ENUM Type:**
```sql
CREATE TYPE workout_status AS ENUM ('active', 'completed', 'cancelled');
```

**Indeksy:**
- `idx_workouts_user_started` ON `(user_id, started_at DESC)`
- `idx_workouts_user_plan` ON `(user_id, plan_id)`
- `idx_workouts_status` ON `status`
- `idx_one_active_workout_per_user` UNIQUE ON `user_id` WHERE `status = 'active'` -- Zapewnia jednego aktywnego treningu na użytkownika

---

#### `workout_exercises`
Tabela łącznikowa reprezentująca instancję ćwiczenia w treningu (kopiowana z plan_exercises przy rozpoczęciu).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator instancji ćwiczenia |
| `workout_id` | UUID | NOT NULL REFERENCES workouts(id) ON DELETE RESTRICT | Trening |
| `exercise_id` | UUID | NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT | Ćwiczenie z globalnej bazy |
| `order_index` | SMALLINT | NOT NULL DEFAULT 0 | Kolejność ćwiczenia w treningu |
| `user_id` | UUID | NOT NULL | ID użytkownika (dla RLS) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data dodania do treningu |

**Indeksy:**
- `idx_workout_exercises_workout` ON `(workout_id, order_index)`
- `idx_workout_exercises_user` ON `user_id`

---

#### `workout_sets`
Serie rzeczywiście wykonane podczas treningu (kopiowane z plan_exercise_sets przy rozpoczęciu).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator serii |
| `workout_exercise_id` | UUID | NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE | Instancja ćwiczenia w treningu |
| `planned_reps` | SMALLINT | NOT NULL CHECK(planned_reps > 0) | Planowana liczba powtórzeń (skopiowana z planu) |
| `planned_weight` | NUMERIC(6,2) | NULL CHECK(planned_weight IS NULL OR planned_weight >= 0) | Planowany ciężar w kg |
| `actual_reps` | SMALLINT | NULL CHECK(actual_reps IS NULL OR actual_reps > 0) | Rzeczywista liczba powtórzeń |
| `actual_weight` | NUMERIC(6,2) | NULL CHECK(actual_weight IS NULL OR actual_weight >= 0) | Rzeczywisty ciężar w kg |
| `completed` | BOOLEAN | NOT NULL DEFAULT FALSE | Czy seria została wykonana |
| `note` | VARCHAR(200) | NULL | Opcjonalna notatka użytkownika (max 200 znaków) |
| `order_index` | SMALLINT | NOT NULL DEFAULT 0 | Kolejność serii w ćwiczeniu |
| `user_id` | UUID | NOT NULL | ID użytkownika (dla RLS) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |

**Indeksy:**
- `idx_workout_sets_workout_exercise` ON `(workout_exercise_id, order_index)`
- `idx_workout_sets_user` ON `user_id`
- `idx_workout_sets_completed` ON `completed`

---

### 1.4. Tabele Statystyk

#### `workout_stats`
Obliczone statystyki treningu (relacja 1:1 z workouts).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unikalny identyfikator statystyk |
| `workout_id` | UUID | NOT NULL UNIQUE REFERENCES workouts(id) ON DELETE CASCADE | Trening (relacja 1:1) |
| `duration_minutes` | INTEGER | NOT NULL CHECK(duration_minutes >= 0) | Czas trwania w minutach |
| `total_exercises` | SMALLINT | NOT NULL CHECK(total_exercises >= 0) | Liczba unikalnych ćwiczeń wykonanych |
| `total_sets` | SMALLINT | NOT NULL CHECK(total_sets >= 0) | Łączna liczba wykonanych serii |
| `total_reps` | INTEGER | NOT NULL CHECK(total_reps >= 0) | Łączna liczba powtórzeń |
| `max_weight` | NUMERIC(6,2) | NULL CHECK(max_weight IS NULL OR max_weight >= 0) | Maksymalny ciężar użyty (kg) |
| `total_volume` | NUMERIC(10,2) | NOT NULL DEFAULT 0 CHECK(total_volume >= 0) | Całkowita objętość: Σ(ciężar × powtórzenia) w kg |
| `user_id` | UUID | NOT NULL | ID użytkownika (dla RLS) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia statystyk |

**Indeksy:**
- `idx_workout_stats_workout` UNIQUE ON `workout_id`
- `idx_workout_stats_user` ON `user_id`

---

## 2. Relacje między Tabelami

### 2.1. Hierarchia Globalnych Danych
```
categories (1) ──< (N) exercises
```
- Jedna kategoria może mieć wiele ćwiczeń
- Ćwiczenie należy do jednej kategorii
- Relacja: `exercises.category_id → categories.id` (ON DELETE RESTRICT)

---

### 2.2. Hierarchia Planów Treningowych
```
workout_plans (1) ──< (N) plan_exercises (1) ──< (N) plan_exercise_sets
```
- Jeden plan może mieć wiele instancji ćwiczeń
- Jedna instancja ćwiczenia może mieć wiele serii
- Relacje:
  - `plan_exercises.plan_id → workout_plans.id` (ON DELETE CASCADE)
  - `plan_exercises.exercise_id → exercises.id` (ON DELETE RESTRICT)
  - `plan_exercise_sets.plan_exercise_id → plan_exercises.id` (ON DELETE CASCADE)

---

### 2.3. Hierarchia Treningów
```
workouts (1) ──< (N) workout_exercises (1) ──< (N) workout_sets
workouts (1) ──── (1) workout_stats
```
- Jeden trening może mieć wiele instancji ćwiczeń
- Jedna instancja ćwiczenia może mieć wiele serii
- Jeden trening ma dokładnie jeden rekord statystyk (1:1)
- Relacje:
  - `workouts.plan_id → workout_plans.id` (ON DELETE RESTRICT)
  - `workout_exercises.workout_id → workouts.id` (ON DELETE RESTRICT)
  - `workout_exercises.exercise_id → exercises.id` (ON DELETE RESTRICT)
  - `workout_sets.workout_exercise_id → workout_exercises.id` (ON DELETE CASCADE)
  - `workout_stats.workout_id → workouts.id` (ON DELETE CASCADE, UNIQUE)

---

### 2.4. Relacje z Użytkownikami (Supabase Auth)
```
auth.users (1) ──< (N) workout_plans
auth.users (1) ──< (N) workouts
```
- Użytkownik może mieć wiele planów treningowych
- Użytkownik może mieć wiele treningów
- Kolumny `user_id` w tabelach nie mają jawnego FOREIGN KEY do `auth.users` (zarządzane przez Supabase Auth)

---

## 3. Indeksy

### 3.1. Indeksy dla Wydajności Wyszukiwania i Filtrowania

```sql
-- Categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order_index ON categories(order_index);

-- Exercises
CREATE INDEX idx_exercises_category ON exercises(category_id);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_name_gin ON exercises USING GIN(name gin_trgm_ops);

-- Workout Plans
CREATE INDEX idx_workout_plans_user ON workout_plans(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workout_plans_user_updated ON workout_plans(user_id, updated_at DESC) WHERE deleted_at IS NULL;

-- Plan Exercises
CREATE INDEX idx_plan_exercises_plan ON plan_exercises(plan_id, order_index);
CREATE INDEX idx_plan_exercises_user ON plan_exercises(user_id);

-- Plan Exercise Sets
CREATE INDEX idx_plan_exercise_sets_plan_exercise ON plan_exercise_sets(plan_exercise_id, order_index);
CREATE INDEX idx_plan_exercise_sets_user ON plan_exercise_sets(user_id);

-- Workouts
CREATE INDEX idx_workouts_user_started ON workouts(user_id, started_at DESC);
CREATE INDEX idx_workouts_user_plan ON workouts(user_id, plan_id);
CREATE INDEX idx_workouts_status ON workouts(status);
CREATE UNIQUE INDEX idx_one_active_workout_per_user ON workouts(user_id) WHERE status = 'active';

-- Workout Exercises
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id, order_index);
CREATE INDEX idx_workout_exercises_user ON workout_exercises(user_id);

-- Workout Sets
CREATE INDEX idx_workout_sets_workout_exercise ON workout_sets(workout_exercise_id, order_index);
CREATE INDEX idx_workout_sets_user ON workout_sets(user_id);
CREATE INDEX idx_workout_sets_completed ON workout_sets(completed);

-- Workout Stats
CREATE UNIQUE INDEX idx_workout_stats_workout ON workout_stats(workout_id);
CREATE INDEX idx_workout_stats_user ON workout_stats(user_id);
```

---

## 4. Row Level Security (RLS) Policies

### 4.1. Włączenie RLS na Tabelach

```sql
-- Tabele globalne (tylko SELECT dla authenticated users)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Tabele użytkowników (pełna izolacja)
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_stats ENABLE ROW LEVEL SECURITY;
```

---

### 4.2. Policies dla Tabel Globalnych

#### Categories
```sql
-- SELECT: wszyscy zalogowani użytkownicy
CREATE POLICY "Allow authenticated users to read categories"
ON categories FOR SELECT
TO authenticated
USING (true);
```

#### Exercises
```sql
-- SELECT: wszyscy zalogowani użytkownicy
CREATE POLICY "Allow authenticated users to read exercises"
ON exercises FOR SELECT
TO authenticated
USING (true);
```

---

### 4.3. Policies dla Planów Treningowych

#### Workout Plans
```sql
-- SELECT: tylko własne plany (nie usunięte)
CREATE POLICY "Users can view their own workout plans"
ON workout_plans FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- INSERT: użytkownik może tworzyć własne plany
CREATE POLICY "Users can create their own workout plans"
ON workout_plans FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może aktualizować własne plany
CREATE POLICY "Users can update their own workout plans"
ON workout_plans FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać własne plany (soft delete)
CREATE POLICY "Users can delete their own workout plans"
ON workout_plans FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

#### Plan Exercises
```sql
-- SELECT: tylko ćwiczenia z własnych planów
CREATE POLICY "Users can view exercises from their own plans"
ON plan_exercises FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: użytkownik może dodawać ćwiczenia do własnych planów
CREATE POLICY "Users can add exercises to their own plans"
ON plan_exercises FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może aktualizować ćwiczenia we własnych planach
CREATE POLICY "Users can update exercises in their own plans"
ON plan_exercises FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać ćwiczenia z własnych planów
CREATE POLICY "Users can delete exercises from their own plans"
ON plan_exercises FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

#### Plan Exercise Sets
```sql
-- SELECT: tylko serie z własnych planów
CREATE POLICY "Users can view sets from their own plans"
ON plan_exercise_sets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: użytkownik może dodawać serie do własnych planów
CREATE POLICY "Users can add sets to their own plans"
ON plan_exercise_sets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może aktualizować serie we własnych planach
CREATE POLICY "Users can update sets in their own plans"
ON plan_exercise_sets FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać serie z własnych planów
CREATE POLICY "Users can delete sets from their own plans"
ON plan_exercise_sets FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

---

### 4.4. Policies dla Treningów

#### Workouts
```sql
-- SELECT: tylko własne treningi
CREATE POLICY "Users can view their own workouts"
ON workouts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: użytkownik może tworzyć własne treningi
CREATE POLICY "Users can create their own workouts"
ON workouts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może aktualizować własne treningi
CREATE POLICY "Users can update their own workouts"
ON workouts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać własne treningi
CREATE POLICY "Users can delete their own workouts"
ON workouts FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

#### Workout Exercises
```sql
-- SELECT: tylko ćwiczenia z własnych treningów
CREATE POLICY "Users can view exercises from their own workouts"
ON workout_exercises FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: użytkownik może dodawać ćwiczenia do własnych treningów
CREATE POLICY "Users can add exercises to their own workouts"
ON workout_exercises FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może aktualizować ćwiczenia we własnych treningach
CREATE POLICY "Users can update exercises in their own workouts"
ON workout_exercises FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać ćwiczenia z własnych treningów
CREATE POLICY "Users can delete exercises from their own workouts"
ON workout_exercises FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

#### Workout Sets
```sql
-- SELECT: tylko serie z własnych treningów
CREATE POLICY "Users can view sets from their own workouts"
ON workout_sets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: użytkownik może dodawać serie do własnych treningów
CREATE POLICY "Users can add sets to their own workouts"
ON workout_sets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może aktualizować serie we własnych treningach
CREATE POLICY "Users can update sets in their own workouts"
ON workout_sets FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać serie z własnych treningów
CREATE POLICY "Users can delete sets from their own workouts"
ON workout_sets FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

---

### 4.5. Policies dla Statystyk

#### Workout Stats
```sql
-- SELECT: tylko statystyki własnych treningów
CREATE POLICY "Users can view stats from their own workouts"
ON workout_stats FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: system/trigger tworzy statystyki (może być również policy dla użytkownika)
CREATE POLICY "Users can create stats for their own workouts"
ON workout_stats FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może aktualizować statystyki własnych treningów (jeśli potrzebne)
CREATE POLICY "Users can update stats for their own workouts"
ON workout_stats FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: kaskada z workouts
CREATE POLICY "Users can delete stats for their own workouts"
ON workout_stats FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

---

## 5. Triggers i Funkcje

### 5.1. Trigger dla Automatycznej Aktualizacji `updated_at`

```sql
-- Funkcja do aktualizacji timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla workout_plans
CREATE TRIGGER trigger_update_workout_plans_updated_at
BEFORE UPDATE ON workout_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();
```

---

### 5.2. Trigger dla Obliczania Statystyk Treningu

```sql
-- Funkcja do obliczania statystyk po zakończeniu treningu
CREATE OR REPLACE FUNCTION calculate_workout_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_duration_minutes INTEGER;
  v_total_exercises SMALLINT;
  v_total_sets SMALLINT;
  v_total_reps INTEGER;
  v_max_weight NUMERIC(6,2);
  v_total_volume NUMERIC(10,2);
BEGIN
  -- Wykonaj tylko gdy status zmienia się na 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Oblicz czas trwania w minutach
    v_duration_minutes := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60;

    -- Oblicz liczbę unikalnych ćwiczeń
    SELECT COUNT(DISTINCT we.exercise_id)
    INTO v_total_exercises
    FROM workout_exercises we
    WHERE we.workout_id = NEW.id;

    -- Oblicz łączną liczbę wykonanych serii
    SELECT COUNT(*)
    INTO v_total_sets
    FROM workout_sets ws
    JOIN workout_exercises we ON ws.workout_exercise_id = we.id
    WHERE we.workout_id = NEW.id AND ws.completed = TRUE;

    -- Oblicz łączną liczbę powtórzeń
    SELECT COALESCE(SUM(ws.actual_reps), 0)
    INTO v_total_reps
    FROM workout_sets ws
    JOIN workout_exercises we ON ws.workout_exercise_id = we.id
    WHERE we.workout_id = NEW.id AND ws.completed = TRUE;

    -- Oblicz maksymalny ciężar
    SELECT MAX(ws.actual_weight)
    INTO v_max_weight
    FROM workout_sets ws
    JOIN workout_exercises we ON ws.workout_exercise_id = we.id
    WHERE we.workout_id = NEW.id AND ws.completed = TRUE;

    -- Oblicz całkowitą objętość treningową: Σ(ciężar × powtórzenia)
    SELECT COALESCE(SUM(ws.actual_weight * ws.actual_reps), 0)
    INTO v_total_volume
    FROM workout_sets ws
    JOIN workout_exercises we ON ws.workout_exercise_id = we.id
    WHERE we.workout_id = NEW.id
      AND ws.completed = TRUE
      AND ws.actual_weight IS NOT NULL;

    -- Wstaw lub zaktualizuj statystyki
    INSERT INTO workout_stats (
      workout_id,
      duration_minutes,
      total_exercises,
      total_sets,
      total_reps,
      max_weight,
      total_volume,
      user_id
    ) VALUES (
      NEW.id,
      v_duration_minutes,
      v_total_exercises,
      v_total_sets,
      v_total_reps,
      v_max_weight,
      v_total_volume,
      NEW.user_id
    )
    ON CONFLICT (workout_id) DO UPDATE SET
      duration_minutes = EXCLUDED.duration_minutes,
      total_exercises = EXCLUDED.total_exercises,
      total_sets = EXCLUDED.total_sets,
      total_reps = EXCLUDED.total_reps,
      max_weight = EXCLUDED.max_weight,
      total_volume = EXCLUDED.total_volume;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na workouts
CREATE TRIGGER trigger_calculate_workout_stats
AFTER UPDATE ON workouts
FOR EACH ROW
EXECUTE FUNCTION calculate_workout_stats();
```

---

### 5.3. Funkcja do Aktualizacji `last_used_at` w Planach

```sql
-- Funkcja do aktualizacji last_used_at przy tworzeniu treningu
CREATE OR REPLACE FUNCTION update_plan_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workout_plans
  SET last_used_at = NEW.started_at
  WHERE id = NEW.plan_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na workouts
CREATE TRIGGER trigger_update_plan_last_used
AFTER INSERT ON workouts
FOR EACH ROW
EXECUTE FUNCTION update_plan_last_used();
```

---

## 6. Dodatkowe Uwagi i Decyzje Projektowe

### 6.1. Typy ENUM
- **`difficulty_level`**: Zapewnia type safety i wydajność dla poziomu trudności ćwiczeń.
- **`workout_status`**: Zapewnia type safety dla statusu treningu (active, completed, cancelled).

### 6.2. Soft Delete
- **`workout_plans.deleted_at`**: Implementuje soft delete dla planów treningowych, co pozwala zachować integralność referencyjną z historycznymi treningami.
- Przy pobieraniu planów należy zawsze filtrować `WHERE deleted_at IS NULL`.

### 6.3. Separacja Planów i Treningów
- **Plan vs Trening**: Plan (`workout_plans`) to szablon, a trening (`workouts`) to konkretna sesja treningowa.
- Przy rozpoczęciu treningu dane z `plan_exercises` i `plan_exercise_sets` są kopiowane do `workout_exercises` i `workout_sets`.
- To zapewnia, że modyfikacje planu NIE wpływają na historyczne treningi (zgodnie z PRD 3.3.4).

### 6.4. Kolumny Audytowe
- `created_at`: Wszystkie tabele mają tę kolumnę dla śledzenia czasu utworzenia.
- `updated_at`: Tylko tabele modyfikowalne przez użytkownika (`workout_plans`) mają automatyczny trigger aktualizacji.

### 6.5. Indeksy dla Wydajności
- **GIN Index z pg_trgm**: Dla efektywnego wyszukiwania tekstowego w nazwie ćwiczenia (wymaga `CREATE EXTENSION pg_trgm;`).
- **Partial Indexes**: `WHERE deleted_at IS NULL` dla planów, `WHERE status = 'active'` dla aktywnych treningów (oszczędność miejsca).
- **Composite Indexes**: Dla często używanych zapytań z sortowaniem (`user_id, started_at DESC`).

### 6.6. Ograniczenia Integralności
- **CHECK Constraints**: Zapewniają walidację na poziomie bazy danych (reps > 0, weight >= 0, completed_at >= started_at).
- **UNIQUE Partial Index**: Zapewnia regułę biznesową "jeden aktywny trening na użytkownika".
- **ON DELETE RESTRICT**: Zapobiega przypadkowemu usunięciu globalnych danych (exercises, categories) i kluczowych relacji.

### 6.7. Row Level Security (RLS)
- **Izolacja danych**: Każdy użytkownik ma dostęp tylko do własnych danych (plany, treningi, statystyki).
- **Globalne dane**: Ćwiczenia i kategorie są dostępne do odczytu dla wszystkich zalogowanych użytkowników.
- **`user_id` w każdej tabeli**: Umożliwia efektywne policies RLS bez skomplikowanych JOIN-ów.

### 6.8. Statystyki jako Osobna Tabela
- **workout_stats**: Separacja metryk obliczeniowych od danych faktycznych zwiększa wydajność zapytań analitycznych.
- **Trigger automatyczny**: Statystyki są obliczane automatycznie po zakończeniu treningu, bez potrzeby logiki w aplikacji.

### 6.9. Normalizacja
- Schemat jest znormalizowany do **3NF** (Third Normal Form):
  - Brak powtarzających się grup
  - Wszystkie kolumny zależą od klucza głównego
  - Brak zależności przechodnich
- **Denormalizacja celowa**: `user_id` jest duplikowany w tabelach łącznikowych dla wydajności RLS (nie wymaga JOIN-ów w policies).

### 6.10. UUID jako Klucze Główne
- Wszystkie tabele używają `UUID` zamiast `SERIAL/BIGSERIAL` dla:
  - Lepszej skalowalności (rozproszonych systemów)
  - Bezpieczeństwa (niemożliwe do przewidzenia ID)
  - Integracji z Supabase Auth (`auth.uid()` zwraca UUID)

### 6.11. PostgreSQL Extensions Wymagane
```sql
-- Dla UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- lub nowszy sposób:
-- gen_random_uuid() jest wbudowany w PostgreSQL 13+

-- Dla wyszukiwania tekstowego (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 6.12. Strategia Migracji
1. Utworzenie ENUM types
2. Utworzenie tabel globalnych (categories, exercises)
3. Utworzenie tabel planów (workout_plans, plan_exercises, plan_exercise_sets)
4. Utworzenie tabel treningów (workouts, workout_exercises, workout_sets)
5. Utworzenie tabel statystyk (workout_stats)
6. Dodanie indeksów
7. Włączenie RLS i utworzenie policies
8. Dodanie triggers i funkcji
9. Załadowanie danych seed (50 ćwiczeń, 5-10 kategorii)

---

**Koniec dokumentu schematu bazy danych**
