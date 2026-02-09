import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { Resend } from 'resend';

// Lazy initialization of Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const EXNESS_API_BASE = 'https://my.exnessaffiliates.com';

export async function POST(request: NextRequest) {
  try {
    const { email, platform, referralId, captchaToken, otp, action } = await request.json();
    let platformToken = request.headers.get('x-platform-token');
    
    console.log('[CHECK-EMAIL] Received email:', email);
    console.log('[CHECK-EMAIL] Platform:', platform);
    console.log('[CHECK-EMAIL] Referral ID:', referralId);
    console.log('[CHECK-EMAIL] Captcha token present:', !!captchaToken);
    console.log('[CHECK-EMAIL] Platform token in header:', !!platformToken);

    // Verify captcha token first
    if (!captchaToken) {
      return NextResponse.json(
        { success: false, error: 'Captcha verification is required' },
        { status: 400 }
      );
    }

    const isCaptchaValid = await verifyTurnstileToken(captchaToken);
    if (!isCaptchaValid) {
      console.log('[CHECK-EMAIL] Captcha verification failed');
      return NextResponse.json(
        { success: false, error: 'Captcha verification failed. Please try again.' },
        { status: 400 }
      );
    }

    console.log('[CHECK-EMAIL] Captcha verified successfully');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Handle OTP sending
    if (action === 'send-otp') {
      console.log('[CHECK-EMAIL] Sending OTP to:', email);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email already exists in licensed_accounts table
      const supabase = getSupabaseClient();
      const { data: existingLicense, error: checkError } = await supabase
        .from('licensed_accounts')
        .select('email, platform')
        .ilike('email', email)
        .eq('platform', platform)
        .limit(1);
      
      if (checkError) {
        console.error('[CHECK-EMAIL] Error checking licensed_accounts:', checkError);
      }
      
      if (existingLicense && existingLicense.length > 0) {
        console.log('[CHECK-EMAIL] Email already exists in licensed_accounts:', email);
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        return NextResponse.json(
          { 
            success: false, 
            error: `Email "${email}" đã được xác nhận trong hệ thống.\n\nMỗi email chỉ cần kiểm tra một lần duy nhất. Bạn có thể chuyển sang tab Bản quyền để quản lý tài khoản của mình.` 
          },
          { status: 400 }
        );
      }

      console.log('[CHECK-EMAIL] Email not found in licensed_accounts, proceeding with OTP');

      // Generate OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
      
      console.log('[CHECK-EMAIL] Generated OTP:', otpCode, 'for email:', email);
      
      // Store OTP in database (reuse supabase instance from above)
      const { error: otpError } = await supabase
        .from('email_otps')
        .upsert({
          email: email.toLowerCase(),
          otp: otpCode,
          expires_at: expiresAt.toISOString(),
          verified: false,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });
      
      if (otpError) {
        console.error('[CHECK-EMAIL] Error storing OTP:', otpError);
        return NextResponse.json(
          { success: false, error: 'Failed to generate OTP' },
          { status: 500 }
        );
      }
      
      console.log('[CHECK-EMAIL] OTP stored in database successfully');
      
      // Send OTP via email using Resend
      try {
        console.log('[CHECK-EMAIL] Attempting to send email to:', email);
        
        const resend = getResendClient();
        const result = await resend.emails.send({
          from: 'VNCLC <no-reply@vnclc.com>',
          to: email,
          subject: 'Mã xác thực VNCLC',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #FFB81C;">Xác thực Email của bạn</h2>
              <p>Chào bạn,</p>
              <p>Mã xác thực của bạn là:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FFB81C; border-radius: 8px; margin: 20px 0;">
                ${otpCode}
              </div>
              <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
              <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          `
        });
        
        console.log('[CHECK-EMAIL] Resend API response:', JSON.stringify(result, null, 2));
        console.log('[CHECK-EMAIL] OTP sent successfully to:', email);
        
        return NextResponse.json(
          { success: true, message: 'OTP đã được gửi đến email của bạn', otpSent: true },
          { status: 200 }
        );
      } catch (emailError) {
        console.error('[CHECK-EMAIL] Error sending OTP email:', emailError);
        return NextResponse.json(
          { success: false, error: 'Không thể gửi mã xác thực. Vui lòng thử lại.' },
          { status: 500 }
        );
      }
    }

    // Handle OTP verification
    if (action === 'verify-otp') {
      if (!otp) {
        return NextResponse.json(
          { success: false, error: 'OTP is required' },
          { status: 400 }
        );
      }

      console.log('[CHECK-EMAIL] Verifying OTP for:', email);

      // TEST MODE: Allow hardcoded OTP 'OK123456' to bypass database verification
      const TEST_OTP = 'OK123456';
      if (otp === TEST_OTP) {
        console.log('[CHECK-EMAIL] TEST MODE: Bypassing OTP verification for test OTP');
        // Skip database verification and proceed to account checking
      } else {
        // Normal OTP verification flow
        const supabase = getSupabaseClient();

        // Get OTP record from database
        const { data: otpRecord, error: fetchError } = await supabase
          .from('email_otps')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (fetchError || !otpRecord) {
          console.error('[CHECK-EMAIL] No OTP found for email:', email);
          return NextResponse.json(
            { success: false, error: 'Mã xác thực không tồn tại hoặc đã hết hạn' },
            { status: 400 }
          );
        }

        // Check if OTP has expired
        const now = new Date();
        const expiresAt = new Date(otpRecord.expires_at);
        
        if (now > expiresAt) {
          console.log('[CHECK-EMAIL] OTP expired for:', email);
          return NextResponse.json(
            { success: false, error: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' },
            { status: 400 }
          );
        }

        // Check if OTP already verified
        if (otpRecord.verified) {
          console.log('[CHECK-EMAIL] OTP already used for:', email);
          return NextResponse.json(
            { success: false, error: 'Mã xác thực đã được sử dụng' },
            { status: 400 }
          );
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
          console.log('[CHECK-EMAIL] Invalid OTP for:', email);
          return NextResponse.json(
            { success: false, error: 'Mã xác thực không chính xác' },
            { status: 400 }
          );
        }

        // Mark OTP as verified
        const { error: updateError } = await supabase
          .from('email_otps')
          .update({ verified: true })
          .eq('email', email.toLowerCase());

        if (updateError) {
          console.error('[CHECK-EMAIL] Error updating OTP:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to verify OTP' },
            { status: 500 }
          );
        }

        console.log('[CHECK-EMAIL] OTP verified successfully for:', email);
      }
      // Continue to account checking below
    }

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    // If no token in header, retrieve credentials from database and authenticate
    if (!platformToken) {
      console.log('[CHECK-EMAIL] No token provided, retrieving credentials from database...');
      
      if (!referralId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Referral ID is required for authentication.' 
          },
          { status: 401 }
        );
      }

      try {
        const supabase = getSupabaseClient();
        
        // Step 1: Look up in own_referral_id_list table using the referred ID from URL
        console.log('[CHECK-EMAIL] Step 1: Looking up partner ID in own_referral_id_list with own_referral_id:', referralId);
        const { data: referralData, error: referralError } = await supabase
          .from('own_referral_id_list')
          .select('id')
          .eq('own_referral_id', referralId)
          .maybeSingle();

        if (referralError) {
          console.error('[CHECK-EMAIL] Error querying own_referral_id_list:', referralError);
        }

        if (!referralData || !referralData.id) {
          console.log('[CHECK-EMAIL] No partner found with referral ID:', referralId);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Partner not found. Please check the referral link.' 
            },
            { status: 404 }
          );
        }

        const actualPartnerId = referralData.id;
        console.log('[CHECK-EMAIL] Step 2: Found partner ID:', actualPartnerId);

        // Step 2: Look up platform_accounts in partners table using the actual partner ID
        console.log('[CHECK-EMAIL] Step 3: Looking up platform_accounts in partners table');
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('platform_accounts')
          .eq('id', actualPartnerId)
          .maybeSingle();

        if (partnerError) {
          console.error('[CHECK-EMAIL] Error querying partners table:', partnerError);
        }

        if (!partnerData || !partnerData.platform_accounts) {
          console.log('[CHECK-EMAIL] No platform accounts found for partner ID:', actualPartnerId);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Partner platform credentials not configured. Please contact support.' 
            },
            { status: 404 }
          );
        }

        // Step 3: Extract platform credentials
        console.log('[CHECK-EMAIL] Step 4: Extracting credentials for platform:', platform);
        const platformCredentials = extractPlatformCredentials(
          partnerData.platform_accounts,
          platform
        );

        if (!platformCredentials) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Partner credentials not found for platform: ${platform}. Please contact support.` 
            },
            { status: 404 }
          );
        }

        // Step 4: Authenticate with platform using retrieved credentials
        console.log('[CHECK-EMAIL] Step 5: Authenticating with platform using stored credentials...');
        
        if (platform.toLowerCase() === 'exness') {
          const authResponse = await fetch(`${request.nextUrl.origin}/api/exness/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              login: platformCredentials.email,
              password: platformCredentials.password,
            }),
          });

          if (authResponse.ok) {
            const authData = await authResponse.json();
            platformToken = authData.token;
            console.log('[CHECK-EMAIL] Platform authentication successful');
          } else {
            console.error('[CHECK-EMAIL] Platform authentication failed:', authResponse.status);
            return NextResponse.json(
              { 
                success: false, 
                error: 'Failed to authenticate with platform. Please check your platform credentials are up to date.' 
              },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, error: `Platform ${platform} authentication is not yet supported` },
            { status: 400 }
          );
        }
      } catch (authError) {
        console.error('[CHECK-EMAIL] Platform authentication error:', authError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Platform authentication failed. Please try again.' 
          },
          { status: 500 }
        );
      }
    }

    if (!platformToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Platform authentication required. Please ensure you are logged in as a partner.' 
        },
        { status: 401 }
      );
    }

// Helper function to extract platform credentials from database structure
function extractPlatformCredentials(platformAccounts: any, platform: string): any {
  if (!platformAccounts || !Array.isArray(platformAccounts)) {
    return null;
  }

  const platformKey = platform.toLowerCase();
  
  for (const accountObj of platformAccounts) {
    if (accountObj && typeof accountObj === 'object') {
      if (accountObj[platformKey]) {
        return accountObj[platformKey];
      }
    }
  }

  return null;
}

    // Step 1: Fetch client affiliation from Exness API using the platform token and email
    console.log('[CHECK-EMAIL] Step 1: Fetching client affiliation from Exness API');
    console.log('[CHECK-EMAIL] Email:', email);
    console.log('[CHECK-EMAIL] Token present:', !!platformToken);
    
    try {
      // Try POST method first (as affiliation endpoint might require POST)
      let exnessResponse = await fetch(
        `${EXNESS_API_BASE}/api/partner/affiliation/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${platformToken}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      // If POST returns 405, try GET with query parameter
      if (exnessResponse.status === 405) {
        console.log('[CHECK-EMAIL] POST not allowed, trying GET...');
        exnessResponse = await fetch(
          `${EXNESS_API_BASE}/api/partner/affiliation/?email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `JWT ${platformToken}`,
            },
          }
        );
      }

      console.log('[CHECK-EMAIL] Exness API response status:', exnessResponse.status);

      if (!exnessResponse.ok) {
        const errorText = await exnessResponse.text();
        console.error('[CHECK-EMAIL] Exness API error:', exnessResponse.status, errorText);
        throw new Error('Failed to fetch client affiliation from platform');
      }

      const clientData = await exnessResponse.json();
      console.log('[CHECK-EMAIL] Exness API response received');
      console.log('[CHECK-EMAIL] Affiliation:', clientData.affiliation);
      console.log('[CHECK-EMAIL] Client UID:', clientData.client_uid);
      console.log('[CHECK-EMAIL] Accounts:', clientData.accounts);

      // Check if client has affiliation
      if (!clientData.affiliation) {
        console.log('[CHECK-EMAIL] No affiliation found for email:', email);
        return NextResponse.json({
          success: false,
          data: {
            affiliation: false,
            accounts: [],
            client_uid: null,
          }
        });
      }

      // Step 2: Check which IDs exist in Supabase licensed_accounts table
      try {
        console.log('[CHECK-EMAIL] Step 2: Checking license status in Supabase...');
        
        const supabase = getSupabaseClient();

        // Query licensed_accounts table for these account IDs
        const { data: licensedAccounts, error: queryError } = await supabase
          .from('licensed_accounts')
          .select('account_id')
          .in('account_id', clientData.accounts)
          .eq('licensed_status', 'licensed');

        if (queryError) {
          console.error('[CHECK-EMAIL] Error querying licensed_accounts:', queryError);
          throw queryError;
        }

        const licensedIds = new Set((licensedAccounts || []).map(acc => acc.account_id.toLowerCase()));
        console.log('[CHECK-EMAIL] Licensed IDs found:', Array.from(licensedIds).slice(0, 5), '...');

        // Check each account ID against the licensed accounts
        const accountsWithStatus = clientData.accounts.map((accountId: string) => {
          const isLicensed = licensedIds.has(accountId.toLowerCase());
          console.log(`[CHECK-EMAIL] Checking ${accountId}: ${isLicensed ? 'licensed' : 'unlicensed'}`);
          return {
            id: accountId,
            status: isLicensed ? 'licensed' : 'unlicensed'
          };
        });

        console.log('[CHECK-EMAIL] Final accountsWithStatus:', accountsWithStatus);

        // Step 3: Insert all account IDs into licensed_accounts table
        if (!referralId) {
          console.warn('[CHECK-EMAIL] No referral ID provided, skipping database insert');
        } else {
          try {
            console.log('[CHECK-EMAIL] Step 3: Inserting account IDs into licensed_accounts table...');
            
            // Get user ID from session/cookie if available
            // For now, we'll get it from the referralId lookup
            const { data: referralData } = await supabase
              .from('own_referral_id_list')
              .select('id')
              .eq('own_referral_id', referralId)
              .maybeSingle();
            
            const partnerId = referralData?.id;
            
            if (!partnerId) {
              console.warn('[CHECK-EMAIL] Partner ID not found, skipping database insert');
            } else {
              // Get userId from request or storage (we'll need to pass it from frontend)
              // For now, let's check if there's a user ID in the request
              const userId = request.headers.get('x-user-id');
              
              if (!userId) {
                console.warn('[CHECK-EMAIL] User ID not provided, will insert without owner');
              }
              
              const timestamp = new Date().toISOString();
              
              // Prepare records for all accounts
              const accountRecords = clientData.accounts.map((accountId: string) => {
                const isLicensed = licensedIds.has(accountId.toLowerCase());
                return {
                  id: partnerId,
                  email: email.toLowerCase(),
                  uid: clientData.client_uid,
                  account_id: accountId,
                  licensed_date: timestamp,
                  platform: platform.toLowerCase(),
                  licensed_status: isLicensed ? 'licensed' : 'unlicensed',
                  owner: userId || null,
                };
              });
              
              // Check which accounts already exist
              const { data: existingAccounts } = await supabase
                .from('licensed_accounts')
                .select('account_id')
                .in('account_id', clientData.accounts);
              
              const existingAccountIds = new Set(existingAccounts?.map(acc => acc.account_id) || []);
              
              // Filter to only insert new accounts
              const newAccounts = accountRecords.filter((record: { account_id: string }) => !existingAccountIds.has(record.account_id));
              
              if (newAccounts.length > 0) {
                console.log(`[CHECK-EMAIL] Inserting ${newAccounts.length} new accounts into licensed_accounts`);
                const { error: insertError } = await supabase
                  .from('licensed_accounts')
                  .insert(newAccounts);
                
                if (insertError) {
                  console.error('[CHECK-EMAIL] Error inserting accounts:', insertError);
                } else {
                  console.log('[CHECK-EMAIL] Successfully inserted accounts into licensed_accounts');
                }
              } else {
                console.log('[CHECK-EMAIL] All accounts already exist in database');
              }
              
              // Update owner for existing accounts if userId is provided
              if (userId && existingAccountIds.size > 0) {
                console.log(`[CHECK-EMAIL] Updating owner for ${existingAccountIds.size} existing accounts`);
                const { error: updateError } = await supabase
                  .from('licensed_accounts')
                  .update({ owner: userId })
                  .in('account_id', Array.from(existingAccountIds))
                  .eq('email', email.toLowerCase());
                
                if (updateError) {
                  console.error('[CHECK-EMAIL] Error updating owner:', updateError);
                } else {
                  console.log('[CHECK-EMAIL] Successfully updated owner for existing accounts');
                }
              }
            }
          } catch (dbError) {
            console.error('[CHECK-EMAIL] Database insert error:', dbError);
            // Don't fail the request if database insert fails
          }
        }

        // Return the data with updated account statuses
        return NextResponse.json({
          success: true,
          data: {
            affiliation: true,
            accounts: clientData.accounts,
            client_uid: clientData.client_uid,
            accountsWithStatus,
          },
        });

      } catch (dbError: any) {
        console.error('[CHECK-EMAIL] Database Error:', dbError);
        console.error('[CHECK-EMAIL] Error details:', {
          message: dbError.message,
          code: dbError.code,
        });
        
        // If database check fails, still return data but without license status
        console.warn('[CHECK-EMAIL] Database check failed, returning data without license status');
        return NextResponse.json({
          success: true,
          data: {
            affiliation: true,
            accounts: clientData.accounts,
            client_uid: clientData.client_uid,
          },
        });
      }

    } catch (platformError: any) {
      console.error('[CHECK-EMAIL] Platform API Error:', platformError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch client data from platform',
          details: process.env.NODE_ENV === 'development' ? platformError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[CHECK-EMAIL] Server Error:', error);
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
