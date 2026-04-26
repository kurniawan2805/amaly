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
        Relationships: []
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
        Relationships: []
      }
      quran_progress: {
        Row: {
          id: string
          user_id: string
          surah: number
          ayah: number
          page: number | null
          pages_read_today: number
          daily_goal: number
          last_page_read: number
          goal_completed_today: boolean
          completed_juzs: Json
          logs: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          surah: number
          ayah: number
          page?: number | null
          pages_read_today?: number
          daily_goal?: number
          last_page_read?: number
          goal_completed_today?: boolean
          completed_juzs?: Json
          logs?: Json
          updated_at?: string
        }
        Update: {
          surah?: number
          ayah?: number
          page?: number | null
          pages_read_today?: number
          daily_goal?: number
          last_page_read?: number
          goal_completed_today?: boolean
          completed_juzs?: Json
          logs?: Json
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      partner_invites: {
        Row: {
          id: string
          code: string
          created_by: string
          creator_role: "husband" | "wife"
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          created_by: string
          creator_role: "husband" | "wife"
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          code?: string
          creator_role?: "husband" | "wife"
          expires_at?: string
          accepted_at?: string | null
        }
        Relationships: []
      }
      partnerships: {
        Row: {
          id: string
          husband_id: string
          wife_id: string
          created_at: string
        }
        Insert: {
          id?: string
          husband_id: string
          wife_id: string
          created_at?: string
        }
        Update: {
          husband_id?: string
          wife_id?: string
        }
        Relationships: []
      }
      partner_events: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          event_type: "quran_goal" | "nudge"
          payload: Json
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          event_type: "quran_goal" | "nudge"
          payload?: Json
          created_at?: string
          read_at?: string | null
        }
        Update: {
          event_type?: "quran_goal" | "nudge"
          payload?: Json
          read_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      accept_partner_invite: {
        Args: {
          invite_code: string
          accepter_role: "husband" | "wife"
        }
        Returns: Database["public"]["Tables"]["partnerships"]["Row"]
      }
      are_partners: {
        Args: {
          target_user: string
        }
        Returns: boolean
      }
      partner_user_ids: {
        Args: {
          current_user?: string
        }
        Returns: {
          user_id: string
        }[]
      }
    }
    Enums: {
      partner_role: "husband" | "wife"
      partner_event_type: "quran_goal" | "nudge"
    }
    CompositeTypes: Record<string, never>
  }
}
