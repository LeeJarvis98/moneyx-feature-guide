import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
   try {
      const { id, login, password, platform } = await request.json();

      if (!id || !login || !password || !platform) {
         return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
         );
      }

      // Call ngrok refresh-account API
      console.log('[REFRESH-PARTNER] Calling ngrok refresh-account API for platform:', platform);
      console.log('[REFRESH-PARTNER] Payload:', [id, login, password, platform.toLowerCase()]);

      const ngrokResponse = await fetch('https://rainbowy-clarine-presumingly.ngrok-free.dev/api/refresh-account', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NGROK_API_KEY || '',
         },
         body: JSON.stringify({
            id,
            login,
            password,
            platform,
         }),
      });

      if (!ngrokResponse.ok) {
         const errorData = await ngrokResponse.json().catch(() => ({}));
         console.error('[REFRESH-PARTNER] Ngrok API call failed:', errorData);
         return NextResponse.json(
            { error: 'Failed to refresh account data', details: errorData },
            { status: ngrokResponse.status }
         );
      }

      const responseData = await ngrokResponse.json().catch(() => ({}));
      console.log('[REFRESH-PARTNER] Ngrok refresh-account API call successful');

      return NextResponse.json({
         success: true,
         message: 'Account data refreshed successfully',
         data: responseData,
      });
   } catch (error) {
      console.error('[REFRESH-PARTNER] Error in refresh-partner-account:', error);
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      );
   }
}
