# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Gym Track

A modern gym tracking application built with Astro, React, TypeScript, and Tailwind CSS.

## Tech Stack

- **Astro 5** - Server-side rendering framework with hybrid rendering
- **React 19** - UI library for interactive components
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Component library (New York style)
- **Supabase** - Backend services, authentication, and database
- **Node.js** - Runtime (v22.14.0 specified in .nvmrc)

## Development Commands

```bash
# Development
npm run dev                 # Start dev server on http://localhost:3000
npm run build              # Build for production
npm run preview            # Preview production build

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix ESLint issues
npm run format             # Format code with Prettier
```

## Project Architecture

### Rendering Strategy

The project uses Astro's **server output mode** (`output: "server"` in astro.config.mjs), meaning pages are server-rendered by default. This enables:

- Server-side rendering for dynamic content
- API endpoints in `src/pages/api/`
- Access to `Astro.cookies` and server-side features
- Hybrid rendering (use `export const prerender = true` for static pages)

### Component Strategy

**Critical architectural decision:** Use Astro components (.astro) for static content and layouts. Only use React components (.tsx) when interactivity is needed.

- **Astro components** → Static content, layouts, server-rendered pages
- **React components** → Interactive UI elements, client-side state management

### Directory Structure

```
src/
├── layouts/              # Astro layouts
├── pages/                # Astro pages (file-based routing)
│   └── api/             # API endpoints
├── middleware/
│   └── index.ts         # Astro middleware for request/response modification
├── components/          # UI components
│   ├── ui/              # Shadcn/ui components
│   └── hooks/           # Custom React hooks
├── lib/
│   ├── services/        # Business logic and services
│   └── utils.ts         # Utility functions (includes cn() for class merging)
├── db/                  # Supabase client and types
├── types.ts             # Shared types (Entities, DTOs)
├── assets/              # Internal static assets
└── styles/
    └── global.css       # Global styles and Tailwind imports
```

### Path Aliases

Configured in `tsconfig.json` and `components.json`:

```typescript
@/*           → ./src/*
@/components  → ./src/components
@/lib         → ./src/lib
@/lib/utils   → ./src/lib/utils
@/components/ui → ./src/components/ui
```

### Styling System

- **Tailwind CSS 4** with CSS variables enabled
- **Base color**: neutral
- **Style**: New York (Shadcn/ui)
- **Icon library**: Lucide React
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Dark mode support via `dark:` variant

## Coding Guidelines

### Error Handling

- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions (avoid deep nesting)
- Place the happy path last in functions
- Avoid unnecessary else statements (use if-return pattern)
- Use guard clauses for preconditions and invalid states
- Implement proper error logging and user-friendly messages

### Astro-Specific Guidelines

- Use uppercase format for endpoint handlers (`GET`, `POST`)
- Use `export const prerender = false` for API routes
- Use **Zod** for input validation in API routes
- Extract business logic into services in `src/lib/services`
- Leverage View Transitions API for smooth page transitions
- Use `Astro.cookies` for server-side cookie management
- Access environment variables via `import.meta.env`
- Use content collections with type safety for structured content

### React Guidelines

- **Never use "use client"** or other Next.js directives (we use React with Astro)
- Use functional components with hooks
- Extract logic into custom hooks in `src/components/hooks`
- Use `React.memo()` for expensive components with stable props
- Use `React.lazy()` and Suspense for code-splitting
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for generating accessibility IDs
- Use `useOptimistic` for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates

### Tailwind CSS Guidelines

- Use `@layer` directive to organize styles (components, utilities, base)
- Use arbitrary values with square brackets for one-off designs (e.g., `w-[123px]`)
- Implement dark mode with `dark:` variant
- Use responsive variants (`sm:`, `md:`, `lg:`, etc.)
- Use state variants (`hover:`, `focus-visible:`, `active:`, etc.)

### Accessibility

- Use ARIA landmarks to identify page regions
- Apply appropriate ARIA roles to custom elements
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` regions for dynamic content updates
- Implement `aria-hidden` for decorative content
- Use `aria-label` or `aria-labelledby` for elements without visible labels
- Use `aria-describedby` for descriptive text associations
- Use `aria-current` for indicating current item in navigation
- Avoid redundant ARIA that duplicates native HTML semantics

### Backend and Database

- Use **Supabase** for backend services, authentication, and database
- **Authentication**: Use Supabase Auth for user management
  - All user data is managed through Supabase Auth (registration, login, sessions)
  - User ID from Supabase Auth is used to associate all actions and data with specific users
  - Access authenticated user via `context.locals.user` in Astro routes
- **Database Access**: Use Supabase client from `context.locals.supabase` in Astro routes (not direct imports)
  - This ensures proper authentication context is maintained
  - The client is pre-configured with the user's session
- **Row Level Security (RLS)**: All tables must use RLS policies
  - Policies should filter data by `auth.uid()` (current authenticated user)
  - This ensures users can only access their own data
  - Example: `workout_plans` table should have policy: `user_id = auth.uid()`
- Use `SupabaseClient` type from `src/db/supabase.client.ts` (not from `@supabase/supabase-js`)
- Use Zod schemas to validate data exchanged with backend
- **IMPORTANT**: Never manually manage user_id in application code - always use the authenticated user from Supabase Auth

## Authentication & User Context

### How to Access Authenticated User

In Astro routes and API endpoints:

```typescript
// src/pages/api/workout-plans.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  // Access authenticated user
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  // Access authenticated Supabase client
  const { data, error } = await locals.supabase
    .from('workout_plans')
    .select('*');
    // RLS automatically filters by user_id = auth.uid()

  return new Response(JSON.stringify(data), { status: 200 });
};
```

### Row Level Security (RLS) Policies

All tables must have RLS enabled with policies like:

```sql
-- Enable RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own workout plans
CREATE POLICY "Users can view their own workout plans"
  ON workout_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own workout plans
CREATE POLICY "Users can insert their own workout plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own workout plans
CREATE POLICY "Users can update their own workout plans"
  ON workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own workout plans
CREATE POLICY "Users can delete their own workout plans"
  ON workout_plans FOR DELETE
  USING (auth.uid() = user_id);
```

### Important Rules

1. **Never manually set `user_id`** - Always use `auth.uid()` in RLS policies or get it from `locals.user.id`
2. **Always use `locals.supabase`** in Astro routes - This client is pre-configured with the user's session
3. **Check authentication** - Always verify `locals.user` exists before processing requests
4. **Trust RLS** - Let database policies handle data filtering, don't filter in application code

## Environment Variables

Required environment variables (see `.env.example`):

```
SUPABASE_URL=###
SUPABASE_KEY=###
OPENROUTER_API_KEY=###
```

## Adding Shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components will be added to `src/components/ui/` with New York style and Lucide icons.

## Pre-commit Hooks

The project uses **Husky** and **lint-staged** for pre-commit quality checks:

- ESLint auto-fix for `.ts`, `.tsx`, `.astro` files
- Prettier formatting for `.json`, `.css`, `.md` files
