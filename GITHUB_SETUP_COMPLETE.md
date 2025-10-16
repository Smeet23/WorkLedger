# GitHub Integration - Complete Setup Guide

## Overview

WorkLedger now uses a **unified GitHub App** for all authentication:
- ✅ Company/Organization installations
- ✅ Employee personal connections (OAuth)
- ✅ Webhooks for real-time updates

**No more dual OAuth Apps!** Everything is handled by one GitHub App: **workledger**

---

## Current Configuration

### GitHub App Details

| Setting | Value |
|---------|-------|
| **App Name** | workledger |
| **App ID** | 2116106 |
| **Public URL** | https://github.com/apps/workledger |
| **Client ID** | Iv23BeoVWPXKTQyDWgL |
| **Owner** | @Smeet23 |

### Environment Configuration

**Ngrok URL:** `https://e1e30fa67ce5.ngrok-free.app`

**Environment Variables (.env):**
```bash
# App URLs
APP_URL="https://e1e30fa67ce5.ngrok-free.app"
NEXTAUTH_URL="https://e1e30fa67ce5.ngrok-free.app"

# GitHub App - Unified Authentication
GITHUB_APP_ID="2116106"
GITHUB_PRIVATE_KEY="<configured>"
GITHUB_WEBHOOK_SECRET="83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c"
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills"

# GitHub App OAuth (same app, OAuth flow)
GITHUB_CLIENT_ID="Iv23BeoVWPXKTQyDWgL"
GITHUB_CLIENT_SECRET="<configured>"
```

### GitHub App URLs (Configured)

| Purpose | URL |
|---------|-----|
| Homepage | https://e1e30fa67ce5.ngrok-free.app |
| Callback | https://e1e30fa67ce5.ngrok-free.app/api/github/callback |
| Setup (optional) | https://e1e30fa67ce5.ngrok-free.app/dashboard/integrations/github/setup-complete |
| Webhook | https://e1e30fa67ce5.ngrok-free.app/api/github/webhooks |

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           GitHub App: workledger                    │
│                                                     │
│  Two Authentication Methods (Same App):             │
│                                                     │
│  1. App Installation (Companies)                   │
│     - Uses: App ID + Private Key                   │
│     - Generates: Installation Tokens (1hr expiry)  │
│     - Access: All organization repositories        │
│                                                     │
│  2. OAuth (Employees)                              │
│     - Uses: Client ID + Client Secret              │
│     - Generates: OAuth Access Tokens               │
│     - Access: Personal repositories                │
└─────────────────────────────────────────────────────┘
```

### For Companies (Organization Installation)

**Flow:**
1. Company admin clicks "Install GitHub App"
2. Redirects to: `https://github.com/apps/workledger/installations/new`
3. Admin selects organization and repositories
4. GitHub redirects to: `/api/github/app/install?installation_id=XXX`
5. WorkLedger stores installation and syncs repositories

**API Endpoints:**
- `POST /api/github/app/install` - Initiate installation
- `GET /api/github/app/install` - Handle callback
- `GET /api/github/installation/status` - Check installation status

### For Employees (Personal OAuth Connection)

**Flow:**
1. Employee clicks "Connect GitHub"
2. Redirects to: `/api/github/oauth/connect`
3. App generates OAuth URL with GitHub App Client ID
4. Redirects to: `https://github.com/login/oauth/authorize?client_id=Iv23BeoVWPXKTQyDWgL`
5. Employee authorizes
6. GitHub redirects to: `/api/github/callback?code=XXX`
7. WorkLedger exchanges code for token and stores connection

**API Endpoints:**
- `GET /api/github/oauth/connect` - Initiate OAuth
- `GET /api/github/connect` - Alternative OAuth initiation
- `GET /api/github/callback` - Handle OAuth callback

---

## Testing the Integration

### Test 1: Company Installation

**Steps:**
1. Start dev server: `npm run dev`
2. Visit: `https://e1e30fa67ce5.ngrok-free.app`
3. Log in as company admin
4. Navigate to: Settings → Integrations → GitHub
5. Click "Install GitHub App"
6. Select organization
7. Choose repositories (all or select)
8. Click "Install"

**Expected Result:**
- Installation stored in database
- Organization repositories synced
- Webhooks configured
- Success page displayed

**Verify:**
```bash
# Check database
psql workledger_db -c "SELECT * FROM github_installations;"

# Check logs
# Server console should show:
# ✓ GitHub App installation completed
# ✓ Organization repositories synced
```

### Test 2: Employee OAuth Connection

**Steps:**
1. Log in as employee (not admin)
2. Navigate to: Employee Dashboard
3. Click "Connect GitHub" button
4. Authorize on GitHub OAuth page
5. Redirected back to dashboard

**Expected Result:**
- Connection stored in database
- GitHub username displayed
- Personal repositories accessible
- Skills begin syncing

**Verify:**
```bash
# Check database
psql workledger_db -c "SELECT * FROM github_connections;"

# Check logs
# Server console should show:
# ✓ GitHub OAuth connection saved
# ✓ Employee repositories synced
```

### Test 3: Webhooks

**Trigger webhook:**
1. Make a commit to a connected repository
2. Push to GitHub

**Expected Result:**
- Webhook received at `/api/github/webhooks`
- Repository updated in database
- Contributions re-synced

**Verify:**
```bash
# Check webhook deliveries in GitHub
# Go to: https://github.com/settings/apps/workledger
# Click: Advanced → Recent Deliveries
# Should see successful deliveries
```

---

## API Routes Summary

### Company Installation Routes

