# Partner Configuration System

This directory contains the centralized partner configuration system for managing partner-specific settings across the application.

## Overview

The partner system allows you to create unique URLs for different partners (e.g., `domain.com/mra`, `domain.com/johncena`) with partner-specific configurations for:

- **Shared Google Sheet**: Used by all partners (including main site) - remains constant
- **Partner-Specific Detailed Sheet**: Each partner has their own Google Sheet tab for detailed tracking
- **Partner-Specific NGROK URL**: Each partner can have their own API endpoint

## File Structure

```
lib/partners/
├── config.ts       # Main configuration file with all partner settings
├── utils.ts        # Utility functions for extracting partner config from requests
├── index.ts        # Barrel export file
└── README.md       # This file
```

## Adding a New Partner

To add a new partner, edit [config.ts](config.ts) and add a new entry to the `PARTNERS` object:

```typescript
export const PARTNERS: Record<string, PartnerConfig> = {
  // ... existing partners ...
  
  newpartner: {
    id: 'newpartner',                    // URL slug (lowercase, no spaces)
    name: 'New Partner Name',             // Display name
    detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',  // Google Sheet ID
    sheetTabName: 'NewPartner',           // Tab name within the sheet
    ngrokApiUrl: 'https://newpartner.ngrok-free.dev/api/lookup',      // Partner API URL
    active: true,                         // Set to false to disable
  },
};
```

### Partner Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | URL-friendly identifier (used in routes like `/mra`, `/johncena`) |
| `name` | string | Human-readable display name |
| `detailedSheetId` | string | Google Sheet ID for detailed tracking (each partner can have their own sheet) |
| `sheetTabName` | string | Tab/sheet name within the detailed Google Sheet |
| `ngrokApiUrl` | string | Partner-specific NGROK API URL for account lookups |
| `active` | boolean | Whether this partner is active (inactive partners return 404) |

## Shared Configuration

### Shared Google Sheet

All partners (including the main site) share one Google Sheet for basic account storage:

```typescript
export const SHARED_SHEET_ID = '10pyG095zn4Kb2yIXHqI4-INzlUpyvqFcEiwh1qgtwgI';
```

This sheet is used by the `/api/check-email` endpoint to verify licensed accounts across all partners.

### Main Site Configuration

When no partner is specified (i.e., accessing `domain.com`), the main configuration is used:

```typescript
export const MAIN_CONFIG: PartnerConfig = {
  id: 'main',
  name: 'Main Site',
  detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',
  sheetTabName: 'AndyBao',
  ngrokApiUrl: 'https://rainbowy-clarine-presumingly.ngrok-free.dev/api/lookup',
  active: true,
};
```

## How It Works

### 1. URL Routing

Partners access their version via: `domain.com/[partnerId]`

Examples:
- `domain.com/mra` → Uses MrA configuration
- `domain.com/johncena` → Uses JohnCena configuration
- `domain.com` → Uses Main configuration

### 2. Partner Validation

The dynamic route at `app/[partner]/page.tsx` validates the partner:

```typescript
export default function PartnerPage({ params }: PartnerPageProps) {
  const { partner } = params;
  
  if (!isValidPartner(partner)) {
    notFound(); // Shows 404 for invalid partners
  }
  
  const partnerConfig = getPartnerConfig(partner);
  return <PartnerPageClient partnerConfig={partnerConfig} />;
}
```

### 3. API Integration

API routes automatically detect the partner from request headers:

```typescript
import { getPartnerFromRequest } from '@/lib/partners';

export async function POST(request: NextRequest) {
  const partnerConfig = getPartnerFromRequest(request);
  
  // Use partner-specific settings
  const response = await fetch(partnerConfig.ngrokApiUrl, { ... });
  // ...
}
```

### 4. Client-Side Usage

Components send the partner ID via custom headers:

```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (partnerId) {
  headers['x-partner-id'] = partnerId;
}

const response = await fetch('/api/check-email', {
  method: 'POST',
  headers,
  body: JSON.stringify({ email }),
});
```

## API Routes Using Partner Config

The following API routes use partner-specific configurations:

