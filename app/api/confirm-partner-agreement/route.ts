import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { assignInitialRank } from '@/lib/partner-rank';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

function getAdminEmail(): string {
  const email = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!email) throw new Error('ADMIN_NOTIFICATION_EMAIL is not configured');
  return email;
}

let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function buildAdminNotificationHtml(params: {
  partnerId: string;
  partnerEmail: string;
  referralId: string;
  rank: string;
  confirmedAt: string;
}): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 40px; border-radius: 16px;">
    <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid rgba(255,184,28,0.3); padding-bottom: 24px;">
      <h1 style="color: #FFB81C; font-size: 22px; margin: 0 0 6px;">✅ XÁC NHẬN HỢP ĐỒNG ĐỐI TÁC</h1>
      <p style="color: #888; font-size: 13px; margin: 0;">Thông báo tự động từ hệ thống VNCLC · Tradi</p>
    </div>

    <p style="color: #ccc; font-size: 14px; margin: 0 0 24px;">
      Một đối tác vừa nhấn xác nhận hợp đồng qua email. Dưới đây là thông tin bằng chứng đồng ý:
    </p>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <td style="padding: 12px 8px; color: #888; width: 40%;">Partner ID</td>
        <td style="padding: 12px 8px; color: #fff; font-family: monospace;">${params.partnerId}</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <td style="padding: 12px 8px; color: #888;">Email</td>
        <td style="padding: 12px 8px; color: #FFB81C;">${params.partnerEmail}</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <td style="padding: 12px 8px; color: #888;">Referral ID</td>
        <td style="padding: 12px 8px; color: #fff; font-family: monospace;">${params.referralId}</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <td style="padding: 12px 8px; color: #888;">Rank</td>
        <td style="padding: 12px 8px; color: #fff;">${params.rank}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; color: #888;">Thời điểm xác nhận</td>
        <td style="padding: 12px 8px; color: #fff;">${params.confirmedAt}</td>
      </tr>
    </table>

    <div style="margin-top: 28px; background: rgba(255,184,28,0.07); border-left: 3px solid #FFB81C; padding: 14px 16px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #ccc; font-size: 13px; line-height: 1.6;">
        Đối tác này đã nhấn nút xác nhận trong email hợp đồng và tài khoản đã được <strong style="color: #FFB81C;">kích hoạt tự động</strong>. 
        Email này là bằng chứng về sự đồng ý của đối tác với các điều khoản hợp đồng.
      </p>
    </div>

    <p style="margin-top: 28px; color: #555; font-size: 12px; text-align: center;">
      © ${new Date().getFullYear()} VNCLC · Tradi — Thông báo nội bộ tự động
    </p>
  </div>
  `;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'partner') {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Find partner with this token
    const { data: partner, error: findError } = await supabase
      .from('partners')
      .select('id, status, agreement_token, agreement_token_expires_at, created_at')
      .eq('agreement_token', token)
      .maybeSingle();

    if (findError) {
      console.error('[confirm-partner-agreement] DB error:', findError);
      return NextResponse.json(
        { error: 'Lỗi hệ thống. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        { error: 'Liên kết xác nhận không hợp lệ hoặc đã được sử dụng.' },
        { status: 404 }
      );
    }

    // Check if already active
    if (partner.status === 'active') {
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        message: 'Tài khoản đối tác của bạn đã được kích hoạt trước đó.',
      });
    }

    // Check token expiry
    if (partner.agreement_token_expires_at) {
      const expiresAt = new Date(partner.agreement_token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Liên kết xác nhận đã hết hạn. Vui lòng liên hệ hỗ trợ để nhận liên kết mới.' },
          { status: 410 }
        );
      }
    }

    // Activate the partner account
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        status: 'active',
        agreement_token: null,
        agreement_token_expires_at: null,
      })
      .eq('id', partner.id);

    if (updateError) {
      console.error('[confirm-partner-agreement] Error activating partner:', updateError);
      return NextResponse.json(
        { error: 'Không thể kích hoạt tài khoản. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    console.log('[confirm-partner-agreement] Partner activated:', partner.id);

    // Generate and store the partner's own referral ID (userId-XXXX) now that they have confirmed
    let ownReferralId: string | null = null;
    try {
      // Check if one was already assigned (e.g. a duplicate confirmation click)
      const { data: existingRef } = await supabase
        .from('own_referral_id_list')
        .select('own_referral_id')
        .eq('id', partner.id)
        .maybeSingle();

      if (existingRef) {
        ownReferralId = existingRef.own_referral_id;
      } else {
        let attempts = 0;
        while (attempts < 10) {
          const candidate = `${partner.id}-${Math.floor(1000 + Math.random() * 9000)}`;
          const { data: conflict } = await supabase
            .from('own_referral_id_list')
            .select('own_referral_id')
            .eq('own_referral_id', candidate)
            .maybeSingle();
          if (!conflict) {
            const { error: refInsertError } = await supabase
              .from('own_referral_id_list')
              .insert({ id: partner.id, own_referral_id: candidate });
            if (!refInsertError) ownReferralId = candidate;
            break;
          }
          attempts++;
        }
      }
      console.log('[confirm-partner-agreement] Own referral ID assigned:', ownReferralId);
    } catch (refError) {
      // Non-fatal — activation already succeeded
      console.error('[confirm-partner-agreement] Failed to assign referral ID:', refError);
    }

    // Fetch user info, assign rank, then send admin notification
    const confirmedAt = new Date().toISOString();
    try {
      const { data: userInfo } = await supabase
        .from('users')
        .select('email, referral_id')
        .eq('id', partner.id)
        .maybeSingle();

      if (userInfo) {
        // Assign partner_rank now that the agreement has been confirmed
        let assignedRank = '';
        try {
          const { rank } = await assignInitialRank(supabase, partner.id, userInfo.referral_id);
          assignedRank = rank;
          console.log('[confirm-partner-agreement] Rank assigned:', rank);
        } catch (rankError) {
          // Non-fatal — activation already succeeded
          console.error('[confirm-partner-agreement] Failed to assign rank:', rankError);
        }

        if (process.env.RESEND_API_KEY) {
          const resend = getResendClient();
          await resend.emails.send({
            from: 'VNCLC <no-reply@vnclc.com>',
            to: getAdminEmail(),
            subject: `Đối tác xác nhận hợp đồng — ${userInfo.email}`,
            html: buildAdminNotificationHtml({
              partnerId: partner.id,
              partnerEmail: userInfo.email,
              referralId: userInfo.referral_id,
              rank: assignedRank,
              confirmedAt: new Intl.DateTimeFormat('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                dateStyle: 'full',
                timeStyle: 'long',
              }).format(new Date(confirmedAt)),
            }),
          });
          console.log('[confirm-partner-agreement] Admin notification sent for partner:', partner.id);
        }
      }
    } catch (notifError) {
      // Non-fatal — activation already succeeded
      console.error('[confirm-partner-agreement] Failed to send admin notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      alreadyActive: false,
      message: 'Tài khoản đối tác đã được kích hoạt thành công!',
    });
  } catch (error) {
    console.error('[confirm-partner-agreement] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

