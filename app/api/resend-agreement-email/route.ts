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
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const supabase = getSupabaseClient();
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, status')
      .eq('id', userId)
      .maybeSingle();
    if (partnerError || !partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    if (partner.status !== 'inactive') return NextResponse.json({ error: 'Partner account is already active' }, { status: 400 });
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();
    if (userError || !user?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const newToken = randomUUID();
    const newExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from('partners')
      .update({ agreement_token: newToken, agreement_token_expires_at: newExpiresAt })
      .eq('id', userId);
    if (updateError) {
      console.error('[resend-agreement-email] DB error:', updateError);
      return NextResponse.json({ error: 'Failed to regenerate token' }, { status: 500 });
    }
    if (process.env.RESEND_API_KEY) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vnclc.com';
      const confirmUrl = `${baseUrl}/confirm-account?token=${newToken}&type=partner`;
      const resend = getResendClient();
      await resend.emails.send({
        from: 'VNCLC <no-reply@vnclc.com>',
        to: user.email,
        subject: '[Tradi] Xác nhận Hợp Đồng Đối Tác — Liên kết mới',
        html: buildAgreementEmailHtml(confirmUrl),
      });
      console.log('[resend-agreement-email] Resent to:', user.email);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[resend-agreement-email] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
