import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getPartnerFromRequest } from '@/lib/partners';

const RANGE = 'A:D'; // Columns: Email, UID, Account, Licensed Date

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

export async function GET(request: NextRequest) {
  try {
    // Get partner configuration from request
    const partnerConfig = getPartnerFromRequest(request);
    console.log('[GET-LICENSED-IDS] Using partner config:', partnerConfig.name, 'Sheet:', partnerConfig.sheetTabName);

    const { searchParams } = new URL(request.url);
    const filterEmail = searchParams.get('email'); // Optional email filter
    
    console.log('[GET-LICENSED-IDS] Fetching licensed account IDs from Google Sheets...');
    if (filterEmail) {
      console.log('[GET-LICENSED-IDS] Filtering by email:', filterEmail);
    }

    try {
      // Initialize auth with service account
      const auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // Read data from partner-specific sheet (Email, UID, Account, Licensed Date)
      console.log('[GET-LICENSED-IDS] Reading data from', partnerConfig.sheetTabName, 'sheet...');
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: partnerConfig.detailedSheetId,
        range: `${partnerConfig.sheetTabName}!${RANGE}`,
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
