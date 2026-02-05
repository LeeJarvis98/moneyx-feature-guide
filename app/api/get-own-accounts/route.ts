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

    // Fetch user referral_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Fetch licensed accounts from licensed_accounts table where owner = userId
    const { data: licensedAccounts, error: licenseError } = await supabase
      .from('licensed_accounts')
      .select('account_id, email, uid, platform, licensed_date, licensed_status')
      .eq('owner', userId);

    if (licenseError) {
      console.error('Error fetching licensed accounts:', licenseError);
      return NextResponse.json(
        { error: 'Failed to fetch licensed accounts' },
        { status: 500 }
      );
    }

    // Group accounts by email and platform
    const emailGroups: Record<string, any> = {};
    
    // Parse licensed_accounts and group by email + platform
    if (licensedAccounts && licensedAccounts.length > 0) {
      licensedAccounts.forEach((account) => {
        const key = `${account.email}_${account.platform}`;
        
        // Initialize email group if it doesn't exist
        if (!emailGroups[key]) {
          emailGroups[key] = {
            email: account.email,
            uid: account.uid,
            platform: account.platform || 'unknown',
            accounts: [],
          };
        }

        // Add account with status
        emailGroups[key].accounts.push({
          accountId: account.account_id,
          status: account.licensed_status || 'licensed',
          licensedDate: account.licensed_date,
        });
      });
    }

    const licensedAccountsByEmail = Object.values(emailGroups);

    return NextResponse.json({
      licensedAccountsByEmail,
      referralId: userData.referral_id,
    });
  } catch (error) {
    console.error('Error in get-own-accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}