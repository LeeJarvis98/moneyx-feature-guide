import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { partnerId, selectedPlatforms } = await request.json();

    // Validate input
    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(selectedPlatforms)) {
      return NextResponse.json(
        { error: 'Selected platforms must be an array' },
        { status: 400 }
      );
    }

    console.log('[UPDATE-SELECTED-PLATFORMS] Updating for partner:', partnerId);
    console.log('[UPDATE-SELECTED-PLATFORMS] Selected platforms:', selectedPlatforms);

    const supabase = getSupabaseClient();

    // Update the selected_platform column in partners table
    const { error: updateError } = await supabase
      .from('partners')
      .update({ selected_platform: selectedPlatforms })
      .eq('id', partnerId);

    if (updateError) {
      console.error('[UPDATE-SELECTED-PLATFORMS] Error updating selected platforms:', updateError);
      return NextResponse.json(
        { error: 'Failed to update selected platforms' },
        { status: 500 }
      );
    }

    console.log('[UPDATE-SELECTED-PLATFORMS] Successfully updated selected platforms');

    return NextResponse.json({
      success: true,
      selectedPlatforms,
    });
  } catch (error) {
    console.error('[UPDATE-SELECTED-PLATFORMS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
