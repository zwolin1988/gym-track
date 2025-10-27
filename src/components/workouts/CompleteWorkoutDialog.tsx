import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CompleteWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CompleteWorkoutDialog({ open, onClose, onConfirm }: CompleteWorkoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zakończyć trening?</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz zakończyć ten trening? Zostaną obliczone statystyki i zostaniesz przekierowany do
            podsumowania.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
            Zakończ trening
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
