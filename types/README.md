# Database Types

This folder contains TypeScript types for the Supabase database.

## Files

- **database.generated.ts** - Auto-generated types from Supabase schema (DO NOT EDIT MANUALLY)
- **database.ts** - Helper types and re-exports for easy imports
- **exness.ts** - Types for Exness API integration
- **index.ts** - Main exports for the types module

## Syncing Types with Supabase

### After updating tables in Supabase Dashboard:

Run this command to regenerate types:

```bash
npm run types:generate
```

Or manually:

```bash
npx supabase gen types typescript --project-id yctqvpgofipnaziqdxsz > types/database.generated.ts
```

### What happens:

1. The CLI connects to your Supabase project
2. Reads the current database schema (all tables, columns, relationships)
3. Generates TypeScript types in `database.generated.ts`
4. Your code automatically gets type safety for all new tables/columns

## Current Tables

Your Supabase database has these tables (auto-detected):

- **users** - User accounts with email, password, status, partner_rank
- **licensed_accounts** - Licensed trading accounts
- **partners** - Partner information with referral links and commissions
- **partner_rank_list** - Partner ranks with reward percentages
- **own_referral_id_list** - List of referral IDs

## Usage in Code

Import helper types from `database.ts`:

```typescript
import type { User, Partner, LicensedAccount } from '@/types/database';

// Type-safe database operations
const user: User = {
  id: '123',
  email: 'user@example.com',
  // TypeScript will ensure all required fields are present
};
```

## Adding New Helper Types

When you add new tables to Supabase:

1. Run `npm run types:generate`
2. Open `database.ts`
3. Add helper exports for your new table:

```typescript
// New Table types
export type NewTable = Tables<'new_table'>;
export type NewTableInsert = TablesInsert<'new_table'>;
export type NewTableUpdate = TablesUpdate<'new_table'>;
```

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and keys

**Error: "Failed to connect to Supabase"**
- Check your internet connection
- Verify project ID in package.json is correct
- Make sure you're logged in: `npx supabase login`

**Types not updating**
- Delete `database.generated.ts` and run `npm run types:generate` again
- Clear your TypeScript cache: restart VS Code or run `Developer: Reload Window`
