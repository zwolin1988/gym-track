import { z } from "zod";

/**
 * Validation schema for GET /api/exercises query parameters
 */
export const getExercisesQuerySchema = z.object({
  category_id: z.string().uuid("Invalid category ID format").optional(),
  difficulty: z
    .string()
    .transform((val) => val.split(",").map((v) => v.trim().toLowerCase()))
    .pipe(z.array(z.enum(["easy", "medium", "hard"])))
    .optional(),
  search: z.string().min(1, "Search term must not be empty").optional(),
  page: z.coerce.number().int().positive("Page must be a positive integer").default(1),
  limit: z.coerce.number().int().positive().max(100, "Limit must not exceed 100").default(20),
});

/**
 * Validation schema for GET /api/exercises/{id} path parameters
 */
export const getExerciseByIdParamsSchema = z.object({
  id: z.string().uuid("Invalid exercise ID format"),
});
