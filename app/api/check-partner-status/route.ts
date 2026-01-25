import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { partnerId } = await request.json();

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
