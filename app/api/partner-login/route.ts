import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyTurnstileToken } from '@/lib/turnstile';
import type { PlatformAccounts, PlatformAccountCredentials } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { partnerId, password, platform, turnstileToken } = await request.json();

    // Verify Turnstile token first
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Security verification is required' },
        { status: 400 }
      );
    }

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'Security verification failed. Please try again.' },
        { status: 403 }
      );
    }

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

    console.log('[PARTNER-LOGIN] Login attempt - Platform:', platform);

    // Login directly to platform API with user-provided credentials
    try {
      let apiResponse;
      let platformData;

      if (platform.toLowerCase() === 'exness') {
        console.log('[PARTNER-LOGIN] Attempting Exness login');
        
        // Use the Exness login API route which handles proxy/CORS properly
        apiResponse = await fetch(`${request.nextUrl.origin}/api/exness/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: partnerId,
            password: password,
          }),
        });

        console.log('[PARTNER-LOGIN] Exness API response status:', apiResponse.status);

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          console.error('[PARTNER-LOGIN] Exness API error response:', errorData);
          
          let errorMessage = 'Unable to login to Exness.';
          
          if (apiResponse.status === 403) {
            errorMessage = 'Invalid Exness credentials. Please check your email and password.';
          } else if (apiResponse.status === 401) {
            errorMessage = 'Invalid Exness credentials or account does not exist.';
          } else if (apiResponse.status === 429) {
            errorMessage = 'Too many login attempts. Please try again later.';
          } else if (apiResponse.status === 400) {
            errorMessage = `Authentication error: ${errorData.message || 'Invalid credentials'}`;
          }
          
          return NextResponse.json(
            { 
              error: errorMessage,
              details: errorData.message || `Status: ${apiResponse.status}`
            },
            { status: 401 }
          );
        }

        platformData = await apiResponse.json();
        console.log('[PARTNER-LOGIN] Successfully logged into Exness');
        
      } else if (platform.toLowerCase() === 'binance') {
        // TODO: Add Binance authentication here when implemented
        console.log('[PARTNER-LOGIN] Binance authentication not yet implemented');
        return NextResponse.json(
          { error: 'Binance authentication is not yet available. Please check back later.' },
          { status: 501 }
        );
      } else {
        return NextResponse.json(
          { error: `Platform ${platform} is not yet supported` },
          { status: 400 }
        );
      }

      // Check and store platform credentials in partners table
      let userIdToUpdate: string | null = null;
      try {
        const supabase = getSupabaseClient();
        const userId = request.headers.get('x-user-id');
        
        // Get the user ID from the request or use the partnerId (email) to find the user
        userIdToUpdate = userId;
        
        if (!userIdToUpdate) {
          // Try to find user by email (partnerId could be the email)
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', partnerId)
            .maybeSingle();
          
          if (userData) {
            userIdToUpdate = userData.id;
          }
        }

        if (userIdToUpdate) {
          // Fetch existing platform_accounts
          const { data: partnerData } = await supabase
            .from('partners')
            .select('platform_accounts')
            .eq('id', userIdToUpdate)
            .maybeSingle();

          let platformAccounts: any[] = [];
          
          if (partnerData && partnerData.platform_accounts && Array.isArray(partnerData.platform_accounts)) {
            platformAccounts = partnerData.platform_accounts;
          }

          // Check if this platform already exists in the array
          const existingIndex = platformAccounts.findIndex(acc => 
            acc && typeof acc === 'object' && platform.toLowerCase() in acc
          );

          // If platform account already exists, verify it matches the current login attempt
          if (existingIndex >= 0) {
            const existingAccount = platformAccounts[existingIndex][platform.toLowerCase()];
            
            if (existingAccount && existingAccount.email) {
              // Check if the email/partnerId matches the stored one
              if (existingAccount.email !== partnerId) {
                console.log('[PARTNER-LOGIN] Attempt to login with different account detected');
                console.log('[PARTNER-LOGIN] Stored account:', existingAccount.email);
                console.log('[PARTNER-LOGIN] Attempted account:', partnerId);
                
                return NextResponse.json(
                  { 
                    error: `Bạn đang đăng nhập bằng tài khoản ${platform.charAt(0).toUpperCase() + platform.slice(1)} khác.`,
                    storedAccount: existingAccount.email,
                    errorType: 'ACCOUNT_MISMATCH'
                  },
                  { status: 403 }
                );
              }
              
              // Account matches, update the password in case it changed
              console.log('[PARTNER-LOGIN] Account matches stored record, updating password');
            }
          }

          // Create or update the platform account credentials
          const credentials: PlatformAccountCredentials = {
            email: partnerId,
            password: password
          };

          if (existingIndex >= 0) {
            // Update existing platform credentials
            platformAccounts[existingIndex] = { [platform.toLowerCase()]: credentials };
          } else {
            // Add new platform credentials
            platformAccounts.push({ [platform.toLowerCase()]: credentials });
            console.log('[PARTNER-LOGIN] First time login for this platform, storing account');
          }

          // Update the partners table
          await supabase
            .from('partners')
            .update({ platform_accounts: platformAccounts as any })
            .eq('id', userIdToUpdate);

          console.log('[PARTNER-LOGIN] Platform credentials saved to database');
        }
      } catch (dbError) {
        console.error('[PARTNER-LOGIN] Error saving credentials to database:', dbError);
        // Don't fail the login if database update fails
      }

      // Create partner_detail entry for this platform if it's the first login
      try {
        if (userIdToUpdate) {
          const supabase = getSupabaseClient();
          
          // Check if partner_detail entry exists for this user + platform combination
          const { data: existingDetail } = await supabase
            .from('partner_detail')
            .select('id')
            .eq('id', userIdToUpdate)
            .eq('platform', platform.toLowerCase())
            .maybeSingle();

          if (!existingDetail) {
            console.log('[PARTNER-LOGIN] First login for this platform, creating partner_detail entry');
            
            // Create partner detail record for this platform
            const { error: detailInsertError } = await supabase
              .from('partner_detail')
              .insert({
                id: userIdToUpdate,
                platform: platform.toLowerCase(),
                total_clients: 0,
                total_client_lots: 0,
                total_client_reward: 0,
                total_partners: 0,
                total_partner_lots: 0,
                total_partner_reward: 0,
                total_refer_reward: 0,
                total_tradi_com: 0,
                this_month_tradi_com: 0,
                accum_client_reward: 0,
                accum_partner_reward: 0,
                accum_refer_reward: 0,
                accum_time_remaining: 0,
                claim_time_remaining: 0,
                total_reward_history: [],
              });

            if (detailInsertError) {
              console.error('[PARTNER-LOGIN] Error creating partner detail:', detailInsertError);
              // Don't fail the login if detail creation fails
            } else {
              console.log('[PARTNER-LOGIN] Partner detail entry created successfully');
            }
          }
        }
      } catch (detailError) {
        console.error('[PARTNER-LOGIN] Error checking/creating partner detail:', detailError);
        // Don't fail the login if partner detail creation fails
      }

      // Call ngrok refresh-account API
      try {
        if (userIdToUpdate) {
          console.log('[PARTNER-LOGIN] Calling ngrok refresh-account API');
          
          const ngrokResponse = await fetch('https://rainbowy-clarine-presumingly.ngrok-free.dev/api/refresh-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.NGROK_API_KEY || '',
            },
            body: JSON.stringify({
              id: userIdToUpdate,
              login: partnerId,
              password: password,
              platform: platform.toLowerCase(),
            }),
          });

          if (!ngrokResponse.ok) {
            console.error('[PARTNER-LOGIN] Ngrok API call failed with status:', ngrokResponse.status);
            const errorData = await ngrokResponse.json().catch(() => ({}));
            console.error('[PARTNER-LOGIN] Ngrok API error:', errorData);
          } else {
            console.log('[PARTNER-LOGIN] Ngrok refresh-account API called successfully');
          }
        }
      } catch (ngrokError) {
        console.error('[PARTNER-LOGIN] Error calling ngrok API:', ngrokError);
        // Don't fail the login if ngrok API call fails
      }

      // Return success with platform info
      return NextResponse.json(
        {
          success: true,
          partnerId: userIdToUpdate || partnerId, // Return actual user ID (e.g., "AndyBao", "ADMIN")
          platformEmail: partnerId, // Keep the platform email for reference
          platform: platform,
          platformToken: platformData.token || null,
          message: 'Login successful'
        },
        { status: 200 }
      );

    } catch (platformError) {
      console.error('[PARTNER-LOGIN] Platform login failed:', platformError);
      return NextResponse.json(
        { error: `Unable to authenticate with ${platform}. Please try again later.` },
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
