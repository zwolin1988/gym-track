# REST API Plan - Gym Track MVP

## 1. Resources

| Resource | Database Table | Access Level | Description |
|----------|---------------|--------------|-------------|
| Categories | `categories` | Read-only | Muscle group categories (global, shared) |
| Exercises | `exercises` | Read-only | Predefined exercise database (minimum 50 exercises) |
| Workout Plans | `workout_plans` | Full CRUD | User's workout plan templates |
| Plan Exercises | `plan_exercises` | Full CRUD | Exercises within a workout plan |
| Plan Exercise Sets | `plan_exercise_sets` | Full CRUD | Planned sets for exercises in a plan |
| Workouts | `workouts` | Full CRUD | User's workout sessions |
| Workout Exercises | `workout_exercises` | Read/Update | Exercises within a workout session |
| Workout Sets | `workout_sets` | Read/Update | Sets performed during a workout |
| Workout Stats | `workout_stats` | Read-only | Calculated workout statistics |

## 2. API Endpoints

### 2.1. Authentication

All endpoints require authentication via Supabase Auth. Authentication is handled by Astro middleware which populates `context.locals.user` with the authenticated user.

**Authentication Flow:**
- User authenticates via Supabase Auth (handled by frontend)
- JWT token is stored in cookies
- Middleware validates token and provides `context.locals.user` and `context.locals.supabase`
- Row Level Security (RLS) automatically filters data by `auth.uid()`

---

### 2.2. Categories

#### GET /api/categories

Retrieve all muscle group categories.

**Query Parameters:**
- None

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Chest",
      "slug": "chest",
      "description": "Chest muscle exercises",
      "image_path": "/storage/categories/chest.jpg",
      "image_alt": "Chest muscle diagram",
      "order_index": 1,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

---

#### GET /api/categories/{id}

Retrieve a single category by ID.

**Path Parameters:**
- `id` (UUID): Category ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Chest",
    "slug": "chest",
    "description": "Chest muscle exercises",
    "image_path": "/storage/categories/chest.jpg",
    "image_alt": "Chest muscle diagram",
    "order_index": 1,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Category does not exist
- `500 Internal Server Error`: Database error

---

### 2.3. Exercises

#### GET /api/exercises

Retrieve exercises with optional filtering, searching, and pagination.

**Query Parameters:**
- `category_id` (UUID, optional): Filter by category ID
- `difficulty` (string[], optional): Filter by difficulty level (`Easy`, `Medium`, `Hard`). Can specify multiple comma-separated values.
- `search` (string, optional): Search by exercise name (case-insensitive, uses GIN index)
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 20, max: 100): Number of results per page

**Request Example:**
```
GET /api/exercises?category_id=uuid&difficulty=Medium,Hard&search=bench&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Barbell Bench Press",
      "description": "Lie on a flat bench...",
      "image_path": "/storage/exercises/bench-press.jpg",
      "image_alt": "Person performing bench press",
      "difficulty": "Medium",
      "category_id": "uuid",
      "category": {
        "id": "uuid",
        "name": "Chest",
        "slug": "chest"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

---

#### GET /api/exercises/{id}

Retrieve a single exercise by ID with full details.

**Path Parameters:**
- `id` (UUID): Exercise ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Barbell Bench Press",
    "description": "Lie on a flat bench and grip the barbell...",
    "image_path": "/storage/exercises/bench-press.jpg",
    "image_alt": "Person performing bench press",
    "difficulty": "Medium",
    "category_id": "uuid",
    "category": {
      "id": "uuid",
      "name": "Chest",
      "slug": "chest",
      "description": "Chest muscle exercises",
      "image_path": "/storage/categories/chest.jpg"
    },
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Exercise does not exist
- `500 Internal Server Error`: Database error

---

### 2.4. Workout Plans

#### GET /api/workout-plans

Retrieve user's workout plans with optional filtering and sorting.

**Query Parameters:**
- `search` (string, optional): Search by plan name
- `sort` (string, optional): Sort field (`created_at`, `updated_at`, `name`). Default: `updated_at`
- `order` (string, optional): Sort order (`asc`, `desc`). Default: `desc`
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 20, max: 100): Results per page

**Request Example:**
```
GET /api/workout-plans?search=push&sort=name&order=asc&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Push Day",
      "description": "Chest, shoulders, and triceps workout",
      "exercise_count": 5,
      "total_sets": 15,
      "last_used_at": "2024-01-20T14:30:00Z",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-18T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "total_pages": 1
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

