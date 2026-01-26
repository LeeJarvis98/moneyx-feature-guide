import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { id, turnstileToken } = await request.json();

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

    // Validate ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (id.length < 3) {
      return NextResponse.json(
        { error: 'ID must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      return NextResponse.json(
        { error: 'ID can only contain letters and numbers' },
        { status: 400 }
      );
    }

    console.log('[CHECK-USER-ID] Checking availability for:', id);

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Check if the ID already exists (case-insensitive)
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .ilike('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[CHECK-USER-ID] Error checking user ID:', error);
      throw error;
    }

    if (existingUser) {
      console.log('[CHECK-USER-ID] ID is taken:', id);
      return NextResponse.json(
        { available: false, message: 'ID đối tác này đã được sử dụng' },
        { status: 200 }
      );
    }

    console.log('[CHECK-USER-ID] ID is available:', id);
    return NextResponse.json(
      { available: true, message: 'ID đối tác khả dụng' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHECK-USER-ID] Error checking user ID:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check ID availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
