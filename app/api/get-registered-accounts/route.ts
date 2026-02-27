import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

const formatTimestamp = (dateString: string | null): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('licensed_accounts')
      .select('account_id, email, uid, platform, licensed_date, licensed_status, registered_at, lot_volume, reward')
      .not('registered_at', 'is', null)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('[GET-REGISTERED-ACCOUNTS] Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const accounts = (data || []).map((row) => ({
      accountId: row.account_id,
      email: row.email,
      uid: row.uid,
      platform: row.platform || 'exness',
      licensedDate: formatTimestamp(row.licensed_date),
      licensedStatus: row.licensed_status ?? 'licensed',
      registeredAt: formatTimestamp(row.registered_at),
      lotVolume: row.lot_volume ?? 0,
      reward: row.reward ?? 0,
    }));

    return NextResponse.json({ success: true, data: accounts });
  } catch (err: any) {
    console.error('[GET-REGISTERED-ACCOUNTS] Server error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
