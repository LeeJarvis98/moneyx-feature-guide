# Cloudflare Turnstile Setup Guide

This guide explains how to set up and use Cloudflare Turnstile captcha in your MoneyX application.

## What is Cloudflare Turnstile?

Cloudflare Turnstile is a **free, privacy-friendly, and user-friendly** CAPTCHA alternative that protects your forms from bots and automated attacks. It's:

- ✅ **Free** for unlimited use
- ✅ **Privacy-first** (GDPR compliant, no user tracking)
- ✅ **User-friendly** (invisible in most cases)
- ✅ **Secure** (powered by Cloudflare's AI/ML bot detection)
- ✅ **Easy to integrate** with React/Next.js

## Implementation Summary

Turnstile has been integrated into the following components:

1. **PartnerLogin** - Partner platform login form
2. **LoginTab** - User login form
3. **AccountSettingsTab** - Password change form
4. **RegisterModal** - User registration form

## Current Configuration (Development Mode)

The application is currently configured with **Cloudflare's test keys** which always pass verification. This is perfect for development and testing.

**Current keys in `.env.local`:**
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

## Setting Up Production Keys

### Step 1: Get Your Cloudflare Turnstile Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign in or create a free account
3. Navigate to **Turnstile** from the sidebar
4. Click **"Add Site"**
5. Configure your site:
   - **Domain**: Add your production domain (e.g., `moneyx.com`)
   - **Widget Mode**: Choose **"Managed"** (recommended) or **"Non-Interactive"**
   - **Theme**: Dark (matches your app's theme)
6. Click **"Create"**
7. Copy your **Site Key** and **Secret Key**

### Step 2: Update Environment Variables

Update your `.env.local` file with your production keys:

```bash
# Production Keys
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_actual_site_key_here
TURNSTILE_SECRET_KEY=your_actual_secret_key_here
```

⚠️ **IMPORTANT**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### Step 3: Restart Your Development Server

After updating the environment variables:

```bash
npm run dev
```

## How It Works

### Client-Side (React Components)

Each form now includes the `<Turnstile>` component which:
1. Renders the Cloudflare Turnstile widget
2. Handles user verification automatically
3. Generates a one-time token on success
4. Passes the token to your form submission

### Server-Side (API Routes)

Each API route now:
1. Receives the turnstile token from the client
2. Verifies the token with Cloudflare's API
3. Rejects the request if verification fails
4. Proceeds with normal logic if verification succeeds

This provides **defense-in-depth** security:
- Bot protection at the form level
- Server-side verification prevents bypass attempts
- Tokens are single-use and expire after verification

## Testing

### With Test Keys (Current Setup)
- The captcha will always appear but always pass
- Perfect for development and automated testing
- No real bot protection (use production keys for that)

### With Production Keys
- Real bot detection and challenges
- Users may see verification challenges if suspicious
- Most legitimate users see nothing (invisible verification)

## Customization Options

### Theme
The widget is currently set to **dark** theme to match your application. You can change this in [components/Turnstile.tsx](components/Turnstile.tsx):

```typescript
options={{
  theme: 'dark', // or 'light', 'auto'
  size: 'normal', // or 'compact', 'flexible'
}}
```

### Widget Placement
The widget is centered above the submit button in each form. You can adjust the styling by modifying the wrapper div in each component.

### Error Handling
The widget automatically handles:
- Network errors (retries automatically)
- Token expiration (triggers `onExpire` callback)
- User errors (triggers `onError` callback)

## Security Features

✅ **Bot Protection**: Prevents automated form submissions  
✅ **Rate Limiting**: Cloudflare handles rate limiting automatically  
✅ **Token Expiration**: Tokens expire after 5 minutes  
✅ **Single-Use Tokens**: Each token can only be verified once  
✅ **Server-Side Verification**: Tokens are verified on your server, not just client-side

## Troubleshooting

### Widget Not Appearing
- Check that `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in `.env.local`
- Restart your dev server after adding environment variables
- Check browser console for errors

### Verification Always Failing
- Check that `TURNSTILE_SECRET_KEY` is set correctly
- Ensure you're using the matching site key and secret key pair
- Check network requests in browser DevTools

### Widget Shows Error
- Check your internet connection
- Verify domain configuration in Cloudflare dashboard
- Check for ad blockers or privacy extensions blocking Cloudflare

## Files Modified

### New Files Created:
- `components/Turnstile.tsx` - Reusable Turnstile component
- `lib/turnstile.ts` - Server-side verification utility
- `.env.local` - Environment variables (test keys)
- `.env.local.example` - Template for production keys

### Components Updated:
- `components/partner/PartnerLogin.tsx`
- `components/tabs/LoginTab.tsx`
- `components/account/AccountSettingsTab.tsx`
- `components/tabs/RegisterModal.tsx`

### API Routes Updated:
- `app/api/partner-login/route.ts`
- `app/api/user-login/route.ts`
- `app/api/update-password/route.ts`
- `app/api/user-signup/route.ts`

## Next Steps

1. ✅ **Development**: Use test keys (already configured)
2. 📝 **Testing**: Test all forms to ensure captcha works
3. 🚀 **Production**: Get real keys from Cloudflare when deploying
4. 🔒 **Deploy**: Update production environment variables
5. 📊 **Monitor**: Check Cloudflare dashboard for captcha analytics

## Additional Resources

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [React Turnstile Library](https://github.com/marsidev/react-turnstile)
- [Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)

---

**Need Help?** Check the Cloudflare Turnstile documentation or reach out to Cloudflare support.
