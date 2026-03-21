import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Get the user's referral_id (the code they signed up with)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData.referral_id) {
      return NextResponse.json(
        { error: 'NO_REFERRAL', message: 'Bạn chưa đăng ký qua đường dẫn giới thiệu của đối tác.' },
        { status: 200 },
      );
    }

    // 2. Find the partner whose own_referral_id matches this user's referral_id
    const { data: refRow, error: refError } = await supabase
      .from('own_referral_id_list')
      .select('id')
      .eq('own_referral_id', userData.referral_id)
      .maybeSingle();

    if (refError) {
      console.error('[get-reward-progress] ref lookup error:', refError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!refRow) {
      return NextResponse.json(
        { error: 'NO_PARTNER_CONFIG', message: 'Không tìm thấy cấu hình hệ thống thưởng từ đối tác của bạn.' },
        { status: 200 },
      );
    }

    const partnerId = refRow.id;

    // 3. Get partner's reward config (all platforms, all levels)
    const { data: configs, error: configError } = await supabase
      .from('partner_reward_configs')
      .select('*')
      .eq('partner_id', partnerId)
      .order('level');

    if (configError) {
      console.error('[get-reward-progress] config error:', configError);
      return NextResponse.json({ error: 'Failed to fetch reward config' }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'NO_PARTNER_CONFIG', message: 'Đối tác của bạn chưa cấu hình hệ thống thưởng.' },
        { status: 200 },
      );
    }

    // Pick the platform that the partner has explicitly applied (is_applied = true)
    const appliedRow = configs.find((c) => c.is_applied);

    if (!appliedRow) {
      return NextResponse.json(
        { error: 'NO_PARTNER_CONFIG', message: 'Đối tác của bạn chưa kích hoạt hệ thống thưởng cho bất kỳ sàn nào.' },
        { status: 200 },
      );
    }

    const selectedPlatform = appliedRow.platform;

    const platformConfigs = configs.filter((c) => c.platform === selectedPlatform);

    // 4. Get user's total lot volume on that platform
    const { data: accountRows, error: accountError } = await supabase
      .from('licensed_accounts')
      .select('lot_volume')
      .eq('id', userId)
      .eq('platform', selectedPlatform);

    if (accountError) {
      console.error('[get-reward-progress] accounts error:', accountError);
      return NextResponse.json({ error: 'Failed to fetch trading volume' }, { status: 500 });
    }

    const totalLots = (accountRows ?? []).reduce(
      (sum, row) => sum + (Number(row.lot_volume) || 0),
      0,
    );

    // 5. Determine current level (highest level where totalLots >= lot_volume AND is_active or level=0)
    const activeLevels = platformConfigs.filter((c) => c.is_active || c.level === 0);
    activeLevels.sort((a, b) => a.level - b.level);

    let currentLevel = 0;
    for (const lvl of activeLevels) {
      if (totalLots >= Number(lvl.lot_volume)) {
        currentLevel = lvl.level;
      }
    }

    // 6. Upsert user_reward_tracking for caching
    await supabase.from('user_reward_tracking').upsert(
      {
        user_id: userId,
        partner_id: partnerId,
        current_level: currentLevel,
        current_lot_volume: totalLots,
        eligible_for_prize: currentLevel > 0,
        last_calculated: new Date().toISOString(),
      },
      { onConflict: 'user_id,partner_id' },
    );

    return NextResponse.json({
      platform: selectedPlatform,
      partnerId,
      levels: platformConfigs.map((c) => ({
        level: c.level,
        lot_volume: Number(c.lot_volume),
        reward_usd: Number(c.reward_usd),
        reward_text: c.reward_text,
        avatar_url: c.avatar_url ?? null,
        is_active: c.is_active,
      })),
      currentLots: totalLots,
      currentLevel,
    });
  } catch (err) {
    console.error('[get-reward-progress] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

