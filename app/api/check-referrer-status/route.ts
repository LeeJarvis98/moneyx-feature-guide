import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Check referrer's rank and role to determine available partner types
 * 
 * Logic:
 * - If the user was referred by someone with rank "Đồng" (lowest) OR role "ADMIN"/"SALE"
 * - Then only show "Đối tác Tradi" button (hide "Đại lí hệ thống" button)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Get current user's referral_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('referral_id')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('[check-referrer-status] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // If user doesn't exist or has no referral_id, allow both options
    if (!currentUser || !currentUser.referral_id) {
      return NextResponse.json({
        showOnlyTradi: false,
        reason: 'no_referrer',
      });
    }

    // Step 2: Find referrer by matching own_referral_id
    const { data: referralEntry, error: referralError } = await supabase
      .from('own_referral_id_list')
      .select('id')
      .eq('own_referral_id', currentUser.referral_id)
      .maybeSingle();

    if (referralError) {
      console.error('[check-referrer-status] Error fetching referral entry:', referralError);
      return NextResponse.json(
        { error: 'Failed to fetch referral data' },
        { status: 500 }
      );
    }

    // If no referrer found, allow both options
    if (!referralEntry) {
      return NextResponse.json({
        showOnlyTradi: false,
        reason: 'referrer_not_found',
      });
    }

    // Step 3: Get referrer's rank and status
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('partner_rank, status')
      .eq('id', referralEntry.id)
      .maybeSingle();

    if (referrerError) {
      console.error('[check-referrer-status] Error fetching referrer data:', referrerError);
      return NextResponse.json(
        { error: 'Failed to fetch referrer data' },
        { status: 500 }
      );
    }

    if (!referrer) {
      return NextResponse.json({
        showOnlyTradi: false,
        reason: 'referrer_data_not_found',
      });
    }

    // Step 4: Check if only Tradi button should be shown
    const isLowestRank = referrer.partner_rank === 'Đồng';
    const isAdminOrSale = referrer.status === 'ADMIN' || referrer.status === 'SALE';
    const showOnlyTradi = isLowestRank || isAdminOrSale;

    let reason = 'eligible_for_both';
    if (isLowestRank) {
      reason = 'referrer_lowest_rank';
    } else if (isAdminOrSale) {
      reason = 'referrer_admin_or_sale';
    }

    return NextResponse.json({
      showOnlyTradi,
      reason,
      referrerId: referralEntry.id,
      referrerRank: referrer.partner_rank,
      referrerStatus: referrer.status,
    });
  } catch (error) {
    console.error('[check-referrer-status] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
