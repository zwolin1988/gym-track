# API Endpoint Implementation Plan: GET /api/exercises

## 1. Endpoint Overview

This implementation plan covers two related endpoints for the exercises resource:

1. **GET /api/exercises** - Retrieve a paginated, filterable list of exercises
2. **GET /api/exercises/{id}** - Retrieve a single exercise by ID

The exercises resource represents the predefined database of workout exercises (minimum 50 in MVP) that are globally available to all authenticated users. These endpoints provide read-only access with advanced filtering, searching, and pagination capabilities.

**Key Characteristics:**
- Read-only access (exercises are global, shared data)
- Authentication required (RLS policy: all authenticated users can read)
- Supports filtering by category and difficulty level
- Full-text search by exercise name (uses PostgreSQL GIN index)
- Pagination with configurable limits
- Returns nested category information (minimal for list, full for detail)

## 2. Request Details

### GET /api/exercises (List)

- **HTTP Method:** GET
- **URL Structure:** `/api/exercises`
- **Authentication:** Required (JWT via Supabase Auth)

**Query Parameters:**

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| `category_id` | UUID | No | - | Valid UUID format | Filter exercises by category |
| `difficulty` | string[] | No | - | Comma-separated enum values: `easy`, `medium`, `hard` | Filter by difficulty level(s) |
| `search` | string | No | - | Min length: 1 | Case-insensitive search in exercise name |
| `page` | number | No | 1 | Integer ≥ 1 | Page number for pagination |
| `limit` | number | No | 20 | Integer ≥ 1, ≤ 100 | Results per page |

**Request Example:**
```http
GET /api/exercises?category_id=123e4567-e89b-12d3-a456-426614174000&difficulty=medium,hard&search=bench&page=1&limit=20
Authorization: Bearer {jwt_token}
```

### GET /api/exercises/{id} (Detail)

- **HTTP Method:** GET
- **URL Structure:** `/api/exercises/{id}`
- **Authentication:** Required (JWT via Supabase Auth)

**Path Parameters:**

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `id` | UUID | Yes | Valid UUID format | Exercise identifier |

**Request Example:**
```http
GET /api/exercises/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {jwt_token}
```

## 3. Used Types

All types are imported from `src/types.ts`:

### Response DTOs

**For List Endpoint:**
```typescript
import type {
  ExercisesPaginatedResponseDTO,
  ExerciseListItemDTO,
  ExerciseCategoryMinimalDTO,
  PaginationMetadataDTO,
  DifficultyLevel
} from '@/types';
```

- `ExercisesPaginatedResponseDTO` - Complete paginated response
- `ExerciseListItemDTO` - Individual exercise in list (with minimal category)
- `ExerciseCategoryMinimalDTO` - Nested minimal category info (id, name, slug)
- `PaginationMetadataDTO` - Pagination metadata structure

**For Detail Endpoint:**
```typescript
import type {
  ExerciseDetailDTO,
  ExerciseCategoryFullDTO,
  DifficultyLevel
} from '@/types';
```

- `ExerciseDetailDTO` - Full exercise details (with complete category)
- `ExerciseCategoryFullDTO` - Nested full category info (id, name, slug, description, image_path)

**Error Responses:**
```typescript
import type { APIErrorResponse, ValidationErrorDetail } from '@/types';
```

### Database Types

```typescript
import type { Tables } from '@/db/database.types';
```

Used internally in service layer for database operations.

## 4. Response Details

### GET /api/exercises (List)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Barbell Bench Press",
      "description": "Lie on a flat bench...",
      "image_path": "/storage/exercises/bench-press.jpg",
      "image_alt": "Person performing bench press",
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
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**

