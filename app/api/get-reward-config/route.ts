import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { partnerId } = await request.json();

    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('partner_reward_configs')
      .select('*')
      .eq('partner_id', partnerId)
      .order('platform')
      .order('level');

    if (error) {
      console.error('[get-reward-config] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch reward config' }, { status: 500 });
    }

    return NextResponse.json({ configs: data ?? [] });
  } catch (err) {
    console.error('[get-reward-config] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
