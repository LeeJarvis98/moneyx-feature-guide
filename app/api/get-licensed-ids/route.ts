import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { MAIN_CONFIG } from '@/lib/config';

const RANGE = 'A:D'; // Columns: Email, UID, Account, Licensed Date

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterEmail = searchParams.get('email'); // Optional email filter
    
    console.log('[GET-LICENSED-IDS] Fetching licensed account IDs from Google Sheets...');
    if (filterEmail) {
      console.log('[GET-LICENSED-IDS] Filtering by email:', filterEmail);
    }

    try {
      // Initialize auth with centralized service account
      const sheets = await getGoogleSheetsClient();

      // Read data from main sheet (Email, UID, Account, Licensed Date)
      console.log('[GET-LICENSED-IDS] Reading data from', MAIN_CONFIG.sheetTabName, 'sheet...');
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: MAIN_CONFIG.detailedSheetId,
        range: `${MAIN_CONFIG.sheetTabName}!${RANGE}`,
      });

      const rows = response.data.values || [];
      console.log('[GET-LICENSED-IDS] Found', rows.length, 'rows');

      // Extract email (column A), UID (column B), account IDs (column C), and timestamp (column D)
      let licensedAccounts = rows
        .slice(1) // Skip header row
        .filter((row) => row[2]) // Filter out rows without account ID
        .map((row) => ({
          email: row[0] || '',
          uid: row[1] || '',
          accountId: row[2],
          timestamp: row[3] || null,
        }));

      // Filter by email if provided
      if (filterEmail) {
        licensedAccounts = licensedAccounts.filter(
          (account) => account.email.toLowerCase() === filterEmail.toLowerCase()
        );
        console.log('[GET-LICENSED-IDS] After email filter:', licensedAccounts.length, 'accounts');
      }

      // Return just the account IDs array for filtering
      const accountIds = licensedAccounts.map((account) => account.accountId);

      console.log('[GET-LICENSED-IDS] Returning', accountIds.length, 'licensed account IDs');

      return NextResponse.json({
        success: true,
        data: accountIds,
        details: licensedAccounts, // Include full details with timestamps
      });

    } catch (apiError: any) {
      console.error('[GET-LICENSED-IDS] Google Sheets API Error:', apiError);
      console.error('[GET-LICENSED-IDS] Error details:', {
        message: apiError.message,
        code: apiError.code,
        errors: apiError.errors,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: apiError.message || 'Failed to read from Google Sheets',
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[GET-LICENSED-IDS] Server Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
