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
      commission_distributions: {
        Row: {
          commission_pool: number
          created_at: string | null
          period_month: string
          recipient_amount: number
          recipient_partner_id: string
          recipient_type: string
          remaining_pool: number
          source_partner_id: string
          source_total_reward: number
          source_upline_share_pct: number
          tradi_fee: number
          upline_position: number
          uuid: string
        }
        Insert: {
          commission_pool?: number
          created_at?: string | null
          period_month: string
          recipient_amount?: number
          recipient_partner_id: string
          recipient_type: string
          remaining_pool?: number
          source_partner_id: string
          source_total_reward?: number
          source_upline_share_pct?: number
          tradi_fee?: number
          upline_position?: number
          uuid?: string
        }
        Update: {
          commission_pool?: number
          created_at?: string | null
          period_month?: string
          recipient_amount?: number
          recipient_partner_id?: string
          recipient_type?: string
          remaining_pool?: number
          source_partner_id?: string
          source_total_reward?: number
          source_upline_share_pct?: number
          tradi_fee?: number
          upline_position?: number
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_distributions_recipient_partner_id_fkey"
            columns: ["recipient_partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_distributions_source_partner_id_fkey"
            columns: ["source_partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_otps: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          otp: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          otp: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          otp?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      licensed_accounts: {
        Row: {
          account_id: string
          email: string
          id: string | null
          licensed_date: string
          licensed_status: string | null
          owner: string | null
          platform: string | null
          uid: string
        }
        Insert: {
          account_id: string
          email: string
          id?: string | null
          licensed_date?: string
          licensed_status?: string | null
          owner?: string | null
          platform?: string | null
          uid: string
        }
        Update: {
          account_id?: string
          email?: string
          id?: string | null
          licensed_date?: string
          licensed_status?: string | null
          owner?: string | null
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
      partner_detail: {
        Row: {
          accum_client_reward: number
          accum_partner_reward: number
          accum_refer_reward: number
          accum_time_remaining: number
          claim_time_remaining: number
          id: string
          partner_list: Json[]
          platform: string | null
          this_month_tradi_com: number
          total_client_lots: number
          total_client_reward: number
          total_clients: number
          total_partner_lots: number
          total_partner_reward: number
          total_partners: number
          total_refer_reward: number
          total_reward_history: Json[]
          total_tradi_com: number
          uid: string
          updated_at: string
        }
        Insert: {
          accum_client_reward: number
          accum_partner_reward: number
          accum_refer_reward: number
          accum_time_remaining?: number
          claim_time_remaining?: number
          id: string
          partner_list?: Json[]
          platform?: string | null
          this_month_tradi_com: number
          total_client_lots: number
          total_client_reward: number
          total_clients?: number
          total_partner_lots: number
          total_partner_reward: number
          total_partners?: number
          total_refer_reward: number
          total_reward_history?: Json[]
          total_tradi_com: number
          uid?: string
          updated_at?: string
        }
        Update: {
          accum_client_reward?: number
          accum_partner_reward?: number
          accum_refer_reward?: number
          accum_time_remaining?: number
          claim_time_remaining?: number
          id?: string
          partner_list?: Json[]
          platform?: string | null
          this_month_tradi_com?: number
          total_client_lots?: number
          total_client_reward?: number
          total_clients?: number
          total_partner_lots?: number
          total_partner_reward?: number
          total_partners?: number
          total_refer_reward?: number
          total_reward_history?: Json[]
          total_tradi_com?: number
          uid?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_detail_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rank_list: {
        Row: {
          lot_volume: number
          partner_rank: string
          reward_percentage: number
          upline_share_percentage: number | null
        }
        Insert: {
          lot_volume?: number
          partner_rank: string
          reward_percentage: number
          upline_share_percentage?: number | null
        }
        Update: {
          lot_volume?: number
          partner_rank?: string
          reward_percentage?: number
          upline_share_percentage?: number | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          platform_accounts: Json[]
          platform_ref_links: Json[]
          selected_platform: Json[]
          support_link: string | null
        }
        Insert: {
          created_at?: string
          id: string
          platform_accounts?: Json[]
          platform_ref_links?: Json[]
          selected_platform?: Json[]
          support_link?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          platform_accounts?: Json[]
          platform_ref_links?: Json[]
          selected_platform?: Json[]
          support_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
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
      active_account_ids: {
        Row: {
          account_id: string | null
        }
        Insert: {
          account_id?: string | null
        }
        Update: {
          account_id?: string | null
        }
        Relationships: []
      }
      monthly_referral_earnings: {
        Row: {
          direct_earned: number | null
          indirect_earned: number | null
          period_month: string | null
          recipient_partner_id: string | null
          source_count: number | null
          total_earned: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_distributions_recipient_partner_id_fkey"
            columns: ["recipient_partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
