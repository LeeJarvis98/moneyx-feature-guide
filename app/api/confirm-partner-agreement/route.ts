import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

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
      .select('id, status, agreement_token, agreement_token_expires_at')
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

