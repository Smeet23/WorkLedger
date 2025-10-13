# GitHub App Architecture - Multi-Tenant Explained

## 🎯 The Big Picture

Your confusion is understandable! Let me clarify: **The GitHub App credentials in .env ARE correct for multi-tenant!**

## How GitHub App Multi-Tenancy Works

### The Setup (One-Time, WorkLedger Owner)

```
┌─────────────────────────────────────────┐
│  WorkLedger (You) Creates ONE GitHub App │
│                                         │
│  App Name: "WorkLedger Skills Tracker"  │
│  App ID: 123456                         │
│  Private Key: -----BEGIN RSA...         │
└─────────────────────────────────────────┘
                    ↓
        Stored in .env (one time)
                    ↓
┌─────────────────────────────────────────┐
│  GITHUB_APP_ID=123456                   │
│  GITHUB_PRIVATE_KEY="-----BEGIN..."     │
│  NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills" │
└─────────────────────────────────────────┘
```

**These credentials belong to WorkLedger, NOT to each company!**

### The Usage (Per Company)

```
Company A clicks "Install GitHub App"
                    ↓
        Redirects to GitHub:
    https://github.com/apps/workledger-skills/installations/new
                    ↓
    Company A installs the app on their org
                    ↓
            GitHub returns:
        installation_id = 12345678
                    ↓
    WorkLedger saves to database:

    GitHubInstallation {
      installationId: 12345678,
      companyId: "company-a-id",
      accountLogin: "company-a-github-org"
    }
                    ↓
    WorkLedger uses:
    - GITHUB_APP_ID (from .env)
    - GITHUB_PRIVATE_KEY (from .env)
    - installation_id (from database)

    To generate installation access token:
    "ghs_installationToken123..."
                    ↓
    This token is stored encrypted in:

    GitHubIntegration {
      companyId: "company-a-id",
      encryptedAccessToken: "encrypted_ghs_...",
      installationId: 12345678
    }
```

## 🔑 Key Concept

### ONE WorkLedger GitHub App → MANY Company Installations

```
WorkLedger GitHub App (in .env)
├── Installation 1 (Company A) → installation_id: 1001
│   └── Access Token (in DB, encrypted)
│       └── Can access Company A's repos
│
├── Installation 2 (Company B) → installation_id: 1002
│   └── Access Token (in DB, encrypted)
│       └── Can access Company B's repos
│
└── Installation 3 (Company C) → installation_id: 1003
    └── Access Token (in DB, encrypted)
        └── Can access Company C's repos
```

## 📊 Data Flow: From Click to Fetching Repos

### Step 1: User Clicks "Install GitHub App"

**Frontend** (`/dashboard/integrations/github/page.tsx`):
```javascript
const initiateInstallation = () => {
  const state = Math.random().toString(36).substring(7)
  sessionStorage.setItem('github_install_state', state)

  // Uses the WorkLedger app name from .env
  const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME
  window.location.href = `https://github.com/apps/${appName}/installations/new?state=${state}`
}
```

### Step 2: GitHub Installation Flow

1. User sees WorkLedger app installation page on GitHub
2. User selects their organization
3. User chooses repositories (all or selected)
4. User clicks "Install"

### Step 3: GitHub Redirects Back

GitHub redirects to:
```
https://yourapp.com/api/github/app/install?installation_id=12345678&setup_action=install
```

### Step 4: Backend Handles Installation

**API Route** (`/api/github/app/install/route.ts`):
```typescript
// 1. Verify user is company admin
const session = await getServerSession()

// 2. Get company
const company = await db.employee.findFirst({
  where: { email: session.user.email },
  include: { company: true }
})

// 3. Save installation to database
await db.gitHubInstallation.create({
  data: {
    installationId: installation_id,
    companyId: company.id,
    accountLogin: "company-github-org",
    // ...other fields
  }
})

// 4. Generate and save access token
await enhancedGitHubService.handleAppInstallation(
  installation_id,
  company.id
)
```

### Step 5: Generate Installation Access Token

**Service** (`/services/github/enhanced-client.ts`):
```typescript
// Uses WorkLedger's App credentials from .env
this.app = new App({
  appId: config.github.app.id,        // From .env
  privateKey: config.github.app.privateKey,  // From .env
})

// Generate installation-specific token
const { token } = await this.app.getInstallationAccessToken({
  installationId: installation_id
})

// Save encrypted token to database
await db.gitHubIntegration.create({
  data: {
    companyId: companyId,
    tokenType: 'app_installation',
    encryptedAccessToken: encrypt(token),
    installationId: installation_id
  }
})
```

### Step 6: Fetch Repos & Commits

**When syncing** (`/services/github/enhanced-client.ts`):
```typescript
async getCompanyClient(companyId: string): Promise<Octokit> {
  // 1. Get company's installation token from database
  const tokenData = await githubTokenManager.getCompanyTokens(
    companyId,
    GitHubTokenType.APP_INSTALLATION
  )

  // 2. Create Octokit client with company's token
  const octokit = new Octokit({
    auth: tokenData.accessToken  // Company-specific token from DB
  })

  return octokit
}

