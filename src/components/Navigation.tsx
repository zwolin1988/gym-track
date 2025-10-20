import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  currentPath?: string;
}

export default function Navigation({ currentPath = "/" }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/plans", label: "Plans" },
    { href: "/workouts", label: "Workouts" },
    { href: "/exercises", label: "Exercises" },
  ];

  const isActive = (href: string) => currentPath === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary text-3xl">fitness_center</span>
          <h2 className="text-xl font-bold tracking-tight">Gym Track</h2>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="icon" aria-label="Add new">
            <span className="material-symbols-outlined">add</span>
          </Button>

          {/* User Avatar */}
          <div className="h-10 w-10 rounded-full bg-cover bg-center bg-muted"></div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
