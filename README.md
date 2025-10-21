# Gym Track

> A modern web application for tracking workout progress and achieving your fitness goals

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Authentication Architecture](#authentication-architecture)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
  - [MVP Features (In Scope)](#mvp-features-in-scope)
  - [Future Features (Out of Scope)](#future-features-out-of-scope)
- [Project Status](#project-status)
- [License](#license)

## About the Project

Gym Track is a web application designed to help fitness enthusiasts systematically track their workout progress. The app enables users to:

- **Create personalized workout plans** with exercises from a curated database
- **Log workouts in real-time** with detailed parameters (sets, reps, weight)
- **Track progress automatically** with calculated statistics and metrics
- **Visualize improvements** through charts and workout history
- **Stay organized** with a clean, mobile-friendly interface

### Key Features

✅ **Authentication & Security** - Secure user registration and login with Row Level Security (RLS)
✅ **Exercise Database** - 50+ predefined exercises across 5-10 muscle categories
✅ **Workout Plans** - Full CRUD operations for creating and managing training plans
✅ **Smart Workout Logger** - Real-time tracking with parameter modifications during workouts
✅ **Automatic Statistics** - Calculate total volume, duration, max weight, and more
✅ **Progress Visualization** - Charts showing training volume over time
✅ **Responsive Design** - Optimized for both mobile and desktop use

### Target Audience

- Regular gym-goers tracking their training progress
- Fitness enthusiasts seeking systematic workout logging
- Beginners to intermediate users looking for simple, effective tracking tools

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, modern web framework with server-side rendering
- **[React 19](https://react.dev/)** - UI library for interactive components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon library

### Backend

- **[Supabase](https://supabase.com/)** - Complete backend solution providing:
  - **PostgreSQL database** - Robust relational database
  - **Supabase Auth** - User authentication and management (registration, login, sessions)
  - **Row Level Security (RLS)** - Database-level security ensuring users can only access their own data
  - **User Association** - All actions and data are automatically linked to the authenticated user via `auth.uid()`
  - **Storage and Edge Functions** - File storage and serverless functions
  - **Backend-as-a-Service SDK** - Type-safe client libraries

### AI Integration

- **[Openrouter.ai](https://openrouter.ai/)** - Access to multiple AI models (OpenAI, Anthropic, Google) with cost control

### Testing

- **[Vitest 2.x](https://vitest.dev/)** - Fast unit and integration testing framework
- **[React Testing Library 16.x](https://testing-library.com/react)** - User-centric component testing
- **[Playwright 1.50+](https://playwright.dev/)** - Modern end-to-end testing with cross-browser support

### DevOps & CI/CD

- **GitHub Actions** - Automated CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker containers
- **Husky** - Git hooks for code quality
- **ESLint & Prettier** - Code linting and formatting

## Getting Started

### Prerequisites

- **Node.js** v22.14.0 (specified in `.nvmrc`)
- **npm** (comes with Node.js)
- **Supabase Account** (for backend services)

If you use `nvm` (Node Version Manager):

```bash
nvm use
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/gym-track.git
cd gym-track
```

2. Install dependencies:

```bash
npm install
```

### Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Fill in your environment variables in `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

3. Set up your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env`
   - Run database migrations (if available)

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Authentication Architecture

Gym Track uses **Supabase Auth** as the primary authentication system with the following architecture:

### User Management
- **Registration & Login**: All user accounts are created and managed through Supabase Auth
- **Session Management**: Supabase handles session tokens, refresh tokens, and authentication state
- **User Identity**: Each user receives a unique `user_id` from Supabase Auth (`auth.uid()`)

### Data Association
- **Automatic Linking**: All workout plans, workouts, and user data are automatically linked to the authenticated user
- **User Context**: In Astro routes, access the authenticated user via `context.locals.user`
- **Authenticated Client**: Use `context.locals.supabase` for database operations (pre-configured with user session)

### Security Model
- **Row Level Security (RLS)**: Every database table uses RLS policies
- **Policy Example**: `workout_plans` table policy: `user_id = auth.uid()`
- **Data Isolation**: Users can only query, insert, update, or delete their own records
- **No Manual user_id Management**: The application never manually sets `user_id` - it's always derived from Supabase Auth

### Protected Routes
- Middleware checks authentication status
- Unauthenticated users are redirected to login
- API endpoints validate session tokens

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |

### Pre-commit Hooks

The project uses **Husky** and **lint-staged** to automatically run quality checks before commits:

- ESLint auto-fix for `.ts`, `.tsx`, `.astro` files
- Prettier formatting for `.json`, `.css`, `.md` files

## API Documentation

### Exercises API

The application provides RESTful API endpoints for managing exercises. All endpoints require authentication.

#### Base URL

```
http://localhost:4321/api
```

#### Authentication

All API requests must include a valid Supabase session cookie. The middleware automatically validates the JWT token and provides `context.locals.user` and `context.locals.supabase`.

---

### Endpoints

#### GET /api/exercises

Retrieve a paginated list of exercises with optional filtering and searching.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category_id` | UUID | No | - | Filter by category ID |
| `difficulty` | string[] | No | - | Filter by difficulty (`easy`, `medium`, `hard`). Comma-separated for multiple values. |
| `search` | string | No | - | Search exercises by name (case-insensitive) |
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 20 | Results per page (max: 100) |

**Example Request:**

```bash
curl -b "sb-access-token=YOUR_TOKEN" \
  "http://localhost:4321/api/exercises?difficulty=medium,hard&search=bench&page=1&limit=10"
```

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
    "limit": 10,
    "total": 45,
    "total_pages": 5
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

---

#### GET /api/exercises/:id

Retrieve a single exercise by ID with full details.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Exercise identifier |

**Example Request:**

```bash
curl -b "sb-access-token=YOUR_TOKEN" \
  "http://localhost:4321/api/exercises/123e4567-e89b-12d3-a456-426614174000"
```

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

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Exercise not found
- `500 Internal Server Error` - Server error

---

### Testing the API

A test script is provided to verify the API functionality:

```bash
./scripts/test-exercises-api.sh
```

For detailed testing instructions, see [.ai/exercises-testing-guide.md](.ai/exercises-testing-guide.md).

## Project Scope

### MVP Features (In Scope)

✅ **Authentication & Authorization**
- User registration and login via **Supabase Auth**
- User sessions managed by Supabase Auth
- All user data and actions automatically linked to authenticated user ID
- **Row Level Security (RLS)** - Database policies ensure users only access their own data
- Protected routes and API endpoints
- Secure user context in `context.locals.user` (Astro) and `context.locals.supabase` (authenticated client)

✅ **Exercise Database**
- 50+ predefined exercises
- 5-10 muscle group categories
- Exercise filtering by category and difficulty
- Search functionality

✅ **Workout Plan Management (CRUD)**
- Create, read, update, delete workout plans
- Add exercises from database
- Define sets with reps and weight
- Reorder exercises

✅ **Workout Logger**
- Start workout from a plan
- Real-time parameter modifications
- Mark sets as completed
- Add optional notes per set
- Add extra sets during workout

✅ **Statistics & Analytics**
- Automatic calculation of:
  - Total workout duration
  - Total training volume
  - Max weight used
  - Total sets and reps
- Workout history with filtering
- Training volume chart (last 4 weeks)

✅ **User Experience**
- Responsive design (mobile & desktop)
- Toast notifications
- Error handling
- Loading states

✅ **Testing & Quality**
- Minimum 1 end-to-end test (Playwright)
- CI/CD pipeline
- Code quality tools (ESLint, Prettier)

### Future Features (Out of Scope)

🔄 Planned for future versions:

- Rest timer between sets
- Custom exercise creation by users
- Unit conversion (kg ↔ lbs)
- Workout plan templates
- Advanced analytics (personal records, per-exercise charts)
- Social features (sharing plans, community)
- Wearable device integrations
- Nutrition tracking
- Video exercise tutorials
- Offline mode
- Dark mode
- Multi-language support
- Data export (CSV, PDF)
- Push notifications

## Project Status

🚧 **Current Phase**: MVP Development

### Completed
- ✅ Project setup and configuration
- ✅ CLAUDE.md documentation
- ✅ Tech stack selection
- ✅ Development environment configuration
- ✅ Database schema design (exercises, categories, workout_plans, workouts)
- ✅ Authentication implementation (Supabase Auth + RLS)
- ✅ Exercises API endpoints (GET /api/exercises, GET /api/exercises/:id)
- ✅ Type system (DTOs and Command Models)
- ✅ Validation schemas (Zod)
- ✅ Service layer architecture
- ✅ API documentation

### In Progress
- 🔄 Core UI components
- 🔄 Workout plan CRUD API
- 🔄 Testing infrastructure

### Upcoming
- ⏳ Workout logger API
- ⏳ Statistics calculation API
- ⏳ Frontend implementation (workout plans UI)
- ⏳ Workout logger interface
- ⏳ Statistics and charts
- ⏳ End-to-end testing
- ⏳ CI/CD pipeline setup
- ⏳ Production deployment

## License

MIT
