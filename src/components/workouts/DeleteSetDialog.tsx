import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteSetDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteSetDialog({ open, onClose, onConfirm }: DeleteSetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usunąć serię?</DialogTitle>
          <DialogDescription>Czy na pewno chcesz usunąć tę serię? Ta operacja jest nieodwracalna.</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            Usuń serię
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
