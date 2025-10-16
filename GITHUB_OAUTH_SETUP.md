# GitHub OAuth App Setup for WorkLedger

## Overview

WorkLedger uses **TWO** different GitHub authentication methods:

1. **GitHub App** (`workledger`) - For company/organization installations
   - Public URL: https://github.com/apps/workledger
   - Used for: Organization-wide repository access
   - Configured at: https://github.com/settings/apps/workledger

2. **GitHub OAuth App** - For individual employee connections
   - Client ID: `Iv23lipcW9WbXTQyDWgL`
   - Used for: Individual employee GitHub profiles
   - Configured at: https://github.com/settings/developers

---

## Current Ngrok URL
```
https://e1e30fa67ce5.ngrok-free.app
```

**Last Updated:** October 15, 2025

---

## Setup Instructions

### 1. Configure GitHub OAuth App (For Employee Connections)

This is the OAuth app used when employees click "Connect GitHub" on their dashboard.

**Go to:** https://github.com/settings/developers

1. Click on **"OAuth Apps"**
2. Find your OAuth App (Client ID: `Iv23lipcW9WbXTQyDWgL`)
3. Update the following settings:

**Homepage URL:**
```
https://e1e30fa67ce5.ngrok-free.app
```

**Authorization callback URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/callback
```

**Optional - Add localhost for local testing:**
```
http://localhost:3000/api/github/callback
```

4. Click **"Update application"**

---

### 2. Configure GitHub App (For Company/Organization Access)

This is the GitHub App used when companies install WorkLedger to their organization.

**Go to:** https://github.com/settings/apps/workledger

Update the following URLs:

**Homepage URL:**
```
https://e1e30fa67ce5.ngrok-free.app
```

**Callback URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/callback
```

**Webhook URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/webhooks
```

**Webhook Secret:** (already configured - don't change)
```
83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c
```

---

## Environment Variables Summary

Make sure your `.env` file has these values:

```bash
# App URLs
APP_URL="https://e1e30fa67ce5.ngrok-free.app"
NEXTAUTH_URL="https://e1e30fa67ce5.ngrok-free.app"

# GitHub OAuth App (for employee connections)
GITHUB_CLIENT_ID="Iv23lipcW9WbXTQyDWgL"
GITHUB_CLIENT_SECRET="e43af2982ce29fbb98fa4ae84f141fd0b69417af"

# GitHub App (for organization installations)
GITHUB_APP_ID="2116106"
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
[Your private key here]
-----END RSA PRIVATE KEY-----"
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills"
GITHUB_WEBHOOK_SECRET="83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c"
```

---

## Testing the Integration

### Test Employee OAuth Connection (Individual)

1. Start your dev server: `npm run dev`
2. Visit: `https://e1e30fa67ce5.ngrok-free.app`
3. Log in as an employee
4. Go to employee dashboard
5. Click "Connect GitHub" button
6. Should redirect to GitHub OAuth authorization page
7. After authorization, should redirect back to your app

**Expected flow:**
- Employee clicks "Connect GitHub"
- Redirects to: `/api/github/oauth/connect`
- Redirects to: `https://github.com/login/oauth/authorize?client_id=Iv23lipcW9WbXTQyDWgL&redirect_uri=https://e1e30fa67ce5.ngrok-free.app/api/github/callback`
- GitHub redirects back to: `/api/github/callback?code=XXX&state=YYY`
- App saves GitHub connection and shows success

### Test Company GitHub App Installation (Organization)

1. Visit: `https://github.com/apps/workledger/installations/new`
2. Select the organization to install to
3. Choose repositories (all or select repositories)
4. Click "Install"
5. Should receive webhook events at `/api/github/webhooks`

---

## Troubleshooting

### Error: "The redirect_uri is not associated with this application"

**Cause:** The OAuth callback URL is not registered in GitHub OAuth App settings.

**Solution:**
1. Go to: https://github.com/settings/developers
2. Click on your OAuth App
3. Add `https://e1e30fa67ce5.ngrok-free.app/api/github/callback` to Authorization callback URLs
4. Save changes

### Error: "Missing client_id or client_secret"

**Cause:** Environment variables not loaded correctly.

**Solution:**
1. Verify `.env` file has `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
2. Restart your dev server: `npm run dev`
3. Check server logs to confirm env vars are loaded

### Webhook not receiving events

**Cause:** Webhook URL not updated in GitHub App settings or webhook secret mismatch.

**Solution:**
1. Go to: https://github.com/settings/apps/workledger
2. Update Webhook URL to your current ngrok URL
3. Verify webhook secret matches your `.env` file
4. Check "Recent Deliveries" tab to see webhook delivery status

---

## Important Notes

1. **Ngrok URL Changes:** Free ngrok URLs change when you restart ngrok. You'll need to update both:
   - GitHub OAuth App callback URL
   - GitHub App webhook URL
   - `.env` file (`APP_URL` and `NEXTAUTH_URL`)

2. **Two Different Authentication Systems:**
   - **OAuth App:** For individual employee GitHub connections (personal repos, contributions)
   - **GitHub App:** For organization-wide installations (company repos, team access)

3. **For Production:** Replace all ngrok URLs with your production domain (e.g., `https://workledger.vercel.app`)

---

## Quick Reference

| Purpose | Where to Configure | Callback URL |
|---------|-------------------|--------------|
| Employee OAuth | https://github.com/settings/developers | `/api/github/callback` |
| Company GitHub App | https://github.com/settings/apps/workledger | `/api/github/callback` |
| GitHub App Webhooks | https://github.com/settings/apps/workledger | `/api/github/webhooks` |

---

**Next Step:** Update both GitHub OAuth App and GitHub App settings with your current ngrok URL!
