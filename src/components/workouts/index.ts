/**
 * Export all workout components for easier imports
 */

// Main container
export { ActiveWorkoutContainer } from "./ActiveWorkoutContainer";

// Header components
export { WorkoutHeader } from "./WorkoutHeader";
export { WorkoutTimer } from "./WorkoutTimer";

// Control components
export { WorkoutControls } from "./WorkoutControls";
export { CompleteWorkoutDialog } from "./CompleteWorkoutDialog";
export { DeleteSetDialog } from "./DeleteSetDialog";

// Exercise list components
export { ExerciseList } from "./ExerciseList";
export { ExerciseAccordion } from "./ExerciseAccordion";
export { ExerciseHeader } from "./ExerciseHeader";

// Set components
export { SetsList } from "./SetsList";
export { SetItem } from "./SetItem";
export { SetCheckbox } from "./SetCheckbox";
export { SetInput } from "./SetInput";
export { AddSetButton } from "./AddSetButton";

// Hooks
export { useActiveWorkout } from "./hooks/useActiveWorkout";
export { useWorkoutTimer } from "./hooks/useWorkoutTimer";
export { useBeforeUnload } from "./hooks/useBeforeUnload";
export {
  saveWorkoutToLocalStorage,
  loadWorkoutFromLocalStorage,
  clearWorkoutFromLocalStorage,
} from "./hooks/useLocalStorage";

// Types
export type { ActiveWorkoutState, UseActiveWorkoutReturn, UseWorkoutTimerReturn, StoredWorkoutState } from "./types";
export { ACTIVE_WORKOUT_STORAGE_KEY } from "./types";
