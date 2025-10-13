# Visual Flow: GitHub App Multi-Tenant Architecture

## The Key Insight

**Your implementation is ALREADY CORRECT! 🎉**

You DON'T need to store GitHub App credentials per company. Here's why:

## Visual Comparison

### ❌ What You Thought (WRONG)

```
Each company needs their own GitHub App:

Company A → Creates own GitHub App
           ├── APP_ID: 111
           ├── PRIVATE_KEY: key-a
           └── Store in database ❌

Company B → Creates own GitHub App
           ├── APP_ID: 222
           ├── PRIVATE_KEY: key-b
           └── Store in database ❌

Company C → Creates own GitHub App
           ├── APP_ID: 333
           ├── PRIVATE_KEY: key-c
           └── Store in database ❌

Problems:
- Each company must create their own app (bad UX)
- You must store private keys per company (security risk)
- No central control
- Complex setup
```

### ✅ How It Actually Works (CORRECT)

```
WorkLedger (YOU) create ONE GitHub App:

┌────────────────────────────────────────┐
│  WorkLedger GitHub App                 │
│  (Created ONCE by you)                 │
│                                        │
│  APP_ID: 456789                        │
│  PRIVATE_KEY: -----BEGIN RSA...        │
│  APP_NAME: "workledger-skills"         │
│                                        │
│  Stored in .env (one time) ✅          │
└────────────────────────────────────────┘
                    │
                    │ Companies install
                    │ this same app
                    ↓
    ┌───────────────┴───────────────┐
    │                               │
    ↓                               ↓
┌─────────────────┐          ┌─────────────────┐
│   Company A     │          │   Company B     │
│   Installs App  │          │   Installs App  │
└─────────────────┘          └─────────────────┘
         │                            │
         │ Gets                       │ Gets
         ↓                            ↓
  installation_id: 1001        installation_id: 1002
         │                            │
         │ Stored in DB:              │ Stored in DB:
         ↓                            ↓
┌─────────────────────┐      ┌─────────────────────┐
│ GitHubInstallation  │      │ GitHubInstallation  │
│ - installationId:   │      │ - installationId:   │
│   1001              │      │   1002              │
│ - companyId: A      │      │ - companyId: B      │
│ - accountLogin:     │      │ - accountLogin:     │
│   "company-a-org"   │      │   "company-b-org"   │
└─────────────────────┘      └─────────────────────┘
         │                            │
         │ Token generated            │ Token generated
         │ using:                     │ using:
         │ APP_ID + PRIVATE_KEY       │ APP_ID + PRIVATE_KEY
         │ + installation_id 1001     │ + installation_id 1002
         ↓                            ↓
┌─────────────────────┐      ┌─────────────────────┐
│ GitHubIntegration   │      │ GitHubIntegration   │
│ - companyId: A      │      │ - companyId: B      │
│ - encryptedToken:   │      │ - encryptedToken:   │
│   "enc_token_a..."  │      │   "enc_token_b..."  │
│ - installationId:   │      │ - installationId:   │
│   1001              │      │   1002              │
└─────────────────────┘      └─────────────────────┘
         │                            │
         ↓                            ↓
   Access ONLY                   Access ONLY
   Company A's repos             Company B's repos
```

## The Magic Formula

```javascript
// WorkLedger owns ONE app
const workledgerApp = {
  appId: process.env.GITHUB_APP_ID,           // From .env (same for all)
  privateKey: process.env.GITHUB_PRIVATE_KEY  // From .env (same for all)
}

// Company A installs it
const companyA = {
  installationId: 1001,  // Unique per company (in DB)
  companyId: "company-a"
}

// Generate Company A's token
const tokenA = generateToken(
  workledgerApp.appId,      // Your app
  workledgerApp.privateKey, // Your app
  companyA.installationId   // Their installation
)
// Result: Token that ONLY accesses Company A's GitHub org

// Company B installs it
const companyB = {
  installationId: 1002,  // Different installation ID
  companyId: "company-b"
}

// Generate Company B's token
const tokenB = generateToken(
  workledgerApp.appId,      // Same app
  workledgerApp.privateKey, // Same app
  companyB.installationId   // Different installation
)
// Result: Token that ONLY accesses Company B's GitHub org
```

## Step-by-Step: What Happens When Company Clicks "Install"?

### Step 1: Company Admin Clicks Button

