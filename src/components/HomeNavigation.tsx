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

interface HomeNavigationProps {
  user?: {
    email: string;
    id: string;
  } | null;
}

export default function HomeNavigation({ user }: HomeNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "#features", label: "Funkcje" },
    { href: "#benefits", label: "Korzyści" },
    { href: "#screenshots", label: "Zrzuty ekranu" },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // Update URL without jumping
      window.history.pushState(null, "", href);
    }
    setMobileMenuOpen(false);
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
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleAnchorClick(e, item.href)}
              className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Dashboard Button for authenticated users */}
              <Button variant="default" size="sm" asChild className="hidden md:inline-flex">
                <a href="/dashboard">Dashboard</a>
              </Button>

              {/* User Avatar Dropdown */}
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
            </>
          ) : (
            <>
              {/* Login/Register buttons for non-authenticated users */}
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/login">Logowanie</a>
              </Button>
              <Button variant="default" size="sm" asChild>
                <a href="/auth/register">Rejestracja</a>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden ml-2"
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
                onClick={(e) => handleAnchorClick(e, item.href)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
            {user && (
              <>
                <div className="my-2 h-px bg-border" />
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  Dashboard
                </a>
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
