# Quick GitHub App Setup Guide

## TL;DR - The Key Understanding

**YOU (WorkLedger) create ONE GitHub App**
- This app belongs to WorkLedger (you)
- Credentials go in `.env` (one time)
- All companies install THIS SAME app on their GitHub orgs
- Each installation gets a unique `installation_id`
- WorkLedger uses your app credentials + their installation_id to generate access tokens
- Access tokens are stored per-company in database (encrypted)
- ✅ Complete multi-tenant isolation!

## 5-Minute Setup

### Step 1: Create GitHub App (5 minutes)

1. **Go to**: https://github.com/settings/apps/new

2. **Fill these fields**:

```
GitHub App name: workledger-skills
Description: Automatically track employee skills from code contributions

Homepage URL: http://localhost:3000
(Change to your production URL later: https://workledger.com)

Callback URL: http://localhost:3000/api/github/app/install
(Or use ngrok for local testing: https://abc123.ngrok.io/api/github/app/install)

Setup URL (optional): [leave empty]

Webhook URL: http://localhost:3000/api/github/webhooks
(Use ngrok for local webhooks: https://abc123.ngrok.io/api/github/webhooks)

Webhook secret: [generate random string, save it]
Example: openssl rand -hex 32
```

3. **Set Permissions**:

**Repository permissions**:
- ✅ Contents: **Read-only**
- ✅ Metadata: **Read-only** (auto-selected)
- ✅ Commit statuses: **Read-only**

**Organization permissions**:
- ✅ Members: **Read-only**

4. **Subscribe to events**:
- ✅ Push
- ✅ Repository
- ✅ Member
- ✅ Organization

5. **Where can this app be installed?**
- ✅ Select: **Any account** (allows all companies to install)

6. Click **"Create GitHub App"**

### Step 2: Get App ID & Generate Private Key

After creating the app:

1. **Copy App ID** (shown at top of settings page)
   - Example: `123456`

2. **Scroll to "Private keys" section**
   - Click **"Generate a private key"**
   - Download the `.pem` file

3. **Convert PEM to single line**:

```bash
# On macOS/Linux:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ~/Downloads/your-app-name.2025-10-05.private-key.pem

# On Windows (PowerShell):
(Get-Content ~/Downloads/your-app-name.2025-10-05.private-key.pem -Raw).Replace("`r`n", "\n").Replace("`n", "\\n")
```

This outputs something like:
```
-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...[long string]...\n-----END RSA PRIVATE KEY-----\n
```

**Copy this entire output** (including the `\\n` characters)

### Step 3: Update .env File

Open your `.env` file and update:

```bash
# GitHub App Configuration (WorkLedger's App - One Time Setup)
GITHUB_APP_ID="123456"  # Your app ID from step 2
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\nMIIEpAIBAAKCAQEA...\\n-----END RSA PRIVATE KEY-----\\n"  # Paste the converted key
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills"  # Your app slug from GitHub
GITHUB_WEBHOOK_SECRET="your-webhook-secret-from-step1"  # The secret you generated

# Keep existing OAuth credentials (optional, for user-level auth)
GITHUB_CLIENT_ID="Ov23liOVbpundEtB0Il0"  # Keep if you have it
GITHUB_CLIENT_SECRET="e803476e694e15b523caeb4c8998e86b19f4b124"  # Keep if you have it
```

### Step 4: Restart Your App

```bash
# Stop current dev server (Ctrl+C in terminal)
npm run dev
```

### Step 5: Test Installation

1. **Open**: http://localhost:3000
2. **Sign in** as company admin
3. **Navigate** to: Dashboard → Integrations → GitHub
4. **Click**: "Install GitHub App"
5. **You'll be redirected** to GitHub installation page
6. **Select** your test organization or personal account
7. **Choose** repositories (select "All repositories" for testing)
8. **Click** "Install"
9. **Redirected back** to WorkLedger
10. **See**: Installation status, organization name, installation ID

### Step 6: Test Features

After installation:

1. **Auto-Discovery**: Click "Run Auto-Discovery"
   - Should fetch all GitHub org members
   - Display matching suggestions

2. **Repository Sync**: Go to "Repositories" tab
   - Should show all accessible repos
   - Display sync status

3. **Skill Detection**: Go to "Skill Detection" tab
   - Should analyze commits
   - Display detected skills

## Testing with Ngrok (For Local Webhooks)

If you want to test webhooks locally:

```bash
# Install ngrok: https://ngrok.com/download

