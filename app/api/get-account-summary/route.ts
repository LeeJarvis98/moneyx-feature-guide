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

    // Fetch all licensed accounts for this user (where owner = userId)
    const { data: licensedAccounts, error } = await supabase
      .from('licensed_accounts')
      .select('email, lot_volume, reward, licensed_status')
      .eq('owner', userId);

    if (error) {
      console.error('[get-account-summary] Error fetching licensed accounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch account summary' },
        { status: 500 }
      );
    }

    // Filter only accounts with licensed status
    const activeLicensedAccounts = (licensedAccounts || []).filter(
      acc => acc.licensed_status === 'licensed'
    );

    // Calculate summary statistics
    const uniqueEmails = new Set(activeLicensedAccounts.map(acc => acc.email));
    const totalRegisteredEmails = uniqueEmails.size;
    
    const totalLicensedAccounts = activeLicensedAccounts.length;
    
    const totalLotVolume = activeLicensedAccounts.reduce((sum, acc) => {
      return sum + (acc.lot_volume || 0);
    }, 0);
    
    const totalReward = activeLicensedAccounts.reduce((sum, acc) => {
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
