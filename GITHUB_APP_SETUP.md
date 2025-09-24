# GitHub App Setup for WorkLedger

## Why GitHub App vs OAuth App?

### Current OAuth App Limitations:
- ❌ Individual user access only
- ❌ Cannot access organization repositories
- ❌ Limited repository visibility
- ❌ No organization-wide permissions

### GitHub App Benefits:
- ✅ Organization-level installation
- ✅ Fine-grained permissions
- ✅ Access to all organization repositories
- ✅ Webhook support
- ✅ Better rate limits
- ✅ Installation-based authentication

## GitHub App Setup Process

### 1. Create GitHub App
```
Navigate to: https://github.com/settings/apps/new

App Name: WorkLedger
Homepage URL: https://workledger.com
Callback URL: https://your-domain.com/api/github/app/callback
Setup URL: https://your-domain.com/api/github/app/setup
Webhook URL: https://your-domain.com/api/github/webhooks
Webhook Secret: [generate secure secret]
```

### 2. Required Permissions

#### Repository Permissions:
- **Contents**: Read (access repository files)
- **Metadata**: Read (repository info)
- **Pull requests**: Read (PR analytics)
- **Issues**: Read (issue tracking)
- **Commits**: Read (commit history)
- **Actions**: Read (CI/CD insights)

#### Organization Permissions:
- **Members**: Read (team member list)
- **Administration**: Read (org structure)

#### Account Permissions:
- **Email addresses**: Read (user identification)
- **Profile**: Read (user info)

### 3. Webhook Events
- `push` - New commits
- `pull_request` - PR activities
- `issues` - Issue activities
- `repository` - Repo changes
- `member` - Team changes
- `installation` - App install/uninstall

### 4. Installation Flow

```typescript
// 1. Company admin installs app on their organization
// 2. GitHub redirects to setup URL with installation_id
// 3. WorkLedger stores installation data
// 4. Employees can then sync their contributions
```

## Implementation Architecture

### Database Schema Updates

```sql
-- GitHub App Installation table
CREATE TABLE github_installations (
  id VARCHAR PRIMARY KEY,
  installation_id BIGINT UNIQUE NOT NULL,
  company_id VARCHAR NOT NULL,
  account_login VARCHAR NOT NULL, -- org username
  account_type VARCHAR NOT NULL, -- "Organization"
  target_type VARCHAR NOT NULL,
  permissions JSONB,
  events VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  installed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Update GitHub Connection for App-based auth
ALTER TABLE github_connections ADD COLUMN installation_id BIGINT;
ALTER TABLE github_connections ADD COLUMN app_access_token VARCHAR;
ALTER TABLE github_connections ADD COLUMN token_expires_at TIMESTAMP;
```

### API Integration Changes

```typescript
// services/github/app-client.ts
export class GitHubAppService {
  private app: App

  constructor() {
    this.app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
      clientId: process.env.GITHUB_APP_CLIENT_ID!,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
    })
  }

  // Get installation token for organization
  async getInstallationToken(installationId: number) {
    const installation = await this.app.getInstallationOctokit(installationId)
    return installation
  }

  // Get all repositories for installation
  async getInstallationRepositories(installationId: number) {
    const octokit = await this.getInstallationToken(installationId)
    return octokit.rest.apps.listReposAccessibleToInstallation()
  }

  // Get organization members
  async getOrganizationMembers(installationId: number, org: string) {
    const octokit = await this.getInstallationToken(installationId)
    return octokit.rest.orgs.listMembers({ org })
  }
}
```

## User Flow Changes

### For Company Administrators:

1. **Install GitHub App**
   ```
   Admin → GitHub App → Install on Organization → Select Repositories → Authorize
   ```

2. **Configure WorkLedger**
   ```
   Admin → WorkLedger Dashboard → GitHub Settings → Complete Installation
   ```

3. **Invite Employees**
   ```
   Admin → Send Employee Invitations → Employees Connect Personal GitHub
   ```

### For Employees:

1. **Connect Personal Account**
   ```
   Employee → Link GitHub Account → OAuth Flow → Personal Access
   ```

2. **Automatic Sync**
   ```
   WorkLedger → Match Employee GitHub → Organization Repositories → Sync Contributions
   ```

## Configuration Updates

### Environment Variables
```env
# GitHub App Credentials
GITHUB_APP_ID="123456"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_APP_CLIENT_ID="Iv1.abcd1234"
GITHUB_APP_CLIENT_SECRET="secret123"
GITHUB_WEBHOOK_SECRET="webhook_secret"

# Legacy OAuth (for personal connections)
GITHUB_CLIENT_ID="Ov23liOVbpundEtB0Il0"
GITHUB_CLIENT_SECRET="e803476e694e15b523caeb4c8998e86b19f4b124"
```

### Config Updates
```typescript
// lib/config.ts
export const githubConfig = {
  app: {
    id: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_APP_PRIVATE_KEY,
    clientId: env.GITHUB_APP_CLIENT_ID,
    clientSecret: env.GITHUB_APP_CLIENT_SECRET,
    webhookSecret: env.GITHUB_WEBHOOK_SECRET,
  },
  oauth: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    scope: 'user:email',
  }
}
```

## Benefits of This Approach

### For Companies:
- ✅ **Complete Organization Visibility**: Access all org repositories
- ✅ **Team Analytics**: Organization-wide skill insights
- ✅ **Centralized Management**: Admin controls what's accessible
- ✅ **Real-time Updates**: Webhooks for instant sync
- ✅ **Security**: Fine-grained permissions

### For Employees:
- ✅ **Easy Setup**: Just connect personal account
- ✅ **Automatic Discovery**: WorkLedger finds their org contributions
- ✅ **Privacy Control**: Personal repos remain private
- ✅ **Comprehensive Tracking**: All work contributions counted

### For WorkLedger:
- ✅ **Enterprise Ready**: Supports large organizations
- ✅ **Better Data**: More complete skill analysis
- ✅ **Scalability**: Handles multiple organizations efficiently
- ✅ **Compliance**: Organization-level access controls

## Migration Strategy

### Phase 1: Dual Support
- Keep existing OAuth for personal accounts
- Add GitHub App for organizations
- Allow both to coexist

### Phase 2: Organization Onboarding
- Company admin installs GitHub App
- Existing employee connections get upgraded
- New repositories automatically synced

### Phase 3: Enhanced Features
- Organization-wide skill matrices
- Team collaboration analytics
- Advanced reporting for managers

## Security Considerations

1. **Token Management**
   - App installation tokens expire (1 hour)
   - Automatic token refresh
   - Secure storage of private keys

2. **Permission Scope**
   - Minimal required permissions only
   - Organization admin approval required
   - Audit trail of all access

3. **Data Privacy**
   - Repository content not stored
   - Only metadata and statistics
   - Employee consent for personal data

## Implementation Priority

1. **Week 1**: GitHub App creation and basic setup
2. **Week 2**: Installation flow and database updates
3. **Week 3**: Repository sync with app tokens
4. **Week 4**: Employee matching and contribution analysis
5. **Week 5**: Organization-wide analytics and reporting

This approach transforms WorkLedger from an individual tool to a true enterprise platform for skill certification.