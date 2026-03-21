import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

const BUCKET = 'reward-avatars';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      limit: 200,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.error('[get-reward-avatars] Storage error:', error);
      return NextResponse.json({ error: 'Failed to list avatars' }, { status: 500 });
    }

    const avatars = (data ?? [])
      .filter((f) => f.name && /\.(png|jpg|jpeg|webp)$/i.test(f.name))
      .map((f) => ({
        name: f.name,
        url: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${f.name}`,
      }));

    return NextResponse.json({ avatars });
  } catch (err) {
    console.error('[get-reward-avatars] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
