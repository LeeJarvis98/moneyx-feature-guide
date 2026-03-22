import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, claimId, chosenReward } = await request.json();

    if (!userId || !claimId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (chosenReward !== undefined && !['usd', 'text'].includes(chosenReward)) {
      return NextResponse.json({ error: 'Invalid chosenReward value' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify ownership and current status
    const { data: claim, error: fetchError } = await supabase
      .from('user_reward_claims')
      .select('id, user_id, status')
      .eq('id', claimId)
      .single();

    if (fetchError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (claim.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (claim.status !== 'not_claimed') {
      return NextResponse.json({ error: 'Claim already processed' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('user_reward_claims')
      .update({
        status: 'processing',
        chosen_reward: chosenReward ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('[claim-reward] update error:', updateError);
      return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[claim-reward] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
