import { NextRequest, NextResponse } from 'next/server';

const EXNESS_API_BASE = 'https://my.exnessaffiliates.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method = 'POST', token, data } = body;

    console.log('Proxy Request:', { endpoint, method, hasToken: !!token, hasData: !!data });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (data && ['POST', 'PATCH', 'PUT'].includes(method)) {
      fetchOptions.body = data;
    }

    console.log('Fetching:', `${EXNESS_API_BASE}${endpoint}`);

    const response = await fetch(`${EXNESS_API_BASE}${endpoint}`, fetchOptions);

    console.log('Response status:', response.status);

    const responseData = await response.json().catch(() => null);

    return NextResponse.json(
      responseData || { error: response.statusText },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Proxy request failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');
    const token = searchParams.get('token');

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${EXNESS_API_BASE}${endpoint}`, {
      method: 'GET',
      headers,
    });

    const responseData = await response.json().catch(() => null);

    return NextResponse.json(
      responseData || { error: response.statusText },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Proxy request failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
