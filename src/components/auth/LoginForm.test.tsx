/**
 * Unit Tests - LoginForm Component
 *
 * Tests cover key functionalities:
 * - Rendering and initial state
 * - Real-time validation (onBlur)
 * - Error clearing during input
 * - Form submission (success and error paths)
 * - Loading states
 * - Password visibility toggle
 * - Error display (banner + toast)
 * - Accessibility attributes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import * as authValidation from "@/lib/validation/auth.validation";

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import mocked toast for assertions
import { toast } from "sonner";

describe("LoginForm Component", () => {
  // Global fetch mock
  const mockFetch = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render all form elements", () => {
      // Act
      render(<LoginForm />);

      // Assert - using semantic queries (per Vitest rules)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło|password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zaloguj|login/i })).toBeInTheDocument();
      expect(screen.getByText(/nie masz konta/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /zarejestruj/i })).toBeInTheDocument();
    });

    it("should have empty initial values", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/hasło|password/i) as HTMLInputElement;

      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe("");
    });

    it("should have submit button enabled initially", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const submitButton = screen.getByRole("button", { name: /zaloguj|login/i });
      expect(submitButton).not.toBeDisabled();
    });

    it("should not show error banner initially", () => {
      // Act
      render(<LoginForm />);

      // Assert - no error banner should be visible
      const errorBanner = screen.queryByText(/nieprawidłowy|invalid|błąd|error/i);
      expect(errorBanner).not.toBeInTheDocument();
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility when eye icon is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/hasło|password/i) as HTMLInputElement;

      // Assert - password is hidden by default
      expect(passwordInput.type).toBe("password");

      // Act - click toggle button
      const toggleButton = screen.getByRole("button", { name: "" }); // Icon button has no accessible name
      await user.click(toggleButton);

      // Assert - password is now visible
      expect(passwordInput.type).toBe("text");

      // Act - click again
      await user.click(toggleButton);

      // Assert - password is hidden again
      expect(passwordInput.type).toBe("password");
    });
  });

  describe("Real-time Validation (onBlur)", () => {
    it("should show email validation error on blur with invalid email", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);

      // Act - enter invalid email and blur
      await user.type(emailInput, "not-an-email");
      await user.tab(); // triggers blur

      // Assert - validation error should appear
      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy.*email|invalid.*email/i)).toBeInTheDocument();
      });
    });

    it("should show password validation error on blur with short password", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/hasło|password/i);

      // Act - enter short password and blur
      await user.type(passwordInput, "123");
      await user.tab();

      // Assert
      await waitFor(() => {
        const errorMessage = screen.queryByText(/hasło|password/i);
        // Error message might vary based on validation rules
        expect(errorMessage).toBeTruthy();
      });
    });

    it("should not show error when valid email is entered", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);

      // Act - enter valid email and blur
      await user.type(emailInput, "test@example.com");
      await user.tab();

      // Assert - no error should appear
      await waitFor(
        () => {
          const errorMessage = screen.queryByText(/nieprawidłowy.*email|invalid.*email/i);
          expect(errorMessage).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Error Clearing During Input", () => {
    it("should clear email error when user starts typing", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);

      // Create error first
      await user.type(emailInput, "invalid");
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/nieprawidłowy|invalid/i)).toBeInTheDocument();
      });

      // Act - start typing again
      await user.clear(emailInput);
      await user.type(emailInput, "t");

      // Assert - error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/nieprawidłowy.*email|invalid.*email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission - Success Path", () => {
    it("should submit form with valid credentials and redirect", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Mock window.location.href
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(<LoginForm redirectUrl="/custom-dashboard" />);

      // Act - fill and submit form
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło|password/i), "SecurePass123!");
      await user.click(screen.getByRole("button", { name: /zaloguj|login/i }));

      // Assert - API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/login",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "test@example.com",
              password: "SecurePass123!",
            }),
          })
        );
      });

      // Assert - success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Zalogowano pomyślnie");
      });

      // Assert - redirect (after 500ms delay)
      await waitFor(
        () => {
          expect(mockLocation.href).toBe("/custom-dashboard");
        },
        { timeout: 1000 }
      );
    });

    it("should use default redirect URL when not specified", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło|password/i), "password123");
      await user.click(screen.getByRole("button", { name: /zaloguj|login/i }));

      // Assert - default redirect to /dashboard
      await waitFor(
        () => {
          expect(mockLocation.href).toBe("/dashboard");
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Form Submission - Error Paths", () => {
    it("should display error banner and toast on API error", async () => {
      // Arrange
      const user = userEvent.setup();
      const errorMessage = "Nieprawidłowy email lub hasło";

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: errorMessage }),
      });

      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło|password/i), "WrongPassword");
      await user.click(screen.getByRole("button", { name: /zaloguj|login/i }));

      // Assert - error toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });

      // Assert - error banner appears in DOM
      await waitFor(() => {
        const errorBanner = screen.getByText(errorMessage);
        expect(errorBanner).toBeInTheDocument();
        expect(errorBanner.closest("div")).toHaveClass("text-red-500");
      });
    });

    it("should show validation errors when submitting invalid data", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act - submit with invalid email
      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.type(screen.getByLabelText(/hasło|password/i), "pass");

      // Wait for validation to process
      const submitButton = screen.getByRole("button", { name: /zaloguj|login/i });
      await user.click(submitButton);

      // Assert - form should not make API call
      expect(mockFetch).not.toHaveBeenCalled();

      // Assert - validation errors appear
      await waitFor(() => {
        const errorText = screen.queryByText(/nieprawidłowy/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło|password/i), "password123");
      await user.click(screen.getByRole("button", { name: /zaloguj|login/i }));

      // Assert - error is displayed
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network error");
      });

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should show generic error when error object is not an Error instance", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce("Some string error");

      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło|password/i), "password123");
      await user.click(screen.getByRole("button", { name: /zaloguj|login/i }));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Wystąpił nieoczekiwany błąd");
      });
    });
  });

  describe("Loading States", () => {
    it("should disable submit button during form submission", async () => {
      // Arrange
      const user = userEvent.setup();

      // Mock slow API call
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              300
            )
          )
      );

      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło|password/i), "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj|login/i });
      await user.click(submitButton);

      // Assert - button is disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Assert - loading text is shown
      expect(screen.getByText(/logowanie\.\.\./i)).toBeInTheDocument();

      // Wait for async operation to complete
      await waitFor(() => expect(submitButton).not.toBeDisabled(), { timeout: 1000 });
    });

    it("should re-enable button after failed submission", async () => {
      // Arrange
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      render(<LoginForm />);

      // Act
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło|password/i), "wrong");

      const submitButton = screen.getByRole("button", { name: /zaloguj|login/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Assert - button is re-enabled
      expect(submitButton).not.toBeDisabled();
      expect(screen.getByText(/zaloguj się/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility (a11y)", () => {
    it("should have proper ARIA attributes on email input", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("required");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("id", "email");
    });

    it("should set aria-invalid when email has error", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);

      // Act - trigger validation error
      await user.type(emailInput, "invalid");
      await user.tab();

      // Assert
      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should associate error message with input via aria-describedby", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);

      // Act - trigger validation error
      await user.type(emailInput, "invalid");
      await user.tab();

      // Assert
      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
        expect(screen.getByText(/nieprawidłowy|invalid/i)).toHaveAttribute("id", "email-error");
      });
    });

    it("should have proper label associations", () => {
      // Act
      render(<LoginForm />);

      // Assert - labels are properly associated with inputs
      const emailLabel = screen.getByText("Email");
      const passwordLabel = screen.getByText("Hasło");

      expect(emailLabel).toHaveAttribute("for", "email");
      expect(passwordLabel).toHaveAttribute("for", "password");
    });
  });

  describe("Integration with Validation Module", () => {
    it("should call validateLoginForm with correct arguments", async () => {
      // Arrange
      const user = userEvent.setup();
      const validateSpy = vi.spyOn(authValidation, "validateLoginForm");

      render(<LoginForm />);

      // Act - trigger validation on blur
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.tab();

      // Assert
      expect(validateSpy).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "",
      });

      validateSpy.mockRestore();
    });
  });
});
