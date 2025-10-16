# GitHub App Unified Implementation Plan

## Overview

Migrate from dual authentication (GitHub OAuth App + GitHub App) to a single **GitHub App** that handles both:
1. **Company/Organization installations** (existing)
2. **Employee personal connections** (new implementation)

## Benefits

- Single app to maintain and configure
- Better security with installation tokens
- Higher rate limits (15,000 req/hour per installation vs 5,000/hour for OAuth)
- Unified user experience
- Simpler codebase

---

## Current State

### What We Have:
1. **GitHub App** (`workledger`)
   - App ID: `2116106`
   - Public URL: https://github.com/apps/workledger
   - Private Key: Configured
   - Webhook Secret: Configured
   - **Used for:** Company installations

2. **Standalone OAuth App** (TO BE REMOVED)
   - Client ID: `Iv23lipcW9WbXTQyDWgL`
   - **Used for:** Employee personal connections
   - **Problem:** Redundant, will be replaced

### What GitHub App Provides:
- App Installation authentication (for organizations)
- OAuth authentication (for personal connections) - **NOT YET CONFIGURED**
- Webhooks
- Fine-grained permissions

---

## Implementation Steps

### Step 1: Get GitHub App OAuth Credentials

GitHub Apps have built-in OAuth capabilities. Get these credentials:

1. Go to: https://github.com/settings/apps/workledger
2. Scroll to **"Client secrets"** section
3. Note the **Client ID** (different from App ID)
4. Generate a new **Client Secret** (if not already done)

**Expected format:**
```
Client ID: Iv1.xxxxxxxxxxxxxxxx (starts with Iv1)
Client Secret: ghs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Update Environment Variables

Replace the old OAuth App credentials with GitHub App OAuth credentials:

**Before (.env):**
```bash
# Old OAuth App (to be removed)
GITHUB_CLIENT_ID="Iv23lipcW9WbXTQyDWgL"
GITHUB_CLIENT_SECRET="e43af2982ce29fbb98fa4ae84f141fd0b69417af"
```

**After (.env):**
```bash
# GitHub App OAuth (new)
GITHUB_CLIENT_ID="<GitHub App Client ID from Step 1>"
GITHUB_CLIENT_SECRET="<GitHub App Client Secret from Step 1>"
```

### Step 3: Update GitHub App Settings

Configure the GitHub App with correct URLs:

**Go to:** https://github.com/settings/apps/workledger

#### General Settings:

**Homepage URL:**
```
https://e1e30fa67ce5.ngrok-free.app
```

**Callback URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/callback
```

**Setup URL (optional):**
```
https://e1e30fa67ce5.ngrok-free.app/dashboard/integrations/github/setup-complete
```

