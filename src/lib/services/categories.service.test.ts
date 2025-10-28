/**
 * Integration Tests - Categories Service
 *
 * Example service layer tests with mocked Supabase client
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoriesService } from "./categories.service";
import { createMockSupabaseClient } from "@/test/utils";

describe("CategoriesService", () => {
  let categoriesService: CategoriesService;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    categoriesService = new CategoriesService();
    mockSupabaseClient = createMockSupabaseClient();
  });

  describe("getCategories", () => {
    it("should fetch all categories successfully", async () => {
      // Arrange
      const mockCategories = [
        {
          id: "cat-1",
          name: "Chest",
          slug: "chest",
          description: "Chest exercises",
          image_path: "/images/chest.jpg",
          image_alt: "Chest",
          order_index: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: "cat-2",
          name: "Back",
          slug: "back",
          description: "Back exercises",
          image_path: "/images/back.jpg",
          image_alt: "Back",
          order_index: 2,
          created_at: new Date().toISOString(),
        },
      ];

      // Mock Supabase response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient as any).from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        }),
      });

      // Act
      const result = await categoriesService.getCategories(mockSupabaseClient);

      // Assert
      expect(result).toEqual(mockCategories);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("categories");
    });

    it("should throw error when Supabase query fails", async () => {
      // Arrange
      const mockError = { message: "Database connection failed" };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient as any).from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      // Act & Assert
      await expect(categoriesService.getCategories(mockSupabaseClient)).rejects.toThrow("Failed to fetch categories");
    });

    it("should return empty array when no categories exist", async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient as any).from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Act
      const result = await categoriesService.getCategories(mockSupabaseClient);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("getCategoryById", () => {
    it("should fetch single category by id", async () => {
      // Arrange
      const mockCategory = {
        id: "cat-1",
        name: "Chest",
        slug: "chest",
        description: "Chest exercises",
        image_path: "/images/chest.jpg",
        image_alt: "Chest",
        order_index: 1,
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient as any).from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCategory,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await categoriesService.getCategoryById("cat-1", mockSupabaseClient);

      // Assert
      expect(result).toEqual(mockCategory);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("categories");
    });

    it("should return null when category not found", async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabaseClient as any).from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" }, // PostgreSQL not found error
            }),
          }),
        }),
      });

      // Act
      const result = await categoriesService.getCategoryById("non-existent-id", mockSupabaseClient);

      // Assert
      expect(result).toBeNull();
    });
  });
});
