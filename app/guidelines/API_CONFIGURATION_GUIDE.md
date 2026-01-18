# API Configuration & Secrets Management Guide

## Overview

This guide establishes the standard practices for handling API keys, credentials, and sensitive configuration data in this Next.js project.

## Core Principles

1. **Never commit secrets to version control**
2. **Centralize all configuration in one place** 
3. **Use environment variables for sensitive data**
4. **Validate configuration at startup**
5. **Document all required environment variables**

---

## Project Structure

```
project/
├── .env.local               # Local environment variables (gitignored)
├── .env.example             # Template showing required variables
├── lib/
│   ├── config.ts            # Application configuration exports
│   └── google-sheets.ts     # Google Sheets utilities
└── app/api/                 # API routes use centralized config
```

---

## Environment Variables (.env.local)

### What Goes in .env.local?

- API keys and secrets
- Database connection strings
- Service account credentials
- OAuth client IDs and secrets
- Third-party API URLs
- Spreadsheet IDs
- Any sensitive configuration data

### Example .env.local Structure

```env
# Google Sheets Configuration
PARTNER_SHEET_ID=your-sheet-id-here
USER_SHEET_ID=your-sheet-id-here
SHARED_SHEET_ID=your-sheet-id-here

# Google Service Account Credentials
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id

# External API Configuration
NGROK_API_URL=https://your-ngrok-url.ngrok.io/api/lookup
EXNESS_API_URL=https://api.exness.com
```

### Security Notes

✅ `.env.local` is automatically gitignored by Next.js  
✅ Never commit `.env.local` to version control  
✅ Use `.env.example` to document required variables  
✅ Rotate credentials regularly  
✅ Use different credentials for development/production  

---

## Configuration Files

### lib/config.ts

**Purpose**: Export typed configuration objects from environment variables

```typescript
// ✅ Good: Export configuration from env variables
export const USER_SHEET_ID = process.env.USER_SHEET_ID || '';
export const PARTNER_SHEET_ID = process.env.PARTNER_SHEET_ID || '';

// ✅ Good: Validate required variables
export function validateEnvConfig(): void {
  const required = ['GOOGLE_PROJECT_ID', 'GOOGLE_PRIVATE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// ❌ Bad: Hardcoded values
const USER_SHEET_ID = '1G3CnLsRG5LUkQ2L1j6G2XiG8I1keeVRWiHvnNuUA5ok';
```

### lib/google-sheets.ts

**Purpose**: Centralize Google Sheets API utilities and credential management

```typescript
// ✅ Good: Load credentials from environment
export function getServiceAccountCredentials() {
  return {
    type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE || 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // ... other fields from env
  };
}

// ✅ Good: Provide reusable API client
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}
```

---

## Using Configuration in API Routes

### ✅ Correct Pattern

```typescript
// app/api/user-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { USER_SHEET_ID } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Use centralized utilities
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: USER_SHEET_ID,
      range: 'A1:Z1000',
    });
    
    // ... rest of logic
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
```

### ❌ Incorrect Pattern (Don't Do This)

```typescript
// ❌ Bad: Hardcoded credentials in API route
const SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'my-project-123',
  private_key: '-----BEGIN PRIVATE KEY-----\n...',
  client_email: 'service@project.iam.gserviceaccount.com',
  // ... more hardcoded values
};

// ❌ Bad: Hardcoded sheet IDs
const SPREADSHEET_ID = '1G3CnLsRG5LUkQ2L1j6G2XiG8I1keeVRWiHvnNuUA5ok';

// ❌ Bad: Duplicate auth setup in every file
const auth = new google.auth.GoogleAuth({
  credentials: SERVICE_ACCOUNT,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
```

---

## Adding New API Keys/Services

### Step-by-Step Process

1. **Add to .env.local**
   ```env
   NEW_API_KEY=your-api-key-here
   NEW_API_URL=https://api.example.com
   ```

2. **Document in .env.example**
   ```env
   # New Service Configuration
   NEW_API_KEY=your-key-here
   NEW_API_URL=https://api.example.com
   ```

3. **Export from lib/config.ts**
   ```typescript
   export const NEW_API_KEY = process.env.NEW_API_KEY;
   export const NEW_API_URL = process.env.NEW_API_URL || 'https://api.example.com';
   ```

