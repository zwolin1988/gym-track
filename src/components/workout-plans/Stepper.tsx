import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepperProps } from "./types";

/**
 * Stepper component - Wizualny wskaźnik postępu wizarda
 * Wyświetla numery kroków, nazwy i status (ukończony, aktywny, nieaktywny)
 */
export function Stepper({ currentStep }: StepperProps) {
  const steps = [
    { number: 1, label: "Nazwa i opis" },
    { number: 2, label: "Wybór ćwiczeń" },
    { number: 3, label: "Definiowanie serii" },
  ];

  return (
    <nav aria-label="Postęp tworzenia planu" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.number}
            className={cn(
              "relative",
              index === 0 && "flex-none",
              index === 1 && "flex-1 flex justify-center",
              index === 2 && "flex-none"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                index < steps.length - 1 &&
                  "after:content-[''] after:w-full after:h-1 after:border-b-2 after:inline-block after:ml-4",
                index === 0 && "after:mr-4",
                index < steps.length - 1 && step.number < currentStep && "after:border-primary",
                index < steps.length - 1 && step.number >= currentStep && "after:border-muted"
              )}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                    step.number < currentStep && "bg-primary text-primary-foreground",
                    step.number === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    step.number > currentStep && "bg-muted text-muted-foreground"
                  )}
                >
                  {step.number < currentStep ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium hidden sm:block whitespace-nowrap",
                    step.number === currentStep ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
