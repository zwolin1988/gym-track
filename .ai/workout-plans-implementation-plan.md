# API Endpoint Implementation Plan: Workout Plans API

## 1. Endpoint Overview

This implementation plan covers the complete CRUD API for workout plans, plan exercises, and plan exercise sets:

**Workout Plans:**
1. GET /api/workout-plans - List user's workout plans
2. POST /api/workout-plans - Create new plan
3. GET /api/workout-plans/{id} - Get plan details
4. PATCH /api/workout-plans/{id} - Update plan
5. DELETE /api/workout-plans/{id} - Delete plan (soft delete)

**Plan Exercises:**
6. POST /api/workout-plans/{planId}/exercises - Add exercise to plan
7. PATCH /api/plan-exercises/reorder - Reorder exercises
8. DELETE /api/plan-exercises/{id} - Remove exercise from plan

**Plan Exercise Sets:**
9. POST /api/plan-exercises/{planExerciseId}/sets - Add set to exercise
10. PATCH /api/plan-exercise-sets/{id} - Update set
11. DELETE /api/plan-exercise-sets/{id} - Delete set

**Key Characteristics:**
- Full CRUD operations for user's workout plans
- Row Level Security enforced (user owns plans)
- Supports nested data (exercises with sets)
- Soft delete for plans (preserves historical workouts)
- Business logic: prevent deletion if active workout exists

## 2. Request Details

### GET /api/workout-plans (List)

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `search` | string | No | - | Min 1 char |
| `sort` | string | No | updated_at | Enum: created_at, updated_at, name |
| `order` | string | No | desc | Enum: asc, desc |
| `page` | number | No | 1 | Integer ≥ 1 |
| `limit` | number | No | 20 | Integer ≥ 1, ≤ 100 |

### POST /api/workout-plans (Create)

**Request Body:**
```json
{
  "name": "Push Day",
  "description": "Chest, shoulders, and triceps workout"
}
```

**Validation:**
- `name`: Required, min 3 characters
- `description`: Optional, max 500 characters

### GET /api/workout-plans/{id} (Detail)

Returns plan with nested exercises and sets.

### PATCH /api/workout-plans/{id} (Update)

**Request Body:**
```json
{
  "name": "Updated Push Day",
  "description": "Modified description"
}
```

**Validation:**
- `name`: Optional, min 3 characters if provided
- `description`: Optional, max 500 characters if provided

### DELETE /api/workout-plans/{id} (Soft Delete)

**Business Logic:**
- Check for active workout using this plan
- If exists, return 409 Conflict
- Otherwise, set `deleted_at` timestamp

### POST /api/workout-plans/{planId}/exercises

**Request Body:**
```json
{
  "exercise_id": "uuid",
  "order_index": 0
}
```

**Validation:**
- `exercise_id`: Required, valid UUID
- `order_index`: Optional, auto-assigned if not provided

### PATCH /api/plan-exercises/reorder

**Request Body:**
```json
{
  "plan_id": "uuid",
  "exercises": [
    { "id": "uuid", "order_index": 0 },
    { "id": "uuid", "order_index": 1 }
  ]
}
```

### POST /api/plan-exercises/{planExerciseId}/sets

**Request Body:**
```json
{
  "reps": 10,
  "weight": 80.0,
  "order_index": 0
}
```

**Validation:**
- `reps`: Required, integer > 0
- `weight`: Optional, number ≥ 0
- `order_index`: Optional, auto-assigned

### PATCH /api/plan-exercise-sets/{id}

**Request Body:**
```json
{
  "reps": 12,
  "weight": 85.0
}
```

## 3. Used Types

From `src/types.ts`:

```typescript
import type {
  WorkoutPlanListItemDTO,
  WorkoutPlanDetailDTO,
  WorkoutPlansPaginatedResponseDTO,
  CreateWorkoutPlanCommand,
  UpdateWorkoutPlanCommand,
  PlanExerciseDTO,
  CreatePlanExerciseCommand,
  ReorderPlanExercisesCommand,
  CreatePlanExerciseSetCommand,
  UpdatePlanExerciseSetCommand,
  PaginationMetadataDTO
} from '@/types';
```

## 4. Response Details

### GET /api/workout-plans (List)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Push Day",
      "description": "Chest, shoulders, and triceps",
      "exercise_count": 5,
      "total_sets": 15,
      "last_used_at": "2024-01-20T14:30:00Z",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-18T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "total_pages": 1
  }
}
```

### GET /api/workout-plans/{id} (Detail)

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Push Day",
    "description": "...",
    "last_used_at": "2024-01-20T14:30:00Z",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-18T11:00:00Z",
    "exercises": [
      {
        "id": "uuid",
        "exercise_id": "uuid",
        "order_index": 0,
        "exercise": {
          "id": "uuid",
          "name": "Barbell Bench Press",
          "image_path": "/storage/exercises/bench-press.jpg",
          "difficulty": "medium",
          "category": { "name": "Chest" }
        },
        "sets": [
          {
            "id": "uuid",
            "reps": 10,
            "weight": 80.0,
            "order_index": 0
          }
        ]
      }
    ]
  }
}
```

