import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { USER_SHEET_ID } from '@/lib/config';

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

    // Set up Google Sheets API with centralized credentials
    const sheets = await getGoogleSheetsClient();

    // Read all data from the sheet (assuming first sheet/tab)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: USER_SHEET_ID,
      range: 'A:F', // Read columns A through F (including partner rank)
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy dữ liệu người dùng' },
        { status: 404 }
      );
    }

    // Skip header row (index 0) and search for user
    // Column A (index 0): might be timestamp or other data
    // Column B (index 1): User ID
    // Column C (index 2): Password
    // Column E (index 4): Status
    // Column F (index 5): Partner Rank
    let foundUser = null;
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowUserId = row[1]?.toString().trim(); // Column B
      const rowPassword = row[2]?.toString().trim(); // Column C
      const rowStatus = row[4]?.toString().trim(); // Column E
      const rowPartnerRank = row[5]?.toString().trim() || ''; // Column F

      if (rowUserId === userId) {
        foundUser = {
          userId: rowUserId,
          password: rowPassword,
          status: rowStatus,
          partnerRank: rowPartnerRank,
        };
        rowIndex = i;
        break;
      }
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

    if (status === 'cancelled') {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị xóa. Vui lòng liên hệ quản trị viên.' },
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
    const isPartner = foundUser.partnerRank !== '';
    
    return NextResponse.json(
      {
        success: true,
        userId: foundUser.userId,
        partnerRank: foundUser.partnerRank,
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
