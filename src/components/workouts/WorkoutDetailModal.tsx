/**
 * WorkoutDetailModal Component
 *
 * Modal displaying full workout details including exercises, sets, and notes.
 * Fetches data from API when opened and displays loading/error states.
 */

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkoutDetailModalProps } from "./types";
import type { WorkoutDetailDTO } from "@/types";
import { formatDate, formatTime, formatDuration, formatNumber } from "@/lib/utils/dates";
import { toast } from "sonner";

export function WorkoutDetailModal({ workoutId, isOpen, onClose }: WorkoutDetailModalProps) {
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workoutId) {
      fetchWorkoutDetails(workoutId);
    } else {
      // Reset state when modal closes
      setWorkoutDetails(null);
      setError(null);
    }
  }, [isOpen, workoutId]);

  const fetchWorkoutDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workouts/${id}`);

      if (!response.ok) {
        throw new Error("Nie udaBo si zaBadowa szczeg�B�w treningu");
      }

      const { data } = await response.json();
      setWorkoutDetails(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "WystpiB nieznany bBd";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Szczeg�By treningu</DialogTitle>
          <DialogClose />
        </DialogHeader>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="py-8 text-center">
            <p className="mb-4 text-red-600">{error}</p>
            <Button onClick={onClose}>Zamknij</Button>
          </div>
        )}

        {/* Content */}
        {workoutDetails && !isLoading && !error && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="mb-2 text-2xl font-bold">{workoutDetails.plan_name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(workoutDetails.started_at)}</span>
                <span>{formatTime(workoutDetails.started_at)}</span>
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                  ZakoDczony
                </Badge>
              </div>
            </div>

            {/* Statystyki */}
            {workoutDetails.stats && (
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4 md:grid-cols-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Czas trwania</p>
                  <p className="text-lg font-bold">{formatDuration(workoutDetails.stats.duration_minutes)}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Objto[</p>
                  <p className="text-lg font-bold">{formatNumber(workoutDetails.stats.total_volume)} kg</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">wiczenia</p>
                  <p className="text-lg font-bold">{workoutDetails.stats.total_exercises}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Serie</p>
                  <p className="text-lg font-bold">{workoutDetails.stats.total_sets}</p>
                </div>
              </div>
            )}

            {/* Lista wiczeD */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Wykonane wiczenia</h3>
              <div className="space-y-6">
                {workoutDetails.exercises.map((exercise, idx) => (
                  <div key={exercise.id} className="rounded-lg border p-4">
                    {/* NagB�wek wiczenia */}
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                      <h4 className="text-lg font-semibold">{exercise.exercise.name}</h4>
                    </div>

                    {/* Tabela serii */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">Seria</th>
                            <th className="p-2 text-left">Planowane</th>
                            <th className="p-2 text-left">Wykonane</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Notatka</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, setIdx) => (
                            <tr key={set.id} className="border-t">
                              <td className="p-2 font-semibold">{setIdx + 1}</td>
                              <td className="p-2">
                                {set.planned_reps} x {set.planned_weight ? `${set.planned_weight} kg` : "BW"}
                              </td>
                              <td className="p-2">
                                {set.actual_reps || "-"} x {set.actual_weight ? `${set.actual_weight} kg` : "-"}
                              </td>
                              <td className="p-2">
                                {set.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </td>
                              <td className="p-2 text-xs italic text-muted-foreground">{set.note || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
