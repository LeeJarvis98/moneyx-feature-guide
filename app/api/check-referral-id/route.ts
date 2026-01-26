import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { referral_id, turnstileToken } = await request.json();

    // Validate Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Captcha token is required' },
        { status: 400 }
      );
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid captcha token' },
        { status: 400 }
      );
    }

    // Validate referral ID
    if (!referral_id || typeof referral_id !== 'string') {
      return NextResponse.json(
        { error: 'Referral ID is required' },
        { status: 400 }
      );
    }

    if (referral_id.length < 4) {
      return NextResponse.json(
        { error: 'Referral ID must be at least 4 characters long' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+-[0-9]+$/.test(referral_id)) {
      return NextResponse.json(
        { error: 'Referral ID format is invalid. Format: [ID]-[numbers], e.g., AndyBao24-8888' },
        { status: 400 }
      );
    }

    console.log('[CHECK-REFERRAL-ID] Checking referral ID:', referral_id);

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Check if the referral ID exists in own_referral_id_list table
    const { data: referralExists, error } = await supabase
      .from('own_referral_id_list')
      .select('own_referral_id')
      .eq('own_referral_id', referral_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[CHECK-REFERRAL-ID] Error checking referral ID:', error);
      throw error;
    }

    if (referralExists) {
      console.log('[CHECK-REFERRAL-ID] Referral ID exists:', referral_id);
      return NextResponse.json(
        { exists: true, message: 'ID giới thiệu hợp lệ' },
        { status: 200 }
      );
    }

    console.log('[CHECK-REFERRAL-ID] Referral ID not found:', referral_id);
    return NextResponse.json(
      { exists: false, message: 'ID giới thiệu không tồn tại trong hệ thống' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[CHECK-REFERRAL-ID] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
