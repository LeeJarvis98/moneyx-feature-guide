import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/network-snapshot?owner_id=<userId>&platform=<platform>
 * Returns the current network snapshot for the given owner.
 * Each owner+platform combination holds exactly one current state 
 * rows are refreshed (delete  insert) rather than accumulated.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerIdParam = searchParams.get('owner_id');
    const platform = searchParams.get('platform') ?? 'exness';

    if (!ownerIdParam) {
      return NextResponse.json({ error: 'owner_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Support email lookup for backward compatibility
    let ownerId = ownerIdParam;
    if (ownerIdParam.includes('@')) {
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', ownerIdParam)
        .maybeSingle();

      if (error || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      ownerId = user.id;
    }

    const { data, error } = await supabase
      .from('network_snapshots')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('platform', platform)
      .order('depth', { ascending: true });

    if (error) {
      console.error('[NETWORK-SNAPSHOT] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch network snapshot' }, { status: 500 });
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error('[NETWORK-SNAPSHOT] Fatal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
