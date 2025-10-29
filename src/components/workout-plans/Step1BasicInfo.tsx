import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Step1BasicInfoProps } from "./types";

/**
 * Step1BasicInfo - Pierwszy krok wizarda
 * Formularz z polami: nazwa planu (wymagane) i opis (opcjonalnie)
 * Walidacja w czasie rzeczywistym z komunikatami błędów
 */
export function Step1BasicInfo({ name, description, onChange }: Step1BasicInfoProps) {
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const validateName = (value: string): string | null => {
    if (value.length < 3) {
      return "Nazwa musi mieć co najmniej 3 znaki";
    }
    if (value.length > 100) {
      return "Nazwa może mieć maksymalnie 100 znaków";
    }
    return null;
  };

  const validateDescription = (value: string): string | null => {
    if (value.length > 500) {
      return "Opis może mieć maksymalnie 500 znaków";
    }
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onChange(newName, description);

    const error = validateName(newName);
    setErrors((prev) => ({ ...prev, name: error || undefined }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDesc = e.target.value;

    const error = validateDescription(newDesc);
    if (error) {
      setErrors((prev) => ({ ...prev, description: error }));
      return;
    }

    onChange(name, newDesc || null);
    setErrors((prev) => ({ ...prev, description: undefined }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="plan-name">
          Nazwa planu <span className="text-destructive">*</span>
        </Label>
        <Input
          id="plan-name"
          data-testid="plan-name-input"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="np. Push Day, Full Body Workout"
          className={cn(errors.name && "border-destructive")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive mt-1">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-description">Opis planu (opcjonalnie)</Label>
        <Textarea
          id="plan-description"
          data-testid="plan-description-input"
          value={description || ""}
          onChange={handleDescriptionChange}
          placeholder="Krótki opis planu treningowego..."
          rows={4}
          maxLength={500}
          className={cn(errors.description && "border-destructive")}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description && (
            <p id="description-error" className="text-sm text-destructive">
              {errors.description}
            </p>
          )}
          <p
            className={cn("text-sm text-muted-foreground ml-auto", (description?.length || 0) > 450 && "text-warning")}
          >
            {description?.length || 0}/500
          </p>
        </div>
      </div>
    </div>
  );
}
