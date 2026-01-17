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

interface UserSignupData {
  partnerId: string;
  email: string;
  password: string;
}

// Validation helper functions
function validatePartnerId(partnerId: string): { valid: boolean; error?: string } {
  if (!partnerId || typeof partnerId !== 'string') {
    return { valid: false, error: 'Partner ID is required' };
  }

  if (partnerId.length < 3) {
    return { valid: false, error: 'Partner ID must be at least 3 characters long' };
  }

  if (partnerId.length > 50) {
    return { valid: false, error: 'Partner ID must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(partnerId)) {
    return { valid: false, error: 'Partner ID can only contain letters and numbers' };
  }

  return { valid: true };
}

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const data: UserSignupData = await request.json();
    console.log('[USER-SIGNUP] Received signup data:', {
      partnerId: data.partnerId,
      email: data.email,
    });

    // Validate Partner ID
    const partnerIdValidation = validatePartnerId(data.partnerId);
    if (!partnerIdValidation.valid) {
      console.error('[USER-SIGNUP] Partner ID validation failed:', partnerIdValidation.error);
      return NextResponse.json(
        { error: partnerIdValidation.error },
        { status: 400 }
      );
    }

    // Validate Email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      console.error('[USER-SIGNUP] Email validation failed:', emailValidation.error);
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate Password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      console.error('[USER-SIGNUP] Password validation failed:', passwordValidation.error);
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    console.log('[USER-SIGNUP] Initializing Google Sheets API...');
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: SERVICE_ACCOUNT,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Create timestamp in ISO format (can be formatted by Google Sheets)
    const timestamp = new Date().toISOString();

    // Format timestamp to dd.mm.yyyy hh:mm:ss
    const formatTimestamp = (isoString: string): string => {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    };

    // Prepare row data: Timestamp, ID, Password, Email, Status
    const rowData = [
      formatTimestamp(timestamp),
      data.partnerId,
      data.password,
      data.email,
      'Active', // Status automatically set to Active
    ];

    console.log('[USER-SIGNUP] Attempting to write to Google Sheets...');
    console.log('[USER-SIGNUP] Spreadsheet ID:', SPREADSHEET_ID);

    // Get spreadsheet metadata to determine the first sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    if (!spreadsheet.data.sheets || spreadsheet.data.sheets.length === 0) {
      console.error('[USER-SIGNUP] No sheets found in the spreadsheet');
      throw new Error('No sheets found in the spreadsheet');
    }

    // Use the first sheet (default sheet)
    const firstSheet = spreadsheet.data.sheets[0];
    const sheetName = firstSheet.properties?.title || 'Sheet1';
    const sheetId = firstSheet.properties?.sheetId;

    console.log('[USER-SIGNUP] Using sheet:', sheetName, 'with ID:', sheetId);

    // Insert a new row at position 2 (right after headers)
    if (sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: 1,
                  endIndex: 2,
                },
              },
            },
          ],
        },
      });
    }

    // Write data to the newly inserted row (row 2)
    const range = `${sheetName}!A2:E2`;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('[USER-SIGNUP] Successfully wrote to Google Sheets:', response.data);

    return NextResponse.json(
      { success: true, message: 'Registration successful', partnerId: data.partnerId },
      { status: 200 }
    );
  } catch (error) {
    console.error('[USER-SIGNUP] Error submitting to Google Sheets:', error);
    if (error instanceof Error) {
      console.error('[USER-SIGNUP] Error message:', error.message);
      console.error('[USER-SIGNUP] Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to register. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
