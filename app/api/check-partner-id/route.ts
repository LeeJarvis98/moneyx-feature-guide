import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { PARTNER_SHEET_ID } from '@/lib/config';

const SPREADSHEET_ID = PARTNER_SHEET_ID;

export async function POST(request: NextRequest) {
  try {
    const { partnerId } = await request.json();

    // Validate partner ID
    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    if (partnerId.length < 3) {
      return NextResponse.json(
        { error: 'Partner ID must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(partnerId)) {
      return NextResponse.json(
        { error: 'Partner ID can only contain letters and numbers' },
        { status: 400 }
      );
    }

    console.log('[CHECK-PARTNER-ID] Checking availability for:', partnerId);

    // Initialize Google Sheets API with centralized credentials
    const sheets = await getGoogleSheetsClient();

    // Read all partner IDs from column B (starting from row 2 to skip header)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AndyBao!B2:B', // Column B from row 2 onwards
    });

    const existingIds = response.data.values?.flat().filter(Boolean) || [];
    
    console.log('[CHECK-PARTNER-ID] Found existing IDs:', existingIds.length);

    // Check if the partner ID already exists (case-insensitive)
    const isTaken = existingIds.some(
      (id) => id.toString().toLowerCase() === partnerId.toLowerCase()
    );

    if (isTaken) {
      console.log('[CHECK-PARTNER-ID] ID is taken:', partnerId);
      return NextResponse.json(
        { available: false, message: 'ID đối tác này đã được sử dụng' },
        { status: 200 }
      );
    }

    console.log('[CHECK-PARTNER-ID] ID is available:', partnerId);
    return NextResponse.json(
      { available: true, message: 'ID đối tác khả dụng' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHECK-PARTNER-ID] Error checking partner ID:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check partner ID availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
