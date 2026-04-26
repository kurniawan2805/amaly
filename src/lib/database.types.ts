export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          user_id: string
          habit_key: string
          completed_on: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_key: string
          completed_on: string
          created_at?: string
        }
        Update: {
          habit_key?: string
          completed_on?: string
        }
      }
      quran_progress: {
        Row: {
          id: string
          user_id: string
          surah: number
          ayah: number
          page: number | null
          pages_read_today: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          surah: number
          ayah: number
          page?: number | null
          pages_read_today?: number
          updated_at?: string
        }
        Update: {
          surah?: number
          ayah?: number
          page?: number | null
          pages_read_today?: number
          updated_at?: string
        }
      }
      fasting_days: {
        Row: {
          id: string
          user_id: string
          fasted_on: string
          fast_type: "qadha" | "sunnah" | "ramadan" | "other"
          status: "planned" | "completed" | "missed"
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          fasted_on: string
          fast_type: "qadha" | "sunnah" | "ramadan" | "other"
          status?: "planned" | "completed" | "missed"
          notes?: string | null
          created_at?: string
        }
        Update: {
          fasted_on?: string
          fast_type?: "qadha" | "sunnah" | "ramadan" | "other"
          status?: "planned" | "completed" | "missed"
          notes?: string | null
        }
      }
      cycle_entries: {
        Row: {
          id: string
          user_id: string
          entry_on: string
          phase: string | null
          flow: string | null
          mood: string | null
          symptoms: string[]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_on: string
          phase?: string | null
          flow?: string | null
          mood?: string | null
          symptoms?: string[]
          notes?: string | null
          created_at?: string
        }
        Update: {
          entry_on?: string
          phase?: string | null
          flow?: string | null
          mood?: string | null
          symptoms?: string[]
          notes?: string | null
        }
      }
      user_settings: {
        Row: {
          user_id: string
          daily_quran_goal_pages: number
          qadha_days_remaining: number
          reminder_settings: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          daily_quran_goal_pages?: number
          qadha_days_remaining?: number
          reminder_settings?: Json
          updated_at?: string
        }
        Update: {
          daily_quran_goal_pages?: number
          qadha_days_remaining?: number
          reminder_settings?: Json
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
