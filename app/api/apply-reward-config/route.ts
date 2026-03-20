import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { partnerId, platform } = await request.json();

    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }
    if (!platform || typeof platform !== 'string') {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    const VALID_PLATFORMS = ['exness', 'lirunex'];
    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Step 1 — deactivate all platforms for this partner
    const { error: clearError } = await supabase
      .from('partner_reward_configs')
      .update({ is_applied: false })
      .eq('partner_id', partnerId);

    if (clearError) {
      console.error('[apply-reward-config] Error clearing is_applied:', clearError);
      return NextResponse.json({ error: 'Failed to apply reward config' }, { status: 500 });
    }

    // Step 2 — mark the selected platform as applied
    const { error: applyError } = await supabase
      .from('partner_reward_configs')
      .update({ is_applied: true })
      .eq('partner_id', partnerId)
      .eq('platform', platform);

    if (applyError) {
      console.error('[apply-reward-config] Error setting is_applied:', applyError);
      return NextResponse.json({ error: 'Failed to apply reward config' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[apply-reward-config] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
