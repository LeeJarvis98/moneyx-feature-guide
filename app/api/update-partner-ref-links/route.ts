import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface PlatformRefLinks {
  exness: string;
  binance: string;
  bingx: string;
  bitget: string;
  bybit: string;
  gate: string;
  htx: string;
  kraken: string;
  kucoin: string;
  mexc: string;
  okx: string;
  upbit: string;
}

export async function POST(request: NextRequest) {
  try {
    const { partnerId, refLinks } = await request.json();

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    if (!refLinks) {
      return NextResponse.json(
        { error: 'Referral links data is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Convert refLinks object to array format: ["platform:url", "platform:url"]
    const refLinksArray: string[] = [];
    Object.entries(refLinks).forEach(([platform, url]) => {
      if (url && typeof url === 'string' && url.trim() !== '') {
        refLinksArray.push(`${platform}:${url.trim()}`);
      }
    });

    // Check if partner exists
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('id')
      .eq('id', partnerId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[update-partner-ref-links] Error checking partner:', checkError);
      return NextResponse.json(
        { error: 'Failed to check partner status' },
        { status: 500 }
      );
    }

    if (existingPartner) {
      // Update existing partner
      const { error: updateError } = await supabase
        .from('partners')
        .update({ platform_ref_links: refLinksArray })
        .eq('id', partnerId);

      if (updateError) {
        console.error('[update-partner-ref-links] Error updating partner:', updateError);
        return NextResponse.json(
          { error: 'Failed to update referral links' },
          { status: 500 }
        );
      }
    } else {
      // Create new partner entry
      const { error: insertError } = await supabase
        .from('partners')
        .insert({
          id: partnerId,
          platform_ref_links: refLinksArray,
          platform_accounts: [],
          total_partner_com: 0,
          total_tradi_com: 0,
        });

      if (insertError) {
        console.error('[update-partner-ref-links] Error creating partner:', insertError);
        return NextResponse.json(
          { error: 'Failed to create partner entry' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Referral links updated successfully',
    });
  } catch (error) {
    console.error('[update-partner-ref-links] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
