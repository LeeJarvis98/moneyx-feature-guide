# Level-Up System Implementation Summary

This document summarizes the implementation of the Tradi partner level-up system based on the specifications in [LEVEL_UP_SYSTEM.md](./LEVEL_UP_SYSTEM.md).

## ✅ What Was Implemented

### 1. Partner Rank Helper Module (`lib/partner-rank.ts`)

A new helper module containing:

- **`countStandardPartnersAbove()`**: Walks the referral chain upward to count standard partners (excluding ADMIN, SALE, None)
- **`assignInitialRank()`**: Assigns initial rank based on chain position and sets `is_auto_ranked`
- **`getRankProgress()`**: Calculates rank progression for UI display
- **Constants**: `CHAIN_POSITION_RANK`, `LOT_UPGRADE_THRESHOLDS`, `NEXT_RANK`

### 2. Updated Partner Registration (`app/api/register-partner/route.ts`)

The partner registration endpoint now:

1. Fetches the user's `referral_id` (the code they signed up with)
2. **If user has a referral_id**: Calls `assignInitialRank()` to determine and set their rank based on chain position
3. **If user has no referral_id**: Assigns default rank (Đồng) with `is_auto_ranked = false`
4. Automatically sets `is_auto_ranked` to `true` for positions 1-4, `false` for position 5+
5. Returns the assigned rank and `isAutoRanked` status in the response

**Note**: Users without a referral code are supported and will receive the default rank of Đồng. This handles edge cases like first users or admin users who don't have an upline.

### 3. Updated User Signup (`app/api/user-signup/route.ts`)

Now properly initializes `is_auto_ranked: false` when creating new users (since they're not partners yet).

### 4. Updated TypeScript Types

Regenerated database types to include the `is_auto_ranked` field in the `users` table.

## 🎯 Chain Position Logic

The system assigns ranks based on position in the referral chain:

| Chain Position | Assigned Rank | `is_auto_ranked` |
|---|---|---|
| 1st standard partner | Kim Cương | `true` |
| 2nd standard partner | Bạch Kim | `true` |
| 3rd standard partner | Vàng | `true` |
| 4th standard partner | Bạc | `true` |
| 5th+ standard partner | Đồng | `false` |

**Note**: ADMIN, SALE, and None ranks are excluded from counting - only standard partners (Đồng, Bạc, Vàng, Bạch Kim, Kim Cương) count toward position.

## 📊 How It Works

### Example Referral Chain

```
ADMIN → UserA → UserB → UserC → UserD → UserE → UserF
```

When UserF registers as a partner:

1. System walks up the chain from UserF's `referral_id` (UserE's code)
2. Counts standard partners: UserE (5th), UserD (4th), UserC (3rd), UserB (2nd), UserA (1st)
3. UserF is the 6th standard partner
4. Assigns rank: `Đồng` with `is_auto_ranked: false`

### Code Flow

```typescript
// 1. User signs up with referral code
POST /api/user-signup
{
  id: "UserF",
  referral_id: "UserE-1234", // The upline's referral code
  // ... other fields
}
// Creates user with partner_rank: 'None', is_auto_ranked: false

// 2. User registers as partner
POST /api/register-partner
{
  userId: "UserF"
}

// Inside the endpoint:
// a. Fetches user's referral_id from database
// b. Calls assignInitialRank(supabase, "UserF", "UserE-1234")
// c. assignInitialRank counts 5 standard partners above
// d. Position = 6, so rank = Đồng, is_auto_ranked = false
// e. Updates user: { partner_rank: 'Đồng', is_auto_ranked: false }
// f. Creates partner record and own_referral_id
```

## 🔄 Future Rank Progression

After initial assignment:

- **Auto-ranked partners** (positions 1-4): Start with high ranks but `total_client_lots = 0`. They must earn lots to maintain their rank.
- **Standard partners** (position 5+): Start at Đồng and can upgrade by accumulating lots:
  - Đồng → Bạc: 100 lots
  - Bạc → Vàng: 500 lots
  - Vàng → Bạch Kim: 1,000 lots
  - Bạch Kim → Kim Cương: 2,000 lots

**Rank upgrades are handled automatically by the backend** during account refresh cycles. The frontend just needs to query the current rank from Supabase.

## 📁 Files Modified/Created

### Created
- `lib/partner-rank.ts` - Core rank assignment logic

### Modified
- `app/api/register-partner/route.ts` - Uses `assignInitialRank()` for rank calculation
- `app/api/user-signup/route.ts` - Initializes `is_auto_ranked: false` for new users
- `types/database.generated.ts` - Regenerated with `is_auto_ranked` field

## 🧪 Testing the Implementation

### Test Case 1: First Partner in Chain

```typescript
// Setup: ADMIN user exists as root
// UserA signs up with ADMIN's referral code
// UserA registers as partner

// Expected:
// - Chain position: 1
// - Rank: Kim Cương
// - is_auto_ranked: true
```

### Test Case 2: Fifth Partner in Chain

```typescript
// Setup: Chain has [ADMIN, UserA, UserB, UserC, UserD]
// UserE signs up with UserD's referral code
// UserE registers as partner

// Expected:
// - Chain position: 5
// - Rank: Đồng
// - is_auto_ranked: false
```

### Test Case 3: Chain with System Ranks

```typescript
// Setup: Chain has [ADMIN, SALE, UserA, UserB]
// UserC signs up with UserB's referral code
// UserC registers as partner

// Expected:
// - Chain position: 3 (ADMIN and SALE don't count)
// - Rank: Vàng
// - is_auto_ranked: true
```

## 🎨 Frontend Integration

To display rank progress in your UI:

```typescript
import { getRankProgress } from '@/lib/partner-rank';

// Fetch user data
const { data: user } = await supabase
  .from('users')
  .select('partner_rank, is_auto_ranked')
  .eq('id', userId)
  .single();

const { data: detail } = await supabase
  .from('partner_detail')
  .select('total_client_lots')
  .eq('id', userId)
  .single();

// Calculate progress
const progress = getRankProgress(user.partner_rank, detail.total_client_lots);

// Display
console.log(`Current rank: ${user.partner_rank}`);
console.log(`Is auto-ranked: ${user.is_auto_ranked}`);
console.log(`Progress to next rank: ${progress.progress}%`);
console.log(`Lots needed: ${progress.remainingLots}`);
```

## 📝 Notes

- The `is_auto_ranked` field is informational and helps distinguish between partners who earned their rank vs. those who received it automatically due to chain position
- Auto-ranked partners still need to accumulate lots to upgrade beyond their initial rank
- The backend handles rank upgrades automatically; frontend just queries the current state
- All rank calculations are based on the referral chain at the time of partner registration

## ✅ Implementation Checklist

- [x] Create `lib/partner-rank.ts` with rank assignment logic
- [x] Update `app/api/register-partner/route.ts` to use `assignInitialRank()`
- [x] Update `app/api/user-signup/route.ts` to initialize `is_auto_ranked`
- [x] Regenerate TypeScript types with `is_auto_ranked` field
- [x] Test compilation and runtime
- [ ] Add UI components to display rank and progress (future work)
- [ ] Write integration tests for rank assignment (optional)
