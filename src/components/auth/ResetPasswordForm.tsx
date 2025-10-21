import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateResetPasswordForm, type ValidationErrors } from "@/lib/validation/auth.validation";

interface ResetPasswordFormState {
  email: string;
  isLoading: boolean;
  isSuccess: boolean;
  errors: ValidationErrors;
}

export function ResetPasswordForm() {
  const [formState, setFormState] = React.useState<ResetPasswordFormState>({
    email: "",
    isLoading: false,
    isSuccess: false,
    errors: {},
  });

  const updateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      email: e.target.value,
      errors: { ...prev.errors, email: undefined },
    }));
  };

  const handleBlur = () => {
    const validationErrors = validateResetPasswordForm(formState.email);

    if (validationErrors.email) {
      setFormState((prev) => ({
        ...prev,
        errors: validationErrors,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    // Walidacja kliencka
    const validationErrors = validateResetPasswordForm(formState.email);

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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się wysłać emaila");
      }

      // Sukces
      setFormState((prev) => ({ ...prev, isSuccess: true }));
      toast.success("Link do resetowania hasła został wysłany na podany adres email");
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

  if (formState.isSuccess) {
    return (
      <div className="w-full">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sprawdź swoją skrzynkę email</h2>
          <p className="text-sm text-neutral-400">Wysłaliśmy link do resetowania hasła na adres {formState.email}</p>
          <div className="rounded-lg bg-green-500/10 p-4">
            <p className="text-sm text-green-500">
              Jeśli nie otrzymasz emaila w ciągu kilku minut, sprawdź folder spam lub spróbuj ponownie.
            </p>
          </div>
        </div>
        <div className="text-center">
          <a href="/auth/login" className="text-sm font-medium text-primary hover:underline">
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }

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
            placeholder="Enter your email"
            value={formState.email}
            onChange={updateEmail}
            onBlur={handleBlur}
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

        <Button type="submit" size="lg" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-400 pt-4">
        Pamiętasz hasło?{" "}
        <a href="/auth/login" className="font-medium text-primary hover:underline">
          Zaloguj się
        </a>
      </p>
    </div>
  );
}
