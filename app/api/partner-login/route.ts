import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { PARTNER_SHEET_ID } from '@/lib/config';

const SPREADSHEET_ID = PARTNER_SHEET_ID;

interface ExnessCredentials {
  email: string;
  password: string;
}

// Parse credentials string to extract platform-specific credentials
function parsePlatformCredentials(credentialsStr: string, platform: string): ExnessCredentials | null {
  try {
    console.log('[PARSE-CREDS] Input string:', credentialsStr);
    console.log('[PARSE-CREDS] Looking for platform:', platform);
    
    // Format: "exness: email / password; binance: email / password" or "exness: email / password"
    const platforms = credentialsStr.split(';').map(s => s.trim());
    console.log('[PARSE-CREDS] Split into', platforms.length, 'platform entries');
    
    for (const platformEntry of platforms) {
      console.log('[PARSE-CREDS] Processing entry:', platformEntry);
      const platformLower = platformEntry.toLowerCase();
      const targetPlatform = platform.toLowerCase();
      
      if (platformLower.startsWith(`${targetPlatform}:`)) {
        console.log('[PARSE-CREDS] Found matching platform entry');
        
        // Extract the part after "platform:"
        const credsPart = platformEntry.substring(platformEntry.indexOf(':') + 1).trim();
        console.log('[PARSE-CREDS] Credentials part:', credsPart);
        
        // Split by "/" to get email and password
        const parts = credsPart.split('/').map(s => s.trim());
        console.log('[PARSE-CREDS] Split into', parts.length, 'parts');
        console.log('[PARSE-CREDS] Part 0 (email):', parts[0]);
        console.log('[PARSE-CREDS] Part 1 (password):', parts[1]);
        console.log('[PARSE-CREDS] Part 1 raw (with quotes):', JSON.stringify(parts[1]));
        
        if (parts.length >= 2) {
          // The password might have extra content after it if there are multiple platforms
          // We need to ensure we only get the password part, not anything after a semicolon
          let passwordPart = parts[1];
          
          // If there's a semicolon in the remaining parts, join them and check
          if (parts.length > 2) {
            // Rejoin everything after the first / and before any semicolon
            const fullRest = parts.slice(1).join('/').trim();
            console.log('[PARSE-CREDS] Full rest after first /:', fullRest);
            // The password is everything before the next semicolon (if any)
            passwordPart = fullRest;
          }
          
          const result = {
            email: parts[0],
            password: passwordPart
          };
          console.log('[PARSE-CREDS] Final credentials - email:', result.email);
          console.log('[PARSE-CREDS] Final credentials - password:', result.password);
          console.log('[PARSE-CREDS] Final credentials - password length:', result.password.length);
          return result;
        }
      }
    }
    
    console.log('[PARSE-CREDS] No matching platform found');
    return null;
  } catch (error) {
    console.error('[PARSE-CREDS] Error parsing credentials:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { partnerId, password, platform } = await request.json();

    // Validate input
    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json(
        { error: 'Platform selection is required' },
        { status: 400 }
      );
    }

    console.log('[PARTNER-LOGIN] Login attempt for partner:', partnerId, 'Platform:', platform);

    // Initialize Google Sheets API with centralized credentials
    const sheets = await getGoogleSheetsClient();

    // Read partner data from Google Sheets (columns B, C, D, E)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AndyBao!B2:E', // Partner ID, Password, Credentials, Status
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('[PARTNER-LOGIN] No partner data found in sheet');
      return NextResponse.json(
        { error: 'Invalid partner ID or password' },
        { status: 401 }
      );
    }

    // Find the partner account
    let partnerData: { id: string; password: string; credentials: string; status: string } | null = null;
    
    for (const row of rows) {
      const [id, pass, creds, status] = row;
      
      if (id && id.toLowerCase() === partnerId.toLowerCase()) {
        partnerData = {
          id,
          password: pass || '',
          credentials: creds || '',
          status: status || 'Pending'
        };
        break;
      }
    }

    if (!partnerData) {
      console.log('[PARTNER-LOGIN] Partner not found:', partnerId);
      return NextResponse.json(
        { error: 'Invalid partner ID or password' },
        { status: 401 }
      );
    }

    // Verify password
    if (partnerData.password !== password) {
      console.log('[PARTNER-LOGIN] Invalid password for partner:', partnerId);
      return NextResponse.json(
        { error: 'Invalid partner ID or password' },
        { status: 401 }
      );
    }

    // Check account status
    const status = partnerData.status.toLowerCase();
    
    if (status === 'pending') {
      console.log('[PARTNER-LOGIN] Account pending approval:', partnerId);
      return NextResponse.json(
        { error: 'Your account is pending approval. Please wait for admin confirmation.' },
        { status: 403 }
      );
    }

    if (status === 'banned') {
      console.log('[PARTNER-LOGIN] Account banned:', partnerId);
      return NextResponse.json(
        { error: 'Your account has been banned. Please contact support.' },
        { status: 403 }
      );
    }

    if (status === 'cancelled') {
      console.log('[PARTNER-LOGIN] Account cancelled:', partnerId);
      return NextResponse.json(
        { error: 'Your account has been cancelled. Please contact support.' },
        { status: 403 }
      );
    }

    if (status !== 'active') {
      console.log('[PARTNER-LOGIN] Account not active:', partnerId, 'Status:', status);
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    console.log('[PARTNER-LOGIN] Account verified, extracting platform credentials from column D');
    console.log('[PARTNER-LOGIN] Raw credentials string:', partnerData.credentials);
    
    // Extract platform credentials from column D
    const platformCreds = parsePlatformCredentials(partnerData.credentials, platform);
    
    if (!platformCreds) {
      console.error('[PARTNER-LOGIN] No credentials found for platform:', platform);
      console.error('[PARTNER-LOGIN] Credentials string was:', partnerData.credentials);
      return NextResponse.json(
        { error: `Không tìm thấy thông tin đăng nhập cho sàn ${platform}. Vui lòng liên hệ hỗ trợ.` },
        { status: 500 }
      );
    }

    console.log('[PARTNER-LOGIN] Platform credentials extracted for:', partnerId, 'Platform:', platform);
    console.log('[PARTNER-LOGIN] Extracted email:', platformCreds.email);
    console.log('[PARTNER-LOGIN] Extracted password length:', platformCreds.password.length);

    // Login to platform API (currently supports Exness, can be extended for other platforms)
    try {
      let apiResponse;
      let platformData;

      if (platform.toLowerCase() === 'exness') {
        console.log('[PARTNER-LOGIN] Attempting Exness login with:', {
          login: platformCreds.email,
          passwordLength: platformCreds.password.length
        });
        
        // Use the Exness login API route which handles proxy/CORS properly
        apiResponse = await fetch(`${request.nextUrl.origin}/api/exness/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: platformCreds.email,
            password: platformCreds.password,
          }),
        });

        console.log('[PARTNER-LOGIN] Exness API response status:', apiResponse.status);

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          console.error('[PARTNER-LOGIN] Exness API error response:', errorData);
          console.error('[PARTNER-LOGIN] Exness API status:', apiResponse.status);
          
          let errorMessage = 'Không thể đăng nhập vào Exness.';
          
          if (apiResponse.status === 403) {
            errorMessage = 'Thông tin đăng nhập Exness không chính xác. Vui lòng kiểm tra email và mật khẩu trong hệ thống.';
          } else if (apiResponse.status === 401) {
            errorMessage = 'Thông tin đăng nhập Exness không chính xác hoặc tài khoản không tồn tại.';
          } else if (apiResponse.status === 429) {
            errorMessage = 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.';
          } else if (apiResponse.status === 400) {
            errorMessage = `Lỗi xác thực: ${errorData.message || 'Thông tin đăng nhập không hợp lệ'}`;
          }
          
          return NextResponse.json(
            { 
              error: errorMessage,
              details: errorData.message || `Status: ${apiResponse.status}`,
              hint: 'Kiểm tra thông tin đăng nhập Exness trong Google Sheet (Column D)'
            },
            { status: 401 }
          );
        }

        platformData = await apiResponse.json();
        
        console.log('[PARTNER-LOGIN] Successfully logged into Exness for partner:', partnerId);
      } else if (platform.toLowerCase() === 'binance') {
        // TODO: Add Binance authentication here when implemented
        console.log('[PARTNER-LOGIN] Binance authentication not yet implemented - returning mock success');
        console.log('[PARTNER-LOGIN] Would use credentials:', {
          email: platformCreds.email,
          passwordLength: platformCreds.password.length
        });
        platformData = { token: 'mock-binance-token' };
      } else {
        throw new Error(`Platform ${platform} is not yet supported`);
      }

      // Return success with partner info
      return NextResponse.json(
        {
          success: true,
          partnerId: partnerData.id,
          platform: platform,
          platformToken: platformData.token || null,
          message: 'Login successful'
        },
        { status: 200 }
      );

    } catch (platformError) {
      console.error('[PARTNER-LOGIN] Platform login failed:', platformError);
      return NextResponse.json(
        { error: `Không thể xác thực với sàn ${platform}. Vui lòng liên hệ hỗ trợ.` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PARTNER-LOGIN] Error during login:', error);
    return NextResponse.json(
      { 
        error: 'Login failed. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
