# GitHub App Configuration for WorkLedger

## Required GitHub App Settings

### 1. Create GitHub App
Go to: https://github.com/settings/apps/new (for personal) or
https://github.com/organizations/{ORG}/settings/apps/new (for organization)

### 2. App Configuration

**Basic Information:**
- **App Name**: WorkLedger Skills Tracker
- **Homepage URL**: http://localhost:3000
- **Webhook URL**: https://your-domain.com/api/github/webhooks
- **Webhook Secret**: Generate a secure random string

### 3. Permissions Required

**Repository Permissions:**
- Contents: Read
- Metadata: Read
- Pull requests: Read
- Commits: Read
- Issues: Read

**Organization Permissions:**
- Members: Read
- Administration: Read (for org details)

**Account Permissions:**
- Email addresses: Read (for matching employees)

### 4. Subscribe to Events
- Push
- Pull request
- Repository
- Organization
- Member
- Installation

### 5. Where can this GitHub App be installed?
- Any account (for MVP)
- Only on this account (for private use)

### 6. After Creation
1. Note down the **App ID**
2. Generate a **Private Key** (will download .pem file)
3. Install the app on your organization

### 7. Environment Variables
```bash
# Add to .env
GITHUB_APP_ID="your-app-id"
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...contents of .pem file...
-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
```

## Installation Flow

1. Company admin visits: `/dashboard/integrations/github`
2. Clicks "Install GitHub App"
3. Redirected to GitHub for authorization
4. Selects repositories (or all)
5. Returns to WorkLedger with installation
6. Automatic discovery begins

## Testing Locally with ngrok

```bash
# Install ngrok
brew install ngrok

# Start local server
npm run dev

# In another terminal, expose local server
ngrok http 3000

# Update GitHub App webhook URL to ngrok URL
# e.g., https://abc123.ngrok.io/api/github/webhooks
```