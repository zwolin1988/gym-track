import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface NavigationProps {
  currentPath?: string;
  user?: {
    email: string;
    id: string;
  } | null;
}

export default function Navigation({ currentPath = "/", user }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/workout-plans", label: "Plany", icon: "list_alt" },
    { href: "/workouts/history", label: "Treningi", icon: "fitness_center" },
    { href: "/exercises", label: "Ćwiczenia", icon: "exercise" },
    { href: "/categories", label: "Kategorie", icon: "category" },
  ];

  const isActive = (href: string) => {
    // Exact match for dashboard
    if (href === "/dashboard") return currentPath === href;
    // For other routes, match if current path starts with the href
    return currentPath?.startsWith(href);
  };

  // Get user initials for avatar fallback
  const getUserInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="material-symbols-outlined text-primary text-3xl">fitness_center</span>
          <h2 className="text-xl font-bold tracking-tight">Gym Track</h2>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Add Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Dodaj nowy" className="hidden md:flex">
                <span className="material-symbols-outlined">add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Szybkie akcje</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/workout-plans" className="flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  Rozpocznij trening
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/workout-plans/new" className="flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-base">list_alt</span>
                  Nowy plan treningowy
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} alt={user.email} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Konto</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton variant="ghost" className="w-full justify-start px-2 py-1.5 text-sm">
                    <span className="material-symbols-outlined mr-2 h-4 w-4 text-sm">logout</span>
                    <span>Wyloguj</span>
                  </LogoutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
                className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </a>
            ))}
            {user && (
              <>
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="material-symbols-outlined text-base">person</span>
                  {user.email}
                </div>
                <LogoutButton variant="outline" className="w-full justify-start">
                  <span className="material-symbols-outlined mr-2 text-base">logout</span>
                  Wyloguj
                </LogoutButton>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
