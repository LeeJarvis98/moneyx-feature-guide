import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { SHARED_SHEET_ID, MAIN_CONFIG } from '@/lib/config';

const RANGE = 'B:B'; // Column B (will use the first sheet)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log('[API] Received email:', email);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Step 1: Fetch account IDs from ngrok API
    console.log('[API] Step 1: Fetching from ngrok API:', MAIN_CONFIG.ngrokApiUrl);
    const ngrokResponse = await fetch(MAIN_CONFIG.ngrokApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!ngrokResponse.ok) {
      throw new Error('Ngrok API response was not ok');
    }

    const ngrokResult = await ngrokResponse.json();
    console.log('[API] Ngrok result:', ngrokResult);

    // If ngrok API returns no affiliation or no accounts, return early
    if (!ngrokResult.success || !ngrokResult.data.affiliation || !ngrokResult.data.accounts) {
      console.log('[API] No affiliation or accounts found, returning early');
      return NextResponse.json(ngrokResult);
    }

    console.log('[API] Accounts from ngrok:', ngrokResult.data.accounts);

    // Step 2: Check which IDs exist in Google Sheets column B using Service Account
    try {
      console.log('[API] Step 2: Fetching from Google Sheets...');
      
      // Initialize auth with centralized service account
      const sheets = await getGoogleSheetsClient();

      // Read data from column B of the shared sheet
      console.log('[API] Reading Google Sheets, ID:', SHARED_SHEET_ID, 'Range:', RANGE);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHARED_SHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values || [];
      console.log('[API] Google Sheets rows count:', rows.length);
      console.log('[API] Google Sheets data (column B):', rows.map(r => r[0]));
      
      const existingIds = new Set(rows.map((row) => row[0]?.toString().toLowerCase()));
      console.log('[API] Existing IDs in Google Sheets:', Array.from(existingIds));

      // Check each account ID against the Google Sheets data
      const accountsWithStatus = ngrokResult.data.accounts.map((accountId: string) => {
        const isLicensed = existingIds.has(accountId.toLowerCase());
        console.log(`[API] Checking ${accountId}: ${isLicensed ? 'licensed' : 'unlicensed'}`);
        return {
          id: accountId,
          status: isLicensed ? 'licensed' : 'unlicensed'
        };
      });

      console.log('[API] Final accountsWithStatus:', accountsWithStatus);

      // Return the ngrok data with updated account statuses
      return NextResponse.json({
        success: true,
        data: {
          ...ngrokResult.data,
          accounts: ngrokResult.data.accounts,
          accountsWithStatus,
        },
      });

    } catch (apiError: any) {
      console.error('[API] Google Sheets API Error:', apiError);
      console.error('[API] Error details:', {
        message: apiError.message,
        code: apiError.code,
        errors: apiError.errors,
      });
      
      // If Google Sheets fails, still return ngrok data but without license status
      console.warn('[API] Google Sheets check failed, returning ngrok data without license status');
      return NextResponse.json(ngrokResult);
    }

  } catch (error: any) {
    console.error('[API] Server Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check email',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
