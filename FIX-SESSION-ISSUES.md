# Fix Session and Authentication Issues

## Issues Fixed

### 1. ✅ Database Connection - RESOLVED
The database is now working properly.

### 2. ✅ Logger Error - RESOLVED
Fixed `logger.withContext is not a function` by using `createLogger()` instead.

### 3. ⚠️ JWT Session Token Error - NEEDS USER ACTION

**Error:** `Invalid Compact JWE` when trying to connect GitHub

**Root Cause:** Corrupted session cookies in your browser from old session format

**Solution:** Clear your browser cookies and login again

## Steps to Fix Session Issues

### Option 1: Clear Cookies in DevTools (Recommended)
1. Open your browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under "Cookies", select `http://localhost:3000`
4. Delete ALL cookies, especially:
   - `next-auth.session-token`
   - `next-auth.csrf-token`
   - `next-auth.callback-url`
5. Refresh the page
6. Login again

### Option 2: Use Incognito/Private Window
1. Open a new Incognito/Private window
2. Go to http://localhost:3000
3. Login with your credentials
4. Try connecting GitHub

### Option 3: Clear All Browser Data
1. Go to browser settings
2. Clear browsing data
3. Select "Cookies and other site data"
4. Clear data for "Last hour" or "All time"
5. Restart browser

## After Clearing Cookies

1. **Login again** at http://localhost:3000/auth/signin
2. Go to **Employee Dashboard**
3. Click **"Connect GitHub Now"**
4. You should be redirected to: `https://github.com/login/oauth/authorize`
   - ✅ **CORRECT**: OAuth authorization page
   - ❌ **WRONG**: `https://github.com/settings/installations/...`

## What to Expect

### Correct Flow:
```
1. Click "Connect GitHub" on dashboard
2. Redirect to: https://github.com/login/oauth/authorize?client_id=Ov23...
3. GitHub shows OAuth consent screen
4. Authorize the app
5. Redirect back to: /api/github/callback
6. Redirect to: /employee/dashboard?connected=true&synced=true
7. ✅ GitHub connected successfully!
```

### If You Still See Installation Page:
This means browser is caching the GitHub redirect. Try:
1. Logout from GitHub completely
2. Go to https://github.com/logout
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try again in incognito mode

## Verify Everything Works

After clearing cookies and logging in:

1. **Test session persistence:**
   - Login
   - Open a new tab
   - Navigate to http://localhost:3000/employee/dashboard
   - ✅ Should stay logged in

2. **Test GitHub connect:**
   - Click "Connect GitHub Now"
   - ✅ Should go to OAuth page (not installations)
   - Authorize
   - ✅ Should return to dashboard with "connected=true"

3. **Test across tabs:**
   - Connect GitHub
   - Open new tab
   - Check if GitHub still connected
   - ✅ Should show as connected

## If Issues Persist

Run this to restart with fresh state:
```bash
# Stop the server (Ctrl+C)

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

Then clear browser cookies again and try.

## Server Logs to Check

When you click "Connect GitHub", you should see:
```
=== OAUTH URL GENERATION ===
Client ID: Ov23liOVbpundEtB0Il0
Redirect URI: http://localhost:3000/api/github/callback
Generated OAuth URL: https://github.com/login/oauth/authorize?client_id=...
```

If you DON'T see these logs, the request isn't reaching the server properly.
