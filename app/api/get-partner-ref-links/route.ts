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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch partner data
    const { data: partner, error } = await supabase
      .from('partners')
      .select('platform_ref_links')
      .eq('id', partnerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[get-partner-ref-links] Error fetching partner:', error);
      return NextResponse.json(
        { error: 'Failed to fetch referral links' },
        { status: 500 }
      );
    }

    // Initialize empty refLinks object
    const refLinks: PlatformRefLinks = {
      exness: '',
      binance: '',
      bingx: '',
      bitget: '',
      bybit: '',
      gate: '',
      htx: '',
      kraken: '',
      kucoin: '',
      mexc: '',
      okx: '',
      upbit: '',
    };

    // Parse platform_ref_links array if it exists
    if (partner && partner.platform_ref_links && Array.isArray(partner.platform_ref_links)) {
      partner.platform_ref_links.forEach((link: string) => {
        const colonIndex = link.indexOf(':');
        if (colonIndex > 0) {
          const platform = link.substring(0, colonIndex);
          const url = link.substring(colonIndex + 1);
          if (platform && url && platform in refLinks) {
            refLinks[platform as keyof PlatformRefLinks] = url;
          }
        }
      });
    }

    return NextResponse.json({
      refLinks,
    });
  } catch (error) {
    console.error('[get-partner-ref-links] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