**Notes:**
- RLS automatically filters plans by `user_id = auth.uid()`
- Soft-deleted plans (`deleted_at IS NOT NULL`) are excluded

---

#### GET /api/workout-plans/{id}

Retrieve a single workout plan with full details including exercises and sets.

**Path Parameters:**
- `id` (UUID): Workout plan ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Push Day",
    "description": "Chest, shoulders, and triceps workout",
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
          "difficulty": "Medium",
          "category": {
            "name": "Chest"
          }
        },
        "sets": [
          {
            "id": "uuid",
            "reps": 10,
            "weight": 80.0,
            "order_index": 0
          },
          {
            "id": "uuid",
            "reps": 8,
            "weight": 90.0,
            "order_index": 1
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- RLS ensures user can only access their own plans
- Includes nested exercises and sets ordered by `order_index`

---

#### POST /api/workout-plans

Create a new workout plan.

**Request Body:**
```json
{
  "name": "Push Day",
  "description": "Chest, shoulders, and triceps workout"
}
```

**Validation Rules:**
- `name`: Required, string, minimum 3 characters
- `description`: Optional, string, maximum 500 characters

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Push Day",
    "description": "Chest, shoulders, and triceps workout",
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-01-20T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name must be at least 3 characters"
      }
    ]
  }
  ```
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

**Notes:**
- `user_id` is automatically set from `context.locals.user.id`
- Plan is created without exercises initially

---

#### PATCH /api/workout-plans/{id}

Update an existing workout plan's name and/or description.

**Path Parameters:**
- `id` (UUID): Workout plan ID

**Request Body:**
```json
{
  "name": "Updated Push Day",
  "description": "Modified description"
}
```

**Validation Rules:**
- `name`: Optional, string, minimum 3 characters if provided
- `description`: Optional, string, maximum 500 characters if provided

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Updated Push Day",
    "description": "Modified description",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-20T11:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- RLS ensures user can only update their own plans
- `updated_at` is automatically updated via trigger
- Changes do not affect historical workouts based on this plan

---

#### DELETE /api/workout-plans/{id}

Delete a workout plan (soft delete).

**Path Parameters:**
- `id` (UUID): Workout plan ID

**Response (204 No Content):**
- Empty response body

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan does not exist or user doesn't own it
- `409 Conflict`: Cannot delete plan with active workout
  ```json
  {
    "error": "Cannot delete plan with active workout",
    "message": "Please complete or cancel the active workout first"
  }
  ```
- `500 Internal Server Error`: Database error

**Notes:**
- Implements soft delete by setting `deleted_at` timestamp
- Prevents deletion if there's an active workout using this plan
- Historical workouts remain unaffected

---

### 2.5. Plan Exercises

#### POST /api/workout-plans/{planId}/exercises

Add an exercise to a workout plan.

**Path Parameters:**
- `planId` (UUID): Workout plan ID

**Request Body:**
```json
{
  "exercise_id": "uuid",
  "order_index": 0
}
```

**Validation Rules:**
- `exercise_id`: Required, UUID, must exist in exercises table
- `order_index`: Optional, number >= 0 (auto-assigned if not provided)

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "exercise_id": "uuid",
    "order_index": 0,
    "exercise": {
      "id": "uuid",
      "name": "Barbell Bench Press",
      "image_path": "/storage/exercises/bench-press.jpg",
      "difficulty": "Medium"
    },
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan or exercise does not exist, or user doesn't own plan
- `500 Internal Server Error`: Database error

**Notes:**
- Same exercise can be added multiple times to a plan
- `user_id` is automatically set from `context.locals.user.id`
- RLS ensures user owns the plan

---

#### PATCH /api/plan-exercises/reorder

Reorder exercises within a workout plan.

**Request Body:**
```json
{
  "plan_id": "uuid",
  "exercises": [
    {
      "id": "uuid",
      "order_index": 0
    },
    {
      "id": "uuid",
      "order_index": 1
    }
  ]
}
```

**Validation Rules:**
- `plan_id`: Required, UUID
- `exercises`: Required, array of objects with `id` and `order_index`

**Response (200 OK):**
```json
{
  "data": {
    "updated_count": 2
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan or exercises do not exist, or user doesn't own plan
- `500 Internal Server Error`: Database error

**Notes:**
- Batch update for better performance
- All exercises must belong to the specified plan

---

#### DELETE /api/plan-exercises/{id}

Remove an exercise from a workout plan.

**Path Parameters:**
- `id` (UUID): Plan exercise ID

**Response (204 No Content):**
- Empty response body

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan exercise does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- Cascades to delete all associated sets (`plan_exercise_sets`)
- RLS ensures user owns the plan exercise

---

### 2.6. Plan Exercise Sets

#### POST /api/plan-exercises/{planExerciseId}/sets

Add a set to an exercise in a workout plan.

**Path Parameters:**
- `planExerciseId` (UUID): Plan exercise ID

**Request Body:**
```json
{
  "reps": 10,
  "weight": 80.0,
  "order_index": 0
}
```

**Validation Rules:**
- `reps`: Required, integer > 0
- `weight`: Optional, number >= 0 if provided
- `order_index`: Optional, number >= 0 (auto-assigned if not provided)

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "plan_exercise_id": "uuid",
    "reps": 10,
    "weight": 80.0,
    "order_index": 0,
    "created_at": "2024-01-20T10:45:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "field": "reps",
        "message": "Reps must be greater than 0"
      }
    ]
  }
  ```
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan exercise does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- `user_id` is automatically set from `context.locals.user.id`
- Weight is optional (e.g., for bodyweight exercises)

---

#### PATCH /api/plan-exercise-sets/{id}

Update a set in a workout plan.

**Path Parameters:**
- `id` (UUID): Plan exercise set ID

**Request Body:**
```json
{
  "reps": 12,
  "weight": 85.0
}
```

**Validation Rules:**
- `reps`: Optional, integer > 0 if provided
- `weight`: Optional, number >= 0 if provided, or null to remove weight

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "plan_exercise_id": "uuid",
    "reps": 12,
    "weight": 85.0,
    "order_index": 0,
    "created_at": "2024-01-20T10:45:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Set does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

---

#### DELETE /api/plan-exercise-sets/{id}

Remove a set from a workout plan.

**Path Parameters:**
- `id` (UUID): Plan exercise set ID

**Response (204 No Content):**
- Empty response body

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Set does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

---

### 2.7. Workouts

#### GET /api/workouts

Retrieve user's workouts with filtering, sorting, and pagination.

**Query Parameters:**
- `status` (string, optional): Filter by status (`active`, `completed`, `cancelled`)
- `plan_id` (UUID, optional): Filter by workout plan ID
- `start_date` (ISO 8601 date, optional): Filter workouts started on or after this date
- `end_date` (ISO 8601 date, optional): Filter workouts started on or before this date
- `sort` (string, optional): Sort field (`started_at`, `completed_at`). Default: `started_at`
- `order` (string, optional): Sort order (`asc`, `desc`). Default: `desc`
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 20, max: 100): Results per page

**Request Example:**
```
GET /api/workouts?status=completed&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=10
```

**Response (200 OK):**
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
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

**Notes:**
- RLS automatically filters workouts by `user_id = auth.uid()`
- Stats are joined from `workout_stats` table

---

#### GET /api/workouts/active

Retrieve the user's currently active workout, if any.

**Query Parameters:**
- None

**Response (200 OK):**
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
            "actual_reps": 10,
            "actual_weight": 80.0,
            "completed": true,
            "note": "Felt strong",
            "order_index": 0
          }
        ]
      }
    ]
  }
}
```

