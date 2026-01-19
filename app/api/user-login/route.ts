import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import type { User } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, password, rememberMe } = await request.json();

    // Validate input
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'ID người dùng là bắt buộc' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Set up Supabase client
    const supabase = getSupabaseClient();

    // Find user by id
    const { data: foundUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .ilike('id', userId)
      .maybeSingle() as { data: User | null; error: any };

    if (queryError) {
      console.error('[USER-LOGIN] Database error:', queryError);
      throw queryError;
    }

    // Check if user exists
    if (!foundUser) {
      return NextResponse.json(
        { error: 'ID người dùng không tồn tại' },
        { status: 401 }
      );
    }

    // Check password
    if (foundUser.password !== password) {
      return NextResponse.json(
        { error: 'Mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Check account status
    const status = foundUser.status?.toLowerCase();
    
    if (status === 'banned') {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    if (status === 'terminated') {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị xóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    if (status === 'hold') {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đang tạm dừng. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    if (status !== 'active') {
      return NextResponse.json(
        { error: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    // Login successful
    const isPartner = foundUser.partner_rank !== '';
    
    return NextResponse.json(
      {
        success: true,
        userId: foundUser.id,
        partnerRank: foundUser.partner_rank,
        isPartner: isPartner,
        message: 'Đăng nhập thành công',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[USER-LOGIN] Error:', error);
    
    if (error instanceof Error && error.message.includes('Unable to parse')) {
      return NextResponse.json(
        { error: 'Dữ liệu yêu cầu không hợp lệ' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi máy chủ. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
