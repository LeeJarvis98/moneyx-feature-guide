import { NextRequest, NextResponse } from 'next/server';

const EXNESS_API_BASE = 'https://my.exnessaffiliates.com';

export async function POST(request: NextRequest) {
  try {
    const credentials = await request.json();
    
    console.log('[EXNESS-LOGIN] Received login request');
    console.log('[EXNESS-LOGIN] Login field:', credentials.login);
    console.log('[EXNESS-LOGIN] Attempting to connect to:', `${EXNESS_API_BASE}/api/v2/auth/`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${EXNESS_API_BASE}/api/v2/auth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(credentials),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[EXNESS-LOGIN] Exness API response status:', response.status);
    
    const data = await response.json();
    console.log('[EXNESS-LOGIN] Exness API response data:', data);

    if (!response.ok) {
      console.error('[EXNESS-LOGIN] Login failed:', data);
      return NextResponse.json(
        { error: data.error || 'Login failed', message: data.message },
        { status: response.status }
      );
    }

    console.log('[EXNESS-LOGIN] Login successful');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[EXNESS-LOGIN] Exception occurred:', error);
    console.error('[EXNESS-LOGIN] Error details:', error instanceof Error ? error.message : String(error));
    
    // Check if it's a network/timeout error
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Connection timeout', 
            message: 'Unable to reach Exness API. The request timed out. Please check your network connection or try again later.',
            details: 'Request timeout after 30 seconds'
          },
          { status: 504 }
        );
      }
      
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        return NextResponse.json(
          { 
            error: 'Network error', 
            message: 'Unable to connect to Exness API. This could be due to network restrictions, firewall settings, or the Exness API being temporarily unavailable.',
            details: error.message,
            suggestion: 'Please check: 1) Your internet connection, 2) Firewall/proxy settings, 3) Try again in a few moments'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'Failed to process login request', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
