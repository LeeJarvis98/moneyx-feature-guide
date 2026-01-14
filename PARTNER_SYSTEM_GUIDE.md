# Partner Routing System - Implementation Guide

## 🎯 Overview

This document explains the partner-specific routing system that was implemented. Each partner can now have their own unique URL with custom configurations for Google Sheets and API endpoints.

## 🌐 How It Works

### URL Structure

- **Main site**: `domain.com` → Uses default/main configuration
- **Partner sites**: `domain.com/partnername` → Uses partner-specific configuration
  - Example: `domain.com/mra` → Mr. A's configuration
  - Example: `domain.com/johncena` → John Cena's configuration

### What Changes Per Partner?

1. **Shared Google Sheet** (Same for everyone)
   - Sheet ID: `10pyG095zn4Kb2yIXHqI4-INzlUpyvqFcEiwh1qgtwgI`
   - Used by all partners to check licensed accounts

2. **Detailed Google Sheet** (Partner-specific)
   - Each partner has their own tab in the detailed sheet
   - Sheet ID: `1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8`
   - Tab names: `AndyBao` (main), `MrA`, `JohnCena`, etc.

3. **NGROK API URL** (Partner-specific)
   - Each partner can have their own API endpoint
   - Main: `https://rainbowy-clarine-presumingly.ngrok-free.dev/api/lookup`
   - Partners can have custom URLs

## 📁 Files Created/Modified

### New Files

1. **`lib/partners/config.ts`** - Main configuration hub for all partners
2. **`lib/partners/utils.ts`** - Utility functions for partner config extraction
3. **`lib/partners/index.ts`** - Barrel export file
4. **`lib/partners/README.md`** - Detailed documentation
5. **`app/[partner]/page.tsx`** - Dynamic partner route (Server Component)
6. **`app/[partner]/PartnerPageClient.tsx`** - Partner page client component
7. **`app/[partner]/not-found.tsx`** - 404 page for invalid partners

### Modified Files

1. **`app/api/check-email/route.ts`** - Uses partner-specific NGROK URL
2. **`app/api/grant-license/route.ts`** - Uses partner-specific detailed sheet
3. **`app/api/get-uid-by-email/route.ts`** - Uses partner-specific detailed sheet
4. **`app/api/get-licensed-ids/route.ts`** - Uses partner-specific detailed sheet
5. **`components/tabs/GetBotTab.tsx`** - Sends partner ID in API headers

## 🔧 Adding a New Partner

### Step 1: Edit Configuration

Open `lib/partners/config.ts` and add a new entry:

```typescript
export const PARTNERS: Record<string, PartnerConfig> = {
  // ... existing partners ...
  
  newpartner: {
    id: 'newpartner',                    // URL slug (lowercase)
    name: 'New Partner Name',             // Display name
    detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',  
    sheetTabName: 'NewPartner',           // Tab name in Google Sheet
    ngrokApiUrl: 'https://newpartner.ngrok-free.dev/api/lookup',
    active: true,                         // Set to false to disable
  },
};
```

### Step 2: Create Google Sheet Tab

1. Open the detailed Google Sheet: `1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8`
2. Create a new tab with the name matching `sheetTabName` (e.g., `NewPartner`)
3. Set up columns: `Email | UID | Account | Licensed Date`

### Step 3: Test

1. Navigate to `domain.com/newpartner`
2. Verify the partner badge shows the correct name
3. Test the "Lấy Bot" functionality with an email
4. Check console logs to see partner config being used

## 🎨 Visual Changes

### Partner Badge

When accessing a partner URL, a badge appears in the header showing:
```
Partner: [Partner Name]
```

This helps users know they're on a partner-specific page.

## 🔍 How API Routing Works

### Client Side (Component)

```typescript
// Extract partner from URL
const pathname = usePathname();
const partnerId = pathname.startsWith('/') && pathname !== '/' 
  ? pathname.slice(1).split('/')[0] 
  : null;

// Add to headers
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (partnerId) {
  headers['x-partner-id'] = partnerId;
}

// Make API call
await fetch('/api/check-email', {
  method: 'POST',
  headers,
  body: JSON.stringify({ email }),
});
```

### Server Side (API Route)

```typescript
import { getPartnerFromRequest } from '@/lib/partners';

export async function POST(request: NextRequest) {
  // Automatically extracts partner from headers
  const partnerConfig = getPartnerFromRequest(request);
  
  // Use partner-specific settings
  console.log('Using partner:', partnerConfig.name);
  console.log('NGROK URL:', partnerConfig.ngrokApiUrl);
  console.log('Sheet Tab:', partnerConfig.sheetTabName);
  
  // ... rest of API logic
}
```

