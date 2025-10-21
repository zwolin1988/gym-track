export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_alt: string | null;
          image_path: string | null;
          name: string;
          order_index: number;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_alt?: string | null;
          image_path?: string | null;
          name: string;
          order_index?: number;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_alt?: string | null;
          image_path?: string | null;
          name?: string;
          order_index?: number;
          slug?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          difficulty: Database["public"]["Enums"]["difficulty_level"];
          id: string;
          image_alt: string | null;
          image_path: string | null;
          name: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          difficulty: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          image_alt?: string | null;
          image_path?: string | null;
          name: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          image_alt?: string | null;
          image_path?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_exercise_sets: {
        Row: {
          created_at: string;
          id: string;
          order_index: number;
          plan_exercise_id: string;
          reps: number;
          user_id: string;
          weight: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_index?: number;
          plan_exercise_id: string;
          reps: number;
          user_id: string;
          weight?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_index?: number;
          plan_exercise_id?: string;
          reps?: number;
          user_id?: string;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "plan_exercise_sets_plan_exercise_id_fkey";
            columns: ["plan_exercise_id"];
            isOneToOne: false;
            referencedRelation: "plan_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          order_index: number;
          plan_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          order_index?: number;
          plan_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          order_index?: number;
          plan_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_exercises_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          order_index: number;
          user_id: string;
          workout_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          order_index?: number;
          user_id: string;
          workout_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          order_index?: number;
          user_id?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_plans: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          last_used_at: string | null;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          last_used_at?: string | null;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          last_used_at?: string | null;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_sets: {
        Row: {
          actual_reps: number | null;
          actual_weight: number | null;
          completed: boolean;
          created_at: string;
          id: string;
          note: string | null;
          order_index: number;
          planned_reps: number;
          planned_weight: number | null;
          user_id: string;
          workout_exercise_id: string;
        };
        Insert: {
          actual_reps?: number | null;
          actual_weight?: number | null;
          completed?: boolean;
          created_at?: string;
          id?: string;
          note?: string | null;
          order_index?: number;
          planned_reps: number;
          planned_weight?: number | null;
          user_id: string;
          workout_exercise_id: string;
        };
        Update: {
          actual_reps?: number | null;
          actual_weight?: number | null;
          completed?: boolean;
          created_at?: string;
          id?: string;
          note?: string | null;
          order_index?: number;
          planned_reps?: number;
          planned_weight?: number | null;
          user_id?: string;
          workout_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_exercise_id_fkey";
            columns: ["workout_exercise_id"];
            isOneToOne: false;
            referencedRelation: "workout_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_stats: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          max_weight: number | null;
          total_exercises: number;
          total_reps: number;
          total_sets: number;
          total_volume: number;
          user_id: string;
          workout_id: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          id?: string;
          max_weight?: number | null;
          total_exercises: number;
          total_reps: number;
          total_sets: number;
          total_volume?: number;
          user_id: string;
          workout_id: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          max_weight?: number | null;
          total_exercises?: number;
          total_reps?: number;
          total_sets?: number;
          total_volume?: number;
          user_id?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_stats_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: true;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workouts: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          plan_id: string;
          started_at: string;
          status: Database["public"]["Enums"]["workout_status"];
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          plan_id: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["workout_status"];
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          plan_id?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["workout_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_options: {
        Args: { "": unknown };
        Returns: undefined;
      };
      gtrgm_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      set_limit: {
        Args: { "": number };
        Returns: number;
      };
      show_limit: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      show_trgm: {
        Args: { "": string };
        Returns: string[];
      };
    };
    Enums: {
      difficulty_level: "easy" | "medium" | "hard";
      workout_status: "active" | "completed" | "cancelled";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      difficulty_level: ["easy", "medium", "hard"],
      workout_status: ["active", "completed", "cancelled"],
    },
  },
} as const;
