import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { SHARED_SHEET_ID, MAIN_CONFIG } from '@/lib/config';

const RANGE = 'B:B'; // Column B only for backward compatibility
const DETAILED_RANGE = 'A:D'; // Columns: Email, UID, Account, Licensed Date

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
      // Initialize auth with centralized service account
      const sheets = await getGoogleSheetsClient();

      // Format timestamp as dd.mm.yyyy hh:mm:ss
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

      // === WRITE TO FIRST SHEET (Simple format - Account ID only in column B) ===
      // Uses the SHARED sheet that all partners use
      console.log('[GRANT] Writing to shared sheet (simple format)...');
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHARED_SHEET_ID,
        range: RANGE,
      });

      const existingRows = readResponse.data.values || [];
      const nextRow = existingRows.length + 1;
      console.log('[GRANT] First sheet - next empty row:', nextRow);

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

      console.log('[GRANT] Successfully wrote to shared sheet');

      // === WRITE TO SECOND SHEET (Detailed format - Email, UID, Account, Date) ===
      // Uses the main detailed sheet and tab name
      console.log('[GRANT] Writing to detailed sheet:', MAIN_CONFIG.detailedSheetId, 'Tab:', MAIN_CONFIG.sheetTabName);
      const detailedReadResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: MAIN_CONFIG.detailedSheetId,
        range: `${MAIN_CONFIG.sheetTabName}!${DETAILED_RANGE}`,
      });

      const detailedExistingRows = detailedReadResponse.data.values || [];
      const detailedNextRow = detailedExistingRows.length + 1;
      console.log('[GRANT] Second sheet - next empty row:', detailedNextRow);

      // Format: Email, UID, Account, Licensed Date
      const detailedValues = accountIds.map((id) => [
        email,
        clientUid,
        id,
        timestamp
      ]);
      
      const detailedTargetRange = `${MAIN_CONFIG.sheetTabName}!A${detailedNextRow}:D${detailedNextRow + detailedValues.length - 1}`;
      
      const detailedResponse = await sheets.spreadsheets.values.update({
        spreadsheetId: MAIN_CONFIG.detailedSheetId,
        range: detailedTargetRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: detailedValues,
        },
      });

      console.log('[GRANT] Successfully wrote', detailedResponse.data.updatedRows, 'rows to second sheet');

      return NextResponse.json({
        success: true,
        data: {
          updatedRows: detailedResponse.data.updatedRows || 0,
          updatedRange: detailedResponse.data.updatedRange,
        },
      });

    } catch (apiError: any) {
      console.error('[GRANT] Google Sheets API Error:', apiError);
      console.error('[GRANT] Error details:', {
        message: apiError.message,
        code: apiError.code,
        errors: apiError.errors,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: apiError.message || 'Failed to write to Google Sheets',
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
