# Prompt: Account Chain Flow & Commission Breakdown Components

> **Context:** I have a pre-existing backend (Next.js + Supabase) that already processes and stores all data. My new website only needs to **read and display** that data — no mutations, no auth tokens beyond a simple session. Build me two React components for this simpler site.

---

## 1 · Tech Stack (use exactly these)

| Concern | Library |
|---|---|
| Flow diagram | `@xyflow/react` (ReactFlow v12) |
| Auto-layout | `@dagrejs/dagre` |
| UI primitives | `@mantine/core` v7 |
| Icons | `lucide-react` |
| Language | TypeScript (strict) |

---

## 2 · Data that comes from the API

**Endpoint A — Referral Chain**
`GET /api/referral-chain?id=<userId>`

Returns the full upline path from ADMIN down to the logged-in user (top-down order).

```ts
interface ReferralChainMember {
  userId: string;
  email: string;
  partnerRank: string; // "ADMIN" | "SALE" | "Vàng" | "Bạc" | "Đồng" | "None"
}

interface ReferralChain {
  userId: string;
  depth: number;
  directReferrerId: string | null;
  chain: ReferralChainMember[];  // ordered: [ADMIN, SALE, …, currentUser]
  chainLength: number;
}
```

**Endpoint B — Chain Commission Snapshot**
`GET /api/chain-commission-snapshot?id=<recipientId>`

Returns every downline partner row, already computed and persisted in the database.

```ts
// One row per downline partner
interface ChainCommissionRow {
  recipient_id: string;
  source_partner_id: string;   // partner's userId
  source_email: string | null;
  source_rank: string;         // partner's rank
  depth: number;               // 1 = direct, 2+ = indirect
  chain_root_id: string | null; // depth-1 ancestor id, used to group sub-chains
  source_total_reward: number; // partner's total monthly reward (USD)
  commission_pool: number;     // source_total_reward × uplineShare%
  tradi_fee: number;           // source_total_reward × 0.05
  remaining_pool: number;      // commission_pool − tradi_fee
  your_role: 'admin' | 'direct' | 'indirect';
  your_cut: number;            // your commission from this partner (USD)
  total_upliner_count: number; // number of indirect upliners above this partner (excl. ADMIN)
  upliner_share: number;       // remaining_pool / total_upliner_count
  own_keep: number;            // recipient's own reward × recipient's keep% (same for every row)
  snapshot_at: string;         // ISO timestamp
}
```

---

## 3 · Business / Domain rules (for tooltips and comments)

The affiliation system is a multi-tier referral network with the following ranks:

| Rank | Keep % | Upline Share % |
|---|---|---|
| ADMIN | 100% | 0% |
| SALE | 95% | 5% |
| Kim Cương | 90% | 10% |
| Bạch Kim | 85% | 15% |
| Vàng | 80% | 20% |
| Bạc | 75% | 25% |
| Đồng | 70% | 30% |
| None | — | — (not a partner) |

**Commission formula for each downline partner P:**
- `commission_pool = P.total_reward × upline_share%`
- `tradi_fee = P.total_reward × 0.05` (ADMIN always collects this)
- `remaining_pool = commission_pool − tradi_fee`
- **Direct referrer (depth=1):** `your_cut = remaining_pool × 0.50` (or `× 1.0` if no indirect upliners)
- **Indirect upliners (depth>1):** `your_cut = (remaining_pool × 0.50) / N_indirect_upliners`
- **ADMIN role:** `your_cut = tradi_fee` (flat 5% of gross reward, every partner, every depth)

Members with rank `"None"` are normal users — **exclude them** from every calculation and every node.

---

## 4 · Component A — `AccountChainFlow`

**Purpose:** A top-down interactive React Flow diagram showing:
- The **upline chain** (ADMIN → SALE → … → You) — role: `upline` / `current_user`
- The **partner tree** (your direct + indirect downline partners) — role: `direct_partner` / `indirect_partner`

**Node card design (220 px wide):**
Each node is a custom `ChainNode` component showing:
- Role label (bold, small caps, coloured border) + rank badge
- `userId` + `email`
- A 4-row data grid:
  - For `current_user`: Keep %, ↑ Upline %, Own Keep (USD), ↓ From Chain (total `your_cut` sum in USD)
  - For all other nodes: Keep %, ↑ Upline %, Lots (their trading volume), Reward (their total USD reward)

**Colour palette:**

```ts
// Node border/background by role
const ROLE_STYLE = {
  current_user:     { border: '#228be6', bg: '#e7f5ff', label: 'You',              miniColor: '#339af0' },
  upline:           { border: '#40c057', bg: '#ebfbee', label: 'Upline',           miniColor: '#51cf66' },
  direct_partner:   { border: '#f59f00', bg: '#fff9db', label: 'Direct Partner',   miniColor: '#fcc419' },
  indirect_partner: { border: '#ae3ec9', bg: '#f8f0fc', label: 'Indirect Partner', miniColor: '#cc5de8' },
};

// Rank badge fill colour
const RANK_COLOURS = {
  ADMIN: 'red', SALE: 'orange', 'Vàng': 'yellow',
  'Bạc': 'gray', 'Đồng': 'cyan', None: 'dark',
};
```

**Layout:** Use `@dagrejs/dagre` with `rankdir: 'TB'`, `nodesep: 70`, `ranksep: 90`. Node size = 220 × 200.

