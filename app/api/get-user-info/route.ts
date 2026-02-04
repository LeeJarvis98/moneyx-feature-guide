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

    // Fetch licensed accounts from own_licensed_accounts
    const { data: ownLicensedAccounts, error: licenseError } = await supabase
      .from('own_licensed_accounts')
      .select('account_id, email, uid')
      .eq('id', userId)
      .single();

    if (licenseError && licenseError.code !== 'PGRST116') {
      console.error('Error fetching licensed accounts:', licenseError);
      return NextResponse.json(
        { error: 'Failed to fetch licensed accounts' },
        { status: 500 }
      );
    }

    // Group accounts by email from own_licensed_accounts
    const emailGroups: Record<string, any> = {};
    
    // Parse own_licensed_accounts for both licensed and unlicensed accounts
    if (ownLicensedAccounts?.account_id && Array.isArray(ownLicensedAccounts.account_id)) {
      const email = ownLicensedAccounts.email || userData.email;
      const uid = ownLicensedAccounts.uid || '';

      ownLicensedAccounts.account_id.forEach((platformData: any) => {
        Object.entries(platformData).forEach(([platform, data]: [string, any]) => {
          // Initialize email group if it doesn't exist
          if (!emailGroups[email]) {
            emailGroups[email] = {
              email: email,
              uid: uid,
              platform: platform,
              accounts: [],
            };
          }

          // Add licensed accounts
          if (data.licensed && Array.isArray(data.licensed)) {
            data.licensed.forEach((licenseEntry: any) => {
              Object.entries(licenseEntry).forEach(([accountId, timestamp]) => {
                emailGroups[email].accounts.push({
                  accountId,
                  status: 'licensed',
                  licensedDate: timestamp,
                });
              });
            });
          }

          // Add unlicensed accounts
          if (data.unlicense && Array.isArray(data.unlicense)) {
            data.unlicense.forEach((accountId: string) => {
              emailGroups[email].accounts.push({
                accountId: accountId,
                status: 'unlicensed',
                licensedDate: null,
              });
            });
          }
        });
      });
    }

    const licensedAccountsByEmail = Object.values(emailGroups);

    return NextResponse.json({
      user: userData,
      licensedAccountsByEmail,
    });
  } catch (error) {
    console.error('Error in get-user-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