**Response (204 No Content):**
- No active workout exists

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

**Notes:**
- Returns null/204 if no active workout
- Unique constraint ensures only one active workout per user

---

#### GET /api/workouts/{id}

Retrieve a single workout with full details.

**Path Parameters:**
- `id` (UUID): Workout ID

**Response (200 OK):**
```json
{
  "data": {
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
    },
    "exercises": [
      {
        "id": "uuid",
        "exercise_id": "uuid",
        "order_index": 0,
        "exercise": {
          "id": "uuid",
          "name": "Barbell Bench Press",
          "image_path": "/storage/exercises/bench-press.jpg",
          "category": {
            "name": "Chest"
          }
        },
        "sets": [
          {
            "id": "uuid",
            "planned_reps": 10,
            "planned_weight": 80.0,
            "actual_reps": 10,
            "actual_weight": 80.0,
            "completed": true,
            "note": "Felt strong",
            "order_index": 0
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Workout does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- Includes full nested data: exercises, sets, and stats
- RLS ensures user can only access their own workouts

---

#### POST /api/workouts

Start a new workout from a workout plan.

**Request Body:**
```json
{
  "plan_id": "uuid"
}
```

**Validation Rules:**
- `plan_id`: Required, UUID, must exist and belong to user

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "status": "active",
    "started_at": "2024-01-20T14:00:00Z",
    "exercises": [
      {
        "id": "uuid",
        "exercise_id": "uuid",
        "order_index": 0,
        "exercise": {
          "name": "Barbell Bench Press"
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

**Error Responses:**
- `400 Bad Request`: Validation error or plan has no exercises
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Plan does not exist or user doesn't own it
- `409 Conflict`: User already has an active workout
  ```json
  {
    "error": "Active workout already exists",
    "message": "Please complete or cancel the current workout first",
    "active_workout_id": "uuid"
  }
  ```
- `500 Internal Server Error`: Database error

**Business Logic:**
1. Validate user has no active workout (check unique constraint)
2. Create workout record with `status = 'active'`
3. Copy all exercises from `plan_exercises` to `workout_exercises`
4. Copy all sets from `plan_exercise_sets` to `workout_sets` with:
   - `planned_reps` = `reps` from plan
   - `planned_weight` = `weight` from plan
   - `actual_reps` = null
   - `actual_weight` = null
   - `completed` = false
5. Update `workout_plans.last_used_at` via trigger
6. Return created workout with nested data

**Notes:**
- This is an atomic operation (transaction)
- Snapshot approach: plan modifications don't affect this workout

---

#### POST /api/workouts/{id}/complete

Complete an active workout.

**Path Parameters:**
- `id` (UUID): Workout ID

**Request Body:**
- None

**Response (200 OK):**
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

**Error Responses:**
- `400 Bad Request`: Workout is not active (already completed or cancelled)
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Workout does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Business Logic:**
1. Validate workout status is 'active'
2. Set `completed_at` to current timestamp
3. Set `status` to 'completed'
4. Trigger automatically calculates and inserts/updates `workout_stats`:
   - `duration_minutes` = `(completed_at - started_at) / 60`
   - `total_exercises` = count of distinct `exercise_id` in workout
   - `total_sets` = count of sets where `completed = true`
   - `total_reps` = sum of `actual_reps` where `completed = true`
   - `max_weight` = max of `actual_weight` where `completed = true`
   - `total_volume` = sum of `(actual_weight × actual_reps)` where `completed = true` and `actual_weight IS NOT NULL`
5. Return workout with calculated stats

**Notes:**
- Stats calculation is handled by database trigger (`calculate_workout_stats()`)
- Sets not marked as completed are excluded from stats

---

#### PATCH /api/workouts/{id}

Cancel an active workout.

**Path Parameters:**
- `id` (UUID): Workout ID

**Request Body:**
```json
{
  "status": "cancelled"
}
```

**Validation Rules:**
- `status`: Must be "cancelled"

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "started_at": "2024-01-20T14:00:00Z",
    "completed_at": null
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status or workout not active
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Workout does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- Only active workouts can be cancelled
- Cancelled workouts do not have stats calculated

---

### 2.8. Workout Exercises

#### POST /api/workout-exercises/{workoutExerciseId}/sets

Add an additional set to an exercise during a workout.

**Path Parameters:**
- `workoutExerciseId` (UUID): Workout exercise ID

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

**Validation Rules:**
- `planned_reps`: Required, integer > 0
- `planned_weight`: Optional, number >= 0 if provided
- `actual_reps`: Optional, integer > 0 if provided
- `actual_weight`: Optional, number >= 0 if provided
- `completed`: Optional, boolean, default: false
- `note`: Optional, string, max 200 characters
- `order_index`: Optional, number >= 0 (auto-assigned if not provided)

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "workout_exercise_id": "uuid",
    "planned_reps": 10,
    "planned_weight": 80.0,
    "actual_reps": 10,
    "actual_weight": 80.0,
    "completed": true,
    "note": "Extra set, felt good",
    "order_index": 3,
    "created_at": "2024-01-20T15:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or workout not active
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Workout exercise does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- Can only add sets to active workouts
- Additional sets are included in final stats calculation

---

### 2.9. Workout Sets

#### PATCH /api/workout-sets/{id}

Update a set during a workout (log actual performance).

**Path Parameters:**
- `id` (UUID): Workout set ID

**Request Body:**
```json
{
  "actual_reps": 12,
  "actual_weight": 82.5,
  "completed": true,
  "note": "Increased weight slightly"
}
```

**Validation Rules:**
- `actual_reps`: Optional, integer > 0 if provided
- `actual_weight`: Optional, number >= 0 if provided, or null
- `completed`: Optional, boolean
- `note`: Optional, string, max 200 characters, or null to remove

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "workout_exercise_id": "uuid",
    "planned_reps": 10,
    "planned_weight": 80.0,
    "actual_reps": 12,
    "actual_weight": 82.5,
    "completed": true,
    "note": "Increased weight slightly",
    "order_index": 0,
    "created_at": "2024-01-20T14:15:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or workout not active
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Set does not exist or user doesn't own it
- `500 Internal Server Error`: Database error

**Notes:**
- Can only update sets in active workouts
- All fields are optional (partial update)
- Frontend can debounce updates for better UX

---

### 2.10. Workout Stats

#### GET /api/workouts/stats

Get aggregated workout statistics for visualization (e.g., volume chart).

**Query Parameters:**
- `start_date` (ISO 8601 date, optional): Start date for data range
- `end_date` (ISO 8601 date, optional): End date for data range
- `period` (string, optional): Predefined period (`7d`, `4w`, `3m`, `1y`). Default: `4w`
- `plan_id` (UUID, optional): Filter by specific workout plan

**Request Example:**
```
GET /api/workouts/stats?period=4w&plan_id=uuid
```

**Response (200 OK):**
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
      },
      {
        "id": "uuid",
        "date": "2024-01-18",
        "plan_name": "Pull Day",
        "duration_minutes": 85,
        "total_volume": 7800.0,
        "total_sets": 14,
        "total_reps": 112
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

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

**Notes:**
- Only includes completed workouts
- Used for charts and analytics
- Optimized query joining `workouts` and `workout_stats`

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

**Supabase Auth with JWT Tokens:**

- User authentication is handled by Supabase Auth
- JWT tokens are stored in HTTP-only cookies
- Astro middleware validates tokens on every request
- Middleware populates `context.locals.user` and `context.locals.supabase`

**Flow:**
1. User signs up/logs in via Supabase Auth (client-side SDK)
2. Supabase returns JWT access token and refresh token
3. Tokens are stored in cookies by middleware
4. Every API request includes the auth cookie
5. Middleware validates token and provides authenticated Supabase client
6. API routes access user via `context.locals.user`

### 3.2. Row Level Security (RLS)

**Database-Level Authorization:**

All user-owned tables have RLS policies that filter data by `auth.uid()`:

```sql
-- Example policy for workout_plans
CREATE POLICY "Users can view their own workout plans"
  ON workout_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);
