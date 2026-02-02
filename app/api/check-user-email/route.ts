import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { Resend } from 'resend';

// Check if API key is configured
if (!process.env.RESEND_API_KEY) {
  console.error('[CHECK-USER-EMAIL] RESEND_API_KEY is not configured!');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[CHECK-USER-EMAIL] RESEND_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'Email service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    console.log('[CHECK-USER-EMAIL] Generated OTP:', otp, 'for email:', email);
    
    // Store OTP in database
    const { error: otpError } = await supabase
      .from('email_otps')
      .upsert({
        email: email.toLowerCase(),
        otp,
        expires_at: expiresAt.toISOString(),
        verified: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });
    
    if (otpError) {
      console.error('[CHECK-USER-EMAIL] Error storing OTP:', otpError);
      throw otpError;
    }
    
    console.log('[CHECK-USER-EMAIL] OTP stored in database successfully');
    
    // Send OTP via email using Resend
    try {
      console.log('[CHECK-USER-EMAIL] Attempting to send email to:', email);
      
      const result = await resend.emails.send({
        from: 'VNCLC <no-reply@vnclc.com>', // Replace with your verified domain
        to: email,
        subject: 'Mã xác thực đăng ký tài khoản VNCLC',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFB81C;">Xác thực Email của bạn</h2>
            <p>Chào bạn,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản VNCLC. Mã xác thực của bạn là:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FFB81C; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        `
      });
      
      console.log('[CHECK-USER-EMAIL] Resend API response:', JSON.stringify(result, null, 2));
      console.log('[CHECK-USER-EMAIL] OTP sent successfully to:', email);
    } catch (emailError) {
      console.error('[CHECK-USER-EMAIL] Error sending OTP email:', emailError);
      console.error('[CHECK-USER-EMAIL] Error details:', JSON.stringify(emailError, null, 2));
      return NextResponse.json(
        { error: 'Không thể gửi mã xác thực. Vui lòng thử lại.', details: emailError instanceof Error ? emailError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { available: true, message: 'Email khả dụng', otpSent: true },
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
