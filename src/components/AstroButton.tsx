import { Button } from "@/components/ui/button";

interface AstroButtonProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
  onClick?: () => void;
}

export default function AstroButton({
  children,
  variant = "default",
  size = "lg",
  className,
  onClick,
}: AstroButtonProps) {
  return (
    <Button variant={variant} size={size} className={className} onClick={onClick}>
      {children}
    </Button>
  );
}