4. **Add validation** (if required)
   ```typescript
   export function validateEnvConfig(): void {
     const required = [
       'GOOGLE_PROJECT_ID',
       'NEW_API_KEY', // Add new required variable
     ];
     const missing = required.filter(key => !process.env[key]);
     if (missing.length > 0) {
       throw new Error(`Missing: ${missing.join(', ')}`);
     }
   }
   ```

5. **Use in API routes**
   ```typescript
   import { NEW_API_KEY, NEW_API_URL } from '@/lib/config';
   
   const response = await fetch(NEW_API_URL, {
     headers: { 'Authorization': `Bearer ${NEW_API_KEY}` }
   });
   ```

---

## Environment-Specific Configuration

### Development vs Production

**Development** (`.env.local`)
```env
GOOGLE_PROJECT_ID=dev-project
DATABASE_URL=postgresql://localhost:5432/dev
DEBUG_MODE=true
```

**Production** (Set in hosting platform)
```env
GOOGLE_PROJECT_ID=prod-project
DATABASE_URL=postgresql://prod-server:5432/prod
DEBUG_MODE=false
```

### Loading Priority

Next.js loads environment variables in this order:
1. `.env.local` (highest priority, gitignored)
2. `.env.production` / `.env.development` (based on NODE_ENV)
3. `.env` (lowest priority, can be committed for defaults)

---

## Security Checklist

- [ ] All secrets stored in `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` documents all required variables
- [ ] No hardcoded credentials in source code
- [ ] Credentials are loaded from `process.env` only
- [ ] Required variables are validated at startup
- [ ] API keys are rotated regularly
- [ ] Different credentials for dev/staging/prod

---

## Common Mistakes to Avoid

### ❌ Committing Secrets
```typescript
// Never do this!
const API_KEY = 'sk_live_abc123xyz789';  // Exposed in git history
```

### ❌ Logging Sensitive Data
```typescript
// Don't log full credentials
console.log('Service account:', SERVICE_ACCOUNT);  // Bad!

// Instead, log only non-sensitive info
console.log('Using service account:', process.env.GOOGLE_CLIENT_EMAIL);  // OK
```

###  ❌ Client-Side Exposure
```typescript
// API keys in client components will be exposed!
'use client';
const apiKey = process.env.NEXT_PUBLIC_API_KEY;  // Visible in browser!

// Only expose what's safe to be public
// Use Server Components or API routes for sensitive operations
```

### ❌ Duplicate Configuration
```typescript
// Don't repeat the same sheet ID in 10 different files
// Centralize in lib/config.ts and import
```

---

## Troubleshooting

### Environment Variables Not Loading

**Problem**: `process.env.MY_VAR` is undefined

**Solutions**:
1. Restart Next.js dev server (required after changing `.env.local`)
2. Check variable name matches exactly (case-sensitive)
3. Ensure `.env.local` is in project root
4. Verify no spaces around `=` in `.env.local`

### Private Key Format Issues

**Problem**: Google auth fails with private key error

**Solution**: Wrap private key in quotes in `.env.local`
```env
# ✅ Correct
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key\n-----END PRIVATE KEY-----\n"

# ❌ Wrong
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
```

---

## Migration Guide

### Converting Hardcoded Credentials

**Before**:
```typescript
// app/api/my-route/route.ts
const API_KEY = 'hardcoded-key-123';
const SHEET_ID = '1ABC...XYZ';
```

**After**:

1. Move to `.env.local`:
   ```env
   MY_API_KEY=hardcoded-key-123
   MY_SHEET_ID=1ABC...XYZ
   ```

2. Export from `lib/config.ts`:
   ```typescript
   export const MY_API_KEY = process.env.MY_API_KEY;
   export const MY_SHEET_ID = process.env.MY_SHEET_ID;
   ```

3. Import and use:
   ```typescript
   import { MY_API_KEY, MY_SHEET_ID } from '@/lib/config';
   ```

---

## References

- [Next.js Environment Variables Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Twelve-Factor App Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## Questions?

When in doubt:
1. **Is it sensitive?** → Put it in `.env.local`
2. **Is it reused?** → Export from `lib/config.ts`  
3. **Is it required?** → Add validation in `validateEnvConfig()`
4. **Is it new?** → Document in `.env.example`

**Remember**: If it's a secret, it doesn't belong in the code!