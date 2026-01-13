import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Path to the bot file in the project root
    const filePath = join(process.cwd(), 'VNCLC [v1.3].ex5');
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'inline; filename="VNCLC [v1.3].ex5"',
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