```

**Key Benefits:**
- No manual filtering needed in API code
- Security enforced at database level
- Prevents cross-user data access
- Simplifies API implementation

**Protected Tables:**
- `workout_plans`
- `plan_exercises`
- `plan_exercise_sets`
- `workouts`
- `workout_exercises`
- `workout_sets`
- `workout_stats`

**Global Tables (Read-Only for Authenticated Users):**
- `categories`
- `exercises`

### 3.3. Authorization Rules

**API Route Pattern:**

```typescript
// src/pages/api/workout-plans.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  // 1. Check authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  // 2. Use authenticated Supabase client
  const { data, error } = await locals.supabase
    .from('workout_plans')
    .select('*');
    // RLS automatically filters by user_id = auth.uid()

  // 3. Return data
  return new Response(JSON.stringify({ data }), { status: 200 });
};
```

**Important Rules:**
1. Always check `locals.user` exists before processing requests
2. Use `locals.supabase` client (pre-authenticated with user session)
3. Never manually set `user_id` - use `locals.user.id` for INSERT operations
4. Trust RLS policies - no need to filter by `user_id` in queries
5. For INSERT operations: explicitly set `user_id: locals.user.id`

---

## 4. Validation and Business Logic

### 4.1. Input Validation

**Validation Strategy:**

- **Primary:** Zod schemas in API routes for request validation
- **Backup:** Database CHECK constraints for data integrity
- **Client:** UI validation for immediate user feedback (not security)

**Zod Schema Examples:**

```typescript
// Workout plan creation
const createWorkoutPlanSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().max(500, 'Description max 500 characters').optional()
});

