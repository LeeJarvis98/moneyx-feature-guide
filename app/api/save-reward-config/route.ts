import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface LevelPayload {
  level: number;
  lot_volume: number;
  reward_usd: number;
  reward_text?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { partnerId, platform, levels } = await request.json();

    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }
    if (!platform || typeof platform !== 'string') {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }
    if (!Array.isArray(levels) || levels.length === 0) {
      return NextResponse.json({ error: 'Levels array is required' }, { status: 400 });
    }

    for (const lvl of levels as LevelPayload[]) {
      if (typeof lvl.level !== 'number' || lvl.level < 0 || lvl.level > 10) {
        return NextResponse.json(
          { error: `Invalid level: ${lvl.level}` },
          { status: 400 },
        );
      }
      if (typeof lvl.lot_volume !== 'number' || lvl.lot_volume < 0) {
        return NextResponse.json({ error: 'Invalid lot_volume' }, { status: 400 });
      }
      if (typeof lvl.reward_usd !== 'number' || lvl.reward_usd < 0) {
        return NextResponse.json({ error: 'Invalid reward_usd' }, { status: 400 });
      }
    }

    const supabase = getSupabaseClient();

    const rows = (levels as LevelPayload[]).map((lvl) => ({
      partner_id: partnerId,
      platform,
      level: lvl.level,
      lot_volume: lvl.lot_volume,
      reward_usd: lvl.reward_usd,
      reward_text: lvl.reward_text ?? null,
      avatar_url: lvl.avatar_url ?? null,
      is_active: lvl.is_active,
    }));

    const { error } = await supabase
      .from('partner_reward_configs')
      .upsert(rows, { onConflict: 'partner_id,platform,level' });

    if (error) {
      console.error('[save-reward-config] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save reward config' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[save-reward-config] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

