import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { partnerId } = await request.json();

    // Validate input
    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    console.log('[GET-SELECTED-PLATFORMS] Fetching for partner:', partnerId);

    const supabase = getSupabaseClient();

    // Fetch the selected_platform column from partners table
    const { data, error } = await supabase
      .from('partners')
      .select('selected_platform')
      .eq('id', partnerId)
      .single();

    if (error) {
      console.error('[GET-SELECTED-PLATFORMS] Error fetching selected platforms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch selected platforms' },
        { status: 500 }
      );
    }

    const selectedPlatforms = data?.selected_platform || [];
    console.log('[GET-SELECTED-PLATFORMS] Found selected platforms:', selectedPlatforms);

    return NextResponse.json({
      success: true,
      selectedPlatforms,
    });
  } catch (error) {
    console.error('[GET-SELECTED-PLATFORMS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
