/**
 * WorkoutHistoryContainer Component
 *
 * Wrapper component managing state for workout timeline and detail modal.
 * Handles workout selection and modal open/close logic.
 */

import { useState } from "react";
import { WorkoutHistoryTimeline } from "./WorkoutHistoryTimeline";
import { WorkoutDetailModal } from "./WorkoutDetailModal";
import type { WorkoutListItemDTO } from "@/types";

interface WorkoutHistoryContainerProps {
  workouts: WorkoutListItemDTO[];
}

export function WorkoutHistoryContainer({ workouts }: WorkoutHistoryContainerProps) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWorkoutClick = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkoutId(null);
  };

  return (
    <>
      <WorkoutHistoryTimeline workouts={workouts} onWorkoutClick={handleWorkoutClick} />

      <WorkoutDetailModal workoutId={selectedWorkoutId} isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