## 📊 Data Flow

```
User visits domain.com/mra
    ↓
Dynamic route validates "mra" partner
    ↓
PartnerPageClient receives partner config
    ↓
User interacts (e.g., clicks "Lấy Bot")
    ↓
GetBotTab extracts "mra" from URL
    ↓
API call includes header: x-partner-id: mra
    ↓
API route extracts partner config
    ↓
Uses MrA's NGROK URL and sheet tab
    ↓
Data saved to correct Google Sheet tab
```

## 🛠️ Configuration Management

### Shared Settings

**Google Sheet ID** (shared by all):
```typescript
export const SHARED_SHEET_ID = '10pyG095zn4Kb2yIXHqI4-INzlUpyvqFcEiwh1qgtwgI';
```

### Main Site Settings

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

### Current Partners

1. **MrA** (`/mra`)
   - Sheet Tab: `MrA`
   - NGROK: `https://mra-partner.ngrok-free.dev/api/lookup`

2. **JohnCena** (`/johncena`)
   - Sheet Tab: `JohnCena`
   - NGROK: `https://johncena-partner.ngrok-free.dev/api/lookup`

## 🚨 Important Notes

### URL Format
- Partner IDs must be **lowercase**
- Use hyphens for multi-word names (e.g., `john-cena`, not `JohnCena`)
- IDs are case-sensitive in config but lowercase in URLs

### Sheet Tab Names
- Tab names can use any casing (e.g., `MrA`, `JohnCena`)
- Must match exactly what's in the Google Sheet
- Each partner needs their own unique tab

### NGROK URLs
- Must include the full URL with protocol (https://)
- Should end with `/api/lookup` (or your specific endpoint)
- Update these when NGROK URLs change

### Activation
- Set `active: false` to temporarily disable a partner
- Disabled partners return 404 page
- Data remains intact when partner is reactivated

## 🔒 Security Considerations

1. **Service Account Credentials**: Already configured in each API route
2. **Google Sheet Permissions**: Ensure service account has access to all sheets
3. **NGROK URLs**: Should be secured in production (consider using environment variables)
4. **Partner Validation**: Invalid partners automatically return 404

## 📈 Monitoring & Debugging

### Console Logs

API routes log which partner config is being used:
```
[API] Using partner config: Mr. A
[GRANT] Using partner config: Mr. A Sheet: MrA
```

### Testing Checklist

- [ ] Partner URL loads correctly
- [ ] Partner badge shows correct name
- [ ] Email validation works
- [ ] License granting works
- [ ] Data appears in correct Google Sheet tab
- [ ] NGROK API responds correctly
- [ ] Console logs show correct partner

## 🔄 Migration from Old System

### Before
- Single hardcoded Google Sheet tab: `AndyBao`
- Single hardcoded NGROK URL
- No partner differentiation

### After
- Dynamic partner configuration
- Each partner has their own sheet tab
- Each partner can have their own NGROK URL
- Main site continues to work as before

### Backward Compatibility
✅ The main site (`domain.com`) works exactly as before
✅ All existing functionality preserved
✅ No breaking changes to API contracts

## 🎓 Examples

### Example 1: Checking if a Partner Exists

```typescript
import { isValidPartner } from '@/lib/partners';

if (isValidPartner('mra')) {
  console.log('MrA is a valid partner');
}
```

### Example 2: Getting All Active Partners

```typescript
import { getActivePartners } from '@/lib/partners';

const partners = getActivePartners();
partners.forEach(p => {
  console.log(`${p.name} - ${p.id}`);
});
```

### Example 3: Getting Partner Config

```typescript
import { getPartnerConfig } from '@/lib/partners';

const config = getPartnerConfig('mra');
if (config) {
  console.log(`Sheet Tab: ${config.sheetTabName}`);
  console.log(`API URL: ${config.ngrokApiUrl}`);
}
```

## 📞 Support

For detailed documentation, see: [lib/partners/README.md](lib/partners/README.md)

For issues or questions:
1. Check console logs for partner config being used
2. Verify Google Sheet tab exists and matches config
3. Ensure NGROK URL is accessible
4. Check that partner is set to `active: true`

---

**Last Updated**: January 14, 2026
**Version**: 1.0.0
