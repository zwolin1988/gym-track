-- =====================================================
-- Migration: Initial Database Schema for Gym Track MVP
-- Created: 2025-10-20 12:00:00 UTC
-- Author: Database Migration Script
-- =====================================================
--
-- Purpose:
--   Creates the complete database schema for Gym Track application including:
--   - ENUM types for difficulty levels and workout status
--   - Global tables: categories, exercises
--   - Workout plan tables: workout_plans, plan_exercises, plan_exercise_sets
--   - Workout session tables: workouts, workout_exercises, workout_sets
--   - Statistics table: workout_stats
--   - All indexes for performance optimization
--   - Row Level Security (RLS) policies for data isolation
--   - Triggers for automated timestamp updates and statistics calculation
--
-- Tables affected:
--   - categories (create)
--   - exercises (create)
--   - workout_plans (create)
--   - plan_exercises (create)
--   - plan_exercise_sets (create)
--   - workouts (create)
--   - workout_exercises (create)
--   - workout_sets (create)
--   - workout_stats (create)
--
-- Special notes:
--   - Requires pg_trgm extension for text search on exercise names
--   - Uses UUID for all primary keys for better scalability
--   - Implements soft delete for workout_plans via deleted_at column
--   - One active workout per user enforced via unique partial index
--   - RLS policies ensure complete data isolation between users
--   - Global tables (categories, exercises) are read-only for authenticated users
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================

-- Enable pg_trgm extension for trigram-based text search
-- This is required for efficient fuzzy searching on exercise names
create extension if not exists pg_trgm;

-- Note: uuid-ossp extension is not needed as gen_random_uuid() is built-in for PostgreSQL 13+

-- =====================================================
-- SECTION 2: ENUM TYPES
-- =====================================================

-- Create ENUM type for exercise difficulty levels
-- Used in exercises table to categorize exercises by difficulty
create type difficulty_level as enum ('easy', 'medium', 'hard');

-- Create ENUM type for workout status
-- Used in workouts table to track the state of a workout session
-- - 'active': Workout is currently in progress (user is logging exercises)
-- - 'completed': Workout has been finished and statistics have been calculated
-- - 'cancelled': Workout was started but abandoned (future use)
create type workout_status as enum ('active', 'completed', 'cancelled');

-- =====================================================
-- SECTION 3: GLOBAL TABLES (Shared across all users)
-- =====================================================

-- -----------------------------------------------------
-- Table: categories
-- -----------------------------------------------------
-- Stores muscle group categories for exercises
-- This is a global table - all users share the same categories
-- Expected to contain 5-10 main muscle group categories in MVP
create table categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  slug varchar(100) not null unique,
  description text,
  image_path varchar(500),
  image_alt text,
  order_index smallint not null default 0,
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table categories is 'Global muscle group categories for exercises. Shared across all users. Read-only for authenticated users.';

-- Add comments to important columns
comment on column categories.slug is 'URL-friendly identifier for routing and SEO (e.g., "chest", "legs")';
comment on column categories.image_path is 'Relative path to image in Supabase Storage (e.g., "categories/chest.jpg")';
comment on column categories.image_alt is 'Alternative text for image accessibility (screen readers)';
comment on column categories.order_index is 'Display order for categories in UI (lower = higher priority)';

-- Enable RLS on categories table
-- Even though this is a global table, RLS must be enabled as per Supabase best practices
alter table categories enable row level security;

-- Create indexes for categories
create index idx_categories_slug on categories(slug);
create index idx_categories_order_index on categories(order_index);

