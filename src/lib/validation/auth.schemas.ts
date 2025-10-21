/**
 * Server-side validation schemas for authentication endpoints
 *
 * These schemas are used in API routes for server-side validation
 * with Polish error messages according to auth-spec.md
 */

import { z } from "zod";

/**
 * Schema for user registration (US-001)
 * POST /api/auth/register
 */
export const registerSchema = z.object({
  email: z.string({ required_error: "Email jest wymagany" }).email("Nieprawidłowy format adresu email"),
  password: z.string({ required_error: "Hasło jest wymagane" }).min(8, "Hasło musi mieć minimum 8 znaków"),
});

/**
 * Schema for user login (US-002)
 * POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z.string({ required_error: "Email jest wymagany" }).email("Nieprawidłowy format adresu email"),
  password: z.string({ required_error: "Hasło jest wymagane" }).min(1, "Hasło jest wymagane"),
});

// Export TypeScript types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
