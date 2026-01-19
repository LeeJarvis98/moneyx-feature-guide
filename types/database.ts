/**
 * Supabase Database Helper Types
 * 
 * Re-exports from database.generated.ts with convenient helper types
 * 
 * To regenerate types from Supabase:
 * npm run types:generate
 */

import type { Database, Tables, TablesInsert, TablesUpdate } from './database.generated';

// Re-export Database type
export type { Database };

// User types
export type User = Tables<'users'>;
export type UserInsert = TablesInsert<'users'>;
export type UserUpdate = TablesUpdate<'users'>;

// Licensed Account types
export type LicensedAccount = Tables<'licensed_accounts'>;
export type LicensedAccountInsert = TablesInsert<'licensed_accounts'>;
export type LicensedAccountUpdate = TablesUpdate<'licensed_accounts'>;

// Partner types
export type Partner = Tables<'partners'>;
export type PartnerInsert = TablesInsert<'partners'>;
export type PartnerUpdate = TablesUpdate<'partners'>;

// Partner Rank List types
export type PartnerRank = Tables<'partner_rank_list'>;
export type PartnerRankInsert = TablesInsert<'partner_rank_list'>;
export type PartnerRankUpdate = TablesUpdate<'partner_rank_list'>;

// Own Referral ID List types
export type OwnReferralId = Tables<'own_referral_id_list'>;
export type OwnReferralIdInsert = TablesInsert<'own_referral_id_list'>;
export type OwnReferralIdUpdate = TablesUpdate<'own_referral_id_list'>;