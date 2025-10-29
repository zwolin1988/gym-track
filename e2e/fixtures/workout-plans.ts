/**
 * E2E Test Fixtures - Workout Plans
 *
 * Provides test data and constants for workout plan E2E tests
 */

export const TEST_WORKOUT_PLANS = {
  basic: {
    name: "E2E Test Plan - Basic",
    description: "Test plan created by E2E test",
  },
  detailed: {
    name: "E2E Test Plan - Full Body",
    description: "Complete full body workout plan for E2E testing with multiple exercises and sets",
  },
  minimal: {
    name: "E2E Minimal Plan",
    description: null,
  },
} as const;

/**
 * Test exercises - using names from the seed migration
 * These exercises should exist in the test database
 */
export const TEST_EXERCISES = {
  chest: {
    pushups: "Pompki (Push-ups)",
    benchPress: "Wyciskanie sztangi na ławce płaskiej",
    dumbellPress: "Wyciskanie hantli skos dodatni",
  },
  back: {
    deadlift: "Martwy ciąg klasyczny",
    pullUps: "Podciąganie szerokim chwytem",
    barbellRow: "Wiosłowanie sztangą w opadzie tułowia",
  },
  legs: {
    squats: "Przysiady ze sztangą na plecach",
    legPress: "Wypychanie ciężaru na suwnicy",
    lunges: "Wykroki z hantlami",
  },
  shoulders: {
    militaryPress: "Wyciskanie żołnierskie (Military Press)",
    lateralRaise: "Unoszenie hantli bokiem (Side Lateral Raise)",
  },
  biceps: {
    barbellCurl: "Uginanie ramion ze sztangą stojąc",
    hammerCurl: "Uginanie młotkowe (Hammer Curl)",
  },
  triceps: {
    pushdown: "Prostowanie ramion na wyciągu górnym (pushdown)",
    skullCrushers: "Wyciskanie francuskie leżąc ze sztangą (Skull Crushers)",
  },
  abs: {
    plank: "Plank (Deska)",
    crunches: "Spięcia brzucha (Crunches)",
  },
} as const;

/**
 * Test sets configurations
 */
export const TEST_SETS = {
  standard: [
    { reps: 10, weight: 20 },
    { reps: 10, weight: 20 },
    { reps: 10, weight: 20 },
  ],
  pyramid: [
    { reps: 12, weight: 10 },
    { reps: 10, weight: 15 },
    { reps: 8, weight: 20 },
    { reps: 6, weight: 25 },
  ],
  bodyweight: [{ reps: 15 }, { reps: 12 }, { reps: 10 }],
  single: [{ reps: 10, weight: 50 }],
} as const;

/**
 * Workout plan routes
 */
export const WORKOUT_PLAN_ROUTES = {
  list: "/workout-plans",
  new: "/workout-plans/new",
  detail: (id: string) => `/workout-plans/${id}`,
  edit: (id: string) => `/workout-plans/${id}/edit`,
} as const;