```javascript
// Frontend (src/app/dashboard/integrations/github/page.tsx)
const initiateInstallation = () => {
  // Redirect to YOUR app's installation page
  const appName = "workledger-skills"  // From .env
  window.location.href = `https://github.com/apps/${appName}/installations/new`
}
```

### Step 2: GitHub Installation Page

```
┌────────────────────────────────────────┐
│  Install WorkLedger Skills Tracker     │
│                                        │
│  Select organization:                  │
│  ▼ [Company A GitHub Org]              │
│                                        │
│  Repository access:                    │
│  ◉ All repositories                    │
│  ○ Select repositories                 │
│                                        │
│         [Install] [Cancel]             │
└────────────────────────────────────────┘
```

User clicks "Install"

### Step 3: GitHub Redirects Back

```
Redirects to:
http://localhost:3000/api/github/app/install?installation_id=1001&setup_action=install
```

### Step 4: Your Backend Receives Callback

```javascript
// API Route (src/app/api/github/app/install/route.ts)

// 1. Extract installation_id from URL
const installationId = 1001  // From query params

// 2. Get authenticated user's company
const session = await getServerSession()
const company = await db.employee.findFirst({
  where: { email: session.user.email }
})

// 3. Save installation to database
await db.gitHubInstallation.create({
  data: {
    installationId: 1001,
    companyId: company.id,
    accountLogin: "company-a-github-org",
    isActive: true
  }
})
```

### Step 5: Generate Installation Access Token

```javascript
// Service (src/services/github/enhanced-client.ts)

// Use YOUR app credentials (from .env)
const app = new App({
  appId: process.env.GITHUB_APP_ID,        // Your app
  privateKey: process.env.GITHUB_PRIVATE_KEY // Your app
})

// Generate token for THIS company's installation
const { token } = await app.getInstallationAccessToken({
  installationId: 1001  // From database
})

// Result: "ghs_a1b2c3..." - Company A's access token
```

### Step 6: Encrypt and Store Token

```javascript
// Encrypt the token
const encryptedToken = encrypt(token, process.env.ENCRYPTION_SECRET)

// Save to database linked to company
await db.gitHubIntegration.create({
  data: {
    companyId: company.id,
    tokenType: 'app_installation',
    encryptedAccessToken: encryptedToken,
    installationId: 1001
  }
})
```

### Step 7: Fetch Repos & Commits

```javascript
// Later, when syncing...

// 1. Get company's token from database
const integration = await db.gitHubIntegration.findFirst({
  where: { companyId: "company-a" }
})

// 2. Decrypt token
const accessToken = decrypt(integration.encryptedAccessToken)

// 3. Create GitHub client
const octokit = new Octokit({ auth: accessToken })

// 4. Fetch repos (ONLY Company A's repos)
const { data } = await octokit.rest.apps.listReposAccessibleToInstallation()

// 5. Save to database
for (const repo of data.repositories) {
  await db.repository.create({
    data: {
      companyId: "company-a",  // Linked to Company A
      githubRepoId: repo.id,
      name: repo.name,
      // ...
    }
  })
}

// 6. Fetch commits, detect skills, etc.
// All linked to Company A!
```

## Database Isolation Visualization

```sql
-- Company A's installation
INSERT INTO github_installations (installationId, companyId, accountLogin)
VALUES (1001, 'company-a', 'acme-corp');

-- Company A's token (encrypted)
INSERT INTO github_integrations (companyId, encryptedAccessToken, installationId)
VALUES ('company-a', 'encrypted_token_a...', 1001);

-- Company A's repos (fetched using their token)
INSERT INTO repositories (companyId, name, githubRepoId)
VALUES
  ('company-a', 'acme-frontend', '11111'),
  ('company-a', 'acme-backend', '11112');

-- Company A's commits
INSERT INTO commits (repositoryId, companyId, authorEmail)
VALUES
  ('repo-11111', 'company-a', 'dev@acme-corp.com'),
  ('repo-11112', 'company-a', 'dev@acme-corp.com');

-- Company A's skills
INSERT INTO skill_records (employeeId, skillId, source, companyId)
VALUES
  ('emp-a1', 'skill-react', 'GITHUB', 'company-a'),
  ('emp-a1', 'skill-node', 'GITHUB', 'company-a');

-------------------------------------------------------------------

-- Company B's installation (COMPLETELY SEPARATE)
INSERT INTO github_installations (installationId, companyId, accountLogin)
VALUES (1002, 'company-b', 'beta-inc');

