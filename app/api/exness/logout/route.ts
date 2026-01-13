import { NextRequest, NextResponse } from 'next/server';

const EXNESS_API_BASE = 'https://my.exnessaffiliates.com';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${EXNESS_API_BASE}/api/v2/auth/token/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error || 'Logout failed', message: data.message },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exness logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process logout request' },
      { status: 500 }
    );
  }
}
