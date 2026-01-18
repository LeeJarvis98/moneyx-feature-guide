import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { partnerId, password, platform } = await request.json();

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

      // Return success with platform info
      return NextResponse.json(
        {
          success: true,
          partnerId: partnerId,
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
