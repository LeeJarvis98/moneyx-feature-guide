import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';

// Password validation function
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword, turnstileToken } = await request.json();

    // Verify Turnstile token first
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Security verification is required' },
        { status: 400 }
      );
    }

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'Security verification failed. Please try again.' },
        { status: 403 }
      );
    }

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check that new password is different from current password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify current password
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Compare current password (plain text comparison)
    const isPasswordValid = currentPassword === userData.password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password (store as plain text)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error in update-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
