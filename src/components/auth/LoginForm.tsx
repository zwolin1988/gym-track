import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateLoginForm, type ValidationErrors } from "@/lib/validation/auth.validation";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  redirectUrl?: string;
}

interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  errors: ValidationErrors;
  showPassword: boolean;
}

export function LoginForm({ redirectUrl = "/dashboard" }: LoginFormProps) {
  const [formState, setFormState] = React.useState<LoginFormState>({
    email: "",
    password: "",
    isLoading: false,
    errors: {},
    showPassword: false,
  });

  const updateField = (field: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      [field]: e.target.value,
      errors: { ...prev.errors, [field]: undefined },
    }));
  };

  const handleBlur = (field: "email" | "password") => () => {
    const validationErrors = validateLoginForm({
      email: formState.email,
      password: formState.password,
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
    const validationErrors = validateLoginForm({
      email: formState.email,
      password: formState.password,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || "Sprawdź poprawność danych");
      setFormState((prev) => ({
        ...prev,
        errors: validationErrors,
        isLoading: false,
      }));
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Logowanie nie powiodło się";
        throw new Error(errorMessage);
      }

      // Sukces
      toast.success("Zalogowano pomyślnie");

      // Delay redirect to ensure toast is visible
      await new Promise((resolve) => setTimeout(resolve, 500));
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
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500 flex items-start gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span className="flex-1">{formState.errors.general}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Podaj login"
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

        <Button type="submit" size="lg" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-400 pt-4">
        Nie masz konta?{" "}
        <a href="/auth/register" className="font-medium text-primary hover:underline cursor-pointer">
          Zarejestruj się
        </a>
      </p>
    </div>
  );
}
