# 🚀 Slack Integration Setup Guide

This guide will walk you through setting up Slack integration for WorkLedger.

---

## 📋 Prerequisites

- Admin access to your Slack workspace
- WorkLedger backend running (locally or deployed)
- ngrok or similar tunnel for local development (if testing locally)

---

## 🔧 Step 1: Create a Slack App

1. **Go to Slack API Portal**
   - Visit: https://api.slack.com/apps
   - Click **"Create New App"**

2. **Choose "From scratch"**
   - **App Name**: `WorkLedger` (or your preferred name)
   - **Workspace**: Select your workspace
   - Click **"Create App"**

---

## 🔐 Step 2: Configure OAuth & Permissions

### 2.1 Bot Token Scopes

Navigate to **"OAuth & Permissions"** in the sidebar, then scroll to **"Scopes"**.

Add these **Bot Token Scopes**:

```
channels:history       - View messages in public channels
channels:read          - View basic channel information
groups:history         - View messages in private channels
groups:read            - View basic private channel information
users:read             - View people in workspace
users:read.email       - View email addresses of people in workspace
team:read              - View workspace information
chat:write             - Send messages as the bot
```

### 2.2 User Token Scopes

Add these **User Token Scopes**:

```
users:read             - View people in workspace
users:read.email       - View email addresses
channels:read          - View basic channel information
groups:read            - View basic private channel information
im:read                - View direct messages
mpim:read              - View group direct messages
```

### 2.3 Redirect URLs

In the **"Redirect URLs"** section, add:

**For Local Development:**
```
http://localhost:3000/api/slack/callback
```

**For Production** (replace with your domain):
```
https://your-domain.com/api/slack/callback
```

**For ngrok** (if using):
```
https://your-ngrok-url.ngrok-free.app/api/slack/callback
```

Click **"Save URLs"**

---

## 🎯 Step 3: Enable Event Subscriptions

1. Navigate to **"Event Subscriptions"** in the sidebar
2. Toggle **"Enable Events"** to **ON**

### 3.1 Request URL

Enter your webhook URL:

**Local Development (ngrok):**
```
https://your-ngrok-url.ngrok-free.app/api/slack/webhooks
```

**Production:**
```
https://your-domain.com/api/slack/webhooks
```

Slack will send a verification request. Your API should respond with the `challenge` parameter.

### 3.2 Subscribe to Bot Events

Add these events:

```
message.channels       - A message was posted to a channel
message.groups         - A message was posted to a private channel
user_change            - A user's profile information changed
channel_created        - A channel was created
channel_rename         - A channel was renamed
channel_archive        - A channel was archived
channel_unarchive      - A channel was unarchived
team_join              - A new member joined the workspace
```

Click **"Save Changes"**

---

## 🔑 Step 4: Get Your Credentials

1. Navigate to **"Basic Information"** in the sidebar

2. Scroll to **"App Credentials"**

3. Copy the following values:

   - **Client ID**
   - **Client Secret**
   - **Signing Secret**

4. Add them to your `.env` file:

```bash
# Slack Integration
SLACK_CLIENT_ID="1234567890.1234567890123"
SLACK_CLIENT_SECRET="abc123def456ghi789jkl012mno345pq"
SLACK_SIGNING_SECRET="xyz789uvw456rst123opq890lmn567ijk"
```

---

## 📦 Step 5: Install App to Workspace

1. Navigate to **"Install App"** in the sidebar
2. Click **"Install to Workspace"**
3. Review permissions
4. Click **"Allow"**

The app is now installed! ✅

---

## 🧪 Step 6: Test the Integration

### 6.1 Start Your Application

```bash
npm run dev
```

### 6.2 Connect Slack

1. Open WorkLedger in your browser
2. Navigate to **Dashboard > Integrations**
3. Find the **Slack Integration Card**
4. Click **"Connect Slack Workspace"**
5. You'll be redirected to Slack for authorization
6. Click **"Allow"**
7. You'll be redirected back to WorkLedger

