/**
 * Types for Workout Plan Wizard
 */

import type { ExerciseListItemDTO, CategoryDTO } from "@/types";

/**
 * Stan wizarda tworzenia planu
 */
export interface WizardState {
  step: 1 | 2 | 3;
  planName: string;
  planDescription: string | null;
  selectedExercises: SelectedExercise[];
  planId: string | null; // UUID po utworzeniu planu w kroku 1
}

/**
 * Wybrane ćwiczenie z seriami
 */
export interface SelectedExercise {
  exerciseId: string;
  exercise: ExerciseListItemDTO;
  orderIndex: number;
  planExerciseId: string | null; // UUID po dodaniu do planu w kroku 2
  sets: PlanSet[];
}

/**
 * Seria w planie
 */
export interface PlanSet {
  reps: number;
  weight: number | null;
  orderIndex: number;
  id: string | null; // UUID po zapisaniu w API (krok 3)
}

/**
 * Props dla głównego wizarda
 */
export interface CreateWorkoutPlanWizardProps {
  exercises: ExerciseListItemDTO[];
  categories: CategoryDTO[];
  editMode?: boolean;
  existingPlanId?: string;
}

/**
 * Zwracane wartości z hooka useWorkoutPlanWizard
 */
export interface UseWorkoutPlanWizardReturn {
  state: WizardState;
  currentStep: 1 | 2 | 3;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goNext: () => Promise<void>;
  goPrevious: () => void;
  updateBasicInfo: (name: string, description: string | null) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (index: number) => void;
  reorderExercises: (newOrder: SelectedExercise[]) => void;
  updateExerciseSets: (exerciseIndex: number, sets: PlanSet[]) => void;
  submitPlan: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Props dla komponentu Stepper
 */
export interface StepperProps {
  currentStep: 1 | 2 | 3;
  totalSteps: 3;
}

/**
 * Props dla Step1BasicInfo
 */
export interface Step1BasicInfoProps {
  name: string;
  description: string | null;
  onChange: (name: string, description: string | null) => void;
}

/**
 * Props dla Step2SelectExercises
 */
export interface Step2SelectExercisesProps {
  exercises: ExerciseListItemDTO[];
  categories: CategoryDTO[];
  selectedExercises: SelectedExercise[];
  onAdd: (exerciseId: string) => void;
  onRemove: (index: number) => void;
  onReorder: (newOrder: SelectedExercise[]) => void;
}

/**
 * Props dla Step3DefineSets
 */
export interface Step3DefineSetsProps {
  selectedExercises: SelectedExercise[];
  onUpdateSets: (exerciseIndex: number, sets: PlanSet[]) => void;
  onReorder: (newOrder: SelectedExercise[]) => void;
  onRemove: (index: number) => void;
}

/**
 * Props dla ExerciseSelector
 */
export interface ExerciseSelectorProps {
  exercises: ExerciseListItemDTO[];
  categories: CategoryDTO[];
  selectedExerciseIds: string[];
  onSelect: (exerciseId: string) => void;
}

/**
 * Props dla SelectedExercisesList
 */
export interface SelectedExercisesListProps {
  exercises: SelectedExercise[];
  onRemove: (index: number) => void;
  onReorder: (newOrder: SelectedExercise[]) => void;
}

/**
 * Props dla SelectedExerciseItem
 */
export interface SelectedExerciseItemProps {
  exercise: SelectedExercise;
  index: number;
  onRemove: () => void;
}

/**
 * Props dla ExerciseSetsEditor
 */
export interface ExerciseSetsEditorProps {
  exerciseName: string;
  sets: PlanSet[];
  onUpdate: (sets: PlanSet[]) => void;
}

/**
 * Props dla SetInputRow
 */
export interface SetInputRowProps {
  setNumber: number;
  reps: number;
  weight: number | null;
  onUpdateReps: (reps: number) => void;
  onUpdateWeight: (weight: number | null) => void;
  onRemove: () => void;
  canRemove: boolean;
}
