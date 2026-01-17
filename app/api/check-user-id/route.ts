import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1G3CnLsRG5LUkQ2L1j6G2XiG8I1keeVRWiHvnNuUA5ok';

// Service account credentials (same as used in other endpoints)
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
    const { partnerId } = await request.json();

    // Validate partner ID
    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    if (partnerId.length < 3) {
      return NextResponse.json(
        { error: 'Partner ID must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(partnerId)) {
      return NextResponse.json(
        { error: 'Partner ID can only contain letters and numbers' },
        { status: 400 }
      );
    }

    console.log('[CHECK-USER-ID] Checking availability for:', partnerId);

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: SERVICE_ACCOUNT,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get spreadsheet metadata to determine the first sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    if (!spreadsheet.data.sheets || spreadsheet.data.sheets.length === 0) {
      console.error('[CHECK-USER-ID] No sheets found in the spreadsheet');
      throw new Error('No sheets found in the spreadsheet');
    }

    // Use the first sheet (default sheet)
    const firstSheet = spreadsheet.data.sheets[0];
    const sheetName = firstSheet.properties?.title || 'Sheet1';

    console.log('[CHECK-USER-ID] Using sheet:', sheetName);

    // Read all user IDs from column B (starting from row 2 to skip header)
    const range = `${sheetName}!B2:B`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const existingIds = response.data.values?.flat().filter(Boolean) || [];
    
    console.log('[CHECK-USER-ID] Found existing IDs:', existingIds.length);

    // Check if the partner ID already exists (case-insensitive)
    const isTaken = existingIds.some(
      (id) => id.toString().toLowerCase() === partnerId.toLowerCase()
    );

    if (isTaken) {
      console.log('[CHECK-USER-ID] ID is taken:', partnerId);
      return NextResponse.json(
        { available: false, message: 'ID đối tác này đã được sử dụng' },
        { status: 200 }
      );
    }

    console.log('[CHECK-USER-ID] ID is available:', partnerId);
    return NextResponse.json(
      { available: true, message: 'ID đối tác khả dụng' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHECK-USER-ID] Error checking user ID:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check partner ID availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