-- Company B's token (encrypted, different)
INSERT INTO github_integrations (companyId, encryptedAccessToken, installationId)
VALUES ('company-b', 'encrypted_token_b...', 1002);

-- Company B's repos (fetched using THEIR token)
INSERT INTO repositories (companyId, name, githubRepoId)
VALUES
  ('company-b', 'beta-api', '22221'),
  ('company-b', 'beta-mobile', '22222');

-- And so on... completely isolated!
```

## Query Isolation Example

```javascript
// When Company A's admin views repos:
const companyARepos = await db.repository.findMany({
  where: { companyId: "company-a" }  // Only sees their repos
})
// Result: ['acme-frontend', 'acme-backend']

// When Company B's admin views repos:
const companyBRepos = await db.repository.findMany({
  where: { companyId: "company-b" }  // Only sees their repos
})
// Result: ['beta-api', 'beta-mobile']

// They NEVER see each other's data!
```

## Summary: Why Your .env Setup is Correct

### The .env Credentials:

```bash
GITHUB_APP_ID="456789"                    # WorkLedger's app (YOU own this)
GITHUB_PRIVATE_KEY="-----BEGIN RSA..."   # WorkLedger's app (YOU own this)
NEXT_PUBLIC_GITHUB_APP_NAME="workledger-skills"  # WorkLedger's app slug
```

**Purpose**:
- Authenticate as the WorkLedger GitHub App
- Generate installation-specific access tokens
- **NOT per-company** - they're for YOUR app

### The Database Stores Per-Company:

```javascript
// Company A
{
  installationId: 1001,           // Unique to Company A
  encryptedAccessToken: "...",    // Company A's token (encrypted)
  companyId: "company-a"          // Links to Company A
}

// Company B
{
  installationId: 1002,           // Unique to Company B
  encryptedAccessToken: "...",    // Company B's token (encrypted)
  companyId: "company-b"          // Links to Company B
}
```

**Purpose**:
- Store installation_id (unique per company)
- Store access token (encrypted, per company)
- Link to company for isolation

## The Flow in One Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkLedger (.env)                        │
│                                                             │
│  GITHUB_APP_ID: 456789                                      │
│  GITHUB_PRIVATE_KEY: -----BEGIN RSA...                      │
│  APP_NAME: workledger-skills                                │
│                                                             │
│  (Created ONCE, used for ALL companies)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ↓                                           ↓
┌──────────────────┐                        ┌──────────────────┐
│   Company A      │                        │   Company B      │
│   installs app   │                        │   installs app   │
└──────────────────┘                        └──────────────────┘
        │                                           │
        ↓                                           ↓
  installation_id: 1001                      installation_id: 1002
        │                                           │
        ↓                                           ↓
┌──────────────────────────┐           ┌──────────────────────────┐
│  Generate token using:   │           │  Generate token using:   │
│  - APP_ID: 456789        │           │  - APP_ID: 456789        │
│  - PRIVATE_KEY: ...      │           │  - PRIVATE_KEY: ...      │
│  - installation_id: 1001 │           │  - installation_id: 1002 │
└──────────────────────────┘           └──────────────────────────┘
        │                                           │
        ↓                                           ↓
  token_a: "ghs_a1b2..."                    token_b: "ghs_x9y8..."
        │                                           │
        ↓                                           ↓
  Encrypt & store in DB                     Encrypt & store in DB
  with companyId: A                         with companyId: B
        │                                           │
        ↓                                           ↓
  Access Company A's                        Access Company B's
  GitHub org ONLY                           GitHub org ONLY
```

## You're Ready! 🚀

**What you need to do**:

1. ✅ Create ONE GitHub App (as WorkLedger owner)
2. ✅ Add credentials to `.env` (one time)
3. ✅ Restart app
4. ✅ Companies can now install YOUR app
5. ✅ Everything automatically works:
   - Each company gets unique installation_id
   - Tokens generated and stored per company
   - Complete data isolation
   - Repos, commits, skills all tracked separately

**What you DON'T need to do**:
- ❌ Store APP_ID per company
- ❌ Store PRIVATE_KEY per company
- ❌ Ask companies to create their own apps
- ❌ Manage multiple GitHub Apps

Your implementation is already perfect! Just set up the ONE WorkLedger GitHub App and you're done! 🎉
