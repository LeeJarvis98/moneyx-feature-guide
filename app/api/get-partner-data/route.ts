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

    // Fetch partner data from partners table
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('id, created_at, platform_accounts, platform_ref_links, selected_platform, support_link')
      .eq('id', userId)
      .single();

    if (partnerError) {
      console.error('Error fetching partner data:', partnerError);
      return NextResponse.json(
        { error: 'Failed to fetch partner data' },
        { status: 500 }
      );
    }

    // Fetch partner detail data from partner_detail table
    const { data: partnerDetailData, error: detailError } = await supabase
      .from('partner_detail')
      .select(`
        id,
        uuid,
        platform,
        total_clients,
        total_client_lots,
        total_client_reward,
        total_partners,
        total_partner_lots,
        total_partner_reward,
        updated_at
      `)
      .eq('id', userId)
      .maybeSingle();

    if (detailError) {
      console.error('Error fetching partner detail data:', detailError);
    }

    // Merge all data sets
    const combinedData = Object.assign(
      {},
      partnerData,
      partnerDetailData || {}
    );

    return NextResponse.json({
      success: true,
      data: combinedData,
    });
  } catch (error) {
    console.error('Error in get-partner-data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
