import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { USER_SHEET_ID } from '@/lib/config';

const SPREADSHEET_ID = USER_SHEET_ID;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('[CHECK-USER-EMAIL] Checking availability for:', email);

    // Initialize Google Sheets API with centralized credentials
    const sheets = await getGoogleSheetsClient();

    // Get spreadsheet metadata to determine the first sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    if (!spreadsheet.data.sheets || spreadsheet.data.sheets.length === 0) {
      console.error('[CHECK-USER-EMAIL] No sheets found in the spreadsheet');
      throw new Error('No sheets found in the spreadsheet');
    }

    // Use the first sheet (default sheet)
    const firstSheet = spreadsheet.data.sheets[0];
    const sheetName = firstSheet.properties?.title || 'Sheet1';

    console.log('[CHECK-USER-EMAIL] Using sheet:', sheetName);

    // Read all emails from column D (starting from row 2 to skip header)
    const range = `${sheetName}!D2:D`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const existingEmails = response.data.values?.flat().filter(Boolean) || [];
    
    console.log('[CHECK-USER-EMAIL] Found existing emails:', existingEmails.length);

    // Check if the email already exists (case-insensitive)
    const isTaken = existingEmails.some(
      (existingEmail) => existingEmail.toString().toLowerCase() === email.toLowerCase()
    );

    if (isTaken) {
      console.log('[CHECK-USER-EMAIL] Email is taken:', email);
      return NextResponse.json(
        { available: false, message: 'Email này đã được đăng ký' },
        { status: 200 }
      );
    }

    console.log('[CHECK-USER-EMAIL] Email is available:', email);
    return NextResponse.json(
      { available: true, message: 'Email khả dụng' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHECK-USER-EMAIL] Error checking email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check email availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
