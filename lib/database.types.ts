export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brand_memory: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          memory_type: string
          performance_score: number | null
          source_post_id: string | null
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          memory_type: string
          performance_score?: number | null
          source_post_id?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          memory_type?: string
          performance_score?: number | null
          source_post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_memory_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          fetched_at: string | null
          id: string
          impressions: number | null
          likes: number | null
          platform: string
          post_id: string | null
          reach: number | null
          shares: number | null
        }
        Insert: {
          fetched_at?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform: string
          post_id?: string | null
          reach?: number | null
          shares?: number | null
        }
        Update: {
          fetched_at?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          post_id?: string | null
          reach?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_variants: {
        Row: {
          content: string
          created_at: string | null
          cta: string | null
          hook: string | null
          id: string
          performance_data: Json | null
          post_id: string
          selected: boolean | null
          variant_label: string
        }
        Insert: {
          content: string
          created_at?: string | null
          cta?: string | null
          hook?: string | null
          id?: string
          performance_data?: Json | null
          post_id: string
          selected?: boolean | null
          variant_label: string
        }
        Update: {
          content?: string
          created_at?: string | null
          cta?: string | null
          hook?: string | null
          id?: string
          performance_data?: Json | null
          post_id?: string
          selected?: boolean | null
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_variants_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_feedback: Json | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          journey_stage: string | null
          platforms: string[]
          publish_results: Json | null
          published_at: string | null
          review_status: string | null
          scheduled_for: string | null
          status: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_feedback?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          journey_stage?: string | null
          platforms?: string[]
          publish_results?: Json | null
          published_at?: string | null
          review_status?: string | null
          scheduled_for?: string | null
          status?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_feedback?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          journey_stage?: string | null
          platforms?: string[]
          publish_results?: Json | null
          published_at?: string | null
          review_status?: string | null
          scheduled_for?: string | null
          status?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bonus_posts: number | null
          company_name: string | null
          content_pillars: Json | null
          created_at: string
          full_name: string | null
          goals: string[] | null
          id: string
          industry: string | null
          latest_strategy: Json | null
          niche: string | null
          offerings: string | null
          onboarding_completed: boolean | null
          plan_status: string | null
          referral_code: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          subscription_status: string
          subscription_tier: string
          target_audience: string | null
          tone_of_voice: string | null
          trial_claimed: boolean
          trial_ends_at: string | null
          trial_starts_at: string | null
          updated_at: string
        }
        Insert: {
          bonus_posts?: number | null
          company_name?: string | null
          content_pillars?: Json | null
          created_at?: string
          full_name?: string | null
          goals?: string[] | null
          id: string
          industry?: string | null
          latest_strategy?: Json | null
          niche?: string | null
          offerings?: string | null
          onboarding_completed?: boolean | null
          plan_status?: string | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          target_audience?: string | null
          tone_of_voice?: string | null
          trial_claimed?: boolean
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string
        }
        Update: {
          bonus_posts?: number | null
          company_name?: string | null
          content_pillars?: Json | null
          created_at?: string
          full_name?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          latest_strategy?: Json | null
          niche?: string | null
          offerings?: string | null
          onboarding_completed?: boolean | null
          plan_status?: string | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          target_audience?: string | null
          tone_of_voice?: string | null
          trial_claimed?: boolean
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          updated_at: string | null
          window_start: number
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string | null
          window_start: number
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string | null
          window_start?: number
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          provider: string
          provider_account_id: string | null
          provider_account_name: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          provider: string
          provider_account_id?: string | null
          provider_account_name?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          provider?: string
          provider_account_id?: string | null
          provider_account_name?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      strategy_reports: {
        Row: {
          generated_at: string | null
          id: string
          period_end: string
          period_start: string
          report_data: Json
          user_id: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          period_end: string
          period_start: string
          report_data: Json
          user_id: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invite_token: string | null
          invited_email: string
          member_id: string | null
          owner_id: string | null
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invite_token?: string | null
          invited_email: string
          member_id?: string | null
          owner_id?: string | null
          role: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invite_token?: string | null
          invited_email?: string
          member_id?: string | null
          owner_id?: string | null
          role?: string
        }
        Relationships: []
      }
      usage: {
        Row: {
          id: string
          images_count: number | null
          period: string
          posts_count: number | null
          updated_at: string | null
          user_id: string
          videos_count: number | null
        }
        Insert: {
          id?: string
          images_count?: number | null
          period: string
          posts_count?: number | null
          updated_at?: string | null
          user_id: string
          videos_count?: number | null
        }
        Update: {
          id?: string
          images_count?: number | null
          period?: string
          posts_count?: number | null
          updated_at?: string | null
          user_id?: string
          videos_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number | null
          last_post_date: string | null
          longest_streak: number | null
          total_posts_all_time: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          last_post_date?: string | null
          longest_streak?: number | null
          total_posts_all_time?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          last_post_date?: string | null
          longest_streak?: number | null
          total_posts_all_time?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          operation_name: string
          platform: string | null
          prompt: string | null
          status: string | null
          user_id: string
          video_uri: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          operation_name: string
          platform?: string | null
          prompt?: string | null
          status?: string | null
          user_id: string
          video_uri?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          operation_name?: string
          platform?: string | null
          prompt?: string | null
          status?: string | null
          user_id?: string
          video_uri?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_operations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_ms: number }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
