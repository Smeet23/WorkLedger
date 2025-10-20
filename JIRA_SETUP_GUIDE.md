# Jira Integration Setup Guide

Complete guide to setting up Jira/Atlassian integration with WorkLedger.

---

## 📋 Prerequisites

- An Atlassian account (Jira Cloud)
- Admin access to your Atlassian organization
- WorkLedger admin account

---

## 🔧 Step 1: Create Atlassian OAuth 2.0 App

### 1.1 Access Developer Console

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **"Create"** → **"OAuth 2.0 integration"**

### 1.2 Configure Basic Information

Fill in your app details:

```
App name: WorkLedger
Company name: [Your Company Name]
App description: Employee skills tracking and digital certificates
Privacy policy URL: https://your-domain.com/privacy (optional)
Support URL: https://your-domain.com/support (optional)
```

Click **"Create"**

---

## 🔐 Step 2: Configure OAuth Settings

### 2.1 Set Callback URL

In the **"Authorization"** tab:

1. Click **"Add"** next to **"Callback URL"**
2. Enter your callback URL:

```
https://your-domain.com/api/jira/callback
```

For local development:
```
http://localhost:3000/api/jira/callback
```

3. Click **"Save changes"**

### 2.2 Configure Permissions

In the **"Permissions"** tab, add these scopes:

#### User Scopes:
```
read:me                    - Read current user info
```

#### App Scopes (Jira):
```
read:jira-work             - Read project and issue data
read:jira-user             - Read user information
write:jira-work            - Create/update issues (optional)
offline_access             - Get refresh token
```

Click **"Save changes"**

---

## 🎫 Step 3: Get Your Credentials

1. In the **"Settings"** tab, find **"Client ID"** and **"Secret"**

2. Copy both values

3. Add them to your `.env` file:

```bash
# Jira/Atlassian Integration
JIRA_CLIENT_ID="your-client-id-here"
JIRA_CLIENT_SECRET="your-secret-here"
ENCRYPTION_KEY="generate-a-32-character-random-string-here"
```

**To generate an encryption key:**
```bash
openssl rand -base64 24
```

---

## 🪝 Step 4: Setup Webhooks (Real-time Updates)

### 4.1 Register Webhook

1. In Atlassian Developer Console, go to your app
2. Navigate to **"Webhooks"** tab
3. Click **"Create webhook"**

### 4.2 Configure Webhook

```
Webhook name: WorkLedger Sync
Status: Enabled
URL: https://your-domain.com/api/jira/webhooks
```

### 4.3 Subscribe to Events

Select these events:

**Issue Events:**
```
✓ Issue created (jira:issue_created)
✓ Issue updated (jira:issue_updated)
✓ Issue deleted (jira:issue_deleted)
```

**Worklog Events:**
```
✓ Worklog created (jira:worklog_created)
✓ Worklog updated (jira:worklog_updated)
```

**Comment Events:**
```
✓ Comment created (comment_created)
✓ Comment updated (comment_updated)
```

Click **"Create"**

---

## 📦 Step 5: Install App to Your Site

### 5.1 Install to Jira

1. In Developer Console, go to your app
2. Click **"Distribution"** tab
3. Click **"Install app"**
4. Select your Jira site
5. Review permissions
6. Click **"Accept"**

The app is now installed! ✅

---

## 🧪 Step 6: Test the Integration

### 6.1 Start Your Application

```bash
npm run dev
```

### 6.2 Connect Jira

1. Open WorkLedger in your browser
2. Navigate to **Dashboard → Integrations**
3. Find the **Jira Integration Card**
4. Click **"Connect Jira Workspace"**
5. You'll be redirected to Atlassian for authorization
6. Select your Jira site
7. Click **"Accept"** to grant permissions
8. You'll be redirected back to WorkLedger

### 6.3 Verify Connection

You should see:
- ✅ **Connected** badge
- Jira site name and URL displayed
- Project count, user count, issue count
- Last sync timestamp

### 6.4 Test Manual Sync

Click the **"Sync Now"** button to manually sync workspace data.

---

## 🔍 Step 7: Verify Data is Syncing

### Check Database

```bash
# Run Prisma Studio
npx prisma studio
```

Navigate to these models to verify data:
- `JiraIntegration` - Your Jira connection
- `JiraProject` - Projects from your Jira site
- `JiraUser` - Users with employee matching
- `JiraIssue` - Issues with full details
- `JiraWorklog` - Time tracking entries
- `JiraComment` - Comments and discussions

