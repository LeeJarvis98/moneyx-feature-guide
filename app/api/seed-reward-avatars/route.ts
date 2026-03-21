import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const BUCKET = 'reward-avatars';

export async function POST(request: NextRequest) {
  const secret = process.env.SEED_ADMIN_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = getSupabaseClient();
  const avatarDir = path.join(process.cwd(), 'public', 'avatar');

  let files: string[];
  try {
    files = fs.readdirSync(avatarDir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  } catch {
    return NextResponse.json({ error: 'Avatar directory not found' }, { status: 500 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'No image files found in avatar directory' }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const results: { name: string; url: string; error?: string }[] = [];

  for (const file of files) {
    const filePath = path.join(avatarDir, file);
    const buffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file, buffer, { contentType: 'image/png', upsert: true });

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${file}`;
    results.push({ name: file, url: publicUrl, ...(error ? { error: error.message } : {}) });
  }

  const failCount = results.filter((r) => r.error).length;
  return NextResponse.json({
    success: failCount === 0,
    uploaded: results.filter((r) => !r.error).length,
    failed: failCount,
    results,
  });
}
