/**
 * Component Tests - LoginForm
 *
 * Example React component test using React Testing Library
 * Follows user-centric testing approach
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

// Mock fetch for API calls
global.fetch = vi.fn();

describe("LoginForm Component", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should render login form with all fields", () => {
    // Act
    render(<LoginForm />);

    // Assert - using semantic queries (per cursor rules)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło|password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zaloguj|login/i })).toBeInTheDocument();
  });

  it("should show validation error for invalid email", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);

    // Act - user interaction simulation
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "not-an-email");
    await user.tab(); // trigger blur

    // Assert
    await waitFor(() => {
      const errorMessage = screen.queryByText(/nieprawidłowy.*email|invalid.*email/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("should submit form with valid credentials", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(<LoginForm />);

    // Act - fill form and submit
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/hasło|password/i), "SecurePass123!");
    await user.click(screen.getByRole("button", { name: /zaloguj|login/i }));

    // Assert - verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("test@example.com"),
        })
      );
    });
  });

  it("should disable submit button while loading", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            100
          )
        )
    );
    global.fetch = mockFetch;

    render(<LoginForm />);

    // Act
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/hasło|password/i), "SecurePass123!");

    const submitButton = screen.getByRole("button", { name: /zaloguj|login/i });
    await user.click(submitButton);

    // Assert - button should be disabled during submission
    expect(submitButton).toBeDisabled();

    // Cleanup - wait for async operation to complete
    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it("should display error message on failed login", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid credentials" }),
    });
    global.fetch = mockFetch;

    render(<LoginForm />);

    // Act
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/hasło|password/i), "WrongPassword");
    await user.click(screen.getByRole("button", { name: /zaloguj|login/i }));

    // Assert - error message should appear
    await waitFor(() => {
      const errorElement = screen.getByText(/nieprawidłowy|invalid|credentials/i);
      expect(errorElement).toBeInTheDocument();
    });
  });
});
