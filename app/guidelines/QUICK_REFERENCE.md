# Quick Reference: Configuration & Secrets

> **TL;DR**: Put secrets in `.env.local`, import from `lib/config.ts`, never hardcode credentials.

---

## 🚀 Quick Setup (First Time)

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Edit .env.local with your actual credentials
# (Google Sheet IDs, service account JSON values)

# 3. Restart server
npm run dev
```

---

## 📝 Common Tasks

### Adding a New API Key

```typescript
// 1. Add to .env.local
NEW_API_KEY=abc123xyz

// 2. Export in lib/config.ts
export const NEW_API_KEY = process.env.NEW_API_KEY;

// 3. Use in API route
import { NEW_API_KEY } from '@/lib/config';
```

### Using Google Sheets

```typescript
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import { USER_SHEET_ID } from '@/lib/config';

const sheets = await getGoogleSheetsClient();
const data = await sheets.spreadsheets.values.get({
  spreadsheetId: USER_SHEET_ID,
  range: 'A1:Z100',
});
```

### Getting Configuration Values

```typescript
// Available exports from lib/config.ts:
import { 
  USER_SHEET_ID,           // User signup sheet
  PARTNER_SHEET_ID,        // Partner signup sheet
  SHARED_SHEET_ID,         // License tracking sheet
  MAIN_CONFIG,             // Full app config object
  validateEnvConfig        // Validation function
} from '@/lib/config';
```

---

## ⚠️ Rules

| ✅ DO | ❌ DON'T |
|-------|----------|
| Put secrets in `.env.local` | Hardcode API keys in code |
| Import from `lib/config.ts` | Duplicate credentials |
| Use `getGoogleSheetsClient()` | Create auth in every file |
| Document new vars in `.env.example` | Commit `.env.local` |
| Restart server after env changes | Forget to add to `.gitignore` |

---

## 📁 File Locations

```
project/
├── .env.local              ← Your secrets (gitignored)
├── .env.example            ← Template (safe to commit)
├── lib/
│   ├── config.ts           ← Import config from here
│   └── google-sheets.ts    ← Import sheets client from here
└── app/api/                ← API routes use above imports
```

---

## 🔍 Available Environment Variables

```env
# Google Sheets
PARTNER_SHEET_ID=...
USER_SHEET_ID=...
SHARED_SHEET_ID=...
DETAILED_SHEET_ID=...
DETAILED_SHEET_TAB=...

# Google Service Account
GOOGLE_PROJECT_ID=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=...
GOOGLE_CLIENT_ID=...

# External APIs
NGROK_API_URL=...
```

See [.env.example](.env.example) for complete list.

---

## 🛟 Troubleshooting

**Environment variables not loading?**
```bash
# Restart dev server (required after .env.local changes)
npm run dev
```

**"Missing required environment variables" error?**
```typescript
// Check which are missing:
import { validateEnvConfig } from '@/lib/config';
validateEnvConfig(); // Throws error with missing vars
```

**Private key format error?**
```env
# Wrap in quotes, keep \n characters:
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----\n"
```

---

## 📖 Full Documentation

- **Complete Guide**: [API_CONFIGURATION_GUIDE.md](API_CONFIGURATION_GUIDE.md)
- **Migration Details**: [CONFIGURATION_MIGRATION_SUMMARY.md](CONFIGURATION_MIGRATION_SUMMARY.md)
- **Next.js Docs**: [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## 💡 Examples

### Bad ❌
```typescript
const API_KEY = 'hardcoded-secret-123';
const SHEET_ID = '1ABC...XYZ';
```

### Good ✅
```typescript
import { API_KEY, SHEET_ID } from '@/lib/config';
```

---

**Need help?** Check [API_CONFIGURATION_GUIDE.md](API_CONFIGURATION_GUIDE.md) for detailed instructions.