// Plan exercise set creation
const createPlanSetSchema = z.object({
  reps: z.number().int().positive('Reps must be greater than 0'),
  weight: z.number().nonnegative('Weight must be 0 or greater').optional().nullable(),
  order_index: z.number().int().nonnegative().optional()
});

// Workout set update
const updateWorkoutSetSchema = z.object({
  actual_reps: z.number().int().positive().optional(),
  actual_weight: z.number().nonnegative().optional().nullable(),
  completed: z.boolean().optional(),
  note: z.string().max(200, 'Note max 200 characters').optional().nullable()
});
```

### 4.2. Validation Rules by Resource

#### Workout Plans
- `name`: Required, min 3 characters, string
- `description`: Optional, max 500 characters, string

#### Plan Exercise Sets
- `reps`: Required, integer > 0
- `weight`: Optional, number >= 0 if provided (can be null for bodyweight exercises)

#### Workout Sets
- `actual_reps`: Optional, integer > 0 if provided
- `actual_weight`: Optional, number >= 0 if provided (can be null)
- `note`: Optional, max 200 characters, string
- `completed`: Boolean

#### Workouts
- `completed_at`: Must be >= `started_at` if provided (database constraint)

### 4.3. Business Logic Implementation

#### BL-1: One Active Workout Per User

**Implementation:**
- Unique partial index in database: `CREATE UNIQUE INDEX idx_one_active_workout_per_user ON workouts(user_id) WHERE status = 'active'`
- API validates before creating workout
- Returns 409 Conflict if active workout exists

**Endpoints Affected:**
- `POST /api/workouts`

---

#### BL-2: Start Workout Copies Plan Data

**Implementation:**
- Atomic transaction when creating workout:
  1. Insert `workouts` record
  2. Copy `plan_exercises` → `workout_exercises`
  3. Copy `plan_exercise_sets` → `workout_sets` with mapped fields
  4. Trigger updates `workout_plans.last_used_at`

**Endpoints Affected:**
- `POST /api/workouts`

**Mapping:**
- `plan_exercise_sets.reps` → `workout_sets.planned_reps`
- `plan_exercise_sets.weight` → `workout_sets.planned_weight`
- Initial `actual_reps`, `actual_weight` = null
- Initial `completed` = false

---

#### BL-3: Plan Modifications Don't Affect Historical Workouts

**Implementation:**
- Snapshot approach: workout data is copied, not referenced
- No foreign key cascade from plan changes to workout data
- Updating/deleting plan exercises/sets doesn't affect workout records

**Endpoints Affected:**
- `PATCH /api/workout-plans/{id}`
- `DELETE /api/plan-exercises/{id}`
- `PATCH /api/plan-exercise-sets/{id}`
- `DELETE /api/plan-exercise-sets/{id}`

---

#### BL-4: Automatic Stats Calculation on Workout Completion

**Implementation:**
- Database trigger `calculate_workout_stats()` fires on `UPDATE workouts`
- Trigger activates when `status` changes to 'completed'
- Calculates and inserts/updates `workout_stats` record

**Calculated Fields:**
- `duration_minutes` = `EXTRACT(EPOCH FROM (completed_at - started_at)) / 60`
- `total_exercises` = `COUNT(DISTINCT exercise_id)` from workout exercises
- `total_sets` = `COUNT(*)` from completed workout sets
- `total_reps` = `SUM(actual_reps)` from completed sets
- `max_weight` = `MAX(actual_weight)` from completed sets
- `total_volume` = `SUM(actual_weight × actual_reps)` from completed sets with weight

**Endpoints Affected:**
- `POST /api/workouts/{id}/complete`

---

#### BL-5: Soft Delete for Workout Plans

**Implementation:**
- `DELETE /api/workout-plans/{id}` sets `deleted_at` timestamp instead of removing record
- All queries filter `WHERE deleted_at IS NULL`
- Preserves referential integrity with historical workouts

**Endpoints Affected:**
- `DELETE /api/workout-plans/{id}`
- `GET /api/workout-plans` (filters out deleted)
- `GET /api/workout-plans/{id}` (returns 404 if deleted)

---

#### BL-6: Prevent Deleting Plan with Active Workout

**Implementation:**
- API checks for active workout using the plan before deletion
- Query: `SELECT id FROM workouts WHERE plan_id = {id} AND status = 'active'`
- Returns 409 Conflict if active workout exists

**Endpoints Affected:**
- `DELETE /api/workout-plans/{id}`

---

#### BL-7: Only Active Workouts Can Be Modified

**Implementation:**
- All workout set update/create endpoints check workout status
- Query: `SELECT status FROM workouts WHERE id = {workout_id}`
- Returns 400 Bad Request if status != 'active'

**Endpoints Affected:**
- `PATCH /api/workout-sets/{id}`
- `POST /api/workout-exercises/{workoutExerciseId}/sets`

---

#### BL-8: Update Plan's last_used_at on Workout Start

**Implementation:**
- Database trigger `update_plan_last_used()` fires on `INSERT workouts`
- Updates `workout_plans.last_used_at` to workout's `started_at`

**Endpoints Affected:**
- `POST /api/workouts`

---

### 4.4. Error Handling Standards

**HTTP Status Codes:**

- `200 OK`: Successful GET, PATCH requests
- `201 Created`: Successful POST requests creating resources
- `204 No Content`: Successful DELETE requests or empty results
- `400 Bad Request`: Validation errors, invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource doesn't exist or user doesn't own it
- `409 Conflict`: Business rule violation (e.g., active workout exists)
- `500 Internal Server Error`: Unexpected server/database errors

**Error Response Format:**

```json
{
  "error": "Error type or summary",
  "message": "User-friendly error message in Polish",
  "details": [
    {
      "field": "field_name",
      "message": "Specific validation error"
    }
  ]
}
```

**Validation Error Example:**

```json
{
  "error": "Validation failed",
  "message": "Dane wejściowe są nieprawidłowe",
  "details": [
    {
      "field": "name",
      "message": "Nazwa musi mieć co najmniej 3 znaki"
    },
    {
      "field": "reps",
      "message": "Liczba powtórzeń musi być większa od 0"
    }
  ]
}
```

**Business Logic Error Example:**

```json
{
  "error": "Active workout already exists",
  "message": "Masz już aktywny trening. Zakończ go przed rozpoczęciem nowego.",
  "active_workout_id": "uuid"
}
```

### 4.5. Rate Limiting and Security

**Considerations for Production:**

- **Rate Limiting:** Not implemented in MVP, but recommended for production
  - Suggestion: 100 requests per minute per user
  - Implement via middleware or API gateway

- **Request Size Limits:**
  - JSON payload max: 1MB
  - Prevent DOS attacks via large payloads

- **CORS:**
  - Configure allowed origins in production
  - MVP: Allow same-origin requests

- **SQL Injection Prevention:**
  - Supabase client uses parameterized queries
  - Zod validates input types

- **XSS Prevention:**
  - Sanitize user input before storing (notes, descriptions)
  - Frontend uses React (auto-escapes by default)

---

## 5. API Versioning

**Current Version:** v1 (implicit)

**URL Structure:**
- Current: `/api/{resource}`
- Future: `/api/v2/{resource}` if breaking changes needed

**Versioning Strategy:**
- No version prefix for v1 (MVP)
- Introduce version prefix only when breaking changes required
- Maintain backward compatibility within major version

---

## 6. Pagination Standards

**Default Pagination:**
- `page`: Default 1
- `limit`: Default 20, Max 100

**Response Format:**
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

**Endpoints with Pagination:**
- `GET /api/exercises`
- `GET /api/workout-plans`
- `GET /api/workouts`

---

## 7. Performance Considerations

### 7.1. Database Indexes

All queries are optimized with appropriate indexes:

- **exercises:** GIN index on `name` for text search
- **workout_plans:** Index on `(user_id, updated_at DESC)` for sorted lists
- **workouts:** Index on `(user_id, started_at DESC)` for history
- **plan_exercises, workout_exercises:** Index on `(parent_id, order_index)` for ordered lists

### 7.2. Query Optimization

- Use `select('specific, fields')` instead of `select('*')` when possible
- Join related data in single query (e.g., exercises with category)
- Limit nested data depth to avoid N+1 queries

### 7.3. Response Time Targets

- **Simple queries** (list, get): < 200ms
- **Complex queries** (nested data): < 500ms
- **Mutations** (create, update): < 300ms
- **Workout start** (transaction): < 1s

---

## 8. Testing Strategy

### 8.1. Unit Tests (Vitest)

**Coverage:**
- Validation schemas (Zod)
- Business logic functions
- Utility functions

### 8.2. Integration Tests (Vitest + Supabase Test Client)

**Coverage:**
- API endpoints with mocked database
- RLS policy enforcement
- Error handling

### 8.3. E2E Tests (Playwright)

**Critical Path (US-046):**
1. Login test user
2. Create workout plan with 2 exercises, 3 sets each
3. Start workout
4. Modify weight/reps for 1 set
5. Mark all sets as completed
6. Complete workout
7. Verify summary:
   - Duration > 0
   - Volume calculated correctly
   - Exercise count = 2
   - Set count = 6

**RLS Test (US-047):**
1. User A creates workout plan
2. User B attempts to read User A's plan
3. Verify: User B receives 404 or empty result
4. Verify: User A can read their own plan

---

## 9. API Documentation

**OpenAPI/Swagger:**
- Generate OpenAPI 3.0 spec from this document (post-MVP)
- Host interactive API docs via Swagger UI

**Developer Resources:**
- This document serves as API specification
- Include example requests/responses for each endpoint
- Maintain up-to-date with code changes

---

## 10. Future Enhancements (Post-MVP)

**Not in scope for MVP but planned:**

1. **Batch Operations:**
   - `PATCH /api/workout-sets/batch` to update multiple sets at once
   - Improves mobile app performance

2. **Advanced Filtering:**
   - `GET /api/exercises?muscle_groups=chest,shoulders` for multi-category filtering
   - Full-text search across exercise names and descriptions

3. **Personal Records (PRs):**
   - `GET /api/exercises/{exerciseId}/pr` to get personal best for an exercise
   - Automatic PR detection and notifications

4. **Workout Templates:**
   - `GET /api/workout-templates` for pre-built workout programs
   - `POST /api/workout-plans/from-template` to create plan from template

5. **Export Data:**
   - `GET /api/export/workouts?format=csv` to export workout history
   - PDF report generation

6. **Social Features:**
   - `POST /api/workout-plans/{id}/share` to share plans with other users
   - `GET /api/community/workout-plans` to browse public plans

7. **Webhooks:**
   - Notify external services on workout completion
   - Integration with fitness tracking apps

---

## 11. Summary

This REST API plan provides comprehensive coverage of the Gym Track MVP requirements:

- ✅ **11 main resources** mapped to database tables
- ✅ **40+ endpoints** covering all user stories (US-001 to US-047)
- ✅ **Supabase Auth** integration with RLS for security
- ✅ **Zod validation** for all inputs
- ✅ **Business logic** implementation details
- ✅ **Error handling** standards with proper HTTP status codes
- ✅ **Pagination** for list endpoints
- ✅ **Performance** considerations with indexed queries
- ✅ **Testing** strategy for quality assurance

The API is designed to be:
- **RESTful:** Following HTTP method conventions and resource-oriented URLs
- **Secure:** Authentication required, RLS enforced, input validated
- **Performant:** Indexed queries, pagination, optimized responses
- **Developer-friendly:** Clear error messages, consistent patterns, well-documented
- **Scalable:** Stateless design, database-level security, separation of concerns

All endpoints align with the PRD requirements and database schema, ensuring seamless integration with the Astro + React frontend and Supabase backend.
