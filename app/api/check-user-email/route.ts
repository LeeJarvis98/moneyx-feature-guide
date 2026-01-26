import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json();

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

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('[CHECK-USER-EMAIL] Checking availability for:', email);

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Check if the email already exists in the database (case-insensitive)
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('email')
      .ilike('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[CHECK-USER-EMAIL] Error checking email:', error);
      throw error;
    }

    const isTaken = !!existingUser;
    
    console.log('[CHECK-USER-EMAIL] Email taken status:', isTaken);

    if (isTaken) {
      console.log('[CHECK-USER-EMAIL] Email is taken:', email);
      return NextResponse.json(
        { available: false, message: 'Email này đã được đăng ký' },
        { status: 200 }
      );
    }

    console.log('[CHECK-USER-EMAIL] Email is available:', email);
    return NextResponse.json(
      { available: true, message: 'Email khả dụng' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHECK-USER-EMAIL] Error checking email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check email availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
