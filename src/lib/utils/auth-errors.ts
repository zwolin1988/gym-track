/**
 * Supabase Authentication Error Mapper
 *
 * Maps Supabase Auth error messages to Polish user-friendly messages
 * and appropriate HTTP status codes according to auth-spec.md
 */

export interface AuthErrorResponse {
  message: string;
  statusCode: number;
}

/**
 * Maps Supabase Auth errors to Polish messages with appropriate HTTP status codes
 *
 * @param error - Supabase AuthError or Error object
 * @param context - 'register' | 'login' | 'logout' - the authentication context
 * @returns Object with Polish error message and HTTP status code
 */
export function mapSupabaseAuthError(
  error: { message: string; status?: number },
  context: "register" | "login" | "logout"
): AuthErrorResponse {
  const errorMessage = error.message.toLowerCase();

  // Registration errors (US-001)
  if (context === "register") {
    if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
      return {
        message: "Ten adres email jest już zarejestrowany",
        statusCode: 409, // Conflict
      };
    }

    if (errorMessage.includes("invalid email")) {
      return {
        message: "Nieprawidłowy format adresu email",
        statusCode: 400,
      };
    }

    if (errorMessage.includes("password") && errorMessage.includes("short")) {
      return {
        message: "Hasło musi mieć minimum 8 znaków",
        statusCode: 400,
      };
    }

    // Default registration error
    return {
      message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      statusCode: 500,
    };
  }

  // Login errors (US-002)
  if (context === "login") {
    // IMPORTANT: For security reasons, always return generic message for login failures
    // Don't distinguish between "user not found" and "wrong password"
    if (
      errorMessage.includes("invalid login") ||
      errorMessage.includes("invalid credentials") ||
      errorMessage.includes("email not confirmed") ||
      errorMessage.includes("invalid password") ||
      errorMessage.includes("user not found")
    ) {
      return {
        message: "Nieprawidłowy email lub hasło",
        statusCode: 401, // Unauthorized
      };
    }

    // Default login error
    return {
      message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      statusCode: 500,
    };
  }

  // Logout errors (US-003)
  if (context === "logout") {
    return {
      message: "Wystąpił błąd podczas wylogowywania",
      statusCode: 500,
    };
  }

  // Fallback
  return {
    message: "Wystąpił nieoczekiwany błąd",
    statusCode: 500,
  };
}
