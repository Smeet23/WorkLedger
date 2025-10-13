# GitHub Integration Testing Guide

## Overview
This guide will help you test all GitHub integration features in WorkLedger.

---

## Prerequisites

### 1. Environment Setup
Your `.env` file needs these variables:

```bash
# GitHub OAuth App (for user authentication)
GITHUB_CLIENT_ID="Ov23liOVbpundEtB0Il0"  ✅ Already configured
GITHUB_CLIENT_SECRET="e803476e694e15b523caeb4c8998e86b19f4b124"  ✅ Already configured

# GitHub App (for organization access) - MISSING
GITHUB_APP_ID=""  ⚠️ NEEDS SETUP
GITHUB_PRIVATE_KEY=""  ⚠️ NEEDS SETUP
NEXT_PUBLIC_GITHUB_APP_NAME=""  ⚠️ NEEDS SETUP (e.g., "workledger-skills")
```

### 2. Database Status
- ✅ PostgreSQL running on localhost:5432
- ✅ Redis running on localhost:6379
- ✅ Prisma schema migrated

### 3. App Running
- ✅ Dev server: http://localhost:3000
- ✅ Authentication working

---

## Setup Required: GitHub App vs GitHub OAuth App

### What's Already Working (GitHub OAuth App)
The `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` allow users to:
- Sign in with GitHub (if you add the provider)
- Basic GitHub API access with user permissions

### What's Missing (GitHub App)
The GitHub App is required for:
- Organization-level access
- Auto-discovery of team members
- Repository syncing
- Webhook events
- Skill detection from commits

---

## How to Set Up GitHub App

### Step 1: Create a GitHub App

1. Go to: https://github.com/settings/apps/new (or your organization's settings)

2. **App Name**: `workledger-skills` (or your choice)

3. **Homepage URL**: `http://localhost:3000` (change for production)

4. **Callback URL**: `http://localhost:3000/api/github/app/install`

5. **Webhook URL**: `http://localhost:3000/api/github/webhooks` (use ngrok for local testing)

6. **Webhook Secret**: Generate a random secret and save it

7. **Permissions**:
   - Repository permissions:
     - Contents: Read-only
     - Metadata: Read-only
     - Commit statuses: Read-only
   - Organization permissions:
     - Members: Read-only

8. **Subscribe to events**:
   - Push
   - Repository
   - Member
   - Organization

9. **Where can this GitHub App be installed?**
   - Choose "Any account" for testing
   - Or "Only on this account" for private use

10. Click **Create GitHub App**

### Step 2: Generate Private Key

1. After creating the app, scroll down to **Private keys**
2. Click **Generate a private key**
3. Download the `.pem` file
4. Convert the key to a single line:

```bash
# On macOS/Linux:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' downloaded-key.pem

# This will output the key as a single line with \n characters
# Copy this entire output
```

### Step 3: Update Environment Variables

Add to your `.env` file:

```bash
# GitHub App Configuration
GITHUB_APP_ID="123456"  # From the app settings page
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEp... (single line with \\n)\n-----END RSA PRIVATE KEY-----\n"
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills"  # The app name you chose
GITHUB_WEBHOOK_SECRET="your-webhook-secret"  # Optional but recommended
```

### Step 4: For Local Webhook Testing (Optional)

