import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Assigns an initial partner rank based on chain position.
 * Stub implementation  the partner_rank column / partner_rank_list table
 * are not yet present in the database schema.
 */
export async function assignInitialRank(
  _supabase: SupabaseClient,
  _userId: string,
  _referralCode: string | null | undefined,
): Promise<{ rank: string }> {
  return { rank: 'None' };
}
