# API Endpoint Implementation Plan: Workouts API

## 1. Endpoint Overview

This implementation plan covers the complete Workouts module - the core functionality for logging workout sessions:

**Workouts:**
1. GET /api/workouts - List user's workouts with filters
2. GET /api/workouts/active - Get currently active workout
3. GET /api/workouts/{id} - Get workout details
4. POST /api/workouts - Start new workout from plan
5. POST /api/workouts/{id}/complete - Complete workout
6. PATCH /api/workouts/{id} - Cancel workout

**Workout Sets:**
7. PATCH /api/workout-sets/{id} - Update set during workout

**Workout Exercises:**
8. POST /api/workout-exercises/{workoutExerciseId}/sets - Add extra set

**Workout Stats:**
9. GET /api/workouts/stats - Get aggregated statistics

**Key Characteristics:**
- **Critical business logic:** One active workout per user
- **Snapshot approach:** Copy plan data (immutable)
- **Automatic stats calculation:** Duration, volume, reps, etc.
- **Real-time logging:** Update sets during workout
- **Historical tracking:** Complete workout history

## 2. Core Business Logic

### BL-1: One Active Workout Per User
- Enforce via database unique constraint
- Check before creating workout
- Return 409 Conflict with active_workout_id

### BL-2: Start Workout Copies Plan Data
**Atomic transaction:**
1. Create workout record (status: active)
2. Copy plan_exercises → workout_exercises
3. Copy plan_exercise_sets → workout_sets
   - `reps` → `planned_reps`
   - `weight` → `planned_weight`
   - `actual_reps` = null
   - `actual_weight` = null
   - `completed` = false
4. Update plan.last_used_at (trigger)

### BL-3: Plan Modifications Don't Affect Workouts
- Snapshot approach: data is copied, not referenced
- No foreign key cascade from plans to workouts
- Historical workouts remain unchanged

### BL-4: Automatic Stats Calculation
**On workout completion:**
- Duration: `(completed_at - started_at) / 60` minutes
- Total exercises: COUNT(DISTINCT exercise_id)
- Total sets: COUNT(completed sets)
- Total reps: SUM(actual_reps)
- Max weight: MAX(actual_weight)
- Total volume: SUM(actual_weight × actual_reps)

### BL-5: Only Active Workouts Can Be Modified
- Validate workout.status = 'active' before:
  - Updating sets
  - Adding sets
  - Completing
  - Cancelling

## 3. Request Details

### POST /api/workouts (Start Workout)

**Request Body:**
```json
{
  "plan_id": "uuid"
}
```

**Validation:**
- `plan_id`: Required, UUID, must exist and belong to user

**Business Logic Checks:**
1. User has no active workout
2. Plan exists and belongs to user
3. Plan is not deleted

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "plan_name": "Push Day",
    "status": "active",
    "started_at": "2024-01-20T14:00:00Z",
    "exercises": [
      {
        "id": "uuid",
        "exercise_id": "uuid",
        "order_index": 0,
        "exercise": {
          "name": "Barbell Bench Press",
          "image_path": "/storage/exercises/bench-press.jpg"
        },
        "sets": [
          {
            "id": "uuid",
            "planned_reps": 10,
            "planned_weight": 80.0,
            "actual_reps": null,
            "actual_weight": null,
            "completed": false,
            "order_index": 0
          }
        ]
      }
    ]
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "error": "Active workout already exists",
  "message": "Please complete or cancel the current workout first",
  "active_workout_id": "uuid"
}
```

### POST /api/workouts/{id}/complete

**Request Body:** None

**Business Logic:**
1. Validate workout.status = 'active'
2. Set completed_at = NOW()
3. Set status = 'completed'
4. Calculate and insert workout_stats

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "started_at": "2024-01-20T14:00:00Z",
    "completed_at": "2024-01-20T15:30:00Z",
    "stats": {
      "duration_minutes": 90,
      "total_exercises": 5,
      "total_sets": 15,
      "total_reps": 120,
      "max_weight": 100.0,
      "total_volume": 8500.0
    }
  }
}
```

### PATCH /api/workout-sets/{id}

