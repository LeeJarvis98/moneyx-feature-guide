import { NextRequest, NextResponse } from 'next/server';

const EXNESS_API_BASE = 'https://my.exnessaffiliates.com';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, method = 'GET', token, data } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`,
      },
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(`${EXNESS_API_BASE}${endpoint}`, fetchOptions);

    // Handle 204 No Content
    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Request failed', message: responseData.message },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Exness partner API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const fullUrl = `${EXNESS_API_BASE}${endpoint}`;
    console.log('[EXNESS API] Requesting:', fullUrl);
    console.log('[EXNESS API] Endpoint param received:', endpoint);
    console.log('[EXNESS API] Token present:', !!token);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`,
      },
    });

    console.log('[EXNESS API] Response status:', response.status);
    console.log('[EXNESS API] Response content-type:', response.headers.get('content-type'));

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[EXNESS API] Non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid response from Exness API', message: 'Expected JSON but received HTML. The endpoint may not exist.' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Request failed', message: data.message },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Exness partner API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
