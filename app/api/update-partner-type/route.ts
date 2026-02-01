import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { userId, partnerType } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!partnerType || (partnerType !== 'DTT' && partnerType !== 'DLHT')) {
      return NextResponse.json(
        { error: 'Invalid partner type' },
        { status: 400 }
      );
    }

    // Check if user is a partner
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('partner_type, partner_type_change_date')
      .eq('id', userId)
      .single();

    if (checkError || !existingPartner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to change to the same type
    if (existingPartner.partner_type === partnerType) {
      return NextResponse.json(
        { error: 'Partner type is already set to this value' },
        { status: 400 }
      );
    }

    // Check if 30 days have passed since last change
    if (existingPartner.partner_type_change_date) {
      const lastChangeDate = new Date(existingPartner.partner_type_change_date);
      const daysSinceLastChange = Math.floor(
        (new Date().getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastChange < 30) {
        return NextResponse.json(
          { 
            error: `Bạn chỉ có thể đổi hình thức sau 30 ngày. Còn ${30 - daysSinceLastChange} ngày nữa.`,
            daysRemaining: 30 - daysSinceLastChange
          },
          { status: 400 }
        );
      }
    }

    // Determine new rank based on partner type
    const newRank = partnerType === 'DTT' ? 'Đồng' : 'Ruby';

    // Update partner type and change date
    const { data: updatedPartner, error: updateError } = await supabase
      .from('partners')
      .update({
        partner_type: partnerType,
        partner_type_change_date: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating partner type:', updateError);
      return NextResponse.json(
        { error: 'Failed to update partner type' },
        { status: 500 }
      );
    }

    // Update user's partner_rank field
    const { error: rankUpdateError } = await supabase
      .from('users')
      .update({ partner_rank: newRank })
      .eq('id', userId);

    if (rankUpdateError) {
      console.error('Error updating partner rank:', rankUpdateError);
      // Don't fail the request if this fails, partner type is already updated
    }

    return NextResponse.json({
      success: true,
      partnerType: updatedPartner.partner_type,
      changeDate: updatedPartner.partner_type_change_date,
      rank: newRank,
    });
  } catch (error) {
    console.error('Error in update-partner-type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
