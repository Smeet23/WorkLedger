# Create New GitHub App - Complete Setup Guide

## Step 1: Create the GitHub App

1. **Go to**: https://github.com/settings/apps/new

2. **Fill in these EXACT values**:

---

### GitHub App name *
```
WorkLedger-App
```
(Must be globally unique - if taken, try: `WorkLedger-Skills-2025` or add your username)

---

### Description
```
Employee skill tracking and certificate generation platform
```

---

### Homepage URL *
```
https://e1e30fa67ce5.ngrok-free.app
```

---

### Callback URL
```
https://e1e30fa67ce5.ngrok-free.app/api/github/callback
```

---

### Setup URL (optional) **⚠️ CRITICAL - THIS IS THE FIX**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/app/install
```

✅ Check the box: **"Redirect on update"**

---

### Webhook

✅ Check: **"Active"**

**Webhook URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/webhooks
```

**Webhook secret:**
```
83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c
```

---

### Permissions

**Repository permissions:**
- **Contents**: Read-only
- **Metadata**: Read-only
- **Commit statuses**: Read-only

**Organization permissions:**
- **Members**: Read-only
- **Administration**: Read-only

---

### Subscribe to events

Check these:
- ✅ Push
- ✅ Repository
- ✅ Member
- ✅ Membership
- ✅ Installation
- ✅ Installation repositories

---

### Where can this GitHub App be installed?

Select: **⚪ Any account**

---

## Step 2: After Creating the App

After clicking "Create GitHub App", you'll be on the app settings page.

### 2.1 Note the App ID
You'll see something like:
```
App ID: 2116789
```
**COPY THIS NUMBER - YOU'LL NEED IT**

### 2.2 Generate Private Key

1. Scroll down to **"Private keys"** section
2. Click **"Generate a private key"**
3. A `.pem` file will download automatically
4. **SAVE THIS FILE** - you'll need it for the next step

### 2.3 Get Client ID and Client Secret

1. Scroll to **"Client secrets"** section
2. You'll see a **Client ID** - copy it
3. Click **"Generate a new client secret"**
4. **IMMEDIATELY COPY THE SECRET** - it won't be shown again!

---

## Step 3: Update Your .env File

Open your `.env` file and update these values:

```bash
# GitHub App Configuration
GITHUB_APP_ID="YOUR_NEW_APP_ID_HERE"
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-app"  # Or whatever name you chose

# GitHub App Private Key
# Open the .pem file you downloaded, copy EVERYTHING including headers
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END RSA PRIVATE KEY-----"

# GitHub OAuth (from Client ID and Secret)
GITHUB_CLIENT_ID="YOUR_CLIENT_ID_HERE"
GITHUB_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"

# Webhook Secret (use the same one from above)
GITHUB_WEBHOOK_SECRET="83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c"

# Your ngrok URL
APP_URL="https://e1e30fa67ce5.ngrok-free.app"
```

---

## Step 4: Restart Your Application

```bash
# Stop your dev server (Ctrl+C)

# Restart it
npm run dev
```

---

## Step 5: Test the Installation

1. Open: http://localhost:3000/dashboard/integrations/github

2. Click **"Install GitHub App"**

3. You'll be redirected to GitHub

4. Select your organization

5. Choose repositories (All or Select)

6. Click **"Install"**

7. **You should be redirected back to**: `/dashboard/integrations/github?installed=true`

8. You should see:
   - Installation status: Active
   - Your repositories syncing
   - Organization stats

---

## Troubleshooting

### If Private Key has issues in .env:

The private key must be on a single line with `\n` for newlines. To convert:

```bash
# In terminal, run this command with your .pem file:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ~/Downloads/your-app-name.pem
```

Copy the output and paste it in your .env like:
```bash
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----\n"
```

### If ngrok URL changes:

Every time you restart ngrok, the URL changes. You'll need to:
1. Update the `.env` APP_URL
2. Go to GitHub App settings: https://github.com/settings/apps/YOUR_APP_NAME
3. Update all 4 URLs (Homepage, Callback, Setup, Webhook)
4. Restart your dev server

### If installation still redirects to GitHub settings:

- Double-check the Setup URL is EXACTLY: `https://YOUR_NGROK_URL/api/github/app/install`
- Make sure you clicked "Save changes" in GitHub App settings
- Clear your browser cookies
- Try in an incognito window

---

## Important URLs Reference

After creating the app, your installation URL will be:
```
https://github.com/apps/YOUR_APP_NAME/installations/new
```

Your app's settings page:
```
https://github.com/settings/apps/YOUR_APP_NAME
```

---

## Quick Checklist

Before testing, verify:
- ✅ Setup URL points to `/api/github/app/install` (not `/setup` or `/dashboard/...`)
- ✅ All URLs use your ngrok URL (not localhost)
- ✅ Private key is properly formatted in .env
- ✅ App ID, Client ID, and Client Secret are updated in .env
- ✅ Dev server is restarted after .env changes
- ✅ Webhook is set to "Active"
- ✅ All required permissions are granted
- ✅ All required events are subscribed

---

## After Successful Installation

Once installed, you can:
1. View synced repositories in the dashboard
2. See organization members
3. Run auto-discovery to match GitHub users to employees
4. Generate skill profiles from commit history
5. Issue certificates to employees

---

## Production Deployment

When ready for production:
1. Deploy your app to a permanent URL (e.g., Vercel, Railway)
2. Update ALL URLs in GitHub App settings to use your production domain
3. Update `APP_URL` in production environment variables
4. Keep your private key and secrets secure (use environment secrets in your hosting platform)
