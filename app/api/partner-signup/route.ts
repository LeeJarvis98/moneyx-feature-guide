import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { PARTNER_SHEET_ID } from '@/lib/config';

const SPREADSHEET_ID = PARTNER_SHEET_ID;

interface PlatformCredential {
  platform: string;
  username: string;
  password: string;
  url: string;
  verified: boolean;
}

interface SignupData {
  partnerId: string;
  partnerPassword: string;
  credentials: PlatformCredential[];
  timestamp: string;
}

// Validation helper functions
function validatePartnerId(partnerId: string): { valid: boolean; error?: string } {
  if (!partnerId || typeof partnerId !== 'string') {
    return { valid: false, error: 'Partner ID is required' };
  }

  if (partnerId.length < 3) {
    return { valid: false, error: 'Partner ID must be at least 3 characters long' };
  }

  if (partnerId.length > 50) {
    return { valid: false, error: 'Partner ID must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(partnerId)) {
    return { valid: false, error: 'Partner ID can only contain letters and numbers (no spaces or special characters)' };
  }

  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter (A-Z)' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter (a-z)' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number (0-9)' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*...)' };
  }

  return { valid: true };
}

function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use http:// or https:// protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format. Please provide a valid URL (e.g., https://example.com)' };
  }
}

function validateCredentials(credentials: PlatformCredential[]): { valid: boolean; error?: string } {
  if (!Array.isArray(credentials) || credentials.length === 0) {
    return { valid: false, error: 'At least one platform credential is required' };
  }

  const validPlatforms = ['exness', 'binance', 'bingx', 'bitget'];
  const hasVerified = credentials.some(cred => cred.verified === true);

  if (!hasVerified) {
    return { valid: false, error: 'At least one credential must be verified' };
  }

  for (let i = 0; i < credentials.length; i++) {
    const cred = credentials[i];

    if (!cred.platform || typeof cred.platform !== 'string') {
      return { valid: false, error: `Credential ${i + 1}: Platform is required` };
    }

    if (!validPlatforms.includes(cred.platform)) {
      return { valid: false, error: `Credential ${i + 1}: Invalid platform "${cred.platform}"` };
    }

    if (!cred.username || typeof cred.username !== 'string' || cred.username.trim().length === 0) {
      return { valid: false, error: `Credential ${i + 1}: Username/Email is required` };
    }

    if (!cred.password || typeof cred.password !== 'string' || cred.password.length === 0) {
      return { valid: false, error: `Credential ${i + 1}: Password is required` };
    }

    const urlValidation = validateUrl(cred.url);
    if (!urlValidation.valid) {
      return { valid: false, error: `Credential ${i + 1}: ${urlValidation.error}` };
    }

    if (typeof cred.verified !== 'boolean') {
      return { valid: false, error: `Credential ${i + 1}: Verification status is invalid` };
    }
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const data: SignupData = await request.json();
    console.log('[PARTNER-SIGNUP] Received signup data:', {
      partnerId: data.partnerId,
      credentialsCount: data.credentials?.length,
      timestamp: data.timestamp
    });

    // Validate Partner ID
    const partnerIdValidation = validatePartnerId(data.partnerId);
    if (!partnerIdValidation.valid) {
      console.error('[PARTNER-SIGNUP] Partner ID validation failed:', partnerIdValidation.error);
      return NextResponse.json(
        { error: partnerIdValidation.error },
        { status: 400 }
      );
    }

    // Validate Partner Password
    const passwordValidation = validatePassword(data.partnerPassword);
    if (!passwordValidation.valid) {
      console.error('[PARTNER-SIGNUP] Password validation failed:', passwordValidation.error);
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Validate Credentials
    const credentialsValidation = validateCredentials(data.credentials);
    if (!credentialsValidation.valid) {
      console.error('[PARTNER-SIGNUP] Credentials validation failed:', credentialsValidation.error);
      return NextResponse.json(
        { error: credentialsValidation.error },
        { status: 400 }
      );
    }

    // Validate timestamp
    if (!data.timestamp || typeof data.timestamp !== 'string') {
      console.error('[PARTNER-SIGNUP] Invalid timestamp');
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 400 }
      );
    }

    try {
      const timestampDate = new Date(data.timestamp);
      if (isNaN(timestampDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      console.error('[PARTNER-SIGNUP] Invalid timestamp format');
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    console.log('[PARTNER-SIGNUP] Initializing Google Sheets API...');
    // Initialize Google Sheets API with centralized credentials
    const sheets = await getGoogleSheetsClient();

    // Format credentials with platform, username, and password
    const credentialsStr = data.credentials
      .map((cred) => `${cred.platform}: ${cred.username} / ${cred.password}`)
      .join('; ');

    // Format timestamp to dd.mm.yyyy hh:mm:ss
    const formatTimestamp = (isoString: string): string => {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    };

    // Prepare row data
    const rowData = [
      formatTimestamp(data.timestamp),
      data.partnerId,
      data.partnerPassword,
      credentialsStr,
      'Pending', // Status
    ];

    console.log('[PARTNER-SIGNUP] Attempting to write to Google Sheets...');
    console.log('[PARTNER-SIGNUP] Spreadsheet ID:', SPREADSHEET_ID);
    console.log('[PARTNER-SIGNUP] Range: AndyBao!A2:E2 (inserting at top)');

    // Get sheet metadata to find the sheetId for "AndyBao"
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const andyBaoSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === 'AndyBao'
    );

    if (!andyBaoSheet || andyBaoSheet.properties?.sheetId === undefined) {
      console.error('[PARTNER-SIGNUP] Sheet "AndyBao" not found');
      throw new Error('Sheet "AndyBao" not found in the spreadsheet');
    }

    const sheetId = andyBaoSheet.properties.sheetId;
    console.log('[PARTNER-SIGNUP] Found AndyBao sheet with ID:', sheetId);

    // Insert a new row at position 2 (right after headers)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 1,
                endIndex: 2,
              },
            },
          },
        ],
      },
    });

    // Write data to the newly inserted row
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AndyBao!A2:E2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('[PARTNER-SIGNUP] Successfully wrote to Google Sheets:', response.data);

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PARTNER-SIGNUP] Error submitting to Google Sheets:', error);
    if (error instanceof Error) {
      console.error('[PARTNER-SIGNUP] Error message:', error.message);
      console.error('[PARTNER-SIGNUP] Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to submit application. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