Use ngrok to expose your local server:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update the Webhook URL in GitHub App settings to: https://abc123.ngrok.io/api/github/webhooks
```

### Step 5: Restart Your App

```bash
npm run dev
```

---

## Testing Plan

### Test 1: GitHub OAuth Connection Flow ✅

**What to test**: Basic GitHub connection using OAuth

**Steps**:
1. ✅ Open http://localhost:3000
2. ✅ Sign in with your account
3. Navigate to Dashboard → Integrations (if exists)
4. Look for GitHub connection option

**Expected Result**:
- Should see GitHub integration page
- OAuth flow should work (redirect to GitHub and back)

**Files to check**:
- `/src/app/api/github/connect/route.ts`
- `/src/app/api/github/callback/route.ts`

**Current Status**: OAuth app configured, ready to test

---

### Test 2: GitHub App Installation ⚠️

**What to test**: Installing the GitHub App on your organization

**Prerequisites**:
- ⚠️ Requires GitHub App setup (see above)

**Steps**:
1. Navigate to: http://localhost:3000/dashboard/integrations/github
2. Click "Install GitHub App" button
3. Should redirect to: https://github.com/apps/workledger-skills/installations/new
4. Choose organization/account
5. Select repositories (all or specific)
6. Click "Install"
7. Redirects back to callback URL

**Expected Result**:
- Installation record created in database
- Installation appears on integration page
- Shows organization name and installation ID

**Files to check**:
- `/src/app/dashboard/integrations/github/page.tsx`
- `/src/app/api/github/app/install/route.ts`

**Database Check**:
```sql
SELECT * FROM github_installations;
```

---

### Test 3: Auto-Discovery of Employees ⚠️

**What to test**: Automatic discovery of GitHub organization members

**Prerequisites**:
- GitHub App installed
- Organization with members

**Steps**:
1. On GitHub integration page, click "Run Auto-Discovery"
2. Watch for progress indicator
3. Check discovered members

**Expected Result**:
- All organization members fetched
- Members stored in `github_organization_members` table
- Matching suggestions displayed
- Confidence scores calculated

**API Endpoint**: `POST /api/github/auto-discover`

**Files to check**:
- `/src/services/github/auto-discovery.ts`
- `/src/app/api/github/auto-discover/route.ts`

**Database Check**:
```sql
SELECT * FROM github_organization_members;
SELECT * FROM employees WHERE "autoDiscovered" = true;
```

---

### Test 4: Repository Syncing ⚠️

**What to test**: Syncing repositories from GitHub

**Prerequisites**:
- GitHub App installed
- Repositories in organization

**Steps**:
1. Navigate to "Repositories" tab on GitHub integration page
2. Click "Sync Repositories" (if available)
3. Watch sync progress

**Expected Result**:
- All accessible repositories synced
- Repository metadata stored
- Language statistics captured
- Sync status displayed

**API Endpoint**: `POST /api/github/sync`

**Files to check**:
- `/src/services/github/client.ts`
- `/src/components/github/repository-sync.tsx`

**Database Check**:
```sql
SELECT * FROM repositories WHERE platform = 'GITHUB';
SELECT * FROM repository_languages;
```

---

### Test 5: Skill Detection ⚠️

**What to test**: Automatic skill detection from commits

**Prerequisites**:
- Repositories synced
- Employees matched to GitHub users

**Steps**:
1. Navigate to "Skill Detection" tab
2. Trigger skill analysis
3. Watch detection progress

**Expected Result**:
- Commits analyzed for languages/frameworks
- Skills created/updated in database
- Skill levels calculated (BEGINNER → EXPERT)
- Confidence scores assigned

**Files to check**:
- `/src/services/github/skill-detector.ts`
- `/src/services/skills/detector.ts`
- `/src/components/github/skill-detection-progress.tsx`

**Database Check**:
```sql
SELECT e.firstName, e.lastName, s.name, sr.level, sr.confidence
FROM skill_records sr
JOIN employees e ON e.id = sr."employeeId"
JOIN skills s ON s.id = sr."skillId"
WHERE sr.source = 'GITHUB'
ORDER BY e.lastName, s.name;
```

---

### Test 6: Webhooks ⚠️

**What to test**: Real-time updates via GitHub webhooks

**Prerequisites**:
- GitHub App installed with webhook URL configured
- ngrok running (for local testing)

**Steps**:
1. Make a commit to a tracked repository
2. Push to GitHub
3. Check webhook delivery in GitHub App settings
4. Check application logs

**Expected Result**:
- Webhook received
- Event processed
- Database updated
- Real-time UI update (if implemented)

**API Endpoint**: `POST /api/github/webhooks`

**Files to check**:
- `/src/app/api/github/webhooks/route.ts`

**Test Webhook Manually**:
```bash
curl -X POST http://localhost:3000/api/github/webhooks \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"full_name": "org/repo"},
    "commits": [{"message": "test"}]
  }'
```

---

## Manual API Testing

### Check GitHub Connection Status

```bash
curl http://localhost:3000/api/github/status \
  -H "Cookie: your-session-cookie"
```

### Trigger Manual Sync

```bash
curl -X POST http://localhost:3000/api/github/sync \
  -H "Cookie: your-session-cookie"
```

### Get Installation Status

```bash
curl http://localhost:3000/api/github/installation/status \
  -H "Cookie: your-session-cookie"
```

---

## Verification Checklist

### Database Integrity

Run these queries to verify data:

```sql
-- Check installations
SELECT * FROM github_installations ORDER BY "createdAt" DESC;

-- Check discovered members
SELECT * FROM github_organization_members;

-- Check matched employees
SELECT
  e.email,
  e."githubUsername",
  e."autoDiscovered",
  e."discoveryConfidence"
FROM employees e
WHERE e."githubUsername" IS NOT NULL;

-- Check repositories
SELECT
  r.name,
  r.platform,
  r.language,
  r."lastSyncAt"
FROM repositories r
WHERE r.platform = 'GITHUB';

