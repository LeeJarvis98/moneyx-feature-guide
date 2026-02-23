import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Generate random password (12 characters: uppercase, lowercase, numbers, special chars)
function generateRandomPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json();

    // Verify Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Xác minh bảo mật là bắt buộc' },
        { status: 400 }
      );
    }

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'Xác minh bảo mật thất bại. Vui lòng thử lại.' },
        { status: 403 }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    console.log('[FORGOT-PASSWORD] Processing request for email:', email);

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Check if email exists in the database
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle();

    if (queryError) {
      console.error('[FORGOT-PASSWORD] Database error:', queryError);
      throw queryError;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Email không tồn tại trong hệ thống' },
        { status: 404 }
      );
    }

    console.log('[FORGOT-PASSWORD] User found:', user.id);

    // Generate new random password
    const newPassword = generateRandomPassword();
    console.log('[FORGOT-PASSWORD] Generated new password for user:', user.id);

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('[FORGOT-PASSWORD] Error updating password:', updateError);
      throw updateError;
    }

    console.log('[FORGOT-PASSWORD] Password updated successfully for user:', user.id);

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[FORGOT-PASSWORD] RESEND_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'Dịch vụ email chưa được cấu hình. Vui lòng liên hệ quản trị viên.' },
        { status: 500 }
      );
    }

    // Send new password via email
    try {
      console.log('[FORGOT-PASSWORD] Sending password reset email to:', email);
      
      const resend = getResendClient();
      const result = await resend.emails.send({
        from: 'VNCLC <no-reply@vnclc.com>',
        to: email,
        subject: 'Mật khẩu mới cho tài khoản VNCLC của bạn',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 40px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #FFB81C; font-size: 28px; margin: 0;">Đặt lại mật khẩu VNCLC</h2>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Chào bạn,</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #ccc;">
              Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản VNCLC của mình. 
              Mật khẩu mới của bạn là:
            </p>
            
            <div style="background: rgba(255, 184, 28, 0.1); border: 2px solid #FFB81C; padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0;">
              <p style="margin: 0 0 10px; color: #888; font-size: 14px;">Mật khẩu mới của bạn:</p>
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #FFB81C; font-family: 'Courier New', monospace;">
                ${newPassword}
              </div>
            </div>
            
            <div style="background: rgba(220, 38, 38, 0.1); border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #ff6b6b; font-weight: 600;">
                ⚠️ QUAN TRỌNG: Vui lòng đổi mật khẩu này ngay sau khi đăng nhập!
              </p>
            </div>
            
            <div style="background: rgba(255, 184, 28, 0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px; color: #FFB81C; font-weight: 600;">Hướng dẫn đổi mật khẩu:</p>
              <ol style="margin: 0; padding-left: 20px; color: #ccc; line-height: 1.8;">
                <li>Đăng nhập với mật khẩu mới ở trên</li>
                <li>Vào phần <strong>Cài đặt tài khoản</strong></li>
                <li>Chọn <strong>Đổi mật khẩu</strong></li>
                <li>Nhập mật khẩu mới an toàn hơn</li>
              </ol>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #888; margin-top: 30px;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với chúng tôi ngay lập tức 
              để bảo vệ tài khoản của bạn.
            </p>
            
            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              Email này được gửi tự động từ hệ thống VNCLC. Vui lòng không trả lời email này.
            </p>
          </div>
        `
      });
      
      console.log('[FORGOT-PASSWORD] Email sent successfully:', JSON.stringify(result, null, 2));
    } catch (emailError) {
      console.error('[FORGOT-PASSWORD] Error sending email:', emailError);
      
      // Rollback password change if email fails
      // (Optional: You might want to keep the new password anyway)
      
      return NextResponse.json(
        { error: 'Không thể gửi email. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Mật khẩu mới đã được gửi đến email của bạn',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[FORGOT-PASSWORD] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Lỗi máy chủ. Vui lòng thử lại sau.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}