import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1OwiPWGUgMo8Sc6tG69x3AeUQGZ-Phv_0GgwjK-OXwF0';

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

interface ExnessCredentials {
  email: string;
  password: string;
}

// Parse credentials string to extract platform-specific credentials
function parsePlatformCredentials(credentialsStr: string, platform: string): ExnessCredentials | null {
  try {
    // Format: "exness: email / password; binance: email / password" or "exness: email / password"
    const platforms = credentialsStr.split(';').map(s => s.trim());
    
    for (const platformEntry of platforms) {
      const platformLower = platformEntry.toLowerCase();
      const targetPlatform = platform.toLowerCase();
      
      if (platformLower.startsWith(`${targetPlatform}:`)) {
        // Extract the part after "platform:"
        const credsPart = platformEntry.substring(platformEntry.indexOf(':') + 1).trim();
        
        // Split by "/" to get email and password
        const parts = credsPart.split('/').map(s => s.trim());
        
        if (parts.length >= 2) {
          return {
            email: parts[0],
            password: parts[1]
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[PARTNER-LOGIN] Error parsing credentials:', error);
    return null;
  }
}

export async function POST(requ, platform } = await request.json();

    // Validate input
    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json(
        { error: 'Platform selection is required' },
        { status: 400 }
      );
    }

    console.log('[PARTNER-LOGIN] Login attempt for partner:', partnerId, 'Platform:', platform

    console.log('[PARTNER-LOGIN] Login attempt for partner:', partnerId);

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: SERVICE_ACCOUNT,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read partner data from Google Sheets (columns B, C, D, E)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AndyBao!B2:E', // Partner ID, Password, Credentials, Status
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('[PARTNER-LOGIN] No partner data found in sheet');
      return NextResponse.json(
        { error: 'Invalid partner ID or password' },
        { status: 401 }
      );
    }

    // Find the partner account
    let partnerData: { id: string; password: string; credentials: string; status: string } | null = null;
    
    for (const row of rows) {
      const [id, pass, creds, status] = row;
      
      if (id && id.toLowerCase() === partnerId.toLowerCase()) {
        partnerData = {
          id,
          password: pass || '',
          credentials: creds || '',
          status: status || 'Pending'
        };
        break;
      }
    }

    if (!partnerData) {
      console.log('[PARTNER-LOGIN] Partner not found:', partnerId);
      return NextResponse.json(
        { error: 'Invalid partner ID or password' },
        { status: 401 }
      );
    }

    // Verify password
    if (partnerData.password !== password) {
      console.log('[PARTNER-LOGIN] Invalid password for partner:', partnerId);
      return NextResponse.json(
        { error: 'Invalid partner ID or password' },
        { status: 401 }
      );
    }

    // Check account status
    const status = partnerData.status.toLowerCase();
    
    if (status === 'pending') {
      console.log('[PARTNER-LOGIN] Account pending approval:', partnerId);
      return NextResponse.json(
        { error: 'Your account is pending approval. Please wait for admin confirmation.' },
        { status: 403 }
      );
    }

    if (status === 'banned') {
      console.log('[PARTNER-LOGIN] Account banned:', partnerId);
      return NextResponse.json(
        { error: 'Your account has been banned. Please contact support.' },
        { status: 403 }
      );
    }

    if (status === 'cancelled') {
      console.log('[PARTNER-LOGIN] Account cancelled:', partnerId);
      return NextResponse.json(
        { error: 'Your account has been cancelled. Please contact support.' },
        { status: 403 }
      );
    }

    if (status !== 'active') {
      consoleplatform credentials from column D
    const platformCreds = parsePlatformCredentials(partnerData.credentials, platform);
    
    if (!platformCreds) {
      console.error('[PARTNER-LOGIN] No credentials found for platform:', platform);
      return NextResponse.json(
        { error: `Không tìm thấy thông tin đăng nhập cho sàn ${platform}. Vui lòng liên hệ hỗ trợ.` },
        { status: 500 }
      );
    }

    console.log('[PARTNER-LOGIN] Platform credentials extracted for:', partnerId, 'Platform:', platform);

    // Login to platform API (currently supports Exness, can be extended for other platforms)
    try {
      let apiResponse;
      let platformData;

      if (platform.toLowerCase() === 'exness') {
        apiResponse = await fetch('https://my.exness.com/api/accounts/trader/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: platformCreds.email,
            password: platformCreds.password,
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          console.error('[PARTNER-LOGIN] Exness API error:', errorData);
          throw new Error('Failed to authenticate with Exness');
        }

        platformData = await apiResponse.json();
        
        console.log('[PARTNER-LOGIN] Successfully logged into Exness for partner:', partnerId);
      } else if (platform.toLowerCase() === 'binance') {
        // Add Binance authentication here when implemented
        console.log('[PARTNER-LOGIN] Binance authentication not yet implemented');
        platformData = { token: null };
      } else {
        throw new Error(`Platform ${platform} is not yet supported`);
      }

      // Return success with partner info
      return NextResponse.json(
        {
          success: true,
          partnerId: partnerData.id,
          platform: platform,
          platformToken: platformData.token || null,
          message: 'Login successful'
        },
        { status: 200 }
      );

    } catch (platformError) {
      console.error('[PARTNER-LOGIN] Platform login failed:', platformError);
      return NextResponse.json(
        { error: `Không thể xác thực với sàn ${platform}. Vui lòng liên hệ hỗ trợ.`
        { status: 200 }
      );

    } catch (exnessError) {
      console.error('[PARTNER-LOGIN] Exness login failed:', exnessError);
      return NextResponse.json(
        { error: 'Failed to authenticate with trading platform. Please contact support.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PARTNER-LOGIN] Error during login:', error);
    return NextResponse.json(
      { 
        error: 'Login failed. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