| Route | Uses Partner Config For |
|-------|------------------------|
| `/api/check-email` | NGROK URL, Shared Sheet |
| `/api/grant-license` | Shared Sheet, Detailed Sheet + Tab |
| `/api/get-uid-by-email` | Detailed Sheet + Tab |
| `/api/get-licensed-ids` | Detailed Sheet + Tab |

## Utility Functions

### `getPartnerConfig(partnerId?: string | null): PartnerConfig | null`

Gets partner configuration by ID. Returns `null` if not found or inactive.

```typescript
const config = getPartnerConfig('mra');
console.log(config?.name); // "Mr. A"
```

### `getPartnerFromRequest(request: NextRequest): PartnerConfig`

Extracts partner config from request headers. Falls back to main config if no partner specified.

```typescript
export async function POST(request: NextRequest) {
  const partnerConfig = getPartnerFromRequest(request);
  // Always returns a valid config (main or partner)
}
```

### `getActivePartners(): PartnerConfig[]`

Returns an array of all active partners.

```typescript
const partners = getActivePartners();
console.log(partners.map(p => p.name)); // ["Mr. A", "John Cena", ...]
```

### `isValidPartner(partnerId: string): boolean`

Checks if a partner ID is valid and active.

```typescript
if (isValidPartner('mra')) {
  // Partner exists and is active
}
```

## Google Sheets Structure

### Shared Sheet (All Partners)

**Sheet ID**: `10pyG095zn4Kb2yIXHqI4-INzlUpyvqFcEiwh1qgtwgI`

| Column B |
|----------|
| Account ID |
| 12345678 |
| 87654321 |

### Detailed Sheet (Partner-Specific Tabs)

**Sheet ID**: `1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8`

**Tab Names**: `AndyBao`, `MrA`, `JohnCena`, etc.

| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Email | UID | Account | Licensed Date |
| user@example.com | abc123 | 12345678 | 14.01.2026 10:30:00 |

## Deactivating a Partner

To temporarily disable a partner without deleting their configuration:

```typescript
mra: {
  id: 'mra',
  name: 'Mr. A',
  // ... other config ...
  active: false, // Set to false to disable
},
```

Accessing `/mra` will now show a 404 page.

## Best Practices

1. **Use lowercase IDs**: Partner IDs should be lowercase and URL-friendly (e.g., `mra`, not `MrA`)
2. **Unique sheet tabs**: Each partner should have their own unique tab name in the detailed sheet
3. **Test new partners**: After adding a partner, test the URL to ensure configuration works
4. **Document changes**: When adding/modifying partners, document the changes in your commit message
5. **Environment-specific URLs**: Consider using environment variables for NGROK URLs in production

## Troubleshooting

### Partner URL returns 404

- Check that the partner ID matches exactly (case-sensitive in config, lowercase in URL)
- Verify `active: true` is set in the partner configuration
- Ensure the partner ID doesn't conflict with existing routes

### API calls not using partner config

- Verify that the client is sending the `x-partner-id` header
- Check that `getPartnerFromRequest()` is being called in the API route
- Look for console logs showing which partner config is being used

### Wrong Google Sheet being accessed

- Double-check `detailedSheetId` matches your intended sheet
- Verify `sheetTabName` exists in the specified sheet
- Ensure service account has access to the sheet

## Example: Complete Partner Setup

1. **Add partner to config.ts**:
```typescript
testpartner: {
  id: 'testpartner',
  name: 'Test Partner',
  detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',
  sheetTabName: 'TestPartner',
  ngrokApiUrl: 'https://testpartner.ngrok-free.dev/api/lookup',
  active: true,
},
```

2. **Create tab in Google Sheet**: Create a new tab called `TestPartner` with columns A-D

3. **Test the URL**: Visit `domain.com/testpartner`

4. **Verify API calls**: Check console logs to see partner config being used

## Future Enhancements

Potential improvements to consider:

- [ ] Store partner configs in a database instead of code
- [ ] Add partner-specific branding/theming
- [ ] Partner analytics dashboard
- [ ] API rate limiting per partner
- [ ] Partner-specific feature flags
- [ ] Dynamic partner registration UI

---

For questions or issues, please contact the development team.
