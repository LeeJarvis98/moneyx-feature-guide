import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, partnerType } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!partnerType || (partnerType !== 'new' && partnerType !== 'system')) {
      return NextResponse.json(
        { error: 'Invalid partner type' },
        { status: 400 }
      );
    }

    // Determine rank based on partner type
    const rank = partnerType === 'new' ? 'Đồng' : 'Ruby';

    // Check if user already exists as a partner
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingPartner) {
      return NextResponse.json(
        { error: 'User is already a partner' },
        { status: 400 }
      );
    }

    // Create new partner record
    const { data: partner, error: insertError } = await supabase
      .from('partners')
      .insert({
        id: userId,
        partner_rank: rank,
        platform_accounts: [],
        platform_ref_links: [],
        sub_partners: [],
        total_clients: 0,
        total_reward: 0,
        total_sub_partners: 0,
        accum_reward: 0,
        claim_reward: 0,
        last_claim_reward: 0,
        accum_time_remaining: 0,
        claim_time_remaining: 0,
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

    // Update user's partner_rank field
    const { error: updateError } = await supabase
      .from('users')
      .update({ partner_rank: rank })
      .eq('id', userId);

    if (updateError) {
      console.error('[register-partner] Error updating user rank:', updateError);
      // Don't fail the request if this fails, partner record is created
    }

    return NextResponse.json({
      success: true,
      partner,
      rank,
      message: `Successfully registered as ${partnerType === 'new' ? 'Đối tác Tradi' : 'Đại lí hệ thống'}`,
    });
  } catch (error) {
    console.error('[register-partner] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
