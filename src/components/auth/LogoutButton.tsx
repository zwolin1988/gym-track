import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  children?: React.ReactNode;
}

export function LogoutButton({ variant = "ghost", children }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Symulacja API call - będzie zastąpione prawdziwym endpointem
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Wylogowanie nie powiodło się");
      }

      toast.info("Zostałeś wylogowany");
      window.location.href = "/auth/login";
    } catch {
      toast.error("Wystąpił błąd podczas wylogowywania");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Wylogowywanie..." : children || "Wyloguj"}
    </Button>
  );
}
