# Frontend Level-Up System — Setup Guide

This document covers everything the **frontend application** needs to implement
to support the Tradi partner level-up system.

The backend (this API) handles **rank progression** (calling `/api/upgrade-rank`
after lot totals change). The frontend is responsible for **initial rank
assignment** at partner registration time.

---

## 1. Database Fields

The following fields on the `users` table are relevant to this system.

| Column | Type | Description |
|---|---|---|
| `partner_rank` | `text` | The partner's current rank (FK → `partner_rank_list`) |
| `is_auto_ranked` | `boolean` | `true` if rank was granted by chain position, not earned organically |
| `referral_id` | `text` | The referral code the user registered under (their upline's code) |

---

## 2. Rank Reference

### Rank Ladder

| Rank | Keep % | Upline Share % | Notes |
|---|---|---|---|
| `ADMIN` | 100% | 0% | Platform owner. Never auto-upgraded. |
| `SALE` | 95% | 5% | Internal collaborators. Never auto-upgraded. |
| `Kim Cương` | 90% | 10% | Max standard rank. |
| `Bạch Kim` | 85% | 15% | |
| `Vàng` | 80% | 20% | |
| `Bạc` | 75% | 25% | |
| `Đồng` | 70% | 30% | Default starting rank for standard partners (position 5+). |
| `None` | 0% | 0% | Normal member, not a partner. |

### Lot Upgrade Thresholds (Standard Partners Only)

| From | To | Total Lots Required |
|---|---|---|
| `Đồng` | `Bạc` | 100 |
| `Bạc` | `Vàng` | 500 |
| `Vàng` | `Bạch Kim` | 1,000 |
| `Bạch Kim` | `Kim Cương` | 2,000 |

---

## 3. Initial Rank Assignment (Registration Flow)

When a new standard partner registers using a referral code, the frontend must
determine their starting rank based on their **position in the referral chain**.

### 3.1 Chain-Position Rules

Count only **standard partners** (`Đồng`, `Bạc`, `Vàng`, `Bạch Kim`,
`Kim Cương`) in the referral chain above the new user. Skip `ADMIN` and `SALE`
positions — they do not count toward the position index.

| Chain Position (among standard partners) | Assigned Rank | `is_auto_ranked` |
|---|---|---|
| 1st | `Kim Cương` | `true` |
| 2nd | `Bạch Kim` | `true` |
| 3rd | `Vàng` | `true` |
| 4th | `Bạc` | `true` |
| 5th or later | `Đồng` | `false` |

**Example chain:** `[ADMIN, SALE, A, B, C, D, E]`

- A is the 1st standard partner → starts at **Kim Cương**, `is_auto_ranked = true`
- B is the 2nd → **Bạch Kim**, `is_auto_ranked = true`
- C is the 3rd → **Vàng**, `is_auto_ranked = true`
- D is the 4th → **Bạc**, `is_auto_ranked = true`
- E is the 5th → **Đồng**, `is_auto_ranked = false`

### 3.2 Algorithm

```typescript
const SYSTEM_RANKS = new Set(['ADMIN', 'SALE', 'None']);

const CHAIN_POSITION_RANK: Record<number, string> = {
  1: 'Kim Cương',
  2: 'Bạch Kim',
  3: 'Vàng',
  4: 'Bạc',
};

/**
 * Walk the referral chain upward from the new user to count how many
 * standard partners already exist above them.
 *
 * Returns the number of standard partners strictly above the new user,
 * excluding the new user themselves.
 */
async function countStandardPartnersAbove(
  supabase: SupabaseClient,
  newUserReferralId: string, // the referral code the new user entered at sign-up
): Promise<number> {
  const SYSTEM_RANKS = new Set(['ADMIN', 'SALE', 'None']);
  let count = 0;
  let currentReferralCode: string | null = newUserReferralId;

  while (currentReferralCode) {
    // Find the user who OWNS this referral code
    const { data: owner } = await supabase
      .from('own_referral_id_list')
      .select('id')
      .eq('own_referral_id', currentReferralCode)
      .maybeSingle();

    if (!owner) break;

    // Fetch that owner's rank and their own referral_id (to keep walking up)
    const { data: ownerUser } = await supabase
      .from('users')
      .select('partner_rank, referral_id')
      .eq('id', owner.id)
      .single();

    if (!ownerUser) break;

    if (!SYSTEM_RANKS.has(ownerUser.partner_rank)) {
      count++;
    }

    currentReferralCode = ownerUser.referral_id ?? null;
  }

  return count;
}

async function assignInitialRank(
  supabase: SupabaseClient,
  userId: string,
  newUserReferralId: string, // the referral code entered at sign-up
): Promise<void> {
  const standardAbove = await countStandardPartnersAbove(supabase, newUserReferralId);

  // New user's position = (standard partners above) + 1
  const chainPosition = standardAbove + 1;

  const assignedRank = CHAIN_POSITION_RANK[chainPosition] ?? 'Đồng';
  const isAutoRanked = chainPosition <= 4;

  await supabase
    .from('users')
    .update({
      partner_rank: assignedRank,
      is_auto_ranked: isAutoRanked,
    })
    .eq('id', userId);
}
```

### 3.3 When to Call

Call `assignInitialRank` **once**, immediately after the new `users` row is
created in Supabase — for example, inside your registration form's submit
handler, right after `supabase.from('users').insert(...)` succeeds.

```typescript
// Example registration flow
const { data: newUser } = await supabase.from('users').insert({ ... }).select().single();

await assignInitialRank(supabase, newUser.id, formData.referralCode);
```

> **Important:** `assignInitialRank` must run **before** any commission
> calculations or rank displays are shown to the user.

---

## 4. Rank Progression Display

Use the thresholds table to show the user their progress toward the next rank.

```typescript
const LOT_UPGRADE_THRESHOLDS: Record<string, number | null> = {
  'Đồng':      100,
  'Bạc':       500,
  'Vàng':      1_000,
  'Bạch Kim':  2_000,
  'Kim Cương': null, // max rank
};

const NEXT_RANK: Record<string, string | null> = {
  'Đồng':      'Bạc',
  'Bạc':       'Vàng',
  'Vàng':      'Bạch Kim',
  'Bạch Kim':  'Kim Cương',
  'Kim Cương': null,
};

function getRankProgress(currentRank: string, totalLots: number) {
  const requiredLots = LOT_UPGRADE_THRESHOLDS[currentRank];
  const nextRank     = NEXT_RANK[currentRank];

  if (!requiredLots || !nextRank) {
    return { isMaxRank: true, nextRank: null, progress: 100 };
  }

  return {
    isMaxRank: false,
    nextRank,
    requiredLots,
    currentLots: totalLots,
    progress: Math.min((totalLots / requiredLots) * 100, 100),
    remainingLots: Math.max(requiredLots - totalLots, 0),
  };
}
```

> **Note on `is_auto_ranked` users:** Their `total_client_lots` in
> `partner_detail` starts at `0` even though their rank may be `Bạch Kim` or
> higher. Display their progress bar starting from 0 toward the threshold —
> this is correct and intentional.

---

## 5. Reading Rank Data from Supabase

To display the current rank and reward percentage on the frontend, read directly
from Supabase (no backend API call needed for reads):

```typescript
// Fetch a user's current rank with reward percentage
const { data } = await supabase
  .from('users')
  .select(`
    partner_rank,
    is_auto_ranked,
    partner_rank_list ( reward_percentage, lot_volume )
  `)
  .eq('id', userId)
  .single();

// Fetch their accumulated lots
const { data: detail } = await supabase
  .from('partner_detail')
  .select('total_client_lots')
  .eq('id', userId)
  .single();
```

---

## 6. Summary Checklist

- [ ] After new partner `users` row is created, call `assignInitialRank(supabase, userId, referralCode)`.
- [ ] Display rank progress bar using `getRankProgress(currentRank, totalLots)`.
- [ ] Read `partner_rank` and `total_client_lots` directly from Supabase — no backend API call needed.
- [ ] Rank upgrades are applied automatically by the backend during each account refresh cycle; just re-query `users.partner_rank` from Supabase to reflect the latest value.
- [ ] For `is_auto_ranked` users, show the progress bar starting from 0 lots — this is expected.
