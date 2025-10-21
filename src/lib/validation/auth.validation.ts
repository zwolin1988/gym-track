/**
 * Client-side validation utilities for authentication forms
 */

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Validates email format using regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates registration form data
 */
export function validateRegisterForm(data: RegisterFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Email validation
  if (!data.email) {
    errors.email = "Email jest wymagany";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Nieprawidłowy format adresu email";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Hasło jest wymagane";
  } else if (data.password.length < 8) {
    errors.password = "Hasło musi mieć minimum 8 znaków";
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = "Potwierdzenie hasła jest wymagane";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Hasła muszą być identyczne";
  }

  return errors;
}

/**
 * Validates login form data
 */
export function validateLoginForm(data: LoginFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Email validation
  if (!data.email) {
    errors.email = "Email jest wymagany";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Nieprawidłowy format adresu email";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Hasło jest wymagane";
  }

  return errors;
}

/**
 * Validates reset password form (email only)
 */
export function validateResetPasswordForm(email: string): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!email) {
    errors.email = "Email jest wymagany";
  } else if (!isValidEmail(email)) {
    errors.email = "Nieprawidłowy format adresu email";
  }

  return errors;
}
