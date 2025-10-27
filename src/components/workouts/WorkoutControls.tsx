import { Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutControlsProps {
  focusMode: boolean;
  onToggleFocus: () => void;
  onComplete: () => void;
}

export function WorkoutControls({ focusMode, onToggleFocus, onComplete }: WorkoutControlsProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button variant="outline" onClick={onToggleFocus} size="default" className="w-full sm:w-auto">
        {focusMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
        {focusMode ? "Wyjdź z trybu Focus" : "Tryb Focus"}
      </Button>

      <Button onClick={onComplete} size="default" className="w-full bg-primary hover:bg-primary/90 sm:w-auto">
        <Check className="mr-2 h-4 w-4" />
        Zakończ trening
      </Button>
    </div>
  );
}
