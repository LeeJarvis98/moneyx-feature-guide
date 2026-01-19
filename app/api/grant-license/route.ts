import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getGoogleSheetsClient } from '@/lib/supabase';
import { SHARED_SHEET_ID } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { accountIds, email, clientUid } = await request.json();
    console.log('[GRANT] Received account IDs to license:', accountIds, 'for email:', email, 'UID:', clientUid);

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Account IDs array is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!clientUid) {
      return NextResponse.json(
        { success: false, error: 'Client UID is required' },
        { status: 400 }
      );
    }

    try {
      // Initialize clients
      const supabase = getSupabaseClient();
      const sheets = await getGoogleSheetsClient();

      console.log('[GRANT] Writing licenses to Supabase and Google Sheets...');

      // Format timestamp as ISO string
      const timestamp = new Date().toISOString();

      // === WRITE TO SUPABASE (Detailed tracking) ===
      console.log('[GRANT] Writing to Supabase...');
      const licensedRecords = accountIds.map((accountId) => ({
        email,
        uid: clientUid,
        account_id: accountId,
        licensed_at: timestamp,
      }));

      const { data: insertedRecords, error: insertError } = await supabase
        .from('licensed_accounts')
        .insert(licensedRecords)
        .select();

      if (insertError) {
        console.error('[GRANT] Supabase error:', insertError);
        throw insertError;
      }

      console.log('[GRANT] Successfully wrote', insertedRecords?.length || 0, 'records to Supabase');

      // === WRITE TO GOOGLE SHEETS (Shared license list) ===
      console.log('[GRANT] Writing to shared Google Sheet...');
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHARED_SHEET_ID,
        range: 'B:B',
      });

      const existingRows = readResponse.data.values || [];
      const nextRow = existingRows.length + 1;
      console.log('[GRANT] Shared sheet - next empty row:', nextRow);

      // Write only account IDs to column B
      const simpleValues = accountIds.map((id) => [id]);
      const simpleTargetRange = `B${nextRow}:B${nextRow + simpleValues.length - 1}`;
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHARED_SHEET_ID,
        range: simpleTargetRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: simpleValues,
        },
      });

      console.log('[GRANT] Successfully wrote to shared Google Sheet');

      return NextResponse.json({
        success: true,
        data: {
          updatedRows: insertedRecords?.length || 0,
          records: insertedRecords,
        },
      });

    } catch (apiError: any) {
      console.error('[GRANT] Error:', apiError);
      console.error('[GRANT] Error details:', {
        message: apiError.message,
        code: apiError.code,
        details: apiError.details,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: apiError.message || 'Failed to grant license',
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[GRANT] Server Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to grant license',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