---

## 🔄 How It Works

### OAuth Flow

```
1. User clicks "Connect Jira"
   ↓
2. Redirected to Atlassian authorization
   ↓
3. User grants permissions
   ↓
4. Redirected back with authorization code
   ↓
5. Exchange code for access token
   ↓
6. Get accessible Jira sites
   ↓
7. Store integration with encrypted tokens
   ↓
8. Auto-sync projects, users, and issues
```

### Data Sync

```
Projects → Users → Issues → Comments → Worklogs
```

**Initial Sync:** Last 90 days of issues
**Incremental:** Webhooks for real-time updates

---

## 📊 What Gets Tracked

### For Each Employee:

**Project Management:**
- Issues created (stories, tasks, bugs)
- Issues assigned and completed
- Average resolution time
- Story points delivered

**Time Management:**
- Time logged vs estimated
- Accuracy of estimates
- Work distribution

**Collaboration:**
- Comments posted
- Issues reviewed/updated
- Cross-team collaboration

**Quality:**
- Bug creation vs fixes
- Issue reopening rate
- Overdue task frequency

---

## ⚙️ Configuration Options

### Sync Frequency

By default, manual sync only. To enable auto-sync, you can:

1. Set up a cron job to call `/api/jira/sync`
2. Use Vercel Cron (add to `vercel.json`):

```json
{
  "crons": [{
    "path": "/api/jira/sync",
    "schedule": "0 */6 * * *"
  }]
}
```

This runs every 6 hours.

### Webhook Security

To verify webhook signatures (optional):

1. Get the webhook secret from Atlassian Console
2. Add to `.env`:
```bash
JIRA_WEBHOOK_SECRET="your-webhook-secret"
```

3. Verify signature in webhook handler

---

## 🚨 Troubleshooting

### "No Jira Sites Found"

**Problem:** After OAuth, you see "no_jira_sites" error

**Solution:**
- Verify you have access to a Jira Cloud site
- Check that the app is installed on your site
- Ensure you're using the correct Atlassian account

### "Unauthorized" Errors

**Problem:** API calls fail with 401

**Solution:**
- Check that `JIRA_CLIENT_ID` and `JIRA_CLIENT_SECRET` are correct
- Verify tokens haven't expired (refresh token flow needed)
- Ensure app has correct permissions

### Issues Not Syncing

**Problem:** Manual sync completes but no issues appear

**Solution:**
- Check that issues exist in last 90 days
- Verify projects aren't archived
- Check console for JQL query errors
- Ensure bot has access to projects

### Webhooks Not Working

**Problem:** Real-time updates not appearing

**Solution:**
- Verify webhook URL is publicly accessible
- Check webhook is enabled in Atlassian Console
- Review webhook delivery logs in Console
- Ensure correct events are subscribed

---

## 🔒 Security Best Practices

1. **Use Environment Variables**
   - Never commit credentials to git
   - Use strong encryption keys
   - Rotate secrets periodically

2. **Token Storage**
   - Tokens are encrypted with AES-256-GCM
   - Store encryption key securely
   - Use different keys for dev/prod

3. **Webhook Verification**
   - Implement signature verification
   - Validate incoming data
   - Rate limit webhook endpoint

4. **Access Control**
   - Only admins can connect/disconnect
   - Audit integration access
   - Monitor API usage

---

## 📈 Next Steps

Once integration is working:

1. **Review Synced Data**
   - Check employee matching accuracy
   - Verify project assignments
   - Review issue statistics

2. **Configure Insights**
   - Set up dashboards
   - Create custom reports
   - Generate certificates

3. **Train Team**
   - Explain what's tracked
   - Show how to view insights
   - Demonstrate certificate generation

---

## 🆘 Getting Help

- **Documentation:** [Atlassian OAuth Docs](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- **API Reference:** [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- **Issues:** Report bugs in WorkLedger repository

---

## ✅ Checklist

Before going live:

- [ ] OAuth app created in Atlassian Console
- [ ] Callback URL configured correctly
- [ ] Required permissions/scopes added
- [ ] Environment variables set in `.env`
- [ ] Encryption key generated and stored
- [ ] Webhooks configured with correct events
- [ ] App installed to Jira site
- [ ] Test connection successful
- [ ] Manual sync working
- [ ] Data appearing in database
- [ ] Webhooks delivering events
- [ ] Employee matching verified

---

**You're all set! 🎉**

Your Jira integration is ready to track project management skills and generate comprehensive work insights.
