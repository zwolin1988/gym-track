import type { SupabaseClient } from "@/db/supabase.client";
import type { CategoryDTO } from "@/types";

/**
 * Service class for categories-related operations
 */
export class CategoriesService {
  /**
   * Get all categories ordered by order_index
   *
   * @param supabase - Authenticated Supabase client
   * @returns Array of categories
   */
  async getCategories(supabase: SupabaseClient): Promise<CategoryDTO[]> {
    const { data, error } = await supabase.from("categories").select("*").order("order_index");

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get single category by ID
   *
   * @param id - Category UUID
   * @param supabase - Authenticated Supabase client
   * @returns Category details or null if not found
   */
  async getCategoryById(id: string, supabase: SupabaseClient): Promise<CategoryDTO | null> {
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data;
  }
}

// Export singleton instance
export const categoriesService = new CategoriesService();
