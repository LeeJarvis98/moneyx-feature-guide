/**
 * Supabase Database Types
 * 
 * TypeScript types for Supabase database tables
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          referral_id: string;
          email: string;
          password: string;
          status: 'active' | 'banned' | 'cancelled' | 'hold' | 'terminated';
          partner_rank: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          referral_id?: string;
          email: string;
          password: string;
          status?: 'active' | 'banned' | 'cancelled' | 'hold' | 'terminated';
          partner_rank?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          referral_id?: string;
          email?: string;
          password?: string;
          status?: 'active' | 'banned' | 'cancelled' | 'hold' | 'terminated';
          partner_rank?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      licensed_accounts: {
        Row: {
          email: string;
          uid: string;
          account_id: string;
          licensed_at: string;
        };
        Insert: {
          email?: string;
          uid?: string;
          account_id?: string;
          licensed_at?: string;
        };
        Update: {
          email?: string;
          uid?: string;
          account_id?: string;
          licensed_at?: string;
        };
      };
    };
  };
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type LicensedAccount = Database['public']['Tables']['licensed_accounts']['Row'];
export type LicensedAccountInsert = Database['public']['Tables']['licensed_accounts']['Insert'];
export type LicensedAccountUpdate = Database['public']['Tables']['licensed_accounts']['Update'];