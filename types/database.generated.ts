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
      bot_feature: {
        Row: {
          feature: string | null
        }
        Insert: {
          feature?: string | null
        }
        Update: {
          feature?: string | null
        }
        Relationships: []
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
          entry_reward: number | null
          entry_volume_lots: number | null
          id: string | null
          licensed_date: string
          licensed_status: string | null
          lot_volume: number | null
          owner: string | null
          platform: string | null
          registered_at: string | null
          reward: number | null
          uid: string
        }
        Insert: {
          account_id: string
          email: string
          entry_reward?: number | null
          entry_volume_lots?: number | null
          id?: string | null
          licensed_date?: string
          licensed_status?: string | null
          lot_volume?: number | null
          owner?: string | null
          platform?: string | null
          registered_at?: string | null
          reward?: number | null
          uid: string
        }
        Update: {
          account_id?: string
          email?: string
          entry_reward?: number | null
          entry_volume_lots?: number | null
          id?: string | null
          licensed_date?: string
          licensed_status?: string | null
          lot_volume?: number | null
          owner?: string | null
          platform?: string | null
          registered_at?: string | null
          reward?: number | null
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
          {
            foreignKeyName: "licensed_accounts_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      network_snapshots: {
        Row: {
          depth: number
          email: string | null
          id: string
          node_key: string
          owner_id: string
          parent_user_id: string | null
          platform: string
          role: string
          role_color: string
          snapshot_id: string
          snapshotted_at: string
          total_lots: number
          total_reward_usd: number
          user_id: string
        }
        Insert: {
          depth?: number
          email?: string | null
          id?: string
          node_key: string
          owner_id: string
          parent_user_id?: string | null
          platform?: string
          role: string
          role_color?: string
          snapshot_id: string
          snapshotted_at?: string
          total_lots?: number
          total_reward_usd?: number
          user_id: string
        }
        Update: {
          depth?: number
          email?: string | null
          id?: string
          node_key?: string
          owner_id?: string
          parent_user_id?: string | null
          platform?: string
          role?: string
          role_color?: string
          snapshot_id?: string
          snapshotted_at?: string
          total_lots?: number
          total_reward_usd?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_snapshots_owner_id_fkey"
            columns: ["owner_id"]
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
          {
            foreignKeyName: "own_referral_id_list_id_fkey1"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_detail: {
        Row: {
          id: string
          platform: string | null
          total_client_lots: number
          total_client_reward: number
          total_clients: number
          total_partner_lots: number
          total_partner_reward: number
          total_partners: number
          updated_at: string
          uuid: string
        }
        Insert: {
          id: string
          platform?: string | null
          total_client_lots: number
          total_client_reward: number
          total_clients?: number
          total_partner_lots: number
          total_partner_reward: number
          total_partners?: number
          updated_at?: string
          uuid?: string
        }
        Update: {
          id?: string
          platform?: string | null
          total_client_lots?: number
          total_client_reward?: number
          total_clients?: number
          total_partner_lots?: number
          total_partner_reward?: number
          total_partners?: number
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_detail_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_detail_id_fkey1"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          agreement_token: string | null
          agreement_token_expires_at: string | null
          congrats_shown: boolean
          created_at: string
          id: string
          platform_accounts: Json[]
          platform_ref_links: Json[]
          selected_platform: Json[]
          status: string
          support_link: string | null
        }
        Insert: {
          agreement_token?: string | null
          agreement_token_expires_at?: string | null
          congrats_shown?: boolean
          created_at?: string
          id: string
          platform_accounts?: Json[]
          platform_ref_links?: Json[]
          selected_platform?: Json[]
          status?: string
          support_link?: string | null
        }
        Update: {
          agreement_token?: string | null
          agreement_token_expires_at?: string | null
          congrats_shown?: boolean
          created_at?: string
          id?: string
          platform_accounts?: Json[]
          platform_ref_links?: Json[]
          selected_platform?: Json[]
          status?: string
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
          password: string
          referral_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          password: string
          referral_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password?: string
          referral_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
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
