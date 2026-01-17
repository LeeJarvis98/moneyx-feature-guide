import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { SHARED_SHEET_ID, MAIN_CONFIG } from '@/lib/config';

const RANGE = 'B:B'; // Column B (will use the first sheet)

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
      
      // Initialize auth with service account
      const auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

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
