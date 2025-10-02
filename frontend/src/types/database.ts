export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          credits_remaining: number
          total_generations: number
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          credits_remaining?: number
          total_generations?: number
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          credits_remaining?: number
          total_generations?: number
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      image_generations: {
        Row: {
          id: string
          user_id: string
          prompt: string
          negative_prompt: string | null
          style: string
          template_id: string | null
          parameters: Json
          image_url: string | null
          thumbnail_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          generation_time_ms: number | null
          seed: number | null
          is_public: boolean
          is_favorite: boolean
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          negative_prompt?: string | null
          style: string
          template_id?: string | null
          parameters: Json
          image_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          generation_time_ms?: number | null
          seed?: number | null
          is_public?: boolean
          is_favorite?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          negative_prompt?: string | null
          style?: string
          template_id?: string | null
          parameters?: Json
          image_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          generation_time_ms?: number | null
          seed?: number | null
          is_public?: boolean
          is_favorite?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          prompt_template: string
          negative_prompt_template: string | null
          default_parameters: Json
          preview_image_url: string | null
          is_active: boolean
          is_premium: boolean
          usage_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          prompt_template: string
          negative_prompt_template?: string | null
          default_parameters: Json
          preview_image_url?: string | null
          is_active?: boolean
          is_premium?: boolean
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          prompt_template?: string
          negative_prompt_template?: string | null
          default_parameters?: Json
          preview_image_url?: string | null
          is_active?: boolean
          is_premium?: boolean
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          default_style: string | null
          default_parameters: Json | null
          notification_preferences: Json | null
          privacy_settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          default_style?: string | null
          default_parameters?: Json | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          default_style?: string | null
          default_parameters?: Json | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type ImageGeneration = Database['public']['Tables']['image_generations']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']

export type InsertUserProfile = Database['public']['Tables']['user_profiles']['Insert']
export type InsertImageGeneration = Database['public']['Tables']['image_generations']['Insert']
export type InsertTemplate = Database['public']['Tables']['templates']['Insert']
export type InsertUserSettings = Database['public']['Tables']['user_settings']['Insert']

export type UpdateUserProfile = Database['public']['Tables']['user_profiles']['Update']
export type UpdateImageGeneration = Database['public']['Tables']['image_generations']['Update']
export type UpdateTemplate = Database['public']['Tables']['templates']['Update']
export type UpdateUserSettings = Database['public']['Tables']['user_settings']['Update']
