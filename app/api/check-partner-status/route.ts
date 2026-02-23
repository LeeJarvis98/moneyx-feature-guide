import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { partnerId, userId, platform } = await request.json();

    // If checking for existing platform account (new feature)
    if (userId && platform) {
      // Get partner record for this user
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('platform_accounts')
        .eq('id', userId)
        .maybeSingle();

      if (partnerError) {
        console.error('[check-partner-status] Error checking partner:', partnerError);
        return NextResponse.json(
          { error: 'Failed to check partner status' },
          { status: 500 }
        );
      }

      // No partner record found
      if (!partner) {
        return NextResponse.json({
          exists: false,
          partnerId: null,
        });
      }

      // Check if platform_accounts exists and has the platform
      // Structure: [{ "exness": { "email": "...", "password": "..." }, "binance": { ... } }]
      const platformAccounts = partner.platform_accounts as Array<Record<string, { email: string; password: string }>> || [];
      
      // Find the account for the specified platform
      let existingEmail: string | null = null;
      
      for (const accountObj of platformAccounts) {
        if (accountObj[platform] && accountObj[platform].email) {
          existingEmail = accountObj[platform].email;
          break;
        }
      }

      if (existingEmail) {
        return NextResponse.json({
          exists: true,
          partnerId: existingEmail,
        });
      }

      return NextResponse.json({
        exists: false,
        partnerId: null,
      });
    }

    // Legacy check (original functionality)
    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists in partners table
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('id', partnerId)
      .maybeSingle();

    if (partnerError) {
      console.error('[check-partner-status] Error checking partner:', partnerError);
      return NextResponse.json(
        { error: 'Failed to check partner status' },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json({
        isPartner: false,
        rank: null,
        referralId: null,
      });
    }

    // Get partner rank from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('partner_rank')
      .eq('id', partnerId)
      .maybeSingle();

    if (userError) {
      console.error('[check-partner-status] Error fetching user data:', userError);
    }

    // Get referral ID
    const { data: referralData, error: referralError } = await supabase
      .from('own_referral_id_list')
      .select('own_referral_id')
      .eq('id', partnerId)
      .maybeSingle();

    if (referralError) {
      console.error('[check-partner-status] Error fetching referral ID:', referralError);
    }

    return NextResponse.json({
      isPartner: true,
      rank: userData?.partner_rank || null,
      referralId: referralData?.own_referral_id || null,
    });
  } catch (error) {
    console.error('[check-partner-status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
