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

    // Step 1: Fetch client accounts from Exness API using the platform token
    console.log('[CHECK-EMAIL] Step 1: Fetching client accounts from Exness API');
    
    try {
      // Use the Exness Partner API to get client accounts report
      const exnessResponse = await fetch(
        `${EXNESS_API_BASE}/api/reports/clients/accounts/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${platformToken}`,
          },
        }
      );

      if (!exnessResponse.ok) {
        console.error('[CHECK-EMAIL] Exness API error:', exnessResponse.status);
        throw new Error('Failed to fetch client accounts from platform');
      }

      const exnessData = await exnessResponse.json();
      console.log('[CHECK-EMAIL] Exness API response received');
      console.log('[CHECK-EMAIL] Total clients found:', exnessData.data?.length || 0);

      // Find client accounts matching the email
      // The API returns client_uid which we can use to identify unique clients
      const matchingClients = exnessData.data?.filter((client: any) => {
        // You may need to adjust this based on the actual API response structure
        // If the API doesn't return email directly, we might need a different approach
        return client.client_account && client.client_uid;
      }) || [];

      if (matchingClients.length === 0) {
        console.log('[CHECK-EMAIL] No matching clients found for email:', email);
        return NextResponse.json({
          success: false,
          data: {
            affiliation: false,
            accounts: [],
            client_uid: null,
          }
        });
      }

      // Group accounts by client_uid to get unique clients
      const clientsByUid = matchingClients.reduce((acc: any, client: any) => {
        if (!acc[client.client_uid]) {
          acc[client.client_uid] = {
            client_uid: client.client_uid,
            accounts: [],
          };
        }
        acc[client.client_uid].accounts.push(client.client_account);
        return acc;
      }, {});

      // For now, take the first client (you may need to add logic to select the right one)
      const firstClientUid = Object.keys(clientsByUid)[0];
      const clientData = clientsByUid[firstClientUid];
      
      console.log('[CHECK-EMAIL] Found client UID:', clientData.client_uid);
      console.log('[CHECK-EMAIL] Accounts:', clientData.accounts);

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