# Run ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# Update GitHub App settings:
# Callback URL: https://abc123.ngrok.io/api/github/app/install
# Webhook URL: https://abc123.ngrok.io/api/github/webhooks

# Keep your app running and ngrok running
```

Now when you push to a tracked repo, webhooks will work!

## Multi-Company Testing

To test multi-tenant isolation:

1. **Company A**:
   - Sign in as admin-a@companyA.com
   - Install GitHub App on Company A's GitHub org
   - Verify repos/skills are synced

2. **Company B**:
   - Sign in as admin-b@companyB.com
   - Install GitHub App on Company B's GitHub org
   - Verify repos/skills are synced

3. **Verify Isolation**:
   - Company A sees only their repos
   - Company B sees only their repos
   - Database has separate records per company

## Troubleshooting

### Error: "GitHub App not configured"
**Solution**: Make sure `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, and `NEXT_PUBLIC_GITHUB_APP_NAME` are in `.env` and restart server.

### Error: "Installation failed"
**Solution**:
- Check callback URL matches in GitHub App settings
- Verify app has correct permissions
- Check browser console for errors

### Error: "Cannot access organization"
**Solution**:
- Ensure app has "Organization → Members" read permission
- Verify you're installing on an organization (not personal account)

### Webhooks not working
**Solution**:
- Use ngrok for local testing
- Update webhook URL to ngrok HTTPS URL
- Check webhook secret matches
- Review webhook delivery logs in GitHub App settings

## Architecture Recap

```
┌─────────────────────────────────────┐
│   WorkLedger GitHub App             │
│   (YOU create this ONCE)            │
│                                     │
│   Credentials in .env:              │
│   - GITHUB_APP_ID                   │
│   - GITHUB_PRIVATE_KEY              │
│   - NEXT_PUBLIC_GITHUB_APP_NAME     │
└─────────────────────────────────────┘
                  ↓
         Companies install it
                  ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   Company A     │   Company B     │   Company C     │
│   installs app  │   installs app  │   installs app  │
│                 │                 │                 │
│   Gets:         │   Gets:         │   Gets:         │
│   install_id:   │   install_id:   │   install_id:   │
│   1001          │   1002          │   1003          │
│                 │                 │                 │
│   Saved in DB:  │   Saved in DB:  │   Saved in DB:  │
│   - install_id  │   - install_id  │   - install_id  │
│   - token       │   - token       │   - token       │
│     (encrypted) │     (encrypted) │     (encrypted) │
│   - companyId   │   - companyId   │   - companyId   │
└─────────────────┴─────────────────┴─────────────────┘
```

Each company's token is generated using:
- Your app's `APP_ID` + `PRIVATE_KEY` (from .env)
- Their `installation_id` (from database)
- Result: unique access token per company (stored encrypted)

## What Happens When Company Clicks "Install"?

1. **Frontend**: Redirects to `https://github.com/apps/workledger-skills/installations/new`
2. **GitHub**: Shows installation page, user selects org/repos
3. **GitHub**: Redirects to `http://localhost:3000/api/github/app/install?installation_id=1001`
4. **Backend**:
   - Receives installation_id
   - Uses your app credentials to generate access token
   - Encrypts token
   - Saves to database with companyId
5. **Auto-sync**:
   - Fetches repos using company's token
   - Fetches commits
   - Detects skills
   - Everything linked to that company

## Security Notes

- ✅ Your app credentials (APP_ID, PRIVATE_KEY) never exposed to companies
- ✅ Each company's access token encrypted in database
- ✅ Each company can only access their own data
- ✅ Tokens auto-refresh (GitHub handles expiration)
- ✅ Audit logs track all token operations

## Production Checklist

Before going to production:

- [ ] Update GitHub App URLs to production domain
- [ ] Enable HTTPS (required by GitHub)
- [ ] Set up proper webhook secret rotation
- [ ] Configure production database backups
- [ ] Set up monitoring for API rate limits
- [ ] Add error notifications (email/Slack)
- [ ] Test with multiple companies
- [ ] Verify data isolation
- [ ] Review security audit logs

## Need Help?

- **Architecture Questions**: Read `GITHUB-APP-ARCHITECTURE.md`
- **Testing Guide**: Read `TESTING-GITHUB.md`
- **API Issues**: Check Next.js server logs
- **GitHub Issues**: Check webhook delivery logs in app settings

---

**You're now ready to test!** 🚀

Just create the GitHub App, add credentials to `.env`, restart, and companies can install!
