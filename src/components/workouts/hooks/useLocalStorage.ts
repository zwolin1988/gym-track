import type { StoredWorkoutState } from "../types";
import { ACTIVE_WORKOUT_STORAGE_KEY } from "../types";

/**
 * Utilities do zarzdzania workout state w localStorage
 */

/**
 * Zapisuje stan treningu do localStorage
 */
export function saveWorkoutToLocalStorage(state: StoredWorkoutState): void {
  try {
    localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save workout state to localStorage:", error);
  }
}

/**
 * Odczytuje stan treningu z localStorage
 */
export function loadWorkoutFromLocalStorage(workoutId: string): StoredWorkoutState | null {
  try {
    const stored = localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as StoredWorkoutState;

    // Sprawdz czy workout ID si zgadza
    if (state.workoutId !== workoutId) {
      console.log("Workout ID mismatch in localStorage, ignoring stored state");
      return null;
    }

    // Opcjonalnie: sprawdz czy nie jest starszy ni| 24h
    const lastUpdated = new Date(state.lastUpdated);
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 24) {
      console.log("Stored workout state is older than 24h, ignoring");
      return null;
    }

    return state;
  } catch (error) {
    console.error("Failed to load workout state from localStorage:", error);
    return null;
  }
}

/**
 * Usuwa stan treningu z localStorage
 */
export function clearWorkoutFromLocalStorage(): void {
  try {
    localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear workout state from localStorage:", error);
  }
}