### 6.3 Verify Connection

You should see:
- ✅ **Connected** badge
- Workspace name displayed
- User count, channel count
- Message statistics

### 6.4 Test Manual Sync

Click the **"Sync Now"** button to manually sync workspace data.

---

## 🔍 Step 7: Verify Data is Syncing

### Check Database

```bash
# Run the Prisma Studio
npx prisma studio
```

Navigate to the following models to verify data:
- `SlackIntegration` - Your workspace connection
- `SlackWorkspace` - Workspace details
- `SlackUser` - Workspace members
- `SlackChannel` - Channels
- `SlackMessage` - Aggregated message data (no content!)

### Check Logs

Watch your console for log messages:
```
✅ Workspace synced: YourWorkspaceName
✅ Synced 42 users (38 matched to employees)
✅ Synced 25 channels
✅ Synced and aggregated messages (1,234 total)
```

---

## 🎨 Step 8: Add to Dashboard (Optional)

If you want to display the Slack integration card on your dashboard:

### Edit your dashboard page

**File:** `src/app/dashboard/page.tsx` (or wherever you want to display it)

```tsx
import { SlackIntegrationCard } from '@/components/slack/slack-integration-card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Your other dashboard content */}

      {/* Slack Integration Card */}
      <SlackIntegrationCard />
    </div>
  )
}
```

---

## 🔧 Troubleshooting

### Issue: OAuth redirect fails

**Solution:**
- Verify your redirect URL matches exactly in:
  - `.env` file (`NEXTAUTH_URL`)
  - Slack App settings
  - No trailing slashes!

### Issue: Webhooks not receiving events

**Solution:**
1. Check Request URL in Slack settings
2. Ensure URL is publicly accessible (use ngrok for local dev)
3. Check that `/api/slack/webhooks` returns `200 OK`
4. Verify Signing Secret in `.env`

### Issue: No users matched to employees

**Solution:**
- Slack users are matched by email
- Ensure employees have the same email in:
  - WorkLedger database
  - Slack profile
- Manually verify emails in Prisma Studio

### Issue: "Failed to exchange code for token"

**Solution:**
- Verify `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in `.env`
- Check that credentials are not exposed (no quotes issues)
- Regenerate credentials if compromised

---

## 📊 What Data is Collected?

### ✅ What we STORE:
- Workspace name, domain, icon
- User profiles (name, email, avatar)
- Channel names, topics, member counts
- **Aggregated message counts per user per hour**
- Reaction counts, thread counts, mention counts

### ❌ What we DON'T STORE:
- ❌ Message content
- ❌ Private/DM message content
- ❌ Deleted messages
- ❌ File contents

**Privacy First:** All message data is aggregated by hour and user. We never store actual message text!

---

## 🚀 Next Steps

1. **Review Analytics**
   - Check team communication patterns
   - Identify most active channels
   - View response time metrics

2. **Customize Settings**
   - Configure sync frequency
   - Set up automated reports
   - Create custom alerts

3. **Match More Employees**
   - Manually link Slack users to employees
   - Improve matching confidence

4. **Explore API**
   - `/api/slack/status` - Connection status
   - `/api/slack/sync` - Manual sync
   - `/api/slack/disconnect` - Disconnect

---

## 🆘 Need Help?

- **Slack API Docs:** https://api.slack.com/docs
- **Workspace Permissions:** https://api.slack.com/scopes
- **Event Types:** https://api.slack.com/events

---

## ✅ Checklist

- [ ] Created Slack App
- [ ] Configured OAuth scopes
- [ ] Added redirect URLs
- [ ] Enabled Event Subscriptions
- [ ] Added webhook URL
- [ ] Subscribed to bot events
- [ ] Copied credentials to `.env`
- [ ] Installed app to workspace
- [ ] Tested OAuth flow
- [ ] Verified data sync
- [ ] Added to dashboard

---

**🎉 Congratulations! Your Slack integration is now live!**

Start tracking team communication and collaboration patterns automatically.
