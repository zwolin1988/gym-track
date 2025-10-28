/**
 * E2E Test Fixtures - Authentication
 *
 * Provides test data and helper functions for authentication tests
 *
 * IMPORTANT: Valid test user credentials are loaded from environment variables:
 * - TEST_USER_EMAIL
 * - TEST_USER_PASSWORD
 *
 * Set these in your .env file (see .env.example)
 */

export const TEST_USERS = {
  valid: {
    email: process.env.TEST_USER_EMAIL || "test@example.com",
    password: process.env.TEST_USER_PASSWORD || "test1234",
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
