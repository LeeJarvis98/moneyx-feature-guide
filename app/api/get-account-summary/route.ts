import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch all accounts for this user
    const { data: licensedAccounts, error } = await supabase
      .from('licensed_accounts')
      .select('email, lot_volume, reward, licensed_status, registered_at')
      .eq('owner', userId);

    if (error) {
      console.error('[get-account-summary] Error fetching licensed accounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch account summary' },
        { status: 500 }
      );
    }

    // Licensed accounts only (for email count and licensed ID count)
    const activeLicensedAccounts = (licensedAccounts || []).filter(
      acc => acc.licensed_status === 'licensed'
    );

    // Registered accounts (registered_at IS NOT NULL) — both licensed and unlicensed
    const registeredAccounts = (licensedAccounts || []).filter(
      acc => acc.registered_at != null
    );

    // Calculate summary statistics
    const uniqueEmails = new Set(activeLicensedAccounts.map(acc => acc.email));
    const totalRegisteredEmails = uniqueEmails.size;

    const totalLicensedAccounts = activeLicensedAccounts.length;

    // Lot volume and reward summed from all registered accounts (licensed + unlicensed)
    const totalLotVolume = registeredAccounts.reduce((sum, acc) => {
      return sum + (acc.lot_volume || 0);
    }, 0);

    const totalReward = registeredAccounts.reduce((sum, acc) => {
      return sum + (acc.reward || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalRegisteredEmails,
        totalLicensedAccounts,
        totalLotVolume,
        totalReward,
      },
    });
  } catch (error) {
    console.error('[get-account-summary] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
