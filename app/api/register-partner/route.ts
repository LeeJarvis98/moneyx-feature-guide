import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { buildAgreementEmailHtml } from '@/lib/agreement-email';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { userId } = await request.json();

    console.log('[register-partner] Starting registration for user:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user already exists as a partner
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingPartner) {
      console.log('[register-partner] User is already a partner:', userId);
      return NextResponse.json(
        { error: 'User is already a partner' },
        { status: 400 }
      );
    }

    // Get the user's referral_id and email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referral_id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[register-partner] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[register-partner] User referral_id:', user.referral_id);

    // Note: partner_rank and own referral ID will be assigned on confirmation, not here.

    // Create new partner record in partners table (status = 'inactive' until email confirmed)
    const { data: partner, error: insertError } = await supabase
      .from('partners')
      .insert({
        id: userId,
        platform_accounts: [],
        platform_ref_links: [],
        selected_platform: [],
        status: 'inactive',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[register-partner] Error creating partner:', insertError);
      return NextResponse.json(
        { error: 'Failed to register as partner', details: insertError.message },
        { status: 500 }
      );
    }

    // Generate agreement confirmation token (UUID, valid 72 hours)
    const agreementToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    // Update partner with agreement token
    const { error: tokenUpdateError } = await supabase
      .from('partners')
      .update({
        agreement_token: agreementToken,
        agreement_token_expires_at: tokenExpiresAt,
      })
      .eq('id', userId);

    if (tokenUpdateError) {
      console.error('[register-partner] Error storing agreement token:', tokenUpdateError);
      // Non-fatal — account created, but email can be resent later
    }

    // Send partner agreement email
    let emailSent = false;
    if (user.email && process.env.RESEND_API_KEY) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vnclc.com';
        const confirmUrl = `${baseUrl}/confirm-account?token=${agreementToken}&type=partner`;
        const resend = getResendClient();
        await resend.emails.send({
          from: 'VNCLC <no-reply@vnclc.com>',
          to: user.email,
          subject: 'Xác nhận Hợp Đồng Đối Tác Tradi — Kích hoạt tài khoản của bạn',
          html: buildAgreementEmailHtml(confirmUrl),
        });
        emailSent = true;
        console.log('[register-partner] Agreement email sent to:', user.email);
      } catch (emailError) {
        console.error('[register-partner] Failed to send agreement email:', emailError);
      }
    }

    console.log('[register-partner] Successfully registered partner:', {
      userId,
      emailSent,
    });

    return NextResponse.json({
      success: true,
      partner,
      requiresEmailConfirmation: true,
      emailSent,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận hợp đồng đối tác.',
    });
  } catch (error) {
    console.error('[register-partner] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[register-partner] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
