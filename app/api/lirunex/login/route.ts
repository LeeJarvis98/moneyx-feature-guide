import { NextRequest, NextResponse } from 'next/server';

const LIRUNEX_API_BASE = process.env.LIRUNEX_API_BASE ?? '';

export async function POST(request: NextRequest) {
  try {
    if (!LIRUNEX_API_BASE) {
      console.error('[LIRUNEX-LOGIN] LIRUNEX_API_BASE environment variable is not set');
      return NextResponse.json(
        { error: 'Configuration error', message: 'Lirunex API base URL is not configured.' },
        { status: 500 }
      );
    }

    const credentials = await request.json();

    console.log('[LIRUNEX-LOGIN] Received login request');
    console.log('[LIRUNEX-LOGIN] Username:', credentials.username);
    console.log('[LIRUNEX-LOGIN] Attempting to connect to:', `${LIRUNEX_API_BASE}/api/Token`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${LIRUNEX_API_BASE}/api/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[LIRUNEX-LOGIN] Lirunex API response status:', response.status);

    const data = await response.json();
    console.log('[LIRUNEX-LOGIN] Lirunex API response data:', data);

    if (!response.ok) {
      console.error('[LIRUNEX-LOGIN] Login failed:', data);
      return NextResponse.json(
        { error: data.message || 'Login failed', message: data.message },
        { status: response.status }
      );
    }

    console.log('[LIRUNEX-LOGIN] Login successful');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[LIRUNEX-LOGIN] Exception occurred:', error);
    console.error('[LIRUNEX-LOGIN] Error details:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Connection timeout',
            message: 'Unable to reach Lirunex API. The request timed out. Please check your network connection or try again later.',
            details: 'Request timeout after 30 seconds',
          },
          { status: 504 }
        );
      }

      if (
        error.message.includes('fetch failed') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')
      ) {
        return NextResponse.json(
          {
            error: 'Network error',
            message: 'Unable to connect to Lirunex API. This could be due to network restrictions, firewall settings, or the Lirunex API being temporarily unavailable.',
            details: error.message,
            suggestion: 'Please check: 1) Your internet connection, 2) Firewall/proxy settings, 3) Try again in a few moments',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process login request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