**Webhook URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/webhooks
```

**Webhook Secret:** (keep existing)
```
83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c
```

#### Permissions (verify these are set):

**Repository permissions:**
- Contents: Read-only
- Metadata: Read-only
- Commit statuses: Read-only

**Organization permissions:**
- Members: Read-only
- Administration: Read-only

**User permissions:**
- Email addresses: Read-only

**Subscribe to events:**
- Push
- Repository
- Member
- Membership
- Installation
- Installation repositories

### Step 4: Code Changes

#### 4.1 Update GitHub Service Client

**File:** `src/services/github/client.ts`

Key changes:
- OAuth URL will now use GitHub App's OAuth flow
- Token exchange remains the same (GitHub App OAuth uses same endpoints)
- Update OAuth URL to include `app` parameter for GitHub App identification

#### 4.2 Update OAuth Connection Routes

**Files to update:**
- `src/app/api/github/connect/route.ts` - Employee OAuth initiation
- `src/app/api/github/oauth/connect/route.ts` - Alternative OAuth route
- `src/app/api/github/callback/route.ts` - OAuth callback handler

#### 4.3 Enhanced GitHub Service

**File:** `src/services/github/enhanced-client.ts`

Already handles both:
- `getCompanyClient()` - Uses App installation tokens
- `getEmployeeClient()` - Uses OAuth tokens (no change needed)

### Step 5: Update Installation Flows

#### For Companies (Organization Installation):

```
Flow:
1. Company Admin clicks "Install GitHub App"
2. Redirects to: https://github.com/apps/workledger/installations/new
3. Admin selects organization and repositories
4. GitHub redirects back to: /api/github/app/install?installation_id=XXX
5. Store installation in database
6. Sync organization repositories
```

**Files:**
- `src/app/api/github/app/install/route.ts` (already implemented)

#### For Employees (Personal Connection):

```
Flow:
1. Employee clicks "Connect GitHub"
2. App generates OAuth URL with GitHub App Client ID
3. Redirects to: https://github.com/login/oauth/authorize?client_id=<App Client ID>
4. Employee authorizes
5. GitHub redirects back to: /api/github/callback?code=XXX
6. Exchange code for token
7. Store connection in database
8. Sync personal repositories
```

**Files:**
- `src/app/api/github/oauth/connect/route.ts`
- `src/app/api/github/callback/route.ts`

---

## Code Implementation Details

### Update OAuth URL Generation

**File:** `src/services/github/client.ts:21-34`

**Current:**
```typescript
static getOAuthUrl(state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'}/api/github/callback`
  const scope = 'repo user:email read:org'

  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`
}
```

**No changes needed!** GitHub App OAuth uses the same endpoints. Just ensure the Client ID is from the GitHub App.

### Token Exchange

**File:** `src/services/github/client.ts:36-57`

**Current implementation is correct.** GitHub App OAuth uses the same token exchange endpoint as standalone OAuth apps.

### Installation Token Management

**File:** `src/services/github/enhanced-client.ts`

Already correctly handles:
- Company installation tokens (1-hour expiry, auto-refresh)
- Employee OAuth tokens (long-lived)

---

## Testing Plan

### Test 1: Company Installation

1. Log in as company admin
2. Go to integrations page
3. Click "Install GitHub App"
4. Select organization
5. Verify:
   - Installation stored in database
   - Organization repos synced
   - Webhooks working

### Test 2: Employee OAuth Connection

1. Log in as employee
2. Go to employee dashboard
3. Click "Connect GitHub"
4. Authorize app
5. Verify:
   - Connection stored in database
   - Personal repos synced
   - Skills detected

### Test 3: Employee Personal Installation

Employees can also install the GitHub App personally:

1. Employee visits: https://github.com/apps/workledger
2. Clicks "Install"
3. Selects personal account
4. Chooses repositories
5. Same as company installation, but for personal account

---

## Migration Checklist

- [ ] Get GitHub App OAuth Client ID
- [ ] Generate GitHub App OAuth Client Secret
- [ ] Update `.env` with new credentials
- [ ] Update GitHub App callback URL
- [ ] Update GitHub App webhook URL
- [ ] Restart dev server
- [ ] Test company installation
- [ ] Test employee OAuth connection
- [ ] Update documentation
- [ ] Delete old OAuth App (optional, after testing)

---

## Configuration Summary

### Environment Variables

```bash
# App URLs
APP_URL="https://e1e30fa67ce5.ngrok-free.app"
NEXTAUTH_URL="https://e1e30fa67ce5.ngrok-free.app"

# GitHub App (unified)
GITHUB_APP_ID="2116106"
GITHUB_PRIVATE_KEY="<your private key>"
GITHUB_WEBHOOK_SECRET="83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c"
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills"

# GitHub App OAuth (NEW - from GitHub App settings)
GITHUB_CLIENT_ID="<GitHub App Client ID - starts with Iv1>"
GITHUB_CLIENT_SECRET="<GitHub App Client Secret>"
```

### GitHub App Settings URLs

| Setting | URL |
|---------|-----|
| Homepage | `https://e1e30fa67ce5.ngrok-free.app` |
| Callback | `https://e1e30fa67ce5.ngrok-free.app/api/github/callback` |
| Webhook | `https://e1e30fa67ce5.ngrok-free.app/api/github/webhooks` |

---

## Post-Implementation

### Optional: Delete Old OAuth App

Once everything is working:

1. Go to: https://github.com/settings/developers
2. Find OAuth App with Client ID: `Iv23lipcW9WbXTQyDWgL`
3. Delete it

### Update Production

When deploying to production:

1. Replace ngrok URLs with production URLs
2. Update GitHub App settings with production URLs
3. Update `.env.production` with GitHub App credentials

---

## Troubleshooting

### Error: "redirect_uri not associated with application"

**Solution:** Ensure callback URL is added in GitHub App settings (not OAuth App settings).

### Error: "Installation not found"

**Solution:** Company needs to install the GitHub App first. Direct them to:
```
https://github.com/apps/workledger/installations/new
```

### Webhooks not received

**Solution:**
1. Check webhook URL in GitHub App settings
2. Verify webhook secret matches
3. Check "Recent Deliveries" in GitHub App settings

---

## Next Steps

1. Get GitHub App OAuth credentials (Step 1)
2. Update `.env` file (Step 2)
3. Update GitHub App settings (Step 3)
4. Test both flows (company + employee)
5. Update documentation
6. Deploy to production

---

**Ready to implement!**