-- Check detected skills
SELECT
  e."firstName" || ' ' || e."lastName" as employee,
  s.name as skill,
  sr.level,
  sr.confidence,
  sr.source
FROM skill_records sr
JOIN employees e ON e.id = sr."employeeId"
JOIN skills s ON s.id = sr."skillId"
WHERE sr.source = 'GITHUB'
ORDER BY e."lastName", sr.confidence DESC;

-- Check commits tracked
SELECT
  COUNT(*) as total_commits,
  COUNT(DISTINCT "repositoryId") as repos_with_commits,
  COUNT(DISTINCT "authorEmail") as unique_authors
FROM commits;

-- Check audit trail
SELECT
  operation,
  COUNT(*) as count
FROM github_token_audits
GROUP BY operation
ORDER BY count DESC;
```

---

## Troubleshooting

### Issue: "GitHub App not configured"

**Solution**:
- Verify `GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY` are set in `.env`
- Restart the dev server

### Issue: "Installation failed"

**Solution**:
- Check callback URL is correctly configured in GitHub App settings
- Verify the app has correct permissions
- Check browser console for errors

### Issue: "Auto-discovery returns 0 members"

**Solution**:
- Verify the GitHub App has "Organization → Members" read permission
- Check if the installation account is an organization (not a personal account)
- Review API logs for rate limiting errors

### Issue: "Webhooks not working"

**Solution**:
- Use ngrok for local testing: `ngrok http 3000`
- Update webhook URL in GitHub App settings to ngrok URL
- Check webhook secret matches
- Review webhook delivery logs in GitHub App settings

### Issue: "Skills not detected"

**Solution**:
- Verify commits exist in repositories
- Check employee GitHub usernames match commit authors
- Review skill detector logic for supported languages/frameworks
- Check logs for errors during analysis

---

## Performance Considerations

### Rate Limiting

GitHub API has rate limits:
- **Unauthenticated**: 60 requests/hour
- **OAuth**: 5,000 requests/hour
- **GitHub App**: 5,000 requests/hour per installation

**Monitoring**:
```bash
curl -I https://api.github.com/rate_limit \
  -H "Authorization: token YOUR_TOKEN"
```

### Optimization Tips

1. **Batch requests** when syncing multiple repositories
2. **Cache organization members** (refresh every 24h)
3. **Use conditional requests** with ETags
4. **Implement job queue** for long-running operations
5. **Store last sync timestamps** to avoid redundant API calls

---

## Security Checklist

- [ ] Private key stored securely (not committed to git)
- [ ] Webhook secret configured and validated
- [ ] Token encryption enabled
- [ ] Audit logging active
- [ ] HTTPS required in production
- [ ] OAuth scopes minimized
- [ ] Error messages don't leak sensitive data

---

## Next Steps After Testing

Once GitHub integration is working:

1. **Add to dashboard**: Show integration status on main dashboard
2. **Notification system**: Alert when new skills are detected
3. **Analytics**: Track skill growth over time
4. **Reports**: Generate team skill matrices
5. **Certificates**: Auto-issue certificates for skill milestones
6. **Mobile app**: Sync data for mobile access

---

## Test Results Template

Copy and use this template to track your testing:

```
## GitHub Integration Test Results
Date: _________
Tester: _________

### Test 1: OAuth Connection Flow
- Status: ☐ Pass ☐ Fail ☐ Not Tested
- Notes:

### Test 2: GitHub App Installation
- Status: ☐ Pass ☐ Fail ☐ Not Tested
- Notes:

### Test 3: Auto-Discovery
- Status: ☐ Pass ☐ Fail ☐ Not Tested
- Members discovered: ___
- Notes:

### Test 4: Repository Syncing
- Status: ☐ Pass ☐ Fail ☐ Not Tested
- Repositories synced: ___
- Notes:

### Test 5: Skill Detection
- Status: ☐ Pass ☐ Fail ☐ Not Tested
- Skills detected: ___
- Notes:

### Test 6: Webhooks
- Status: ☐ Pass ☐ Fail ☐ Not Tested
- Notes:

### Overall Assessment
- Ready for production: ☐ Yes ☐ No ☐ Partial
- Critical issues:
- Recommendations:
```

---

## Quick Start Testing (Without GitHub App)

If you want to test basic functionality WITHOUT setting up the GitHub App:

1. **Test the UI**: Visit http://localhost:3000/dashboard/integrations/github
2. **Check API endpoints**: Test status and connection endpoints
3. **Review database schema**: Verify tables are created correctly
4. **Code review**: Check service implementations for completeness

This will let you validate the codebase structure before committing to GitHub App setup.
