import { NextRequest, NextResponse } from 'next/server';

// Lirunex tokens expire after 20 minutes and there is no server-side revocation
// endpoint in the API spec, so logout simply acknowledges the request.
// The client is responsible for discarding the token from sessionStorage.
export async function POST(_request: NextRequest) {
  try {
    console.log('[LIRUNEX-LOGOUT] Logout requested  token will be discarded client-side');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LIRUNEX-LOGOUT] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process logout request' },
      { status: 500 }
    );
  }
}
