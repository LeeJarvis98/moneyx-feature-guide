import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/referral-chain?id=<userId>
 * Returns the full upline referral chain from ADMIN down to the specified user
 */

interface ReferralChainMember {
  userId: string;
  email: string;
  partnerRank: string; // "ADMIN" | "SALE" | "Vàng" | "Bạc" | "Đồng" | "None"
}

interface ReferralChain {
  userId: string;
  depth: number;
  directReferrerId: string | null;
  chain: ReferralChainMember[];  // ordered: [ADMIN, SALE, , currentUser]
  chainLength: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('id');

    console.log('[REFERRAL-CHAIN] Request received for ID:', userIdParam);

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Handle backward compatibility: if param looks like email, look up user ID
    let userId = userIdParam;
    if (userIdParam.includes('@')) {
      console.log('[REFERRAL-CHAIN] Email detected, looking up user ID...');
      const lookupStart = Date.now();
      const { data: user, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userIdParam)
        .maybeSingle();
      console.log(`[REFERRAL-CHAIN] Email lookup took ${Date.now() - lookupStart}ms`);

      if (emailError || !user) {
        console.error('[REFERRAL-CHAIN] User not found for email:', userIdParam, emailError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      userId = user.id;
      console.log('[REFERRAL-CHAIN] Found user ID:', userId);
    }

    console.log('[REFERRAL-CHAIN] Building chain for user:', userId);
    // Build the referral chain by recursively following referral_id
    const chain: ReferralChainMember[] = [];
    let currentUserId = userId;
    let depth = 0;
    let directReferrerId: string | null = null;

    // Start from the current user and traverse upward
    while (currentUserId) {
      const queryStart = Date.now();
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, partner_rank, referral_id')
        .eq('id', currentUserId)
        .single();
      console.log(`[REFERRAL-CHAIN] User query for ${currentUserId} took ${Date.now() - queryStart}ms`);

      if (error || !user) {
        console.error('[REFERRAL-CHAIN] Error fetching user:', currentUserId, error);
        break;
      }
      console.log('[REFERRAL-CHAIN] Found user:', user.id, user.email, user.partner_rank);

      // Add to chain (will reverse later to get top-down order)
      chain.unshift({
        userId: user.id,
        email: user.email,
        partnerRank: user.partner_rank,
      });

      // Find who referred this user
      if (user.referral_id) {
        console.log('[REFERRAL-CHAIN] Looking up referrer for referral_id:', user.referral_id);
        const refQueryStart = Date.now();
        const { data: referrer, error: refError } = await supabase
          .from('own_referral_id_list')
          .select('id')
          .eq('own_referral_id', user.referral_id)
          .single();
        console.log(`[REFERRAL-CHAIN] Referrer query took ${Date.now() - refQueryStart}ms`);

        if (!refError && referrer) {
          console.log('[REFERRAL-CHAIN] Found referrer:', referrer.id);
          
          // Prevent infinite loops: if referrer is the same as current user, stop
          if (referrer.id === currentUserId) {
            console.log('[REFERRAL-CHAIN] Self-referral detected, stopping chain traversal');
            break;
          }
          
          if (currentUserId === userId) {
            directReferrerId = referrer.id;
          }
          currentUserId = referrer.id;
          depth++;
        } else {
          console.log('[REFERRAL-CHAIN] No referrer found or error:', refError);
          break;
        }
      } else {
        console.log('[REFERRAL-CHAIN] User has no referral_id, end of chain');
        break;
      }

      // Safety limit to prevent infinite loops
      if (depth > 50) break;
    }

    const result: ReferralChain = {
      userId,
      depth,
      directReferrerId,
      chain, // Already in top-down order (ADMIN -> ... -> user)
      chainLength: chain.length,
    };

    const totalTime = Date.now() - startTime;
    console.log(`[REFERRAL-CHAIN] ✓ Complete! Chain length: ${chain.length}, Total time: ${totalTime}ms`);
    console.log('[REFERRAL-CHAIN] Chain:', chain.map(c => c.userId).join(' -> '));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[REFERRAL-CHAIN] ✗ Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
