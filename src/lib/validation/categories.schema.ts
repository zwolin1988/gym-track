import { z } from "zod";

/**
 * Validation schema for GET /api/categories/{id} path parameters
 */
export const getCategoryByIdParamsSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});
