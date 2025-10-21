# API Endpoint Implementation Plan: Categories API

## 1. Endpoint Overview

This implementation plan covers two endpoints for the categories resource:

1. **GET /api/categories** - Retrieve all muscle group categories
2. **GET /api/categories/{id}** - Retrieve a single category by ID

The categories resource represents muscle group categories (e.g., Chest, Back, Legs) that organize exercises. Categories are global, read-only data available to all authenticated users.

**Key Characteristics:**
- Read-only access (categories are global, shared data)
- Authentication required (RLS policy: all authenticated users can read)
- No pagination (small dataset: 5-10 categories in MVP)
- Ordered by `order_index` for consistent display
- Returns complete category information including images

## 2. Request Details

### GET /api/categories (List)

- **HTTP Method:** GET
- **URL Structure:** `/api/categories`
- **Authentication:** Required (JWT via Supabase Auth)

**Query Parameters:** None

**Request Example:**
```http
GET /api/categories
Authorization: Bearer {jwt_token}
```

### GET /api/categories/{id} (Detail)

- **HTTP Method:** GET
- **URL Structure:** `/api/categories/{id}`
- **Authentication:** Required (JWT via Supabase Auth)

**Path Parameters:**

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `id` | UUID | Yes | Valid UUID format | Category identifier |

**Request Example:**
```http
GET /api/categories/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {jwt_token}
```

## 3. Used Types

All types are imported from `src/types.ts`:

### Response DTOs

```typescript
import type { CategoryDTO } from '@/types';
```

- `CategoryDTO` - Complete category information (directly from `Tables<"categories">`)

**Error Responses:**
```typescript
import type { APIErrorResponse } from '@/types';
```

### Database Types

```typescript
import type { Tables } from '@/db/database.types';
```

## 4. Response Details

### GET /api/categories (List)

**Success Response (200 OK):**
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
    },
    {
      "id": "uuid",
      "name": "Back",
      "slug": "back",
      "description": "Back muscle exercises",
      "image_path": "/storage/categories/back.jpg",
      "image_alt": "Back muscle diagram",
      "order_index": 2,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Error Responses:**

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

### GET /api/categories/{id} (Detail)

**Success Response (200 OK):**
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

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "message": "Invalid category ID format"
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
  "message": "Category not found"
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

### GET /api/categories (List) Flow

```
1. Client Request
   ↓
2. Astro Middleware
   - Validates JWT token
   - Populates context.locals.user
   - Provides context.locals.supabase client
   ↓
3. API Route Handler (src/pages/api/categories/index.ts)
   - Check authentication (locals.user exists)
   - Call categories.service.getCategories()
   ↓
4. Categories Service (src/lib/services/categories.service.ts)
   - Build Supabase query:
     * .select('*')
     * .order('order_index')
   - Execute query
   - Return CategoryDTO[]
   ↓
5. API Route Handler
   - Wrap in { data: CategoryDTO[] }
   - Return Response with status 200
   ↓
6. Client receives all categories
```

### GET /api/categories/{id} (Detail) Flow

```
1. Client Request
   ↓
2. Astro Middleware
   - Validates JWT token
   - Populates context.locals.user
   ↓
3. API Route Handler (src/pages/api/categories/[id].ts)
   - Check authentication
   - Validate path parameter with Zod
   - Call categories.service.getCategoryById()
   ↓
4. Categories Service
   - Build query: .select('*').eq('id', id).single()
   - Execute query
   - If no data, return null
   ↓
5. API Route Handler
   - If null, return 404
   - Otherwise wrap in { data: CategoryDTO }
   - Return Response with status 200
   ↓
6. Client receives category details
```

## 6. Security Considerations

### Authentication
- Middleware validates all requests
- Early return 401 if user not authenticated

### Row Level Security (RLS)
- Categories are readable by all authenticated users
- No user_id filtering needed
- Database-enforced read-only access

### Input Validation
- UUID validation prevents SQL injection
- Zod schema validation for path parameters

## 7. Error Handling

### Error Scenarios

| Scenario | Status Code | Handling |
|----------|-------------|----------|
| User not authenticated | 401 | Check `locals.user` |
| Invalid UUID format | 400 | Zod validation |
| Category not found | 404 | Service returns null |
| Database error | 500 | Try-catch wrapper |

## 8. Performance Considerations

### Database Optimization
- **Small dataset:** 5-10 categories, no pagination needed
- **Index:** Primary key index on `id`
- **Ordering:** `order_index` column for consistent sorting

### Response Time Targets
- **List query:** < 100ms (small dataset, simple query)
- **Detail query:** < 100ms (primary key lookup)

## 9. Implementation Steps

### ✅ Step 1: Create Validation Schemas
**File:** `src/lib/validation/categories.schema.ts` - COMPLETED

Created schema for category ID validation:
```typescript
export const getCategoryByIdParamsSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});
```

### ✅ Step 2: Create Categories Service
**File:** `src/lib/services/categories.service.ts` - COMPLETED

Implemented two methods:
- `getCategories()` - Returns all categories ordered by order_index
- `getCategoryById(id)` - Returns single category or null

### ✅ Step 3: Create List API Route
**File:** `src/pages/api/categories/index.ts` - COMPLETED

GET endpoint that:
1. Validates authentication
2. Calls service
3. Returns all categories

### ✅ Step 4: Create Detail API Route
**File:** `src/pages/api/categories/[id].ts` - COMPLETED

GET endpoint that:
1. Validates authentication
2. Validates UUID parameter
3. Returns category or 404

### Step 5: Manual Testing Checklist

1. **Authentication Tests:**
   - [ ] Request without auth token returns 401
   - [ ] Request with valid auth token returns 200

2. **List Endpoint Tests:**
   - [ ] GET /api/categories returns all categories
   - [ ] Categories are ordered by order_index
   - [ ] All category fields are populated

3. **Detail Endpoint Tests:**
   - [ ] GET /api/categories/{id} returns category
   - [ ] Invalid UUID returns 400
   - [ ] Non-existent category returns 404

4. **Performance Tests:**
   - [ ] List query completes in < 100ms
   - [ ] Detail query completes in < 100ms

---

**Implementation Status:** ✅ COMPLETED

**Related User Stories:** US-011 (Przeglądanie kategorii ćwiczeń)

**Dependencies:**
- ✅ Database schema deployed (categories table)
- ✅ RLS policies enabled
- ✅ Supabase Auth middleware configured
- ⏳ Seed data for categories (5-10 categories needed)

**Estimated Implementation Time:** 1-2 hours
**Actual Implementation Time:** ~30 minutes