**Edge colours:** upline chain = `#adb5bd`; direct partner edges = `#f59f00`; indirect partner edges = `#ae3ec9`. All edges use `MarkerType.ArrowClosed`.

**Canvas features:** `<Background variant="Dots">`, `<Controls>`, `<MiniMap>` (node colour from role), `fitView`, `minZoom: 0.05`.

**Legend bar:** above the canvas — one `Badge variant="dot"` per role (You / Upline / Direct Partner / Indirect Partner).

**CSV Export button:** exports all visible nodes with columns:
`type, user_id, email, partner_rank, reward_pct_keep_%, upline_share_pct_%, total_lots, total_reward_usd, parent_user_id, depth`

**Props interface:**
```ts
interface AccountChainFlowProps {
  referralChain: ReferralChain | null;
  // Derived from chain_commission_snapshots rows — map to PartnerTreeNode:
  partnerTree: {
    id: string;               // source_partner_id
    email: string;
    partner_rank: string;     // source_rank
    reward_percentage: number;// derive: 1 − (commission_pool / source_total_reward)
    total_lots: number;       // not stored in snapshot — pass 0 or fetch separately
    total_reward: number;     // source_total_reward
    parentUserId: string;     // use chain_root_id for depth>1, or recipientId for depth=1
    depth: number;
  }[];
  userId: string;             // recipientId
  userRank: { partner_rank: string; reward_percentage: number; lot_volume: number } | null;
  exnessTotals: { volume_lots: number; reward_usd: number };
}
```

Wrap the inner component with `<ReactFlowProvider>` in the default export for standalone use.

---

## 5 · Component B — `ChainCommissionBreakdown`

**Purpose:** A read-only data table (using `mantine-datatable` or a plain Mantine `Table`) showing the pre-computed rows from the `chain_commission_snapshots` table, plus three summary mini-cards.

**Summary mini-cards (side by side, full width):**

| Card | Value | Subtitle |
|---|---|---|
| Own Keep | `own_keep` (same on every row — take from `rows[0].own_keep`) | `{keep%}% of your ${total_reward} reward` |
| ↓ From Chain | `SUM(your_cut)` | `From N active partners` |
| Total Estimated | `own_keep + SUM(your_cut)` | `Own keep + chain commission` |

**Table columns (in order):**

| Column | Field | Notes |
|---|---|---|
| Partner | `source_email` / `source_partner_id` | Email bold, id dimmed below |
| Rank | `source_rank` | `<Badge variant="light" color="violet">` |
| Your Role | `your_role` | `<Badge variant="dot">` — yellow for `direct`, grape for `indirect`, red for `admin` |
| Their Reward | `source_total_reward` | USD, 4 decimal places |
| Commission Pool | `commission_pool` | USD + dimmed `{upline%}% upline share` subtitle |
| Tradi Fee (5%) | `tradi_fee` | Prefixed with `−`, dimmed colour |
| Remaining Pool | `remaining_pool` | Orange |
| Total Upline Partners | `total_upliner_count` | Plain number |
| Upline Share | `upliner_share` | Teal; show `—` when `total_upliner_count === 0` |
| Your Commission | `your_cut` | Bold blue, 4 decimal places — this is the key column |

**Filter:** If there are multiple depth-1 partners (multiple direct sub-chains), show a `<Select>` dropdown to filter by `chain_root_id`, with an "All" option. The summary mini-cards recalculate to reflect only the filtered rows.

**Props interface:**
```ts
interface ChainCommissionBreakdownProps {
  rows: ChainCommissionRow[];  // raw rows from GET /api/chain-commission-snapshot
  // Optional: pass the user's own rank % to show in "Own Keep" subtitle
  userRewardPercentage?: number;
  userTotalReward?: number;
}
```

---

## 6 · How the simpler website uses these components

Since all data is pre-computed in the database, the page only needs to:

1. Call `GET /api/referral-chain?id={userId}` → pass result as `referralChain` prop
2. Call `GET /api/chain-commission-snapshot?id={userId}` → pass raw rows as `rows` prop to `ChainCommissionBreakdown`; also map the rows to `partnerTree` shape for `AccountChainFlow`
3. Render both components — **no mutation, no refresh button, no auth complexity**

The `own_keep` field on the snapshot rows replaces the need to fetch `userRank` + `exnessTotals` separately — it is already the computed value.

**Mapping snapshot rows → `partnerTree` prop:**
```ts
const partnerTree = snapshotRows.map((row) => ({
  id: row.source_partner_id,
  email: row.source_email ?? '',
  partner_rank: row.source_rank,
  // Derive keep% from stored numbers (avoids needing a separate rank lookup)
  reward_percentage:
    row.source_total_reward > 0
      ? 1 - row.commission_pool / row.source_total_reward
      : 0,
  total_lots: 0,            // snapshot does not store lots; set to 0 or fetch separately
  total_reward: row.source_total_reward,
  parentUserId:
    row.depth === 1
      ? recipientId         // depth-1 partners hang off the current user
      : row.chain_root_id ?? recipientId,
  depth: row.depth,
}));
```

---

## 7 · File structure expected

```
components/
  AccountChainFlow.tsx          ← React Flow diagram (wraps with ReactFlowProvider)
  ChainCommissionBreakdown.tsx  ← Summary cards + data table
app/
  dashboard/
    page.tsx                    ← Fetches both endpoints, renders both components
```

Generate all three files, fully typed, no `any`, with inline comments explaining the commission logic and node-building logic.
