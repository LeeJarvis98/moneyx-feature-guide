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
      licensed_accounts: {
        Row: {
          account_id: string
          email: string
          id: string | null
          licensed_date: string
          platform: string | null
          uid: string
        }
        Insert: {
          account_id: string
          email: string
          id?: string | null
          licensed_date?: string
          platform?: string | null
          uid: string
        }
        Update: {
          account_id?: string
          email?: string
          id?: string | null
          licensed_date?: string
          platform?: string | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "licensed_accounts_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      own_referral_id_list: {
        Row: {
          created_at: string
          id: string
          own_referral_id: string
        }
        Insert: {
          created_at?: string
          id: string
          own_referral_id: string
        }
        Update: {
          created_at?: string
          id?: string
          own_referral_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "own_referral_id_list_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rank_list: {
        Row: {
          partner_rank: string
          reward_percentage: number
        }
        Insert: {
          partner_rank: string
          reward_percentage: number
        }
        Update: {
          partner_rank?: string
          reward_percentage?: number
        }
        Relationships: []
      }
      partners: {
        Row: {
          accum_reward: number
          accum_time_remaining: number
          claim_reward: number
          claim_time_remaining: number
          created_at: string
          id: string
          last_claim_reward: number
          partner_rank: string
          platform_accounts: Json[]
          platform_ref_links: Json[]
          sub_partners: Json[]
          total_clients: number
          total_reward: number
          total_sub_partners: number
        }
        Insert: {
          accum_reward?: number
          accum_time_remaining?: number
          claim_reward?: number
          claim_time_remaining?: number
          created_at?: string
          id: string
          last_claim_reward?: number
          partner_rank?: string
          platform_accounts?: Json[]
          platform_ref_links?: Json[]
          sub_partners?: Json[]
          total_clients?: number
          total_reward?: number
          total_sub_partners?: number
        }
        Update: {
          accum_reward?: number
          accum_time_remaining?: number
          claim_reward?: number
          claim_time_remaining?: number
          created_at?: string
          id?: string
          last_claim_reward?: number
          partner_rank?: string
          platform_accounts?: Json[]
          platform_ref_links?: Json[]
          sub_partners?: Json[]
          total_clients?: number
          total_reward?: number
          total_sub_partners?: number
        }
        Relationships: [
          {
            foreignKeyName: "partners_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_partner_rank_fkey"
            columns: ["partner_rank"]
            isOneToOne: false
            referencedRelation: "partner_rank_list"
            referencedColumns: ["partner_rank"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          partner_rank: string
          password: string
          referral_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          partner_rank?: string
          password: string
          referral_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          partner_rank?: string
          password?: string
          referral_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_partner_rank_fkey"
            columns: ["partner_rank"]
            isOneToOne: false
            referencedRelation: "partner_rank_list"
            referencedColumns: ["partner_rank"]
          },
        ]
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
