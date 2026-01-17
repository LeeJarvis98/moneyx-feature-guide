import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { SHARED_SHEET_ID, MAIN_CONFIG } from '@/lib/config';

const RANGE = 'B:B'; // Column B only for backward compatibility
const DETAILED_RANGE = 'A:D'; // Columns: Email, UID, Account, Licensed Date

// Service account credentials
const SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'thermal-loop-468609-u1',
  private_key_id: 'b4ac5453b4efdb659af24d8fb99044d7922276a4',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCzrMndchvwUk3S\nUc4S+MX9dTYP6unPsMzxdiaSjBcImRvahOGAbOYcEzHLn9gqCTn7VV61X5zbkpNw\nxc7ttCIYxC4O6+N4P4U8j4DllGc+ZQOTp1uTtoeS4efx+jebWCWQQuvTGM99cQd1\nOP+xQGKuLgY2R+6z8Ntxywb6O2dBUKtRXs06vashcfuIctDTGQGAKF500XAbroux\nBIrjZknkl6ATz/b5doGuYJv+6MZ+CXDn5gv2Pa7Ld74K+Yy8HMPfeB+ChniMnXu9\nUOAETFPJUP4klpMstxW+EhVGch46Hdo5PsIpPBJvn/EVhQPUGjaBOE4+MmyFBTE0\nBIR3+pdRAgMBAAECggEAAM67ct5ZND4W5sk0c1mZx4qg/T3+DQhdLFWLDiwB59QZ\nOoFsY1+2XtTSXXkmHJJBYMrO4SoISwE83miOFIneKyRT6uOyFM9/1QagiOefEkhj\nDki5gE+uQ6USupUi/GaIPndpM0OUD5sNAIfDm8VWpRfEh5omDYE19fNNw/JgLlG9\nywRZ5kKXpq+eZdIpip5OVyA7rI0SEim82X3hEscWhOJA4CmEf9ExL0MxicFbODQG\nediUljgD01XABx9Q2iZueQIyGWKuAC4Qzk8T2RMICy0mfVcKaxWEziJ5mamYq3eQ\nOY2Rih1SmnJwi7uPWqosT5lQ2cjJRjeXRprVsXDMwQKBgQDb7nJEiN+D9CyqTFl/\nLL7Lwd+v1XBORltPchwEtM1WujluX9dUuDczC5ajprOGVcNkbtINuDXTzf2YB8jQ\nm1vWqmkgLCoPc3NtuhDzZE9CKIaLO99oBtF70tvjCoThiXULVLi0q0ENjeXx8Hpk\nqEMIm2X4SACM7xW1Ae7lkCfYqQKBgQDRJDkWgPapZbiket0h2LMvMAZSM7xUniiK\npvQzVfQLba4SP0QOsuKykwJxMd2vl7FS+33XTpmiMbPewpPuhHRKTUulBk5ECrfT\n8J3w72ALXR8jll2SLGvtEyPivHrm+tBIRfJSIyJHCZJQTf2bNbcLI3ddaCuLqm2o\nD2rS6L8qaQKBgHfJXKVlY1AsevNaWFiDF3xFIT9U4jFP8sXHoekSTNDS5xrtyouT\nNkVwJ2EFF7ywE5ctIO1mCrNM+7WFb+Pm6lN2R4HFbDc0K4d1E2xtkxm2lulY9+ph\n5FEr3KXBgfSReJVuVJfaurjWM4rd7tvKJZCXiyd6mAoq4kjPP737ESjZAoGBAJBR\nlrNYut2aPBgEUKQSjVN6qGIBIWyi1wcWvlzOa2GXhg9BaQ1bk+P2XjEOYBPTcaH5\nuZThwFKUSbLmQn7NGBJN1G1ENK3vV3sBB3xDMtuknuBH2roLvU4Tbyf/ODA7046L\n9fOIGxc6G6UerGp2XqFpD+18/M+cA599RBHWWlRBAoGBANF4p2HOIh3U27mQEUFB\nOwX74cbE6w+eO+BEmDMyXfnm8GJx8nSgDgEl3ahVUvYwQ5b0Ewo8E1Oaw0jy4DWH\n984D+GV25s3Hd88Mmj6lTecrGO79yn/e/PGr8FxYWhgbIUZaM1Mdr1vtkrFoFznN\nNYMSDgZ5ocdlTjyPQv0JJBps\n-----END PRIVATE KEY-----\n',
  client_email: 'vnclc-360@thermal-loop-468609-u1.iam.gserviceaccount.com',
  client_id: '104129272153748853373',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/vnclc-360%40thermal-loop-468609-u1.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

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
      // Initialize auth with service account
      const auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

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
