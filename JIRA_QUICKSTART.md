# Jira Integration - Quick Start

Get Jira connected in 5 minutes!

---

## 🚀 Quick Setup

### 1. Create Atlassian OAuth App (2 min)

1. Go to: https://developer.atlassian.com/console/myapps/
2. Click **"Create" → "OAuth 2.0 integration"**
3. Name it: **"WorkLedger"**
4. Click **"Create"**

### 2. Add Callback URL (30 sec)

In **Authorization** tab:
```
https://your-domain.com/api/jira/callback
```

Local dev:
```
http://localhost:3000/api/jira/callback
```

### 3. Add Permissions (1 min)

In **Permissions** tab, add:
- `read:me`
- `read:jira-work`
- `read:jira-user`
- `offline_access`

### 4. Get Credentials (30 sec)

In **Settings** tab, copy:
- Client ID
- Secret

### 5. Add to .env (1 min)

```bash
JIRA_CLIENT_ID="your-client-id"
JIRA_CLIENT_SECRET="your-secret"
ENCRYPTION_KEY="$(openssl rand -base64 24)"
```

### 6. Connect! (30 sec)

1. Start app: `npm run dev`
2. Go to: `/dashboard/integrations/jira`
3. Click **"Connect Jira Workspace"**
4. Authorize on Atlassian
5. Done! ✅

---

## 🔄 Optional: Enable Webhooks

### Quick Webhook Setup (2 min)

1. In Atlassian Console → **Webhooks** tab
2. Click **"Create webhook"**
3. URL: `https://your-domain.com/api/jira/webhooks`
4. Events:
   - `jira:issue_created`
   - `jira:issue_updated`
   - `jira:worklog_updated`
   - `comment_created`
5. Click **"Create"**

Now you get real-time updates! 🎉

---

## 📊 What You Get

✅ **Projects** - All your Jira projects
✅ **Issues** - Tasks, stories, bugs (last 90 days)
✅ **Users** - Auto-matched to employees
✅ **Time Tracking** - Story points and logged time
✅ **Comments** - Collaboration metrics
✅ **Real-time** - Live updates via webhooks

---

## 🎯 Quick Commands

```bash
# Sync manually
curl -X POST http://localhost:3000/api/jira/sync

# Check status
curl http://localhost:3000/api/jira/status

# View data
npx prisma studio
```

---

## 🆘 Troubleshooting

**Can't connect?**
- Check `JIRA_CLIENT_ID` is correct
- Verify callback URL matches exactly
- Ensure app is installed on your Jira site

**No data syncing?**
- Click "Sync Now" button
- Check console for errors
- Verify you have issues in last 90 days

**Need help?**
- See full guide: `JIRA_SETUP_GUIDE.md`
- Check logs in terminal

---

That's it! You're tracking project management skills now. 🚀
