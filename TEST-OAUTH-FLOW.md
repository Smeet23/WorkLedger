# Test OAuth Flow - Debugging Guide

## The Problem
You're being redirected to `https://github.com/settings/installations/88820411` instead of the OAuth authorize page.

## Root Cause
This happens when:
1. GitHub App ID is being used instead of OAuth App Client ID
2. Browser cache is redirecting you
3. You're clicking the wrong link

## Steps to Test Properly

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Login as Employee
1. Go to: http://localhost:3000/auth/signin?type=employee
2. Login with your employee credentials

### 3. Check the Connect Link
On the dashboard, **right-click** on "Connect GitHub Now" button and select "Copy Link Address"

It should be: `http://localhost:3000/api/github/connect?returnUrl=/employee/dashboard`

### 4. Test the Connect Endpoint
Open a new terminal and run:
```bash
# This will show what URL the server generates
curl -s "http://localhost:3000/api/github/connect?returnUrl=/employee/dashboard"  \
  -H "Cookie: $(cat .cookies)" \
  -L 2>&1 | grep -i "github"
```

### 5. Check Server Logs
When you click "Connect GitHub", check the terminal running `npm run dev` for these logs:
```
=== GITHUB CONNECT ===
Employee ID: xxx
=== OAUTH URL GENERATION ===
Client ID: Ov23liOVbpundEtB0Il0
Redirect URI: http://localhost:3000/api/github/callback
Generated OAuth URL: https://github.com/login/oauth/authorize?client_id=...
```

### 6. Expected OAuth URL
The URL should look like:
```
https://github.com/login/oauth/authorize
  ?client_id=Ov23liOVbpundEtB0Il0
  &redirect_uri=http://localhost:3000/api/github/callback
  &scope=repo%20user:email%20read:org
  &state=<random-token>
```

**NOT**:
```
https://github.com/apps/workledger-skills/installations/new
https://github.com/settings/installations/88820411
```

## If You're Still Getting GitHub App URLs

### Check 1: Verify Environment Variables
```bash
grep "GITHUB_CLIENT_ID" .env
```

Should output: `GITHUB_CLIENT_ID="Ov23liOVbpundEtB0Il0"`

**NOT**: `GITHUB_CLIENT_ID="2066886"` (this is the App ID)

### Check 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try connecting again

### Check 3: Test in Incognito Mode
1. Open incognito window
2. Login to your app
3. Try connecting GitHub
4. This eliminates browser cache issues

### Check 4: Verify You're Using the Right Route
The dashboard should use: `/api/github/connect` (employee OAuth)

**NOT**: `/api/github/app/install` (company GitHub App)

## Quick Debug Script

Run this to verify the OAuth URL is generated correctly:

```bash
# Save your session cookie
node -e "
const url = 'http://localhost:3000/api/github/connect?returnUrl=/employee/dashboard';
console.log('Testing:', url);
console.log('Expected to redirect to: https://github.com/login/oauth/authorize');
console.log('\\nNOT: https://github.com/apps/... or https://github.com/settings/installations/...');
"
```

## What Success Looks Like

1. Click "Connect GitHub"
2. Browser redirects to: `https://github.com/login/oauth/authorize?client_id=Ov23...`
3. GitHub shows OAuth consent screen (NOT App installation screen)
4. After authorizing, redirects back to `/api/github/callback`
5. Finally redirects to `/employee/dashboard?connected=true&synced=true`

## What Failure Looks Like

1. Click "Connect GitHub"
2. Browser redirects to: `https://github.com/settings/installations/88820411`
3. This is the **GitHub App** installation page (wrong!)

## If OAuth URL is Correct But Still Wrong Redirect

This means GitHub is redirecting based on cached session. Fix:

1. Logout from GitHub completely
2. Go to https://github.com/logout
3. Clear browser cache
4. Try again in incognito mode
