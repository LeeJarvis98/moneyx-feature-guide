import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { BOT_BUCKET, BOT_STORAGE_PATH, BOT_DISPLAY_NAME } from '@/lib/bot-config';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Download the file blob from Supabase Storage using the service role
    const { data, error } = await supabase.storage
      .from(BOT_BUCKET)
      .download(BOT_STORAGE_PATH);

    if (error || !data) {
      console.error('Supabase Storage download error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve bot file from storage' },
        { status: 500 }
      );
    }

    // Convert Blob to ArrayBuffer for the response
    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${BOT_DISPLAY_NAME}"`,
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving bot file:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bot file' },
      { status: 500 }
    );
  }
}
