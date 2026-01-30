import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getGoogleSheetsClient } from '@/lib/supabase';
import { SHARED_SHEET_ID } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { accountIds, email, clientUid, userId } = await request.json();
    console.log('[GRANT] Received account IDs to license:', accountIds, 'for email:', email, 'UID:', clientUid, 'User ID:', userId);

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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
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

      // === CHECK FOR EXISTING ACCOUNTS IN SUPABASE ===
      console.log('[GRANT] Checking for existing accounts in Supabase...');
      const { data: existingAccounts, error: checkError } = await supabase
        .from('licensed_accounts')
        .select('account_id')
        .in('account_id', accountIds);

      if (checkError) {
        console.error('[GRANT] Error checking existing accounts:', checkError);
        throw checkError;
      }

      const existingAccountIds = new Set(existingAccounts?.map((acc) => acc.account_id) || []);
      console.log('[GRANT] Found', existingAccountIds.size, 'existing accounts:', Array.from(existingAccountIds));

      // Filter out accounts that already exist
      const newAccountIds = accountIds.filter((id) => !existingAccountIds.has(id));
      console.log('[GRANT] New accounts to insert:', newAccountIds);

      // === WRITE TO SUPABASE (Only new accounts) ===
      let insertedRecords = [];
      if (newAccountIds.length > 0) {
        console.log('[GRANT] Writing', newAccountIds.length, 'new accounts to Supabase...');
        const licensedRecords = newAccountIds.map((accountId) => ({
          id: userId, // Foreign key to users table
          email,
          uid: clientUid,
          account_id: accountId,
          licensed_date: timestamp,
          platform: 'exness', // Default platform
          licensed_status: 'licensed', // Set status to licensed
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('licensed_accounts')
          .insert(licensedRecords)
          .select();

        if (insertError) {
          console.error('[GRANT] Supabase error:', insertError);
          throw insertError;
        }

        insertedRecords = inserted || [];
        console.log('[GRANT] Successfully wrote', insertedRecords.length, 'new records to Supabase');
      } else {
        console.log('[GRANT] All accounts already exist in Supabase, skipping insert');
      }

      // === UPDATE EXISTING ACCOUNTS STATUS TO 'LICENSED' ===
      if (existingAccountIds.size > 0) {
        console.log('[GRANT] Updating', existingAccountIds.size, 'existing accounts to licensed status...');
        const { error: updateError } = await supabase
          .from('licensed_accounts')
          .update({ licensed_status: 'licensed' })
          .in('account_id', Array.from(existingAccountIds));

        if (updateError) {
          console.error('[GRANT] Error updating existing accounts status:', updateError);
        } else {
          console.log('[GRANT] Successfully updated existing accounts to licensed status');
        }
      }

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
          updatedRows: insertedRecords.length,
          totalAccounts: accountIds.length,
          newAccounts: insertedRecords.length,
          existingAccounts: existingAccountIds.size,
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
