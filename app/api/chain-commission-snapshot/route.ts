import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import type { Tables } from '@/types/database.generated';

/**
 * GET /api/chain-commission-snapshot?id=<recipientId>
 * Returns pre-computed commission snapshot for all downline partners
 */

interface ChainCommissionRow {
  recipient_id: string;
  source_partner_id: string;
  source_email: string | null;
  source_rank: string;
  depth: number;
  chain_root_id: string | null;
  source_total_reward: number;
  commission_pool: number;
  tradi_fee: number;
  remaining_pool: number;
  your_role: 'admin' | 'direct' | 'indirect';
  your_cut: number;
  total_upliner_count: number;
  upliner_share: number;
  own_keep: number;
  total_chain_commission: number;
  snapshot_at: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const recipientIdParam = searchParams.get('id');

    console.log('[COMMISSION-SNAPSHOT] Request received for ID:', recipientIdParam);

    if (!recipientIdParam) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Handle backward compatibility: if param looks like email, look up user ID
    let recipientId = recipientIdParam;
    if (recipientIdParam.includes('@')) {
      console.log('[COMMISSION-SNAPSHOT] Email detected, looking up user ID...');
      const lookupStart = Date.now();
      const { data: user, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', recipientIdParam)
        .maybeSingle();
      console.log(`[COMMISSION-SNAPSHOT] Email lookup took ${Date.now() - lookupStart}ms`);

      if (emailError || !user) {
        console.error('[COMMISSION-SNAPSHOT] User not found for email:', recipientIdParam, emailError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      recipientId = user.id;
      console.log('[COMMISSION-SNAPSHOT] Found user ID:', recipientId);
    }

    console.log('[COMMISSION-SNAPSHOT] Fetching snapshots for user:', recipientId);

    // Fetch pre-computed snapshots from chain_commission_snapshots table
    const snapshotsQueryStart = Date.now();
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('chain_commission_snapshots')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('snapshot_at', { ascending: false });
    console.log(`[COMMISSION-SNAPSHOT] Snapshots query took ${Date.now() - snapshotsQueryStart}ms`);

    if (snapshotsError) {
      console.error('[COMMISSION-SNAPSHOT] Error fetching snapshots:', snapshotsError);
      return NextResponse.json(
        { error: 'Failed to fetch commission snapshot data' },
        { status: 500 }
      );
    }

    if (!snapshots || snapshots.length === 0) {
      console.log('[COMMISSION-SNAPSHOT] No snapshot data found for user:', recipientId);
      return NextResponse.json([], { status: 200 });
    }
    console.log(`[COMMISSION-SNAPSHOT] Found ${snapshots.length} snapshot records`);

    // Map snapshots to ChainCommissionRow format
    const rows: ChainCommissionRow[] = snapshots.map((snapshot) => ({
      recipient_id: snapshot.recipient_id,
      source_partner_id: snapshot.source_partner_id,
      source_email: snapshot.source_email,
      source_rank: snapshot.source_rank,
      depth: snapshot.depth,
      chain_root_id: snapshot.chain_root_id,
      source_total_reward: snapshot.source_total_reward,
      commission_pool: snapshot.commission_pool,
      tradi_fee: snapshot.tradi_fee,
      remaining_pool: snapshot.remaining_pool,
      your_role: snapshot.your_role as 'admin' | 'direct' | 'indirect',
      your_cut: snapshot.your_cut,
      total_upliner_count: snapshot.total_upliner_count,
      upliner_share: snapshot.upliner_share,
      own_keep: snapshot.own_keep,
      total_chain_commission: snapshot.total_chain_commission,
      snapshot_at: snapshot.snapshot_at,
    }));

    const totalTime = Date.now() - startTime;
    console.log(`[COMMISSION-SNAPSHOT] ✓ Complete! Returning ${rows.length} rows, Total time: ${totalTime}ms`);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('[COMMISSION-SNAPSHOT] ✗ Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