**400 Bad Request** (Invalid query parameters):
```json
{
  "error": "Validation failed",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "category_id",
      "message": "Invalid UUID format"
    },
    {
      "field": "difficulty",
      "message": "Must be one of: easy, medium, hard"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### GET /api/exercises/{id} (Detail)

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Barbell Bench Press",
    "description": "Lie on a flat bench and grip the barbell...",
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

**Error Responses:**

**400 Bad Request** (Invalid UUID):
```json
{
  "error": "Validation failed",
  "message": "Invalid exercise ID format"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Exercise not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### GET /api/exercises (List) Flow

```
1. Client Request
   ↓
2. Astro Middleware
   - Validates JWT token
   - Populates context.locals.user
   - Provides context.locals.supabase client
   ↓
3. API Route Handler (src/pages/api/exercises/index.ts)
   - Check authentication (locals.user exists)
   - Extract and validate query parameters with Zod
   - Call exercises.service.getExercises()
   ↓
4. Exercises Service (src/lib/services/exercises.service.ts)
   - Build Supabase query with filters:
     * .eq('category_id', category_id) if provided
     * .in('difficulty', difficulty) if provided
     * .ilike('name', `%${search}%`) if provided
   - Join categories table for nested data:
     * .select('*, category:categories(id, name, slug)')
   - Apply pagination:
     * Calculate offset: (page - 1) * limit
     * .range(offset, offset + limit - 1)
   - Execute count query for total
   - Transform DB results to ExerciseListItemDTO[]
   - Calculate pagination metadata
   ↓
5. API Route Handler
   - Construct ExercisesPaginatedResponseDTO
   - Return Response with status 200
   ↓
6. Client receives paginated exercises
```

### GET /api/exercises/{id} (Detail) Flow

```
1. Client Request
   ↓
2. Astro Middleware
   - Validates JWT token
   - Populates context.locals.user
   - Provides context.locals.supabase client
   ↓
3. API Route Handler (src/pages/api/exercises/[id].ts)
   - Check authentication (locals.user exists)
   - Extract and validate path parameter (id) with Zod
   - Call exercises.service.getExerciseById()
   ↓
4. Exercises Service
   - Build Supabase query:
     * .select('*, category:categories(id, name, slug, description, image_path)')
     * .eq('id', id)
     * .single()
   - Execute query
   - If no data, return null
   - Transform DB result to ExerciseDetailDTO
   ↓
5. API Route Handler
   - If service returns null, return 404
   - Otherwise, wrap in { data: ExerciseDetailDTO }
   - Return Response with status 200
   ↓
6. Client receives exercise details
```

### Database Interactions

**Tables Accessed:**
- `exercises` (primary table)
- `categories` (joined for nested data)

**RLS Policy Applied:**
```sql
-- From db-plan.md
CREATE POLICY "Allow authenticated users to read exercises"
ON exercises FOR SELECT
TO authenticated
USING (true);
```

**Indexes Used:**
- `idx_exercises_category` - for category_id filter
- `idx_exercises_difficulty` - for difficulty filter
- `idx_exercises_name_gin` - for name search (trigram GIN index)

## 6. Security Considerations

### Authentication
- **Middleware validation:** All requests validated by Astro middleware
- **User context:** `context.locals.user` must exist
- **Supabase client:** Use pre-authenticated `context.locals.supabase`
- **Early return:** Return 401 immediately if user not authenticated

### Row Level Security (RLS)
- **Global read access:** Exercises are readable by all authenticated users
- **No user_id filtering:** Exercises table doesn't have user_id column
- **Database-enforced:** RLS policy ensures only SELECT operations allowed

### Input Validation
- **UUID validation:** Prevents SQL injection via malformed UUIDs
- **Enum validation:** Difficulty values restricted to ['easy', 'medium', 'hard']
- **Range validation:** Page ≥ 1, limit ≤ 100
- **Search sanitization:** Supabase uses parameterized queries (safe from injection)

### Data Exposure
- **No sensitive data:** Exercises are public/shared resources
- **Image paths:** Relative paths only (no direct file system access)
- **No PII:** No personally identifiable information in exercises table

### Rate Limiting (Future Consideration)
- Not implemented in MVP
- Recommended for production: 100 requests/minute per user
- Can be added via middleware or API gateway

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | Status Code | Error Response | Handling |
|----------|-------------|----------------|----------|
| User not authenticated | 401 | `{ error: "Unauthorized", message: "Authentication required" }` | Check `locals.user` at route start |
| Invalid UUID format | 400 | `{ error: "Validation failed", details: [...] }` | Zod schema validation |
| Invalid difficulty value | 400 | `{ error: "Validation failed", details: [...] }` | Zod enum validation |
| Page/limit out of range | 400 | `{ error: "Validation failed", details: [...] }` | Zod number validation |
| Exercise not found (detail) | 404 | `{ error: "Not Found", message: "Exercise not found" }` | Check service return null |
| Database connection error | 500 | `{ error: "Internal Server Error", message: "..." }` | Try-catch around service calls |
| Unexpected server error | 500 | `{ error: "Internal Server Error", message: "..." }` | Top-level try-catch |

### Error Handling Pattern

```typescript
// Route handler pattern
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // 1. Authentication check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Input validation
    const validationResult = schema.safeParse(params);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: 'Invalid query parameters',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Service call
    const result = await exercisesService.getExercises(...);

    // 4. Success response
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in GET /api/exercises:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Logging Strategy
- Log all 500 errors with full stack trace
- Log validation errors at debug level (for monitoring patterns)
- Do not log successful requests (to reduce noise)
- Use structured logging format for monitoring tools

## 8. Performance Considerations

### Database Optimization

**Indexes:**
- **Category filter:** `idx_exercises_category` on `category_id` - O(log n) lookup
- **Difficulty filter:** `idx_exercises_difficulty` on `difficulty` - bitmap index scan
- **Name search:** `idx_exercises_name_gin` (GIN trigram) - efficient full-text search
- **Composite potential:** Consider `(category_id, difficulty)` if frequently combined

**Query Optimization:**
```typescript
// Efficient query pattern
const query = supabase
  .from('exercises')
  .select('id, name, description, image_path, image_alt, difficulty, created_at, category:categories(id, name, slug)')
  .order('name'); // Use index

// Avoid N+1 queries - join category in single query
// Supabase PostgREST handles this efficiently
```

**Pagination:**
- Use `.range()` for offset pagination (simple for MVP)
- Consider cursor-based pagination for large datasets (future)
- Default limit of 20 balances response size and UX

### Caching Strategy (Future)

Not implemented in MVP, but consider:
- **HTTP caching:** Set `Cache-Control` headers for exercises (immutable data)
- **CDN caching:** Exercises rarely change, can cache at edge
- **Redis caching:** Cache popular searches and category filters
- **TTL:** 1 hour for list, 24 hours for detail

### Response Time Targets

Based on api-plan.md:
- **List query:** < 200ms (simple query with indexes)
- **Detail query:** < 200ms (single row lookup by primary key)
- **With search:** < 500ms (GIN index makes search efficient)

### Potential Bottlenecks

1. **Large result sets:** Mitigated by max limit of 100
2. **Complex search queries:** GIN index handles efficiently
3. **Category joins:** Single join, indexed foreign key
4. **Concurrent requests:** Supabase connection pooling handles this

## 9. Implementation Steps

### ✅ Step 1: Create Validation Schemas

**File:** `src/lib/validation/exercises.schema.ts` - COMPLETED

### ✅ Step 2: Create Exercises Service

**File:** `src/lib/services/exercises.service.ts` - COMPLETED

### ✅ Step 3: Create List API Route

**File:** `src/pages/api/exercises/index.ts` - COMPLETED

### ✅ Step 4: Create Detail API Route

**File:** `src/pages/api/exercises/[id].ts` - COMPLETED

### Step 5: Manual Testing Checklist

1. **Authentication Tests:**
   - [ ] Request without auth token returns 401
   - [ ] Request with valid auth token returns 200

2. **List Endpoint Tests:**
   - [ ] GET /api/exercises returns paginated results
   - [ ] Filter by category_id works correctly
   - [ ] Filter by single difficulty works
   - [ ] Filter by multiple difficulties works (comma-separated)
   - [ ] Search by name works (case-insensitive)
   - [ ] Pagination works (page, limit parameters)
   - [ ] Invalid UUID returns 400
   - [ ] Invalid difficulty returns 400
   - [ ] Limit > 100 returns 400
   - [ ] Empty results return empty array (not error)

3. **Detail Endpoint Tests:**
   - [ ] GET /api/exercises/{id} returns exercise details
   - [ ] Invalid UUID format returns 400
   - [ ] Non-existent exercise returns 404
   - [ ] Category data is fully populated

4. **Performance Tests:**
   - [ ] List query completes in < 200ms
   - [ ] Detail query completes in < 200ms
   - [ ] Search query completes in < 500ms

### Step 6: Documentation Updates

1. Update API documentation with example requests/responses
2. Add JSDoc comments to service methods
3. Document any environment variables needed (none for this endpoint)
4. Update README if needed

### Step 7: Deployment Checklist

- [ ] All TypeScript compilation passes
- [ ] Linting passes (npm run lint)
- [ ] Manual testing completed
- [ ] Code reviewed by team member
- [ ] Database indexes verified in production
- [ ] RLS policies verified in Supabase dashboard
- [ ] Monitoring/logging configured for 500 errors

---

**Implementation Status:** ✅ COMPLETED (Code Implementation)
**Testing Status:** ⏳ PENDING (Requires database seed data and authentication setup)

**Implementation Priority:** High (MVP requirement - US-001 to US-005)

**Estimated Implementation Time:** 4-6 hours (ACTUAL: ~2 hours)

**Dependencies:**
- ✅ Database schema deployed (exercises, categories tables)
- ⏳ RLS policies enabled (need to verify in Supabase)
- ✅ Supabase Auth middleware configured
- ✅ Types.ts file created
- ⏳ Seed data for exercises and categories (needed for testing)
