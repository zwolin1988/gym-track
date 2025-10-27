/**
 * Types for Workout History View Components and Active Workout View
 */

import type {
  WorkoutListItemDTO,
  WorkoutPlanListItemDTO,
  PaginationMetadataDTO,
  WorkoutDetailDTO,
  UpdateWorkoutSetCommand,
  CreateWorkoutSetCommand,
} from "@/types";

/**
 * Filtry historii trening�w
 */
export interface WorkoutHistoryFilters {
  plan_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Dane formularza filtr�w
 */
export interface WorkoutHistoryFiltersFormData {
  plan_id: string;
  start_date: string;
  end_date: string;
  preset?: "7d" | "30d" | "3m" | "all";
}

/**
 * Props dla WorkoutHistoryHeader
 */
export interface WorkoutHistoryHeaderProps {
  totalWorkouts: number;
  totalVolume: number;
}

/**
 * Props dla WorkoutHistoryFilters
 */
export interface WorkoutHistoryFiltersProps {
  plans: WorkoutPlanListItemDTO[];
  initialFilters: WorkoutHistoryFilters;
}

/**
 * Props dla WorkoutHistoryTimeline
 */
export interface WorkoutHistoryTimelineProps {
  workouts: WorkoutListItemDTO[];
  isLoading?: boolean;
  onWorkoutClick: (workoutId: string) => void;
}

/**
 * Props dla WorkoutHistoryItem
 */
export interface WorkoutHistoryItemProps {
  workout: WorkoutListItemDTO;
  onClick: (workoutId: string) => void;
}

/**
 * Props dla WorkoutDetailModal
 */
export interface WorkoutDetailModalProps {
  workoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props dla WorkoutHistoryPagination
 */
export interface WorkoutHistoryPaginationProps {
  pagination: PaginationMetadataDTO;
}

/**
 * Predefiniowane zakresy dat
 */
export const DATE_PRESETS = {
  "7d": { label: "Ostatnie 7 dni", days: 7 },
  "30d": { label: "Ostatnie 30 dni", days: 30 },
  "3m": { label: "Ostatnie 3 miesice", days: 90 },
  all: { label: "Wszystkie", days: null },
} as const;

// ========================================
// Active Workout Types
// ========================================

/**
 * Stan dla useActiveWorkout hook
 */
export interface ActiveWorkoutState {
  workout: WorkoutDetailDTO;
  isLoading: boolean;
  error: string | null;
}

/**
 * Return type dla useActiveWorkout hook
 */
export interface UseActiveWorkoutReturn {
  workout: WorkoutDetailDTO;
  isLoading: boolean;
  error: string | null;
  updateSet: (setId: string, updates: UpdateWorkoutSetCommand) => Promise<void>;
  addSet: (exerciseId: string, setData: CreateWorkoutSetCommand) => Promise<void>;
  deleteSet: (setId: string, exerciseId: string) => Promise<void>;
  completeWorkout: () => Promise<void>;
  refreshWorkout: () => Promise<void>;
}

/**
 * Return type dla useWorkoutTimer hook
 */
export interface UseWorkoutTimerReturn {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * LocalStorage key dla workout state
 */
export const ACTIVE_WORKOUT_STORAGE_KEY = "gym-track-active-workout";

/**
 * LocalStorage workout state structure
 */
export interface StoredWorkoutState {
  workoutId: string;
  lastUpdated: string;
  exercises: {
    exerciseId: string;
    sets: {
      setId: string;
      actual_reps: number | null;
      actual_weight: number | null;
      completed: boolean;
      note: string | null;
    }[];
  }[];
}
