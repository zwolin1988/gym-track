/**
 * E2E Test Fixtures - Authentication
 *
 * Provides test data and helper functions for authentication tests
 *
 * IMPORTANT: Valid test user credentials are loaded from .env.test file:
 * - E2E_USERNAME (email)
 * - E2E_PASSWORD
 * - E2E_USERNAME_ID (optional, for future use)
 *
 * This allows E2E tests to use a dedicated test database in Supabase
 * Set these in your .env.test file (see .env.test.example)
 */

export const TEST_USERS = {
  valid: {
    email: process.env.E2E_USERNAME || "test@example.com",
    password: process.env.E2E_PASSWORD || "test1234",
    userId: process.env.E2E_USERNAME_ID, // Optional: for direct DB operations
  },
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: "SecurePass123!",
  },
  invalid: {
    email: "invalid@example.com",
    password: "WrongPassword",
  },
} as const;

export const AUTH_ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  dashboard: "/dashboard",
} as const;

export const AUTH_ERRORS = {
  invalidCredentials: "Nieprawidłowy email lub hasło",
  emailExists: "Email jest już zarejestrowany",
  requiredFields: "To pole jest wymagane",
} as const;
