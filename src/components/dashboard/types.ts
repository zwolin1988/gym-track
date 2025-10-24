/**
 * Dashboard Component Types
 *
 * Type definitions for dashboard-specific components and props
 */

import type { WorkoutDetailDTO, WorkoutListItemDTO, WorkoutStatsDataPointDTO, WorkoutStatsDTO } from "@/types";

/**
 * Props for DashboardHero
 */
export interface DashboardHeroProps {
  activeWorkout: WorkoutDetailDTO | null;
}

/**
 * Props for ActiveWorkoutBanner
 */
export interface ActiveWorkoutBannerProps {
  workout: WorkoutDetailDTO;
}

/**
 * Props for LastWorkoutSummary
 */
export interface LastWorkoutSummaryProps {
  lastWorkout: WorkoutListItemDTO | null;
}

/**
 * Props for WorkoutSummaryCard
 */
export interface WorkoutSummaryCardProps {
  stats: WorkoutStatsDTO;
  planName: string;
  date: string;
  workoutId?: string;
  onClick?: () => void;
}

/**
 * Props for VolumeChart
 */
export interface VolumeChartProps {
  data: WorkoutStatsDataPointDTO[];
  period?: string;
}

/**
 * Props for QuickActions
 */
export interface QuickActionsProps {
  hasWorkoutPlans?: boolean;
}

/**
 * ViewModel for Dashboard - agreguje wszystkie dane
 */
export interface DashboardViewModel {
  activeWorkout: WorkoutDetailDTO | null;
  lastWorkout: WorkoutListItemDTO | null;
  volumeChartData: WorkoutStatsDataPointDTO[];
  hasWorkoutPlans: boolean;
}
