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

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at, partner_rank, referral_id, status')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Fetch licensed accounts
    const { data: licensedAccounts, error: licenseError } = await supabase
      .from('licensed_accounts')
      .select('account_id, email, platform, licensed_date')
      .eq('id', userId);

    if (licenseError) {
      console.error('Error fetching licensed accounts:', licenseError);
      return NextResponse.json(
        { error: 'Failed to fetch licensed accounts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: userData,
      licensedAccounts: licensedAccounts || [],
    });
  } catch (error) {
    console.error('Error in get-user-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
