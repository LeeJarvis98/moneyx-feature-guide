/**
 * Partner Rank Assignment Logic
 * 
 * Implements the Tradi partner level-up system for initial rank assignment
 * based on referral chain position.
 * 
 * @see docs/LEVEL_UP_SYSTEM.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type SupabaseClientType = SupabaseClient<Database>;

/**
 * System ranks that don't count toward chain position
 */
const SYSTEM_RANKS = new Set(['ADMIN', 'SALE', 'None']);

/**
 * Chain position to rank mapping (for positions 1-4)
 * Position 5+ gets 'Đồng' by default
 */
const CHAIN_POSITION_RANK: Record<number, string> = {
  1: 'Kim Cương',
  2: 'Bạch Kim',
  3: 'Vàng',
  4: 'Bạc',
};

/**
 * Walks the referral chain upward from the new user to count how many
 * standard partners already exist above them.
 * 
 * System ranks (ADMIN, SALE, None) are excluded from the count.
 * 
 * @param supabase - Supabase client instance
 * @param newUserReferralId - The referral code the new user entered at sign-up
 * @returns The number of standard partners strictly above the new user
 */
async function countStandardPartnersAbove(
  supabase: SupabaseClientType,
  newUserReferralId: string,
): Promise<number> {
  let count = 0;
  let currentReferralCode: string | null = newUserReferralId;
  const visitedUsers = new Set<string>(); // Track visited user IDs to prevent infinite loops
  const MAX_DEPTH = 100; // Safety limit to prevent infinite loops
  let depth = 0;

  console.log('[countStandardPartnersAbove] Starting chain walk with referral code:', newUserReferralId);

  while (currentReferralCode && depth < MAX_DEPTH) {
    depth++;
    console.log('[countStandardPartnersAbove] Depth:', depth, 'Current code:', currentReferralCode);

    // Find the user who OWNS this referral code
    const { data: owner, error: ownerError } = await supabase
      .from('own_referral_id_list')
      .select('id')
      .eq('own_referral_id', currentReferralCode)
      .maybeSingle() as { data: { id: string } | null; error: any };

    if (ownerError) {
      console.error('[countStandardPartnersAbove] Error fetching owner:', ownerError);
      break;
    }

    if (!owner) {
      // Referral code doesn't exist or chain ends
      console.log('[countStandardPartnersAbove] No owner found for code:', currentReferralCode);
      break;
    }

    // Check for circular reference
    if (visitedUsers.has(owner.id)) {
      console.log('[countStandardPartnersAbove] Circular reference detected for user:', owner.id, '- stopping chain walk');
      break;
    }
    visitedUsers.add(owner.id);

    // Fetch that owner's rank and their own referral_id (to keep walking up)
    const { data: ownerUser, error: userError } = await supabase
      .from('users')
      .select('partner_rank, referral_id')
      .eq('id', owner.id)
      .single() as { data: { partner_rank: string; referral_id: string | null } | null; error: any };

    if (userError) {
      console.error('[countStandardPartnersAbove] Error fetching user:', userError);
      break;
    }

    if (!ownerUser) {
      console.log('[countStandardPartnersAbove] No user data found for:', owner.id);
      break;
    }

    console.log('[countStandardPartnersAbove] Found user:', owner.id, 'Rank:', ownerUser.partner_rank);

    // Only count standard partners (exclude ADMIN, SALE, None)
    if (!SYSTEM_RANKS.has(ownerUser.partner_rank)) {
      count++;
      console.log('[countStandardPartnersAbove] Counted standard partner. Total count:', count);
    } else {
      console.log('[countStandardPartnersAbove] Skipping system rank:', ownerUser.partner_rank, '- stopping chain walk');
      // System ranks are at the top of the chain, no need to continue
      break;
    }

    // Check if user's referral_id is their own code (self-referencing)
    if (ownerUser.referral_id === currentReferralCode) {
      console.log('[countStandardPartnersAbove] Self-referencing detected - user referral_id equals current code');
      break;
    }

    // Move up the chain
    currentReferralCode = ownerUser.referral_id ?? null;
  }

  if (depth >= MAX_DEPTH) {
    console.warn('[countStandardPartnersAbove] Max depth reached. Possible infinite loop or very long chain.');
  }

  console.log('[countStandardPartnersAbove] Final count:', count, 'Depth:', depth);
  return count;
}

/**
 * Assigns initial rank to a new partner based on their position in the referral chain.
 * 
 * Chain position 1-4: Assigned high ranks with is_auto_ranked = true
 * Chain position 5+: Assigned 'Đồng' with is_auto_ranked = false
 * 
 * @param supabase - Supabase client instance
 * @param userId - The ID of the new partner user
 * @param newUserReferralId - The referral code the new user entered at sign-up
 */
export async function assignInitialRank(
  supabase: SupabaseClientType,
  userId: string,
  newUserReferralId: string,
): Promise<{ rank: string; isAutoRanked: boolean }> {
  try {
    console.log('[assignInitialRank] Starting for user:', userId, 'with referral code:', newUserReferralId);

    // Count standard partners in the chain above this user
    const standardAbove = await countStandardPartnersAbove(supabase, newUserReferralId);

    // New user's position = (standard partners above) + 1
    const chainPosition = standardAbove + 1;

    // Determine rank based on position
    const assignedRank = CHAIN_POSITION_RANK[chainPosition] ?? 'Đồng';
    const isAutoRanked = chainPosition <= 4;

    console.log('[assignInitialRank] User:', userId, {
      referralId: newUserReferralId,
      standardPartnersAbove: standardAbove,
      chainPosition,
      assignedRank,
      isAutoRanked,
    });

    // Update user's partner_rank and is_auto_ranked
    const { error: updateError } = await supabase
      .from('users')
      .update({
        partner_rank: assignedRank,
        is_auto_ranked: isAutoRanked,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[assignInitialRank] Error updating user rank:', updateError);
      throw updateError;
    }

    console.log('[assignInitialRank] Successfully updated user rank');
    return { rank: assignedRank, isAutoRanked };
  } catch (error) {
    console.error('[assignInitialRank] Unexpected error:', error);
    throw error;
  }
}

/**
 * Rank progression thresholds for displaying progress bars
 */
export const LOT_UPGRADE_THRESHOLDS: Record<string, number | null> = {
  'Đồng': 100,
  'Bạc': 500,
  'Vàng': 1_000,
  'Bạch Kim': 2_000,
  'Kim Cương': null, // max rank
};

export const NEXT_RANK: Record<string, string | null> = {
  'Đồng': 'Bạc',
  'Bạc': 'Vàng',
  'Vàng': 'Bạch Kim',
  'Bạch Kim': 'Kim Cương',
  'Kim Cương': null,
};

/**
 * Calculates rank progression information for display
 */
export function getRankProgress(currentRank: string, totalLots: number) {
  const requiredLots = LOT_UPGRADE_THRESHOLDS[currentRank];
  const nextRank = NEXT_RANK[currentRank];

  if (!requiredLots || !nextRank) {
    return {
      isMaxRank: true,
      nextRank: null,
      requiredLots: null,
      currentLots: totalLots,
      progress: 100,
      remainingLots: 0,
    };
  }

  return {
    isMaxRank: false,
    nextRank,
    requiredLots,
    currentLots: totalLots,
    progress: Math.min((totalLots / requiredLots) * 100, 100),
    remainingLots: Math.max(requiredLots - totalLots, 0),
  };
}