```typescript
// Initiate installation
POST /api/github/app/install
Response: { installationUrl, state, instructions }

// Handle installation callback
GET /api/github/app/install?installation_id=XXX
Redirect: /dashboard/integrations/github/setup-complete

// Check installation status
GET /api/github/installation/status
Response: { installed: boolean, installation: {...} }
```

### Employee OAuth Routes

```typescript
// Initiate OAuth (primary)
GET /api/github/oauth/connect?returnUrl=/employee/dashboard
Redirect: https://github.com/login/oauth/authorize

// Initiate OAuth (alternative)
GET /api/github/connect?returnUrl=/employee/dashboard
Redirect: https://github.com/login/oauth/authorize

// OAuth callback
GET /api/github/callback?code=XXX&state=YYY
Redirect: /employee/dashboard (with success message)
```

### Webhook Route

```typescript
// Receive GitHub webhooks
POST /api/github/webhooks
Events: push, repository, member, membership, installation
```

### Sync Routes

```typescript
// Manual sync for employee
POST /api/github/sync
Body: { employeeId }
Response: { repositories, commits, skills }

// Check sync status
GET /api/github/status
Response: { connected, lastSync, syncStatus }
```

---

## Troubleshooting

### Issue 1: "redirect_uri not associated with application"

**Cause:** Callback URL not configured in GitHub App settings.

**Solution:**
1. Go to: https://github.com/settings/apps/workledger
2. Scroll to "Identifying and authorizing users"
3. Ensure Callback URL is: `https://e1e30fa67ce5.ngrok-free.app/api/github/callback`
4. Save changes

### Issue 2: "Installation not found"

**Cause:** Company hasn't installed the GitHub App yet.

**Solution:**
1. Company admin must install the app first
2. Direct them to: `https://github.com/apps/workledger/installations/new`
3. Or use the "Install GitHub App" button in dashboard

### Issue 3: Webhooks not received

**Cause:** Webhook URL incorrect or webhook secret mismatch.

**Solution:**
1. Verify webhook URL in GitHub App settings
2. Check webhook secret matches `.env` file
3. View "Recent Deliveries" in GitHub App settings for errors

### Issue 4: "Invalid client credentials"

**Cause:** Client ID or Client Secret incorrect in `.env`.

**Solution:**
1. Verify `GITHUB_CLIENT_ID` matches GitHub App Client ID
2. Verify `GITHUB_CLIENT_SECRET` is correct
3. Restart dev server after changing `.env`

### Issue 5: Employee OAuth fails

**Cause:** OAuth not enabled in GitHub App settings.

**Solution:**
1. Go to: https://github.com/settings/apps/workledger
2. Scroll to "Identifying and authorizing users"
3. Check "Request user authorization (OAuth) during installation"
4. Ensure callback URL is configured
5. Save changes

---

## Updating Ngrok URL

When ngrok URL changes (after restart):

### Step 1: Update .env
```bash
APP_URL="https://NEW_NGROK_URL.ngrok-free.app"
NEXTAUTH_URL="https://NEW_NGROK_URL.ngrok-free.app"
```

### Step 2: Update GitHub App Settings
Go to: https://github.com/settings/apps/workledger

Update:
- Homepage URL
- Callback URL
- Webhook URL

### Step 3: Restart Dev Server
```bash
npm run dev
```

---

## Production Deployment

When deploying to production (e.g., Vercel):

### Step 1: Update .env.production
```bash
APP_URL="https://workledger.vercel.app"
NEXTAUTH_URL="https://workledger.vercel.app"

# Keep same GitHub App credentials
GITHUB_APP_ID="2116106"
GITHUB_CLIENT_ID="Iv23BeoVWPXKTQyDWgL"
# ... other credentials
```

### Step 2: Update GitHub App URLs
Update all URLs to production domain:
- Homepage: `https://workledger.vercel.app`
- Callback: `https://workledger.vercel.app/api/github/callback`
- Webhook: `https://workledger.vercel.app/api/github/webhooks`

### Step 3: Deploy
```bash
vercel deploy --prod
```

---

## Benefits of Unified GitHub App

### Before (Dual Apps)
- ❌ Two apps to maintain
- ❌ Two sets of credentials
- ❌ Callback URLs in two places
- ❌ Confusing for developers
- ❌ Lower rate limits for OAuth

### After (Single GitHub App)
- ✅ One app for everything
- ✅ One set of credentials (plus OAuth)
- ✅ Single configuration point
- ✅ Clear architecture
- ✅ Higher rate limits (15k/hour per installation)
- ✅ Better security (installation tokens auto-expire)
- ✅ Unified user experience

---

## Support & Resources

### Documentation
- GitHub Apps: https://docs.github.com/en/apps
- OAuth Apps: https://docs.github.com/en/apps/oauth-apps
- Webhooks: https://docs.github.com/en/webhooks

### Your GitHub App
- Settings: https://github.com/settings/apps/workledger
- Public Page: https://github.com/apps/workledger
- Install: https://github.com/apps/workledger/installations/new

### Logs & Debugging
```bash
# View server logs
npm run dev

# Check webhook deliveries
# GitHub App Settings → Advanced → Recent Deliveries

# Database queries
psql workledger_db

# Check installations
SELECT * FROM github_installations;

# Check employee connections
SELECT * FROM github_connections;
```

---

## Next Steps

1. ✅ Configuration complete
2. ✅ GitHub App OAuth enabled
3. ✅ URLs configured
4. ⏳ Test company installation
5. ⏳ Test employee OAuth
6. ⏳ Verify webhooks working
7. ⏳ Deploy to production

---

**Setup completed on:** October 15, 2025
**Ngrok URL:** https://e1e30fa67ce5.ngrok-free.app
**GitHub App:** workledger (ID: 2116106)

**Status:** ✅ Ready for testing!
