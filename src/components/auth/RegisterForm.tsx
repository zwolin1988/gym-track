import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateRegisterForm, type ValidationErrors } from "@/lib/validation/auth.validation";
import { Eye, EyeOff } from "lucide-react";

interface RegisterFormProps {
  redirectUrl?: string;
}

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  errors: ValidationErrors;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

export function RegisterForm({ redirectUrl = "/dashboard" }: RegisterFormProps) {
  const [formState, setFormState] = React.useState<RegisterFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    isLoading: false,
    errors: {},
    showPassword: false,
    showConfirmPassword: false,
  });

  const updateField =
    (field: keyof Omit<RegisterFormState, "isLoading" | "errors">) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: e.target.value,
        errors: { ...prev.errors, [field]: undefined },
      }));
    };

  const handleBlur = (field: "email" | "password" | "confirmPassword") => () => {
    const validationErrors = validateRegisterForm({
      email: formState.email,
      password: formState.password,
      confirmPassword: formState.confirmPassword,
    });

    if (validationErrors[field]) {
      setFormState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [field]: validationErrors[field] },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    // Walidacja kliencka
    const validationErrors = validateRegisterForm({
      email: formState.email,
      password: formState.password,
      confirmPassword: formState.confirmPassword,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFormState((prev) => ({
        ...prev,
        errors: validationErrors,
        isLoading: false,
      }));
      return;
    }

    try {
      // Symulacja API call - będzie zastąpione prawdziwym endpointem
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Rejestracja nie powiodła się");
      }

      // Sukces
      toast.success("Konto utworzone pomyślnie! Witamy w Gym Track.");
      window.location.href = redirectUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      setFormState((prev) => ({
        ...prev,
        errors: { general: errorMessage },
      }));
      toast.error(errorMessage);
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {formState.errors.general && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{formState.errors.general}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Podaj email"
            value={formState.email}
            onChange={updateField("email")}
            onBlur={handleBlur("email")}
            required
            aria-invalid={!!formState.errors.email}
            aria-describedby={formState.errors.email ? "email-error" : undefined}
          />
          {formState.errors.email && (
            <p id="email-error" className="text-sm text-red-500">
              {formState.errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Hasło
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={formState.showPassword ? "text" : "password"}
              placeholder="Podaj hasło"
              value={formState.password}
              onChange={updateField("password")}
              onBlur={handleBlur("password")}
              required
              aria-invalid={!!formState.errors.password}
              aria-describedby={formState.errors.password ? "password-error" : undefined}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setFormState((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 cursor-pointer"
            >
              {formState.showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {formState.errors.password && (
            <p id="password-error" className="text-sm text-red-500">
              {formState.errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Potwierdź hasło
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={formState.showConfirmPassword ? "text" : "password"}
              placeholder="Potwierdź hasło"
              value={formState.confirmPassword}
              onChange={updateField("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              required
              aria-invalid={!!formState.errors.confirmPassword}
              aria-describedby={formState.errors.confirmPassword ? "confirm-password-error" : undefined}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() =>
                setFormState((prev) => ({
                  ...prev,
                  showConfirmPassword: !prev.showConfirmPassword,
                }))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 cursor-pointer"
            >
              {formState.showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {formState.errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-red-500">
              {formState.errors.confirmPassword}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? "Tworzenie konta..." : "Zarejestruj się"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-400 pt-4">
        Masz już konto?{" "}
        <a href="/auth/login" className="font-medium text-primary hover:underline cursor-pointer">
          Zaloguj się
        </a>
      </p>
    </div>
  );
}
