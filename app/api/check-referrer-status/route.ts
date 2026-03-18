import { NextRequest, NextResponse } from 'next/server';

/**
 * Ranking system has been removed.
 * Always allows both partner types.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      showOnlyTradi: false,
      reason: 'ranking_removed',
    });
  } catch (error) {
    console.error('[check-referrer-status] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
