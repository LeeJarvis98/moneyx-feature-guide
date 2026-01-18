import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { USER_SHEET_ID } from '@/lib/config';

const SPREADSHEET_ID = USER_SHEET_ID;

interface UserSignupData {
  partnerId: string;
  email: string;
  password: string;
}

// Validation helper functions
function validatePartnerId(partnerId: string): { valid: boolean; error?: string } {
  if (!partnerId || typeof partnerId !== 'string') {
    return { valid: false, error: 'ID is required' };
  }

  if (partnerId.length < 4) {
    return { valid: false, error: 'ID must be at least 4 characters long' };
  }

  if (partnerId.length > 50) {
    return { valid: false, error: 'ID must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(partnerId)) {
    return { valid: false, error: 'ID can only contain letters and numbers' };
  }

  return { valid: true };
}

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
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
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const data: UserSignupData = await request.json();
    console.log('[USER-SIGNUP] Received signup data:', {
      partnerId: data.partnerId,
      email: data.email,
    });

    // Validate ID
    const partnerIdValidation = validatePartnerId(data.partnerId);
    if (!partnerIdValidation.valid) {
      console.error('[USER-SIGNUP] ID validation failed:', partnerIdValidation.error);
      return NextResponse.json(
        { error: partnerIdValidation.error },
        { status: 400 }
      );
    }

    // Validate Email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      console.error('[USER-SIGNUP] Email validation failed:', emailValidation.error);
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate Password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      console.error('[USER-SIGNUP] Password validation failed:', passwordValidation.error);
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    console.log('[USER-SIGNUP] Initializing Google Sheets API...');
    // Initialize Google Sheets client with centralized credentials
    const sheets = await getGoogleSheetsClient();

    // Get spreadsheet metadata to determine the sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    if (!spreadsheet.data.sheets || spreadsheet.data.sheets.length === 0) {
      console.error('[USER-SIGNUP] No sheets found in the spreadsheet');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const firstSheet = spreadsheet.data.sheets[0];
    const sheetName = firstSheet.properties?.title || 'Sheet1';
    const sheetId = firstSheet.properties?.sheetId;

    console.log('[USER-SIGNUP] Using sheet:', sheetName, 'with ID:', sheetId);

    // BACKEND VALIDATION: Double-check Partner ID availability
    console.log('[USER-SIGNUP] Double-checking ID availability...');
    const existingIdsRange = `${sheetName}!B2:B`;
    const existingIdsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: existingIdsRange,
    });

    const existingIds = existingIdsResponse.data.values?.flat().filter(Boolean) || [];
    const partnerIdTaken = existingIds.some(
      (id) => id.toString().toLowerCase() === data.partnerId.toLowerCase()
    );

    if (partnerIdTaken) {
      console.error('[USER-SIGNUP] ID already exists:', data.partnerId);
      return NextResponse.json(
        { error: 'ID này đã được sử dụng. Vui lòng chọn ID khác.' },
        { status: 409 }
      );
    }

    // BACKEND VALIDATION: Double-check Email availability
    console.log('[USER-SIGNUP] Double-checking Email availability...');
    const existingEmailsRange = `${sheetName}!D2:D`;
    const existingEmailsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: existingEmailsRange,
    });

    const existingEmails = existingEmailsResponse.data.values?.flat().filter(Boolean) || [];
    const emailTaken = existingEmails.some(
      (existingEmail) => existingEmail.toString().toLowerCase() === data.email.toLowerCase()
    );

    if (emailTaken) {
      console.error('[USER-SIGNUP] Email already exists:', data.email);
      return NextResponse.json(
        { error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.' },
        { status: 409 }
      );
    }

    console.log('[USER-SIGNUP] All validations passed. Proceeding with registration...');

    // Create timestamp in ISO format (can be formatted by Google Sheets)
    const timestamp = new Date().toISOString();

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

    // Prepare row data: Timestamp, ID, Password, Email, Status
    const rowData = [
      formatTimestamp(timestamp),
      data.partnerId,
      data.password,
      data.email,
      'Active', // Status automatically set to Active
    ];

    console.log('[USER-SIGNUP] Attempting to write to Google Sheets...');

    // Insert a new row at position 2 (right after headers)
    if (sheetId !== undefined) {
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
    }

    // Write data to the newly inserted row (row 2)
    const range = `${sheetName}!A2:E2`;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('[USER-SIGNUP] Successfully wrote to Google Sheets:', response.data);

    return NextResponse.json(
      { success: true, message: 'Registration successful', partnerId: data.partnerId },
      { status: 200 }
    );
  } catch (error) {
    console.error('[USER-SIGNUP] Error submitting to Google Sheets:', error);
    if (error instanceof Error) {
      console.error('[USER-SIGNUP] Error message:', error.message);
      console.error('[USER-SIGNUP] Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to register. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
