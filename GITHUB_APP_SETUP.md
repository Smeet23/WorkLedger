# GitHub App Configuration with Ngrok

## Your Current Ngrok URL
```
https://e1e30fa67ce5.ngrok-free.app
```

**Last Updated:** October 15, 2025

## Update GitHub App Settings

Go to: https://github.com/settings/apps/workledger

### 1. General Settings

**Homepage URL:**
```
https://e1e30fa67ce5.ngrok-free.app
```

**Callback URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/callback
```

**Setup URL:** (REQUIRED - This handles the installation callback)
```
https://e1e30fa67ce5.ngrok-free.app/api/github/app/install
```

**Webhook URL:**
```
https://e1e30fa67ce5.ngrok-free.app/api/github/webhooks
```

**Webhook secret:** (already set)
```
83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c
```

### 2. Permissions (Already Set)

**Repository permissions:**
- ✅ Contents: Read-only
- ✅ Metadata: Read-only
- ✅ Commit statuses: Read-only

**Organization permissions:**
- ✅ Members: Read-only
- ✅ Administration: Read-only

### 3. Subscribe to events

- ✅ Push
- ✅ Repository
- ✅ Member
- ✅ Membership
- ✅ Installation
- ✅ Installation repositories

### 4. Where can this app be installed?
- ✅ Any account

---

## Important Notes

1. **Ngrok URL Changes**: Free ngrok URLs change when you restart ngrok. If your URL changes, you'll need to update GitHub App settings again.

2. **Testing Installation Flow**:
   - Start your dev server: `npm run dev`
   - Start ngrok: `ngrok http 3000`
   - Update GitHub App with new ngrok URL (if it changed)
   - Go to your dashboard: http://localhost:3000
   - Click "Connect GitHub Organization"

3. **For Production**: Replace ngrok URL with your production domain (e.g., https://workledger.vercel.app)

---

## Current Configuration Summary

✅ GitHub App ID: 2116106
✅ App Name: workledger (public link: https://github.com/apps/workledger)
✅ Internal App Name: workledger-skills
✅ Ngrok URL: https://e1e30fa67ce5.ngrok-free.app
✅ Webhook Secret: Configured
✅ Private Key: Configured in .env

## Installation URL

Users/organizations can install the app at:
```
https://github.com/apps/workledger/installations/new
```

Or use the install button in your WorkLedger dashboard.

**Next Steps**:
1. Update the GitHub App URLs in GitHub settings with the URLs above
2. Save your changes in GitHub App settings
3. Test the installation flow by visiting your dashboard
4. Install the app to your organization or personal account
