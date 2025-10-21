import type { SupabaseClient } from "@/db/supabase.client";
import type {
  ExerciseListItemDTO,
  ExerciseDetailDTO,
  ExercisesPaginatedResponseDTO,
  PaginationMetadataDTO,
} from "@/types";

interface GetExercisesFilters {
  category_id?: string;
  difficulty?: string[];
  search?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Service class for exercises-related operations
 */
export class ExercisesService {
  /**
   * Get paginated list of exercises with optional filters
   *
   * @param filters - Optional filters (category_id, difficulty, search)
   * @param pagination - Pagination parameters (page, limit)
   * @param supabase - Authenticated Supabase client
   * @returns Paginated exercises response with metadata
   */
  async getExercises(
    filters: GetExercisesFilters,
    pagination: PaginationParams,
    supabase: SupabaseClient
  ): Promise<ExercisesPaginatedResponseDTO> {
    // Start building query with category join
    let query = supabase.from("exercises").select("*, category:categories(id, name, slug)", { count: "exact" });

    // Apply filters if provided
    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      query = query.in("difficulty", filters.difficulty);
    }

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    // Calculate pagination offset
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    // Execute query with ordering
    const { data, error, count } = await query.order("name");

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    // Transform database results to DTOs
    const exercises: ExerciseListItemDTO[] = (data || []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      image_path: exercise.image_path,
      image_alt: exercise.image_alt,
      difficulty: exercise.difficulty,
      created_at: exercise.created_at,
      category: {
        id: exercise.category.id,
        name: exercise.category.name,
        slug: exercise.category.slug,
      },
    }));

    // Calculate pagination metadata
    const total = count || 0;
    const total_pages = Math.ceil(total / pagination.limit);

    const paginationMetadata: PaginationMetadataDTO = {
      page: pagination.page,
      limit: pagination.limit,
      total,
      total_pages,
    };

    return {
      data: exercises,
      pagination: paginationMetadata,
    };
  }

  /**
   * Get single exercise by ID with full details
   *
   * @param id - Exercise UUID
   * @param supabase - Authenticated Supabase client
   * @returns Exercise details or null if not found
   */
  async getExerciseById(id: string, supabase: SupabaseClient): Promise<ExerciseDetailDTO | null> {
    const { data, error } = await supabase
      .from("exercises")
      .select("*, category:categories(id, name, slug, description, image_path)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    // Transform database result to DTO
    const exercise: ExerciseDetailDTO = {
      id: data.id,
      name: data.name,
      description: data.description,
      image_path: data.image_path,
      image_alt: data.image_alt,
      difficulty: data.difficulty,
      created_at: data.created_at,
      category: {
        id: data.category.id,
        name: data.category.name,
        slug: data.category.slug,
        description: data.category.description,
        image_path: data.category.image_path,
      },
    };

    return exercise;
  }
}

// Export singleton instance
export const exercisesService = new ExercisesService();
