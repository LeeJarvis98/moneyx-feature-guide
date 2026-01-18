import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const USER_SHEET_ID = '1G3CnLsRG5LUkQ2L1j6G2XiG8I1keeVRWiHvnNuUA5ok';

// Service account credentials
const SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'thermal-loop-468609-u1',
  private_key_id: 'b4ac5453b4efdb659af24d8fb99044d7922276a4',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCzrMndchvwUk3S\nUc4S+MX9dTYP6unPsMzxdiaSjBcImRvahOGAbOYcEzHLn9gqCTn7VV61X5zbkpNw\nxc7ttCIYxC4O6+N4P4U8j4DllGc+ZQOTp1uTtoeS4efx+jebWCWQQuvTGM99cQd1\nOP+xQGKuLgY2R+6z8Ntxywb6O2dBUKtRXs06vashcfuIctDTGQGAKF500XAbroux\nBIrjZknkl6ATz/b5doGuYJv+6MZ+CXDn5gv2Pa7Ld74K+Yy8HMPfeB+ChniMnXu9\nUOAETFPJUP4klpMstxW+EhVGch46Hdo5PsIpPBJvn/EVhQPUGjaBOE4+MmyFBTE0\nBIR3+pdRAgMBAAECggEAAM67ct5ZND4W5sk0c1mZx4qg/T3+DQhdLFWLDiwB59QZ\nOoFsY1+2XtTSXXkmHJJBYMrO4SoISwE83miOFIneKyRT6uOyFM9/1QagiOefEkhj\nDki5gE+uQ6USupUi/GaIPndpM0OUD5sNAIfDm8VWpRfEh5omDYE19fNNw/JgLlG9\nywRZ5kKXpq+eZdIpip5OVyA7rI0SEim82X3hEscWhOJA4CmEf9ExL0MxicFbODQG\nediUljgD01XABx9Q2iZueQIyGWKuAC4Qzk8T2RMICy0mfVcKaxWEziJ5mamYq3eQ\nOY2Rih1SmnJwi7uPWqosT5lQ2cjJRjeXRprVsXDMwQKBgQDb7nJEiN+D9CyqTFl/\nLL7Lwd+v1XBORltPchwEtM1WujluX9dUuDczC5ajprOGVcNkbtINuDXTzf2YB8jQ\nm1vWqmkgLCoPc3NtuhDzZE9CKIaLO99oBtF70tvjCoThiXULVLi0q0ENjeXx8Hpk\nqEMIm2X4SACM7xW1Ae7lkCfYqQKBgQDRJDkWgPapZbiket0h2LMvMAZSM7xUniiK\npvQzVfQLba4SP0QOsuKykwJxMd2vl7FS+33XTpmiMbPewpPuhHRKTUulBk5ECrfT\n8J3w72ALXR8jll2SLGvtEyPivHrm+tBIRfJSIyJHCZJQTf2bNbcLI3ddaCuLqm2o\nD2rS6L8qaQKBgHfJXKVlY1AsevNaWFiDF3xFIT9U4jFP8sXHoekSTNDS5xrtyouT\nNkVwJ2EFF7ywE5ctIO1mCrNM+7WFb+Pm6lN2R4HFbDc0K4d1E2xtkxm2lulY9+ph\n5FEr3KXBgfSReJVuVJfaurjWM4rd7tvKJZCXiyd6mAoq4kjPP737ESjZAoGBAJBR\nlrNYut2aPBgEUKQSjVN6qGIBIWyi1wcWvlzOa2GXhg9BaQ1bk+P2XjEOYBPTcaH5\nuZThwFKUSbLmQn7NGBJN1G1ENK3vV3sBB3xDMtuknuBH2roLvU4Tbyf/ODA7046L\n9fOIGxc6G6UerGp2XqFpD+18/M+cA599RBHWWlRBAoGBANF4p2HOIh3U27mQEUFB\nOwX74cbE6w+eO+BEmDMyXfnm8GJx8nSgDgEl3ahVUvYwQ5b0Ewo8E1Oaw0jy4DWH\n984D+GV25s3Hd88Mmj6lTecrGO79yn/e/PGr8FxYWhgbIUZaM1Mdr1vtkrFoFznN\nNYMSDgZ5ocdlTjyPQv0JJBps\n-----END PRIVATE KEY-----\n',
  client_email: 'vnclc-360@thermal-loop-468609-u1.iam.gserviceaccount.com',
  client_id: '104129272153748853373',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/vnclc-360%40thermal-loop-468609-u1.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

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

    // Set up Google Sheets API
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT.client_email,
      key: SERVICE_ACCOUNT.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read all data from the sheet (assuming first sheet/tab)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: USER_SHEET_ID,
      range: 'A:E', // Read columns A through E
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
    let foundUser = null;
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowUserId = row[1]?.toString().trim(); // Column B
      const rowPassword = row[2]?.toString().trim(); // Column C
      const rowStatus = row[4]?.toString().trim(); // Column E

      if (rowUserId === userId) {
        foundUser = {
          userId: rowUserId,
          password: rowPassword,
          status: rowStatus,
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
    return NextResponse.json(
      {
        success: true,
        userId: foundUser.userId,
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
