import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getGoogleSheetsClient } from '@/lib/supabase';
import { SHARED_SHEET_ID } from '@/lib/config';

/**
 * Revoke license API - Removes account IDs from Google Sheets and updates status in Supabase
 * Note: Supabase records are NOT deleted to maintain history and allow future re-licensing
 */
export async function POST(request: NextRequest) {
  try {
    const { accountIds, email } = await request.json();
    console.log('[REVOKE] Received account IDs to revoke:', accountIds, 'for email:', email);

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

    try {
      // Initialize clients
      const supabase = getSupabaseClient();
      const sheets = await getGoogleSheetsClient();

      console.log('[REVOKE] Reading from shared Google Sheet...');
      
      // Read all values from column B
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHARED_SHEET_ID,
        range: 'B:B',
      });

      const existingRows = readResponse.data.values || [];
      console.log('[REVOKE] Total rows in sheet:', existingRows.length);

      // Find rows that match the account IDs to delete
      const rowsToDelete: number[] = [];
      accountIds.forEach((accountId) => {
        const rowIndex = existingRows.findIndex((row) => row[0] === accountId);
        if (rowIndex !== -1) {
          rowsToDelete.push(rowIndex + 1); // +1 because spreadsheet rows are 1-indexed
          console.log('[REVOKE] Found account ID', accountId, 'at row', rowIndex + 1);
        }
      });

      if (rowsToDelete.length === 0) {
        console.log('[REVOKE] No matching rows found to delete');
        return NextResponse.json({
          success: true,
          message: 'No matching account IDs found in Google Sheets',
          deletedCount: 0,
        });
      }

      console.log('[REVOKE] Rows to delete:', rowsToDelete);

      // Delete rows in reverse order to avoid index shifting issues
      const sortedRows = rowsToDelete.sort((a, b) => b - a);
      
      const deleteRequests = sortedRows.map((rowNumber) => ({
        deleteDimension: {
          range: {
            sheetId: 0, // Assuming first sheet
            dimension: 'ROWS',
            startIndex: rowNumber - 1, // 0-indexed for API
            endIndex: rowNumber, // Exclusive end
          },
        },
      }));

      // Execute batch delete
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHARED_SHEET_ID,
        requestBody: {
          requests: deleteRequests,
        },
      });

      console.log('[REVOKE] Successfully deleted', rowsToDelete.length, 'rows from Google Sheets');

      // === UPDATE SUPABASE STATUS TO 'UNLICENSED' ===
      console.log('[REVOKE] Updating Supabase status to unlicensed...');
      const { error: updateError } = await supabase
        .from('licensed_accounts')
        .update({ licensed_status: 'unlicensed' })
        .in('account_id', accountIds);

      if (updateError) {
        console.error('[REVOKE] Error updating Supabase status:', updateError);
      } else {
        console.log('[REVOKE] Successfully updated', accountIds.length, 'accounts to unlicensed status');
      }

      return NextResponse.json({
        success: true,
        message: 'Licenses revoked successfully from Google Sheets and Supabase updated',
        deletedCount: rowsToDelete.length,
      });

    } catch (error) {
      console.error('[REVOKE] Error during revoke operation:', error);
      throw error;
    }

  } catch (error) {
    console.error('[REVOKE] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