### POST /api/workout-plans (Create)

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Push Day",
    "description": "...",
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-01-20T10:00:00Z"
  }
}
```

### DELETE /api/workout-plans/{id}

**Success Response:** 204 No Content

**Error Response (409 Conflict):**
```json
{
  "error": "Conflict",
  "message": "Cannot delete plan with active workout"
}
```

## 5. Data Flow

### Create Workout Plan Flow

```
1. Client POST request
   ↓
2. Middleware validates auth
   ↓
3. Route handler validates request body (Zod)
   ↓
4. WorkoutPlansService.createWorkoutPlan()
   - Insert workout_plan record
   - Set user_id from locals.user.id
   - Return created plan
   ↓
5. Return 201 with plan data
```

### Get Plan Details Flow

```
1. Client GET request
   ↓
2. Middleware validates auth
   ↓
3. Route handler validates UUID
   ↓
4. WorkoutPlansService.getWorkoutPlanById()
   - Query workout_plans with RLS filter
   - Join plan_exercises with exercises
   - For each exercise, fetch sets
   - Transform to WorkoutPlanDetailDTO
   ↓
5. Return 200 with nested data
```

### Delete Plan Flow

```
1. Client DELETE request
   ↓
2. Middleware validates auth
   ↓
3. WorkoutPlansService.deleteWorkoutPlan()
   - Check for active workout
   - If exists, throw error
   - Otherwise, set deleted_at
   ↓
4. Return 204 or 409
```

## 6. Security Considerations

### Row Level Security
- All tables enforce `user_id = auth.uid()`
- Policies:
  - workout_plans: SELECT, INSERT, UPDATE, DELETE where user_id matches
  - plan_exercises: same
  - plan_exercise_sets: same

### Business Logic
- **Prevent deletion with active workout**
- **Auto-assign user_id** - Never trust client input
- **Soft delete** - Preserves referential integrity
- **Modifications don't affect historical workouts**

## 7. Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| User not authenticated | 401 | Unauthorized |
| Invalid input | 400 | Validation failed |
| Plan not found | 404 | Not found |
| Active workout exists | 409 | Conflict |
| Database error | 500 | Internal server error |

## 8. Performance Considerations

### Database Optimization
- **Indexes:**
  - `(user_id, updated_at DESC)` for sorted lists
  - `(user_id, deleted_at)` for filtering deleted
  - Foreign keys indexed automatically

### Query Optimization
- Use `.select()` with specific fields
- Join exercises and categories in single query
- Fetch sets in nested loop (acceptable for MVP)
- Consider batch loading for large plans (future)

### Response Time Targets
- List query: < 200ms
- Detail query: < 500ms (nested data)
- Mutations: < 300ms

## 9. Implementation Steps

### ✅ Step 1: Create Validation Schemas
**File:** `src/lib/validation/workout-plans.schema.ts` - COMPLETED

Created 10 Zod schemas for all operations.

### ✅ Step 2: Create Workout Plans Service
**File:** `src/lib/services/workout-plans.service.ts` - COMPLETED

Implemented 11 methods:
- getWorkoutPlans() - List with filters, sorting, pagination
- getWorkoutPlanById() - Details with nested data
- createWorkoutPlan() - Create new plan
- updateWorkoutPlan() - Update name/description
- deleteWorkoutPlan() - Soft delete with validation
- addExerciseToPlan() - Add exercise
- reorderPlanExercises() - Batch update order
- removeExerciseFromPlan() - Remove exercise
- addSetToPlanExercise() - Add set
- updatePlanExerciseSet() - Update set
- deletePlanExerciseSet() - Delete set

### ✅ Step 3: Create API Routes
**Files created:**
- `src/pages/api/workout-plans/index.ts` - GET, POST
- `src/pages/api/workout-plans/[id].ts` - GET, PATCH, DELETE
- `src/pages/api/workout-plans/[planId]/exercises.ts` - POST
- `src/pages/api/plan-exercises/reorder.ts` - PATCH
- `src/pages/api/plan-exercises/[id].ts` - DELETE
- `src/pages/api/plan-exercises/[planExerciseId]/sets.ts` - POST
- `src/pages/api/plan-exercise-sets/[id].ts` - PATCH, DELETE

### Step 4: Manual Testing Checklist

1. **Workout Plans CRUD:**
   - [ ] Create plan with valid data
   - [ ] Create plan with invalid data (validation)
   - [ ] List plans with pagination
   - [ ] List plans with search
   - [ ] Get plan details with nested data
   - [ ] Update plan name/description
   - [ ] Delete plan (soft delete)
   - [ ] Prevent deletion with active workout

2. **Plan Exercises:**
   - [ ] Add exercise to plan
   - [ ] Add same exercise multiple times
   - [ ] Reorder exercises
   - [ ] Remove exercise from plan

3. **Plan Exercise Sets:**
   - [ ] Add set to exercise
   - [ ] Update set reps/weight
   - [ ] Delete set

4. **Security:**
   - [ ] User can only see own plans
   - [ ] User cannot access other user's plans
   - [ ] RLS policies enforced

---

**Implementation Status:** ✅ COMPLETED

**Related User Stories:**
- US-012 to US-021 (Zarządzanie planami treningowymi)

**Dependencies:**
- ✅ Database schema deployed
- ✅ RLS policies enabled
- ✅ Supabase Auth middleware configured
- ✅ Types defined

**Estimated Implementation Time:** 6-8 hours
**Actual Implementation Time:** ~4 hours