**Request Body:**
```json
{
  "actual_reps": 12,
  "actual_weight": 82.5,
  "completed": true,
  "note": "Felt strong today"
}
```

**Validation:**
- `actual_reps`: Optional, integer > 0
- `actual_weight`: Optional, number ≥ 0
- `completed`: Optional, boolean
- `note`: Optional, max 200 characters

**Business Logic:**
- Verify workout is active
- Verify set belongs to user

### POST /api/workout-exercises/{workoutExerciseId}/sets

**Request Body:**
```json
{
  "planned_reps": 10,
  "planned_weight": 80.0,
  "actual_reps": 10,
  "actual_weight": 80.0,
  "completed": true,
  "note": "Extra set, felt good",
  "order_index": 3
}
```

**Use Case:** Adding extra sets during workout beyond the plan

### GET /api/workouts (List)

**Query Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `status` | enum | No | - |
| `plan_id` | UUID | No | - |
| `start_date` | ISO 8601 | No | - |
| `end_date` | ISO 8601 | No | - |
| `sort` | enum | No | started_at |
| `order` | enum | No | desc |
| `page` | number | No | 1 |
| `limit` | number | No | 20 |

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "plan_id": "uuid",
      "plan_name": "Push Day",
      "status": "completed",
      "started_at": "2024-01-20T14:00:00Z",
      "completed_at": "2024-01-20T15:30:00Z",
      "stats": {
        "duration_minutes": 90,
        "total_exercises": 5,
        "total_sets": 15,
        "total_reps": 120,
        "max_weight": 100.0,
        "total_volume": 8500.0
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

### GET /api/workouts/active

**Response:**
- **200 OK** with workout data if active workout exists
- **204 No Content** if no active workout

### GET /api/workouts/stats

**Query Parameters:**

| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `period` | enum | 4w | 7d, 4w, 3m, 1y |
| `start_date` | ISO 8601 | - | Custom start |
| `end_date` | ISO 8601 | - | Custom end |
| `plan_id` | UUID | - | Filter by plan |

**Success Response (200 OK):**
```json
{
  "data": {
    "period": "4w",
    "start_date": "2023-12-21",
    "end_date": "2024-01-20",
    "workouts": [
      {
        "id": "uuid",
        "date": "2024-01-15",
        "plan_name": "Push Day",
        "duration_minutes": 90,
        "total_volume": 8500.0,
        "total_sets": 15,
        "total_reps": 120
      }
    ],
    "summary": {
      "total_workouts": 8,
      "total_volume": 65000.0,
      "avg_duration_minutes": 87,
      "avg_volume_per_workout": 8125.0
    }
  }
}
```

## 4. Data Flow

### Start Workout Flow

```
1. Client: POST /api/workouts { plan_id }
   ↓
2. Middleware: Validate auth
   ↓
3. Route: Validate request body
   ↓
4. Service: workoutsService.createWorkout()
   ↓
   a. Check for active workout
      - Query: workouts WHERE user_id AND status='active'
      - If exists: throw ACTIVE_WORKOUT_EXISTS error
   ↓
   b. Verify plan exists
      - Query: workout_plans WHERE id AND user_id
      - If not found: throw Plan not found
   ↓
   c. Create workout record
      - INSERT workouts (plan_id, user_id, status='active', started_at)
   ↓
   d. Copy plan exercises
      - Query: plan_exercises WHERE plan_id
      - INSERT workout_exercises (workout_id, exercise_id, order_index, user_id)
   ↓
   e. For each exercise, copy sets
      - Query: plan_exercise_sets WHERE plan_exercise_id
      - INSERT workout_sets (
          workout_exercise_id,
          planned_reps = plan_set.reps,
          planned_weight = plan_set.weight,
          actual_reps = null,
          actual_weight = null,
          completed = false,
          user_id
        )
   ↓
   f. Fetch created workout with nested data
   ↓
5. Route: Return 201 with workout data
   ↓
6. Client: Receives active workout
```

### Complete Workout Flow

```
1. Client: POST /api/workouts/{id}/complete
   ↓
2. Service: workoutsService.completeWorkout()
   ↓
   a. Get workout
      - Verify status = 'active'
      - If not: throw "Workout is not active"
   ↓
   b. Update workout
      - UPDATE workouts SET
          status = 'completed',
          completed_at = NOW()
        WHERE id AND user_id
   ↓
   c. Calculate stats
      - Get all completed sets
      - Calculate:
        * duration = (completed_at - started_at) / 60
        * total_exercises = COUNT(DISTINCT exercise_id)
        * total_sets = COUNT(sets WHERE completed=true)
        * total_reps = SUM(actual_reps WHERE completed=true)
        * max_weight = MAX(actual_weight WHERE completed=true)
        * total_volume = SUM(actual_weight * actual_reps WHERE completed=true)
   ↓
   d. Insert workout_stats
      - UPSERT workout_stats (workout_id, user_id, ...)
   ↓
   e. Fetch workout with stats
   ↓
3. Route: Return 200 with completed workout + stats
```

### Update Set During Workout Flow

```
1. Client: PATCH /api/workout-sets/{id}
   { actual_reps: 12, actual_weight: 82.5, completed: true }
   ↓
2. Service: workoutsService.updateWorkoutSet()
   ↓
   a. Verify set belongs to user
      - JOIN workout_sets
        → workout_exercises
        → workouts
   ↓
   b. Verify workout is active
      - Check workouts.status = 'active'
      - If not: throw "Workout is not active"
   ↓
   c. Update set
      - UPDATE workout_sets SET
          actual_reps,
          actual_weight,
          completed,
          note
        WHERE id AND user_id
   ↓
3. Route: Return 200 with updated set
```

## 5. Database Schema Integration

### Tables Used

**workouts:**
- `id` (PK)
- `plan_id` (FK → workout_plans)
- `user_id` (FK → auth.users)
- `status` (enum: active, completed, cancelled)
- `started_at` (timestamp)
- `completed_at` (timestamp, nullable)

**workout_exercises:**
- `id` (PK)
- `workout_id` (FK → workouts, CASCADE)
- `exercise_id` (FK → exercises)
- `order_index` (int)
- `user_id` (FK → auth.users)

**workout_sets:**
- `id` (PK)
- `workout_exercise_id` (FK → workout_exercises, CASCADE)
- `planned_reps` (int)
- `planned_weight` (decimal, nullable)
- `actual_reps` (int, nullable)
- `actual_weight` (decimal, nullable)
- `completed` (boolean, default false)
- `note` (text, nullable, max 200 chars)
- `order_index` (int)
- `user_id` (FK → auth.users)

**workout_stats:**
- `id` (PK)
- `workout_id` (FK → workouts, UNIQUE)
- `user_id` (FK → auth.users)
- `duration_minutes` (int)
- `total_exercises` (int)
- `total_sets` (int)
- `total_reps` (int)
- `max_weight` (decimal)
- `total_volume` (decimal)

### Constraints

**Unique Constraint:**
```sql
CREATE UNIQUE INDEX idx_one_active_workout_per_user
ON workouts(user_id)
WHERE status = 'active';
```

**Check Constraints:**
```sql
ALTER TABLE workout_sets
ADD CONSTRAINT check_actual_reps_positive
CHECK (actual_reps IS NULL OR actual_reps > 0);

ALTER TABLE workout_sets
ADD CONSTRAINT check_actual_weight_nonnegative
CHECK (actual_weight IS NULL OR actual_weight >= 0);
```

## 6. Security Considerations

### Row Level Security

All workout tables enforce `user_id = auth.uid()`:

```sql
-- workouts
CREATE POLICY "Users can view their own workouts"
ON workouts FOR SELECT
USING (user_id = auth.uid());

-- workout_exercises
CREATE POLICY "Users can view their own workout exercises"
ON workout_exercises FOR SELECT
USING (user_id = auth.uid());

-- workout_sets
CREATE POLICY "Users can update their own workout sets"
ON workout_sets FOR UPDATE
USING (user_id = auth.uid());
```

### Business Logic Security

1. **Always verify workout belongs to user** before operations
2. **Validate workout status** before modifications
3. **Auto-assign user_id** - never trust client
4. **Check active workout** before creating new one

## 7. Performance Considerations

### Database Optimization

**Indexes:**
- `idx_workouts_user_status` on `(user_id, status)` - active workout check
- `idx_workouts_user_started` on `(user_id, started_at DESC)` - workout history
- `idx_workout_exercises_workout` on `(workout_id, order_index)` - ordered exercises
- `idx_workout_sets_exercise` on `(workout_exercise_id, order_index)` - ordered sets

**Query Optimization:**
- Use `.select()` with specific fields
- Join exercises and categories in single query
- Fetch sets in nested loop (acceptable for workout size)

### Response Time Targets
- Start workout: < 1s (transaction with multiple inserts)
- Complete workout: < 1s (stats calculation)
- Update set: < 300ms (single update)
- Get active workout: < 500ms (nested data)
- List workouts: < 200ms (with stats join)
- Get stats: < 500ms (aggregation)

### Caching Considerations (Future)
- Cache active workout for user (Redis)
- Invalidate on workout completion
- Cache workout history per user (short TTL)

## 8. Implementation Steps

### ✅ Step 1: Create Validation Schemas
**File:** `src/lib/validation/workouts.schema.ts` - COMPLETED

Created 9 Zod schemas covering all operations.

### ✅ Step 2: Create Workouts Service
**File:** `src/lib/services/workouts.service.ts` - COMPLETED

Implemented 10 methods:
- `getWorkouts()` - List with filters, sorting, pagination
- `getActiveWorkout()` - Get user's active workout
- `getWorkoutById()` - Details with nested data and stats
- `createWorkout()` - Start workout (copy from plan)
- `completeWorkout()` - Complete and calculate stats
- `cancelWorkout()` - Cancel active workout
- `addSetToWorkoutExercise()` - Add extra set
- `updateWorkoutSet()` - Update set during workout
- `getWorkoutStats()` - Aggregated statistics
- `calculateWorkoutStats()` - Helper for stats calculation

### ✅ Step 3: Create API Routes

**Files created:**
- `src/pages/api/workouts/index.ts` - GET (list), POST (create)
- `src/pages/api/workouts/active.ts` - GET (active)
- `src/pages/api/workouts/[id].ts` - GET (details), PATCH (cancel)
- `src/pages/api/workouts/[id]/complete.ts` - POST (complete)
- `src/pages/api/workouts/stats.ts` - GET (statistics)
- `src/pages/api/workout-sets/[id].ts` - PATCH (update set)
- `src/pages/api/workout-exercises/[workoutExerciseId]/sets.ts` - POST (add set)

### Step 4: Manual Testing Checklist

**Critical Path (US-046):**
1. [ ] Login test user
2. [ ] Create workout plan with 2 exercises, 3 sets each
3. [ ] Start workout
4. [ ] Modify weight/reps for 1 set
5. [ ] Mark all sets as completed
6. [ ] Complete workout
7. [ ] Verify summary:
   - Duration > 0
   - Volume calculated correctly
   - Exercise count = 2
   - Set count = 6

**Business Logic Tests:**
1. [ ] Cannot start workout if active exists (409)
2. [ ] Cannot update set in completed workout
3. [ ] Stats calculated correctly on completion
4. [ ] Cancelled workouts don't have stats
5. [ ] Active workout returned by /active endpoint
6. [ ] No active workout returns 204

**Performance Tests:**
1. [ ] Start workout < 1s
2. [ ] Complete workout < 1s
3. [ ] Update set < 300ms
4. [ ] Get active < 500ms

---

**Implementation Status:** ✅ COMPLETED

**Related User Stories:**
- US-022 to US-030 (Logowanie treningu)
- US-031 to US-036 (Historia i statystyki)
- US-046 (Test krytycznej ścieżki)

**Dependencies:**
- ✅ Database schema deployed
- ✅ RLS policies enabled
- ✅ Unique constraint on active workout
- ✅ Workout Plans API implemented
- ⏳ Database triggers (optional, manual calculation implemented)

**Estimated Implementation Time:** 8-10 hours
**Actual Implementation Time:** ~5 hours

**Critical for MVP:** ⭐⭐⭐ HIGH PRIORITY - Core functionality
