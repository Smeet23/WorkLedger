# 🚀 Jira Integration - Next Steps

Everything is ready! Here's what to do to activate Jira integration.

---

## ✅ What's Already Done

- ✅ Database schema (8 models)
- ✅ Backend services (OAuth + Sync)
- ✅ API routes (6 endpoints)
- ✅ Webhooks handler
- ✅ UI page
- ✅ Documentation
- ✅ Added to integrations page

---

## 📝 To-Do: Get Jira Working

### Step 1: Create Atlassian OAuth App (5 min)

1. **Go to:** https://developer.atlassian.com/console/myapps/
2. **Click:** "Create" → "OAuth 2.0 integration"
3. **Name:** WorkLedger
4. **Click:** "Create"

### Step 2: Configure Callback URL (1 min)

In **Authorization** tab:

**For ngrok (current setup):**
```
https://3b104c3ca740.ngrok-free.app/api/jira/callback
```

**For local testing:**
```
http://localhost:3000/api/jira/callback
```

### Step 3: Add Permissions (1 min)

In **Permissions** tab, add these scopes:

```
read:me
read:jira-work
read:jira-user
write:jira-work
offline_access
```

### Step 4: Get Credentials (1 min)

In **Settings** tab:
1. Copy **Client ID**
2. Copy **Secret**

### Step 5: Update .env File (1 min)

Replace the empty values in your `.env`:

```bash
# Jira/Atlassian Integration
JIRA_CLIENT_ID="paste-your-client-id-here"
JIRA_CLIENT_SECRET="paste-your-secret-here"
ENCRYPTION_KEY="$(openssl rand -base64 24)"
```

**To generate ENCRYPTION_KEY in terminal:**
```bash
openssl rand -base64 24
```

### Step 6: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 7: Test Connection

1. **Go to:** http://localhost:3000/dashboard/integrations
2. **Click:** Jira card → "Manage Integration"
3. **Click:** "Connect Jira Workspace"
4. **Authorize** on Atlassian
5. **Done!** ✅

---

## 🪝 Optional: Enable Webhooks (2 min)

For real-time updates:

1. In Atlassian Console → **Webhooks** tab
2. Click **"Create webhook"**
3. **URL:** `https://3b104c3ca740.ngrok-free.app/api/jira/webhooks`
4. **Events:** Select all issue, worklog, and comment events
5. **Click:** "Create"

---

## 📚 Documentation Reference

- **Full Setup Guide:** `JIRA_SETUP_GUIDE.md`
- **Quick Start:** `JIRA_QUICKSTART.md`
- **Technical Docs:** `JIRA_INTEGRATION_COMPLETE.md`

---

## 🎯 After Connection

Once connected, you'll see:

- ✅ Projects count
- ✅ Users count (auto-matched to employees)
- ✅ Issues count
- ✅ Completed issues count
- ✅ Last sync timestamp
- ✅ Manual sync button

---

## 🔍 Check Database

```bash
# View synced data
npx prisma studio
```

Look for:
- `JiraIntegration` - Your connection
- `JiraProject` - Projects
- `JiraUser` - Users matched to employees
- `JiraIssue` - All issues
- `JiraWorklog` - Time logs
- `JiraComment` - Comments

---

## ⚡ Quick Commands

```bash
# Manual sync
curl -X POST http://localhost:3000/api/jira/sync

# Check status
curl http://localhost:3000/api/jira/status

# View database
npx prisma studio
```

---

## 🆘 If You Get Stuck

1. **Check** `.env` has all three Jira variables filled
2. **Verify** callback URL matches exactly in Atlassian Console
3. **Ensure** all permissions/scopes are added
4. **Restart** dev server after changing `.env`
5. **Check** console logs for errors

---

**That's it!** 5 steps and you're tracking project management skills! 🚀

See `JIRA_SETUP_GUIDE.md` for detailed instructions.
