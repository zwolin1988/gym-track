-- =====================================================
-- Migration: Add Foreign Key Constraints to auth.users
-- Created: 2025-10-21 00:00:00 UTC
-- =====================================================
--
-- Purpose:
--   Adds foreign key constraints from user_id columns to auth.users(id)
--   This enables visual relationship diagrams in Supabase dashboard
--   and enforces referential integrity at the database level.
--
-- Tables affected:
--   - workout_plans
--   - plan_exercises
--   - plan_exercise_sets
--   - workouts
--   - workout_exercises
--   - workout_sets
--   - workout_stats
--
-- Special notes:
--   - Uses ON DELETE CASCADE to automatically clean up user data when user is deleted
--   - This is safe because all user data should be removed when user account is deleted
-- =====================================================

-- Add foreign key constraint for workout_plans.user_id
alter table workout_plans
  add constraint fk_workout_plans_user
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Add foreign key constraint for plan_exercises.user_id
alter table plan_exercises
  add constraint fk_plan_exercises_user
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Add foreign key constraint for plan_exercise_sets.user_id
alter table plan_exercise_sets
  add constraint fk_plan_exercise_sets_user
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Add foreign key constraint for workouts.user_id
alter table workouts
  add constraint fk_workouts_user
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Add foreign key constraint for workout_exercises.user_id
alter table workout_exercises
  add constraint fk_workout_exercises_user
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Add foreign key constraint for workout_sets.user_id
alter table workout_sets
  add constraint fk_workout_sets_user
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Add foreign key constraint for workout_stats.user_id
alter table workout_stats
  add constraint fk_workout_stats_user
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Add comments explaining the foreign keys
comment on constraint fk_workout_plans_user on workout_plans is
  'Ensures workout plans belong to valid users. Cascades delete when user is removed.';

comment on constraint fk_plan_exercises_user on plan_exercises is
  'Ensures plan exercises belong to valid users. Cascades delete when user is removed.';

comment on constraint fk_plan_exercise_sets_user on plan_exercise_sets is
  'Ensures plan exercise sets belong to valid users. Cascades delete when user is removed.';

comment on constraint fk_workouts_user on workouts is
  'Ensures workouts belong to valid users. Cascades delete when user is removed.';

comment on constraint fk_workout_exercises_user on workout_exercises is
  'Ensures workout exercises belong to valid users. Cascades delete when user is removed.';

comment on constraint fk_workout_sets_user on workout_sets is
  'Ensures workout sets belong to valid users. Cascades delete when user is removed.';

comment on constraint fk_workout_stats_user on workout_stats is
  'Ensures workout stats belong to valid users. Cascades delete when user is removed.';