// Now fetch repos for THIS company
async syncOrganizationRepositories(companyId: string) {
  const octokit = await this.getCompanyClient(companyId)

  // This fetches ONLY repos accessible to this company's installation
  const { data: repos } = await octokit.rest.apps.listReposAccessibleToInstallation()

  // Save repos to database linked to this company
  for (const repo of repos.repositories) {
    await db.repository.upsert({
      where: { githubRepoId: repo.id.toString() },
      create: {
        companyId: companyId,
        githubRepoId: repo.id.toString(),
        name: repo.name,
        // ...
      }
    })
  }
}
```

## 🔐 Security & Isolation

### Per-Company Isolation

```sql
-- Company A's data
SELECT * FROM github_installations WHERE companyId = 'company-a';
-- Result: installation_id = 1001

SELECT * FROM github_integrations WHERE companyId = 'company-a';
-- Result: encrypted token for installation 1001

SELECT * FROM repositories WHERE companyId = 'company-a';
-- Result: ONLY Company A's repos

-- Company B's data
SELECT * FROM github_installations WHERE companyId = 'company-b';
-- Result: installation_id = 1002

SELECT * FROM github_integrations WHERE companyId = 'company-b';
-- Result: encrypted token for installation 1002

SELECT * FROM repositories WHERE companyId = 'company-b';
-- Result: ONLY Company B's repos
```

### Token Encryption

Each company's access token is encrypted using `ENCRYPTION_SECRET` from .env:

```typescript
// Encrypt before storing
const encryptedToken = encrypt(installationToken, ENCRYPTION_SECRET)

await db.gitHubIntegration.create({
  data: {
    encryptedAccessToken: encryptedToken
  }
})

// Decrypt when using
const tokenData = await db.gitHubIntegration.findFirst({
  where: { companyId }
})
const accessToken = decrypt(tokenData.encryptedAccessToken, ENCRYPTION_SECRET)
```

## ✅ What You Need to Do (One-Time Setup)

### Step 1: Create WorkLedger GitHub App

1. Go to https://github.com/settings/apps/new

2. Fill in:
   - **App Name**: `workledger-skills` (or your choice)
   - **Homepage URL**: `https://workledger.com` (or your domain)
   - **Callback URL**: `https://yourdomain.com/api/github/app/install`
   - **Webhook URL**: `https://yourdomain.com/api/github/webhooks`
   - **Webhook Secret**: Generate a random string

3. **Permissions** (Repository):
   - Contents: Read-only
   - Metadata: Read-only
   - Commit statuses: Read-only

4. **Permissions** (Organization):
   - Members: Read-only

5. **Subscribe to events**:
   - Push
   - Repository
   - Member
   - Organization

6. **Where can this app be installed?**
   - ✅ **Any account** (allows any company to install)

7. Click **Create GitHub App**

### Step 2: Generate Private Key

1. After creation, scroll to **Private keys**
2. Click **Generate a private key**
3. Download the `.pem` file
4. Convert to single line:
   ```bash
   awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' your-app.pem
   ```

### Step 3: Update .env

```bash
# Your WorkLedger GitHub App (ONE TIME, FOR ALL COMPANIES)
GITHUB_APP_ID="123456"  # From app settings
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEp...\n-----END RSA PRIVATE KEY-----\n"
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills"  # The app slug
GITHUB_WEBHOOK_SECRET="your-random-secret"  # For webhook verification
```

### Step 4: Restart App

```bash
npm run dev
```

## 🚀 How It Works for Each Company

### Company A Flow

1. **Admin logs in** to WorkLedger
2. **Navigates** to `/dashboard/integrations/github`
3. **Clicks** "Install GitHub App"
4. **Redirects** to `https://github.com/apps/workledger-skills/installations/new`
5. **Selects** their GitHub organization (e.g., "acme-corp")
6. **Chooses** repositories (all or selected)
7. **Installs** the app
8. **Redirects back** to WorkLedger with `installation_id=1001`
9. **WorkLedger**:
   - Saves installation_id to database
   - Generates access token using WorkLedger App credentials
   - Encrypts and saves token to database
   - Links to Company A's companyId
10. **Auto-sync**:
    - Fetches repos using Company A's token
    - Fetches commits from Company A's repos
    - Detects skills from Company A's code
    - Everything isolated to Company A

### Company B Flow

Same process, but:
- Gets different `installation_id=1002`
- Gets different access token
- Accesses different repos
- Completely isolated from Company A

## 📝 Summary

### ❌ WRONG Understanding:
"Each company needs their own GitHub App with their own APP_ID and PRIVATE_KEY in database"

### ✅ CORRECT Understanding:
"WorkLedger has ONE GitHub App. Each company installs this app, gets a unique installation_id, and WorkLedger generates installation-specific access tokens stored per-company in database"

### The .env Credentials Are:
- **For WorkLedger's GitHub App** (owned by you)
- **Used to authenticate as the WorkLedger app**
- **Used to generate installation tokens** for each company
- **NOT per-company**, they're per-app (your app)

### The Database Stores:
- **installation_id** - unique per company installation
- **encryptedAccessToken** - company-specific access token
- **companyId** - links everything to the right company

### The Magic:
1. WorkLedger App credentials (in .env) + installation_id (in DB) = installation access token
2. Installation access token = access to ONLY that company's GitHub org
3. Each company completely isolated
4. One app, many installations, many tokens

## 🎯 Next Steps

1. **Create your WorkLedger GitHub App** (one time, as WorkLedger owner)
2. **Add credentials to .env** (APP_ID, PRIVATE_KEY, APP_NAME)
3. **Companies can now install** your app on their orgs
4. **Everything works automatically** - repos, commits, skills, all isolated per company!

No need to store APP_ID/PRIVATE_KEY per company - they're for YOUR app, not theirs! 🎉
