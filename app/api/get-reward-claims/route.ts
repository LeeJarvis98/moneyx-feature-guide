import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface UnlockedLevel {
  level: number;
  reward_usd: number;
  reward_text: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, platform, partnerId, unlockedLevels } = await request.json();

    if (!userId || !platform || !partnerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Sync: insert claim records for newly unlocked levels, ignore existing ones
    if (Array.isArray(unlockedLevels) && unlockedLevels.length > 0) {
      const rows = (unlockedLevels as UnlockedLevel[]).map((l) => ({
        user_id: userId,
        partner_id: partnerId,
        platform,
        level: l.level,
        reward_usd: l.reward_usd,
        reward_text: l.reward_text ?? null,
        status: 'not_claimed',
      }));

      const { error: upsertError } = await supabase
        .from('user_reward_claims')
        .upsert(rows, { onConflict: 'user_id,platform,level', ignoreDuplicates: true });

      if (upsertError) {
        console.error('[get-reward-claims] upsert error:', upsertError);
      }
    }

    // Fetch all claims for this user+platform ordered by level
    const { data: claims, error } = await supabase
      .from('user_reward_claims')
      .select('id, level, reward_usd, reward_text, status, chosen_reward, completed_at, created_at')
      .eq('user_id', userId)
      .eq('platform', platform)
      .order('level', { ascending: true });

    if (error) {
      console.error('[get-reward-claims] fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
    }

    return NextResponse.json({ claims: claims ?? [] });
  } catch (err) {
    console.error('[get-reward-claims] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