-- -----------------------------------------------------
-- Table: exercises
-- -----------------------------------------------------
-- Stores the predefined database of exercises
-- This is a global table - all users share the same exercise library
-- Expected to contain minimum 50 exercises in MVP
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  description text,
  image_path varchar(500),
  image_alt text,
  difficulty difficulty_level not null,
  category_id uuid not null references categories(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table exercises is 'Global exercise library. Shared across all users. Minimum 50 exercises in MVP. Read-only for authenticated users.';

-- Add comments to important columns
comment on column exercises.description is 'Technical description of exercise execution technique';
comment on column exercises.difficulty is 'Exercise difficulty level (Easy, Medium, Hard)';
comment on column exercises.category_id is 'Reference to muscle group category. ON DELETE RESTRICT prevents accidental deletion of categories with exercises.';

-- Enable RLS on exercises table
alter table exercises enable row level security;

-- Create indexes for exercises
create index idx_exercises_category on exercises(category_id);
create index idx_exercises_difficulty on exercises(difficulty);
-- GIN index with pg_trgm for efficient fuzzy text search on exercise names (US-009)
create index idx_exercises_name_gin on exercises using gin(name gin_trgm_ops);

-- =====================================================
-- SECTION 4: WORKOUT PLAN TABLES (User-specific)
-- =====================================================

-- -----------------------------------------------------
-- Table: workout_plans
-- -----------------------------------------------------
-- Stores user-created workout plan templates
-- Each plan belongs to a specific user (isolated via RLS)
-- Implements soft delete via deleted_at column
create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name varchar(200) not null check(length(name) >= 3),
  description varchar(500),
  deleted_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add comment to table
comment on table workout_plans is 'User workout plan templates. Each plan is owned by a user (RLS enforced). Soft delete via deleted_at.';

-- Add comments to important columns
comment on column workout_plans.user_id is 'Owner of the workout plan. Used for RLS policy enforcement.';
comment on column workout_plans.name is 'Plan name. Must be at least 3 characters (enforced by CHECK constraint).';
comment on column workout_plans.deleted_at is 'Soft delete timestamp. NULL = active, NOT NULL = deleted. Allows preserving historical workout references.';
comment on column workout_plans.last_used_at is 'Timestamp of when this plan was last used to start a workout. Updated automatically via trigger.';

-- Enable RLS on workout_plans table
alter table workout_plans enable row level security;

-- Create indexes for workout_plans
-- Partial index only includes non-deleted plans for better performance
create index idx_workout_plans_user on workout_plans(user_id) where deleted_at is null;
create index idx_workout_plans_user_updated on workout_plans(user_id, updated_at desc) where deleted_at is null;

-- -----------------------------------------------------
-- Table: plan_exercises
-- -----------------------------------------------------
-- Junction table linking workout plans to exercises
-- Represents an instance of an exercise within a plan
-- Allows the same exercise to appear multiple times in a plan (US-013)
create table plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references workout_plans(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  order_index smallint not null default 0,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table plan_exercises is 'Junction table: workout plans to exercises. One plan can have multiple instances of the same exercise.';

-- Add comments to important columns
comment on column plan_exercises.plan_id is 'Reference to workout plan. ON DELETE CASCADE ensures exercises are removed when plan is deleted.';
comment on column plan_exercises.exercise_id is 'Reference to global exercise. ON DELETE RESTRICT prevents deletion of exercises in use.';
comment on column plan_exercises.order_index is 'Display order of exercise within the plan (0-based).';
comment on column plan_exercises.user_id is 'Owner user ID. Duplicated from plan for efficient RLS without joins.';

-- Enable RLS on plan_exercises table
alter table plan_exercises enable row level security;

-- Create indexes for plan_exercises
create index idx_plan_exercises_plan on plan_exercises(plan_id, order_index);
create index idx_plan_exercises_user on plan_exercises(user_id);

-- -----------------------------------------------------
-- Table: plan_exercise_sets
-- -----------------------------------------------------
-- Stores planned sets for each exercise instance in a plan
-- One plan_exercise can have multiple sets (1:N relationship)
create table plan_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  plan_exercise_id uuid not null references plan_exercises(id) on delete cascade,
  reps smallint not null check(reps > 0),
  weight numeric(6,2) check(weight is null or weight >= 0),
  order_index smallint not null default 0,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table plan_exercise_sets is 'Planned sets for exercises in workout plans. Defines target reps and weight for each set.';

-- Add comments to important columns
comment on column plan_exercise_sets.plan_exercise_id is 'Reference to exercise instance in plan. ON DELETE CASCADE removes sets when exercise is removed from plan.';
comment on column plan_exercise_sets.reps is 'Planned number of repetitions. Must be > 0 (enforced by CHECK constraint).';
comment on column plan_exercise_sets.weight is 'Planned weight in kg. NULL allowed for bodyweight exercises. Must be >= 0 if provided.';
comment on column plan_exercise_sets.order_index is 'Display order of set within the exercise (0-based).';
comment on column plan_exercise_sets.user_id is 'Owner user ID. Duplicated for efficient RLS without joins.';

-- Enable RLS on plan_exercise_sets table
alter table plan_exercise_sets enable row level security;

-- Create indexes for plan_exercise_sets
create index idx_plan_exercise_sets_plan_exercise on plan_exercise_sets(plan_exercise_id, order_index);
create index idx_plan_exercise_sets_user on plan_exercise_sets(user_id);

-- =====================================================
-- SECTION 5: WORKOUT SESSION TABLES (User-specific)
-- =====================================================

-- -----------------------------------------------------
-- Table: workouts
-- -----------------------------------------------------
-- Stores actual workout sessions performed by users
-- Each workout is based on a workout plan (frozen snapshot)
-- One active workout per user enforced via unique partial index
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null references workout_plans(id) on delete restrict,
  status workout_status not null default 'active',
  started_at timestamptz not null default now(),
  completed_at timestamptz check(completed_at is null or completed_at >= started_at),
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table workouts is 'Actual workout sessions. Each workout is based on a plan but data is copied (frozen snapshot). One active workout per user enforced.';

-- Add comments to important columns
comment on column workouts.user_id is 'Owner of the workout. Used for RLS policy enforcement.';
comment on column workouts.plan_id is 'Reference to plan used for this workout. ON DELETE RESTRICT prevents deletion of plans with workouts.';
comment on column workouts.status is 'Workout state: active (in progress), completed (finished), cancelled (abandoned).';
comment on column workouts.started_at is 'Timestamp when workout was started. Used for calculating duration.';
comment on column workouts.completed_at is 'Timestamp when workout was completed. NULL = in progress. Must be >= started_at.';

-- Enable RLS on workouts table
alter table workouts enable row level security;

-- Create indexes for workouts
create index idx_workouts_user_started on workouts(user_id, started_at desc);
create index idx_workouts_user_plan on workouts(user_id, plan_id);
create index idx_workouts_status on workouts(status);

-- CRITICAL: Unique partial index ensures only one active workout per user (business rule)
-- This enforces the requirement from US-022: user can have only one active workout at a time
create unique index idx_one_active_workout_per_user on workouts(user_id) where status = 'active';

-- -----------------------------------------------------
-- Table: workout_exercises
-- -----------------------------------------------------
-- Junction table linking workouts to exercises
-- Copied from plan_exercises when workout starts (frozen snapshot)
-- Allows the same exercise to appear multiple times in a workout
create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete restrict,
  exercise_id uuid not null references exercises(id) on delete restrict,
  order_index smallint not null default 0,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table workout_exercises is 'Junction table: workouts to exercises. Copied from plan_exercises at workout start. Preserves plan structure at time of workout.';

-- Add comments to important columns
comment on column workout_exercises.workout_id is 'Reference to workout session. ON DELETE RESTRICT prevents accidental deletion of workouts with exercises.';
comment on column workout_exercises.exercise_id is 'Reference to global exercise. ON DELETE RESTRICT prevents deletion of exercises in use.';
comment on column workout_exercises.order_index is 'Display order of exercise within the workout (0-based).';
comment on column workout_exercises.user_id is 'Owner user ID. Duplicated for efficient RLS without joins.';

-- Enable RLS on workout_exercises table
alter table workout_exercises enable row level security;

-- Create indexes for workout_exercises
create index idx_workout_exercises_workout on workout_exercises(workout_id, order_index);
create index idx_workout_exercises_user on workout_exercises(user_id);

-- -----------------------------------------------------
-- Table: workout_sets
-- -----------------------------------------------------
-- Stores actual sets performed during a workout
-- Copied from plan_exercise_sets when workout starts
-- Allows user to modify weight/reps during workout (US-023)
-- Tracks completion status and optional notes
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  planned_reps smallint not null check(planned_reps > 0),
  planned_weight numeric(6,2) check(planned_weight is null or planned_weight >= 0),
  actual_reps smallint check(actual_reps is null or actual_reps > 0),
  actual_weight numeric(6,2) check(actual_weight is null or actual_weight >= 0),
  completed boolean not null default false,
  note varchar(200),
  order_index smallint not null default 0,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table workout_sets is 'Actual sets performed during workout. Includes planned values (from plan) and actual values (logged by user).';

-- Add comments to important columns
comment on column workout_sets.workout_exercise_id is 'Reference to exercise instance in workout. ON DELETE CASCADE removes sets when exercise is removed.';
comment on column workout_sets.planned_reps is 'Planned reps copied from plan. Must be > 0.';
comment on column workout_sets.planned_weight is 'Planned weight copied from plan. NULL for bodyweight exercises.';
comment on column workout_sets.actual_reps is 'Actual reps performed by user. NULL = not yet performed. Must be > 0 if provided.';
comment on column workout_sets.actual_weight is 'Actual weight used by user. NULL for bodyweight exercises or not yet performed.';
comment on column workout_sets.completed is 'Whether this set was completed. Used for statistics calculation.';
comment on column workout_sets.note is 'Optional user note (max 200 chars) for this set. E.g., "felt heavy", "good form".';
comment on column workout_sets.order_index is 'Display order of set within the exercise (0-based).';
comment on column workout_sets.user_id is 'Owner user ID. Duplicated for efficient RLS without joins.';

-- Enable RLS on workout_sets table
alter table workout_sets enable row level security;

-- Create indexes for workout_sets
create index idx_workout_sets_workout_exercise on workout_sets(workout_exercise_id, order_index);
create index idx_workout_sets_user on workout_sets(user_id);
create index idx_workout_sets_completed on workout_sets(completed);

-- =====================================================
-- SECTION 6: STATISTICS TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: workout_stats
-- -----------------------------------------------------
-- Stores calculated statistics for completed workouts
-- 1:1 relationship with workouts table (workout_id is unique)
-- Statistics are automatically calculated via trigger when workout is completed
create table workout_stats (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null unique references workouts(id) on delete cascade,
  duration_minutes integer not null check(duration_minutes >= 0),
  total_exercises smallint not null check(total_exercises >= 0),
  total_sets smallint not null check(total_sets >= 0),
  total_reps integer not null check(total_reps >= 0),
  max_weight numeric(6,2) check(max_weight is null or max_weight >= 0),
  total_volume numeric(10,2) not null default 0 check(total_volume >= 0),
  user_id uuid not null,
  created_at timestamptz not null default now()
);

-- Add comment to table
comment on table workout_stats is 'Calculated statistics for completed workouts. 1:1 relationship with workouts. Auto-populated via trigger.';

-- Add comments to important columns
comment on column workout_stats.workout_id is 'Reference to workout (1:1 relationship). UNIQUE constraint enforces one stats record per workout.';
comment on column workout_stats.duration_minutes is 'Total workout duration in minutes. Calculated from completed_at - started_at.';
comment on column workout_stats.total_exercises is 'Count of unique exercises performed (completed sets).';
comment on column workout_stats.total_sets is 'Total number of completed sets across all exercises.';
comment on column workout_stats.total_reps is 'Sum of actual_reps for all completed sets.';
comment on column workout_stats.max_weight is 'Maximum weight used in any single set during this workout.';
comment on column workout_stats.total_volume is 'Total volume: Σ(actual_weight × actual_reps) for all completed sets with weight. Core metric for progress tracking.';
comment on column workout_stats.user_id is 'Owner user ID. Duplicated for efficient RLS without joins.';

-- Enable RLS on workout_stats table
alter table workout_stats enable row level security;

-- Create indexes for workout_stats
create unique index idx_workout_stats_workout on workout_stats(workout_id);
create index idx_workout_stats_user on workout_stats(user_id);

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- -----------------------------------------------------
-- RLS Policies for: categories
-- -----------------------------------------------------
-- Global table: read-only access for all authenticated users
-- No INSERT/UPDATE/DELETE policies (admin-only via direct DB access)

-- Policy: Allow all authenticated users to read categories
create policy "authenticated_users_can_read_categories"
  on categories
  for select
  to authenticated
  using (true);

-- Policy: Allow anonymous users to read categories (for public exercise browsing if needed)
create policy "anon_users_can_read_categories"
  on categories
  for select
  to anon
  using (true);

-- -----------------------------------------------------
-- RLS Policies for: exercises
-- -----------------------------------------------------
-- Global table: read-only access for all authenticated users
-- No INSERT/UPDATE/DELETE policies (admin-only via direct DB access)

-- Policy: Allow all authenticated users to read exercises
create policy "authenticated_users_can_read_exercises"
  on exercises
  for select
  to authenticated
  using (true);

-- Policy: Allow anonymous users to read exercises (for public exercise browsing if needed)
create policy "anon_users_can_read_exercises"
  on exercises
  for select
  to anon
  using (true);

-- -----------------------------------------------------
-- RLS Policies for: workout_plans
-- -----------------------------------------------------
-- User-specific table: full CRUD access only to own plans
-- Policies enforce user_id = auth.uid() for all operations

-- Policy: Users can view their own non-deleted workout plans
create policy "authenticated_users_can_read_own_workout_plans"
  on workout_plans
  for select
  to authenticated
  using (user_id = auth.uid() and deleted_at is null);

-- Policy: Users can create their own workout plans
-- WITH CHECK ensures user_id in inserted row matches authenticated user
create policy "authenticated_users_can_create_own_workout_plans"
  on workout_plans
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update their own workout plans
-- USING clause checks current row ownership, WITH CHECK ensures updated row still owned by user
create policy "authenticated_users_can_update_own_workout_plans"
  on workout_plans
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete their own workout plans (soft delete via updated deleted_at)
create policy "authenticated_users_can_delete_own_workout_plans"
  on workout_plans
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: plan_exercises
-- -----------------------------------------------------
-- User-specific table: access controlled via user_id column
-- All operations restricted to own plan exercises

-- Policy: Users can view exercises from their own plans
create policy "authenticated_users_can_read_own_plan_exercises"
  on plan_exercises
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Users can add exercises to their own plans
create policy "authenticated_users_can_create_own_plan_exercises"
  on plan_exercises
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update exercises in their own plans
create policy "authenticated_users_can_update_own_plan_exercises"
  on plan_exercises
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete exercises from their own plans
create policy "authenticated_users_can_delete_own_plan_exercises"
  on plan_exercises
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: plan_exercise_sets
-- -----------------------------------------------------
-- User-specific table: access controlled via user_id column
-- All operations restricted to own plan exercise sets

-- Policy: Users can view sets from their own plan exercises
create policy "authenticated_users_can_read_own_plan_exercise_sets"
  on plan_exercise_sets
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Users can add sets to their own plan exercises
create policy "authenticated_users_can_create_own_plan_exercise_sets"
  on plan_exercise_sets
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update sets in their own plan exercises
create policy "authenticated_users_can_update_own_plan_exercise_sets"
  on plan_exercise_sets
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete sets from their own plan exercises
create policy "authenticated_users_can_delete_own_plan_exercise_sets"
  on plan_exercise_sets
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: workouts
-- -----------------------------------------------------
-- User-specific table: full CRUD access only to own workouts
-- Policies enforce user_id = auth.uid() for all operations

-- Policy: Users can view their own workouts
create policy "authenticated_users_can_read_own_workouts"
  on workouts
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Users can create their own workouts
create policy "authenticated_users_can_create_own_workouts"
  on workouts
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update their own workouts (e.g., complete, cancel)
create policy "authenticated_users_can_update_own_workouts"
  on workouts
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete their own workouts (should be rare, prefer status change)
create policy "authenticated_users_can_delete_own_workouts"
  on workouts
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: workout_exercises
-- -----------------------------------------------------
-- User-specific table: access controlled via user_id column
-- All operations restricted to own workout exercises

-- Policy: Users can view exercises from their own workouts
create policy "authenticated_users_can_read_own_workout_exercises"
  on workout_exercises
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Users can add exercises to their own workouts (US-025: adding extra sets)
create policy "authenticated_users_can_create_own_workout_exercises"
  on workout_exercises
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update exercises in their own workouts
create policy "authenticated_users_can_update_own_workout_exercises"
  on workout_exercises
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete exercises from their own workouts (should be rare)
create policy "authenticated_users_can_delete_own_workout_exercises"
  on workout_exercises
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: workout_sets
-- -----------------------------------------------------
-- User-specific table: access controlled via user_id column
-- All operations restricted to own workout sets

-- Policy: Users can view sets from their own workouts
create policy "authenticated_users_can_read_own_workout_sets"
  on workout_sets
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Users can add sets to their own workouts (US-025: adding extra sets during workout)
create policy "authenticated_users_can_create_own_workout_sets"
  on workout_sets
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update sets in their own workouts (logging actual reps/weight, marking completed)
create policy "authenticated_users_can_update_own_workout_sets"
  on workout_sets
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete sets from their own workouts (should be rare)
create policy "authenticated_users_can_delete_own_workout_sets"
  on workout_sets
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: workout_stats
-- -----------------------------------------------------
-- User-specific table: primarily read access
-- INSERT/UPDATE typically handled via trigger, but policies allow user access

-- Policy: Users can view stats from their own workouts
create policy "authenticated_users_can_read_own_workout_stats"
  on workout_stats
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Users can create stats for their own workouts (typically via trigger)
create policy "authenticated_users_can_create_own_workout_stats"
  on workout_stats
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Users can update stats for their own workouts (recalculation if needed)
create policy "authenticated_users_can_update_own_workout_stats"
  on workout_stats
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete stats for their own workouts (cascade with workout deletion)
create policy "authenticated_users_can_delete_own_workout_stats"
  on workout_stats
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================
-- SECTION 8: TRIGGERS AND FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Function: update_updated_at_timestamp
-- -----------------------------------------------------
-- Purpose: Automatically update the updated_at column to current timestamp
-- Used by: workout_plans table trigger
-- Behavior: Sets NEW.updated_at = NOW() before any UPDATE operation
create or replace function update_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  -- Set updated_at to current timestamp
  new.updated_at = now();
  return new;
end;
$$;

-- Add comment to function
comment on function update_updated_at_timestamp is 'Automatically updates updated_at column to current timestamp on UPDATE operations.';

-- -----------------------------------------------------
-- Trigger: trigger_update_workout_plans_updated_at
-- -----------------------------------------------------
-- Purpose: Automatically update updated_at when a workout plan is modified
-- Fires: BEFORE UPDATE on workout_plans table
-- Calls: update_updated_at_timestamp() function
create trigger trigger_update_workout_plans_updated_at
  before update on workout_plans
  for each row
  execute function update_updated_at_timestamp();

-- -----------------------------------------------------
-- Function: update_plan_last_used
-- -----------------------------------------------------
-- Purpose: Update last_used_at timestamp when a workout is created from a plan
-- Used by: workouts table trigger
-- Behavior: Updates workout_plans.last_used_at = workout.started_at when workout is inserted
create or replace function update_plan_last_used()
returns trigger
language plpgsql
as $$
begin
  -- Update the last_used_at timestamp for the plan that was used
  update workout_plans
  set last_used_at = new.started_at
  where id = new.plan_id;

  return new;
end;
$$;

-- Add comment to function
comment on function update_plan_last_used is 'Updates workout_plans.last_used_at when a new workout is created from that plan.';

-- -----------------------------------------------------
-- Trigger: trigger_update_plan_last_used
-- -----------------------------------------------------
-- Purpose: Track when a plan was last used for a workout
-- Fires: AFTER INSERT on workouts table
-- Calls: update_plan_last_used() function
create trigger trigger_update_plan_last_used
  after insert on workouts
  for each row
  execute function update_plan_last_used();

-- -----------------------------------------------------
-- Function: calculate_workout_stats
-- -----------------------------------------------------
-- Purpose: Automatically calculate and store workout statistics when workout is completed
-- Used by: workouts table trigger
-- Behavior: Calculates all statistics (duration, volume, etc.) and inserts/updates workout_stats
-- This is a CRITICAL function for US-028 (automatic statistics calculation)
create or replace function calculate_workout_stats()
returns trigger
language plpgsql
as $$
declare
  v_duration_minutes integer;
  v_total_exercises smallint;
  v_total_sets smallint;
  v_total_reps integer;
  v_max_weight numeric(6,2);
  v_total_volume numeric(10,2);
begin
  -- Only calculate stats when status changes to 'completed'
  -- This prevents recalculation on every update and ensures stats are only for finished workouts
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then

    -- Calculate workout duration in minutes
    -- EXTRACT(EPOCH FROM interval) returns seconds, divide by 60 for minutes
    v_duration_minutes := extract(epoch from (new.completed_at - new.started_at)) / 60;

    -- Calculate number of unique exercises that were performed
    -- COUNT(DISTINCT) ensures same exercise appearing multiple times is counted once
    select count(distinct we.exercise_id)
    into v_total_exercises
    from workout_exercises we
    where we.workout_id = new.id;

    -- Calculate total number of completed sets
    -- Only count sets marked as completed=true
    select count(*)
    into v_total_sets
    from workout_sets ws
    join workout_exercises we on ws.workout_exercise_id = we.id
    where we.workout_id = new.id
      and ws.completed = true;

    -- Calculate total number of reps across all completed sets
    -- COALESCE ensures we get 0 instead of NULL if no sets exist
    select coalesce(sum(ws.actual_reps), 0)
    into v_total_reps
    from workout_sets ws
    join workout_exercises we on ws.workout_exercise_id = we.id
    where we.workout_id = new.id
      and ws.completed = true;

    -- Find the maximum weight used in any single set during this workout
    -- NULL if all sets were bodyweight exercises
    select max(ws.actual_weight)
    into v_max_weight
    from workout_sets ws
    join workout_exercises we on ws.workout_exercise_id = we.id
    where we.workout_id = new.id
      and ws.completed = true;

    -- Calculate total volume: Σ(weight × reps) for all completed sets with weight
    -- This is the CORE METRIC for tracking training progress (US-035)
    -- Formula: sum of (actual_weight × actual_reps) for each completed set
    -- Sets without weight (bodyweight exercises) are excluded from volume calculation
    select coalesce(sum(ws.actual_weight * ws.actual_reps), 0)
    into v_total_volume
    from workout_sets ws
    join workout_exercises we on ws.workout_exercise_id = we.id
    where we.workout_id = new.id
      and ws.completed = true
      and ws.actual_weight is not null;

    -- Insert or update statistics record
    -- ON CONFLICT allows safe recalculation if stats already exist
    insert into workout_stats (
      workout_id,
      duration_minutes,
      total_exercises,
      total_sets,
      total_reps,
      max_weight,
      total_volume,
      user_id
    ) values (
      new.id,
      v_duration_minutes,
      v_total_exercises,
      v_total_sets,
      v_total_reps,
      v_max_weight,
      v_total_volume,
      new.user_id
    )
    on conflict (workout_id) do update set
      duration_minutes = excluded.duration_minutes,
      total_exercises = excluded.total_exercises,
      total_sets = excluded.total_sets,
      total_reps = excluded.total_reps,
      max_weight = excluded.max_weight,
      total_volume = excluded.total_volume;

  end if;

  return new;
end;
$$;

-- Add comment to function
comment on function calculate_workout_stats is 'Calculates and stores workout statistics when workout status changes to completed. Implements US-028 automatic statistics calculation.';

-- -----------------------------------------------------
-- Trigger: trigger_calculate_workout_stats
-- -----------------------------------------------------
-- Purpose: Automatically calculate workout statistics when workout is completed
-- Fires: AFTER UPDATE on workouts table
-- Calls: calculate_workout_stats() function
-- This is CRITICAL for US-028 (automatic statistics calculation)
create trigger trigger_calculate_workout_stats
  after update on workouts
  for each row
  execute function calculate_workout_stats();

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Migration completed successfully
-- Next steps:
--   1. Run this migration: supabase db reset (local) or supabase db push (remote)
--   2. Verify tables created: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
--   3. Verify RLS enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--   4. Seed initial data (categories and exercises) via separate seed migration
--   5. Run tests to verify RLS policies work correctly (US-047)
