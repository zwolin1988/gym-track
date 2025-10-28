/**
 * Unit Tests - Zod Validation Schemas
 *
 * Tests for authentication validation schemas
 */

import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./auth.schemas";

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      // Arrange
      const validData = {
        email: "demo@demo.pl",
        password: "demo1234",
      };

      // Act
      const result = loginSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(validData.email);
        expect(result.data.password).toBe(validData.password);
      }
    });

    it("should reject invalid email format", () => {
      // Arrange
      const invalidData = {
        email: "not-an-email",
        password: "SecurePass123!",
      };

      // Act
      const result = loginSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("should reject empty password", () => {
      // Arrange
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      // Act
      const result = loginSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });

    it("should reject missing fields", () => {
      // Arrange
      const invalidData = {};

      // Act
      const result = loginSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      // Arrange
      const validData = {
        email: "newuser@example.com",
        password: "SecurePass123!",
      };

      // Act
      const result = registerSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(validData.email);
        expect(result.data.password).toBe(validData.password);
      }
    });

    it("should reject invalid email format", () => {
      // Arrange
      const invalidData = {
        email: "not-an-email",
        password: "SecurePass123!",
      };

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("should reject weak passwords", () => {
      // Arrange
      const invalidData = {
        email: "test@example.com",
        password: "weak",
      };

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path.includes("password"));
        expect(passwordError).toBeDefined();
      }
    });

    it("should reject missing fields", () => {
      // Arrange
      const invalidData = {};

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
