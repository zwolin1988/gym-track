/**
 * E2E Test Fixtures - Authentication
 *
 * Provides test data and helper functions for authentication tests
 */

export const TEST_USERS = {
  valid: {
    email: "demo@demo.pl",
    password: "demo1234",
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
