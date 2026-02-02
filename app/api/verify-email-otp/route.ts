import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Validate inputs
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    console.log('[VERIFY-EMAIL-OTP] Verifying OTP for:', email);

    const supabase = getSupabaseClient();

    // Get OTP record from database
    const { data: otpRecord, error: fetchError } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !otpRecord) {
      console.error('[VERIFY-EMAIL-OTP] No OTP found for email:', email);
      return NextResponse.json(
        { valid: false, message: 'Mã xác thực không tồn tại hoặc đã hết hạn' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    
    if (now > expiresAt) {
      console.log('[VERIFY-EMAIL-OTP] OTP expired for:', email);
      return NextResponse.json(
        { valid: false, message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    // Check if OTP already verified
    if (otpRecord.verified) {
      console.log('[VERIFY-EMAIL-OTP] OTP already used for:', email);
      return NextResponse.json(
        { valid: false, message: 'Mã xác thực đã được sử dụng' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      console.log('[VERIFY-EMAIL-OTP] Invalid OTP for:', email);
      return NextResponse.json(
        { valid: false, message: 'Mã xác thực không chính xác' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('email_otps')
      .update({ verified: true })
      .eq('email', email.toLowerCase());

    if (updateError) {
      console.error('[VERIFY-EMAIL-OTP] Error updating OTP:', updateError);
      throw updateError;
    }

    console.log('[VERIFY-EMAIL-OTP] OTP verified successfully for:', email);
    return NextResponse.json(
      { valid: true, message: 'Email đã được xác thực thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VERIFY-EMAIL-OTP] Error verifying OTP:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify OTP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
