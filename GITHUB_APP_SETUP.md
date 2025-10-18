# GitHub App Configuration with Ngrok

## ⚠️ IMPORTANT: APP_URL FIX APPLIED

**Fixed Issue:** Removed leading space from APP_URL in `.env` file (this was causing redirect failures)

## Your Current Ngrok URL
```
https://bfbe47065779.ngrok-free.app
```

**Last Updated:** October 18, 2025

## 🔧 REQUIRED: Update GitHub App Settings

Go to: https://github.com/settings/apps/workledger-app

### 1. General Settings

**Homepage URL:**
```
https://bfbe47065779.ngrok-free.app
```

**Callback URL:**
```
https://bfbe47065779.ngrok-free.app/api/github/callback
```

**Setup URL:** ⚠️ **CRITICAL - This MUST be set for redirects to work!**
```
https://bfbe47065779.ngrok-free.app/api/github/app/install
```

**Webhook URL:**
```
https://bfbe47065779.ngrok-free.app/api/github/webhooks
```

**Webhook secret:** (already set)
```
83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c
```

### 2. Permissions (Already Set)

**Repository permissions:**
- ✅ Contents: Read-only
- ✅ Metadata: Read-only
- ✅ Commit statuses: Read-only

**Organization permissions:**
- ✅ Members: Read-only
- ✅ Administration: Read-only

### 3. Subscribe to events

- ✅ Push
- ✅ Repository
- ✅ Member
- ✅ Membership
- ✅ Installation
- ✅ Installation repositories

### 4. Where can this app be installed?
- ✅ Any account

---

## Important Notes

1. **Ngrok URL Changes**: Free ngrok URLs change when you restart ngrok. If your URL changes, you'll need to update GitHub App settings again.

2. **Testing Installation Flow**:
   - Start your dev server: `npm run dev`
   - Start ngrok: `ngrok http 3000`
   - Update GitHub App with new ngrok URL (if it changed)
   - Go to your dashboard: http://localhost:3000
   - Click "Connect GitHub Organization"

3. **For Production**: Replace ngrok URL with your production domain (e.g., https://workledger.vercel.app)

---

## Current Configuration Summary

✅ GitHub App ID: 2122223
✅ App Name: workledger-app (public link: https://github.com/apps/workledger-app)
✅ Internal App Name: workledger-skills
✅ Ngrok URL: https://bfbe47065779.ngrok-free.app
✅ Webhook Secret: Configured
✅ Private Key: Configured in .env
✅ APP_URL: Fixed (removed leading space)

## Installation URL

Users/organizations can install the app at:
```
https://github.com/apps/workledger-app/installations/new
```

Or use the install button in your WorkLedger dashboard.

---

## 🐛 Bug Fix Summary (October 18, 2025)

### Problem
After installing the GitHub App, users were stuck on the GitHub settings page (`https://github.com/settings/installations/XXXXXX`) instead of being redirected back to the WorkLedger dashboard.

### Root Causes Identified
1. **Leading space in APP_URL** - The `.env` file had `APP_URL=" https://..."` with a leading space
2. **Setup URL not configured** - GitHub App settings didn't have the Setup URL configured
3. **Insufficient logging** - Hard to debug the callback flow

### Fixes Applied
1. ✅ **Fixed `.env` file** - Removed leading space from APP_URL (line 50)
2. ✅ **Enhanced callback logging** - Added comprehensive logging to `/api/github/app/install/route.ts`
3. ✅ **Improved error handling** - Better error messages and explicit 302 redirects
4. ✅ **Added UI feedback** - Success/error alerts on the integration page

### Required Action
⚠️ **YOU MUST DO THIS NOW:**

1. Go to: https://github.com/settings/apps/workledger-app
2. Click "Edit"
3. Scroll to "Setup URL (optional)"
4. Enter: `https://bfbe47065779.ngrok-free.app/api/github/app/install`
5. Click "Save changes"

### Testing the Fix

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Log in** as company admin

3. **Go to:** `/dashboard/integrations/github`

4. **Click:** "Install GitHub App"

5. **On GitHub:**
   - Select organization
   - Select repositories
   - Click "Install"

6. **Expected result:**
   - ✅ Redirected back to WorkLedger
   - ✅ Success alert shown
   - ✅ Integration status displayed
   - ✅ Stats updated

### Debugging

If you're still having issues, check the server logs for:
```
=== GITHUB APP INSTALLATION CALLBACK ===
```

This will show you exactly what's happening during the callback.

---

## Next Steps

1. ✅ Update the GitHub App Setup URL (see above)
2. ✅ Test the installation flow
3. ✅ Verify the redirect works
4. ✅ Check that repositories sync
5. ✅ Verify employee discovery works
