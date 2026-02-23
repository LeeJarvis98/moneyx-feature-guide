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

    // Fetch all partner detail records for this user (one per platform)
    const { data: partnerDetails, error } = await supabase
      .from('partner_detail')
      .select('platform, total_client_lots')
      .eq('id', userId);

    if (error) {
      console.error('[get-partner-platform-details] Error fetching partner details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch partner platform details' },
        { status: 500 }
      );
    }

    // Transform array into a platform-keyed object for easier lookup
    // { "exness": { total_client_lots: 123.45 }, "binance": { total_client_lots: 67.89 } }
    const platformDetails = (partnerDetails || []).reduce((acc, detail) => {
      if (detail.platform) {
        acc[detail.platform] = {
          total_client_lots: detail.total_client_lots || 0,
        };
      }
      return acc;
    }, {} as Record<string, { total_client_lots: number }>);

    return NextResponse.json({
      success: true,
      platformDetails,
    });
  } catch (error) {
    console.error('[get-partner-platform-details] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
