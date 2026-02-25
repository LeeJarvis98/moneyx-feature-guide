import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { assignInitialRank } from '@/lib/partner-rank';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { userId } = await request.json();

    console.log('[register-partner] Starting registration for user:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user already exists as a partner
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingPartner) {
      console.log('[register-partner] User is already a partner:', userId);
      return NextResponse.json(
        { error: 'User is already a partner' },
        { status: 400 }
      );
    }

    // Get the user's referral_id (the code they signed up with)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referral_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[register-partner] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[register-partner] User referral_id:', user.referral_id);

    // Generate unique referral ID in format: userId-XXXX (4 random digits)
    const generateReferralId = async (): Promise<string> => {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000-9999
        const referralId = `${userId}-${randomDigits}`;

        // Check if this referral ID already exists
        const { data: existingReferral } = await supabase
          .from('own_referral_id_list')
          .select('own_referral_id')
          .eq('own_referral_id', referralId)
          .maybeSingle();

        if (!existingReferral) {
          return referralId;
        }

        attempts++;
      }

      throw new Error('Failed to generate unique referral ID');
    };

    const ownReferralId = await generateReferralId();
    console.log('[register-partner] Generated own referral ID:', ownReferralId);

    // Assign initial rank based on referral chain position
    const { rank, isAutoRanked } = await assignInitialRank(
      supabase,
      userId,
      user.referral_id
    );

    console.log('[register-partner] Assigned rank:', { rank, isAutoRanked });

    // Create new partner record in partners table
    const { data: partner, error: insertError } = await supabase
      .from('partners')
      .insert({
        id: userId,
        platform_accounts: [],
        platform_ref_links: [],
        selected_platform: [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('[register-partner] Error creating partner:', insertError);
      return NextResponse.json(
        { error: 'Failed to register as partner', details: insertError.message },
        { status: 500 }
      );
    }

    // Store the partner's own referral ID in own_referral_id_list table
    const { error: referralInsertError } = await supabase
      .from('own_referral_id_list')
      .insert({
        id: userId,
        own_referral_id: ownReferralId,
      });

    if (referralInsertError) {
      console.error('[register-partner] Error storing referral ID:', referralInsertError);
      // Don't fail the request if this fails, partner record is created
    }

    console.log('[register-partner] Successfully registered partner:', {
      userId,
      rank,
      isAutoRanked,
      referralId: ownReferralId,
    });

    return NextResponse.json({
      success: true,
      partner,
      rank,
      isAutoRanked,
      referralId: ownReferralId,
      message: 'Successfully registered as Đại lý Tradi',
    });
  } catch (error) {
    console.error('[register-partner] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[register-partner] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
