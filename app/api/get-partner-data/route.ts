import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch partner data (excluding platform_ref_links)
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select(`
        id,
        created_at,
        partner_type,
        partner_list,
        platform_accounts,
        total_clients,
        total_client_lots,
        total_client_reward,
        total_partners,
        total_partner_lots,
        total_partner_reward,
        total_refer_reward,
        total_tradi_com,
        this_month_tradi_com,
        accum_client_reward,
        accum_partner_reward,
        accum_refer_reward,
        accum_time_remaining,
        claim_client_reward,
        claim_partner_reward,
        claim_refer_reward,
        claim_time_remaining,
        last_claim_client_reward,
        last_claim_partner_reward,
        last_claim_refer_reward
      `)
      .eq('id', userId)
      .single();

    if (partnerError) {
      console.error('Error fetching partner data:', partnerError);
      return NextResponse.json(
        { error: 'Failed to fetch partner data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: partnerData,
    });
  } catch (error) {
    console.error('Error in get-partner-data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
