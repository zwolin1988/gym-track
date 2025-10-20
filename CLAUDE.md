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
- Use Supabase client from `context.locals` in Astro routes (not direct imports)
- Use `SupabaseClient` type from `src/db/supabase.client.ts` (not from `@supabase/supabase-js`)
- Use Zod schemas to validate data exchanged with backend

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
