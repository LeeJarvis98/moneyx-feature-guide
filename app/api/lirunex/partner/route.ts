import { NextRequest, NextResponse } from 'next/server';

const LIRUNEX_API_BASE = process.env.LIRUNEX_API_BASE ?? '';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, method = 'GET', token, data } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 401 });
    }

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    if (!LIRUNEX_API_BASE) {
      return NextResponse.json(
        { error: 'Configuration error', message: 'Lirunex API base URL is not configured.' },
        { status: 500 }
      );
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(`${LIRUNEX_API_BASE}${endpoint}`, fetchOptions);

    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.message || 'Request failed', message: responseData.message },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[LIRUNEX] Partner API POST error:', error);
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
      return NextResponse.json({ error: 'Token is required' }, { status: 401 });
    }

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    if (!LIRUNEX_API_BASE) {
      return NextResponse.json(
        { error: 'Configuration error', message: 'Lirunex API base URL is not configured.' },
        { status: 500 }
      );
    }

    const fullUrl = `${LIRUNEX_API_BASE}${endpoint}`;
    console.log('[LIRUNEX] Requesting:', fullUrl);
    console.log('[LIRUNEX] Token present:', !!token);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('[LIRUNEX] Response status:', response.status);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[LIRUNEX] Non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        {
          error: 'Invalid response from Lirunex API',
          message: 'Expected JSON but received a non-JSON response. The endpoint may not exist.',
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Request failed', message: data.message },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[LIRUNEX] Partner API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
