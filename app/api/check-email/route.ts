import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/supabase';
import { SHARED_SHEET_ID } from '@/lib/config';

const RANGE = 'B:B'; // Column B (will use the first sheet)
const EXNESS_API_BASE = 'https://my.exnessaffiliates.com';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const platformToken = request.headers.get('x-platform-token');
    
    console.log('[CHECK-EMAIL] Received email:', email);
    console.log('[CHECK-EMAIL] Platform token present:', !!platformToken);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!platformToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Platform authentication required. Please ensure you are logged in to the platform.' 
        },
        { status: 401 }
      );
    }

    // Step 1: Fetch client affiliation from Exness API using the platform token and email
    console.log('[CHECK-EMAIL] Step 1: Fetching client affiliation from Exness API');
    console.log('[CHECK-EMAIL] Email:', email);
    console.log('[CHECK-EMAIL] Token present:', !!platformToken);
    
    try {
      // Try POST method first (as affiliation endpoint might require POST)
      let exnessResponse = await fetch(
        `${EXNESS_API_BASE}/api/partner/affiliation/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${platformToken}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      // If POST returns 405, try GET with query parameter
      if (exnessResponse.status === 405) {
        console.log('[CHECK-EMAIL] POST not allowed, trying GET...');
        exnessResponse = await fetch(
          `${EXNESS_API_BASE}/api/partner/affiliation/?email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `JWT ${platformToken}`,
            },
          }
        );
      }

      console.log('[CHECK-EMAIL] Exness API response status:', exnessResponse.status);

      if (!exnessResponse.ok) {
        const errorText = await exnessResponse.text();
        console.error('[CHECK-EMAIL] Exness API error:', exnessResponse.status, errorText);
        throw new Error('Failed to fetch client affiliation from platform');
      }

      const clientData = await exnessResponse.json();
      console.log('[CHECK-EMAIL] Exness API response received');
      console.log('[CHECK-EMAIL] Affiliation:', clientData.affiliation);
      console.log('[CHECK-EMAIL] Client UID:', clientData.client_uid);
      console.log('[CHECK-EMAIL] Accounts:', clientData.accounts);

      // Check if client has affiliation
      if (!clientData.affiliation) {
        console.log('[CHECK-EMAIL] No affiliation found for email:', email);
        return NextResponse.json({
          success: false,
          data: {
            affiliation: false,
            accounts: [],
            client_uid: null,
          }
        });
      }

      // Step 2: Check which IDs exist in Google Sheets column B using Service Account
      try {
        console.log('[CHECK-EMAIL] Step 2: Fetching from Google Sheets...');
        
        // Initialize auth with centralized service account
        const sheets = await getGoogleSheetsClient();

        // Read data from column B of the shared sheet
        console.log('[CHECK-EMAIL] Reading Google Sheets, ID:', SHARED_SHEET_ID, 'Range:', RANGE);
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHARED_SHEET_ID,
          range: RANGE,
        });

        const rows = response.data.values || [];
        console.log('[CHECK-EMAIL] Google Sheets rows count:', rows.length);
        
        const existingIds = new Set(rows.map((row: any) => row[0]?.toString().toLowerCase()));
        console.log('[CHECK-EMAIL] Existing IDs in Google Sheets:', Array.from(existingIds).slice(0, 5), '...');

        // Check each account ID against the Google Sheets data
        const accountsWithStatus = clientData.accounts.map((accountId: string) => {
          const isLicensed = existingIds.has(accountId.toLowerCase());
          console.log(`[CHECK-EMAIL] Checking ${accountId}: ${isLicensed ? 'licensed' : 'unlicensed'}`);
          return {
            id: accountId,
            status: isLicensed ? 'licensed' : 'unlicensed'
          };
        });

        console.log('[CHECK-EMAIL] Final accountsWithStatus:', accountsWithStatus);

        // Return the data with updated account statuses
        return NextResponse.json({
          success: true,
          data: {
            affiliation: true,
            accounts: clientData.accounts,
            client_uid: clientData.client_uid,
            accountsWithStatus,
          },
        });

      } catch (sheetsError: any) {
        console.error('[CHECK-EMAIL] Google Sheets API Error:', sheetsError);
        console.error('[CHECK-EMAIL] Error details:', {
          message: sheetsError.message,
          code: sheetsError.code,
          errors: sheetsError.errors,
        });
        
        // If Google Sheets fails, still return data but without license status
        console.warn('[CHECK-EMAIL] Google Sheets check failed, returning data without license status');
        return NextResponse.json({
          success: true,
          data: {
            affiliation: true,
            accounts: clientData.accounts,
            client_uid: clientData.client_uid,
          },
        });
      }

    } catch (platformError: any) {
      console.error('[CHECK-EMAIL] Platform API Error:', platformError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch client data from platform',
          details: process.env.NODE_ENV === 'development' ? platformError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[CHECK-EMAIL] Server Error:', error);
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
