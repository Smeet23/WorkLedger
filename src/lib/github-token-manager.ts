import { db } from './db'
import { encrypt, decrypt } from './crypto'
import { config } from './config'
import { NotFoundError, ExternalServiceError } from './errors'
import { logger } from './logger'

// GitHub token types for different integration levels
export enum GitHubTokenType {
  OAUTH_ACCESS = 'oauth_access',
  APP_INSTALLATION = 'app_installation',
  APP_USER = 'app_user',
  ORGANIZATION = 'organization'
}

export interface GitHubTokenData {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
  tokenType: GitHubTokenType
  metadata?: Record<string, unknown>
}

export class GitHubTokenManager {
  private readonly logger = logger.withContext({ service: 'github_token_manager' })

  /**
   * Store encrypted GitHub tokens for a company
   */
  async storeCompanyTokens(
    companyId: string,
    tokenData: GitHubTokenData,
    organizationLogin?: string
  ): Promise<void> {
    try {
      // Encrypt sensitive token data
      const encryptedAccessToken = encrypt(tokenData.accessToken)
      const encryptedRefreshToken = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null

      await db.gitHubIntegration.upsert({
        where: {
          companyId_tokenType: {
            companyId,
            tokenType: tokenData.tokenType
          }
        },
        update: {
          encryptedAccessToken,
          encryptedRefreshToken,
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope,
          organizationLogin,
          metadata: tokenData.metadata,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          companyId,
          tokenType: tokenData.tokenType,
          encryptedAccessToken,
          encryptedRefreshToken,
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope,
          organizationLogin,
          metadata: tokenData.metadata,
          isActive: true
        }
      })

      this.logger.info('GitHub tokens stored for company', {
        companyId,
        tokenType: tokenData.tokenType,
        organizationLogin,
        hasRefreshToken: !!tokenData.refreshToken
      })
    } catch (error) {
      this.logger.error('Failed to store GitHub tokens', error, { companyId })
      throw new ExternalServiceError('GitHub', 'Failed to store authentication tokens')
    }
  }

  /**
   * Store encrypted GitHub tokens for an employee
   */
  async storeEmployeeTokens(
    employeeId: string,
    tokenData: GitHubTokenData,
    githubUsername?: string
  ): Promise<void> {
    try {
      const encryptedAccessToken = encrypt(tokenData.accessToken)
      const encryptedRefreshToken = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null

      await db.gitHubConnection.upsert({
        where: { employeeId },
        update: {
          encryptedAccessToken,
          encryptedRefreshToken,
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope,
          githubUsername,
          isActive: true,
          lastSync: new Date(),
          updatedAt: new Date()
        },
        create: {
          employeeId,
          encryptedAccessToken,
          encryptedRefreshToken,
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope,
          githubUsername,
          isActive: true
        }
      })

      this.logger.info('GitHub tokens stored for employee', {
        employeeId,
        githubUsername,
        hasRefreshToken: !!tokenData.refreshToken
      })
    } catch (error) {
      this.logger.error('Failed to store employee GitHub tokens', error, { employeeId })
      throw new ExternalServiceError('GitHub', 'Failed to store authentication tokens')
    }
  }

  /**
   * Retrieve and decrypt GitHub tokens for a company
   */
  async getCompanyTokens(
    companyId: string,
    tokenType: GitHubTokenType = GitHubTokenType.APP_INSTALLATION
  ): Promise<GitHubTokenData | null> {
    try {
      const integration = await db.gitHubIntegration.findUnique({
        where: {
          companyId_tokenType: {
            companyId,
            tokenType
          }
        }
      })

      if (!integration || !integration.isActive) {
        return null
      }

      // Check if token is expired
      if (integration.expiresAt && integration.expiresAt < new Date()) {
        this.logger.warn('Company GitHub token has expired', {
          companyId,
          tokenType,
          expiresAt: integration.expiresAt
        })

        // Try to refresh if possible
        if (integration.encryptedRefreshToken) {
          return await this.refreshCompanyToken(companyId, tokenType)
        }

        return null
      }

      // Decrypt tokens
      const accessToken = decrypt(integration.encryptedAccessToken)
      const refreshToken = integration.encryptedRefreshToken
        ? decrypt(integration.encryptedRefreshToken)
        : undefined

      return {
        accessToken,
        refreshToken,
        expiresAt: integration.expiresAt || undefined,
        scope: integration.scope || undefined,
        tokenType: integration.tokenType as GitHubTokenType,
        metadata: integration.metadata as Record<string, unknown> || {}
      }
    } catch (error) {
      this.logger.error('Failed to retrieve company GitHub tokens', error, { companyId })
      throw new ExternalServiceError('GitHub', 'Failed to retrieve authentication tokens')
    }
  }

  /**
   * Retrieve and decrypt GitHub tokens for an employee
   */
  async getEmployeeTokens(employeeId: string): Promise<GitHubTokenData | null> {
    try {
      const connection = await db.gitHubConnection.findUnique({
        where: { employeeId }
      })

      if (!connection || !connection.isActive) {
        return null
      }

      // Check if token is expired
      if (connection.expiresAt && connection.expiresAt < new Date()) {
        this.logger.warn('Employee GitHub token has expired', {
          employeeId,
          expiresAt: connection.expiresAt
        })

        // Try to refresh if possible
        if (connection.encryptedRefreshToken) {
          return await this.refreshEmployeeToken(employeeId)
        }

        return null
      }

      // Decrypt tokens
      const accessToken = decrypt(connection.encryptedAccessToken)
      const refreshToken = connection.encryptedRefreshToken
        ? decrypt(connection.encryptedRefreshToken)
        : undefined

      return {
        accessToken,
        refreshToken,
        expiresAt: connection.expiresAt || undefined,
        scope: connection.scope || undefined,
        tokenType: GitHubTokenType.OAUTH_ACCESS,
        metadata: {}
      }
    } catch (error) {
      this.logger.error('Failed to retrieve employee GitHub tokens', error, { employeeId })
      throw new ExternalServiceError('GitHub', 'Failed to retrieve authentication tokens')
    }
  }

  /**
   * Refresh expired company tokens
   */
  async refreshCompanyToken(
    companyId: string,
    tokenType: GitHubTokenType
  ): Promise<GitHubTokenData | null> {
    try {
      const integration = await db.gitHubIntegration.findUnique({
        where: {
          companyId_tokenType: {
            companyId,
            tokenType
          }
        }
      })

      if (!integration?.encryptedRefreshToken) {
        throw new NotFoundError('Refresh token', companyId)
      }

      const refreshToken = decrypt(integration.encryptedRefreshToken)

      // For GitHub Apps, we need to generate new installation tokens
      if (tokenType === GitHubTokenType.APP_INSTALLATION) {
        return await this.refreshAppInstallationToken(companyId, integration.installationId!)
      }

      // For OAuth tokens, use refresh token flow
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.github.oauth.clientId,
          client_secret: config.github.oauth.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new ExternalServiceError('GitHub', 'Token refresh failed')
      }

      const data = await response.json()

      if (data.error) {
        throw new ExternalServiceError('GitHub', data.error_description || data.error)
      }

      const newTokenData: GitHubTokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
        scope: data.scope,
        tokenType
      }

      // Store the refreshed tokens
      await this.storeCompanyTokens(companyId, newTokenData)

      this.logger.info('Company GitHub token refreshed', { companyId, tokenType })
      return newTokenData
    } catch (error) {
      this.logger.error('Failed to refresh company GitHub token', error, { companyId })

      // Deactivate the integration if refresh fails
      await this.deactivateCompanyIntegration(companyId, tokenType)

      return null
    }
  }

  /**
   * Refresh GitHub App installation token
   */
  private async refreshAppInstallationToken(
    companyId: string,
    installationId: number
  ): Promise<GitHubTokenData | null> {
    try {
      // Generate new installation token using GitHub App private key
      const { App } = await import('@octokit/app')

      const app = new App({
        appId: config.github.app.id,
        privateKey: config.github.app.privateKey,
      })

      const installation = await app.getInstallationOctokit(installationId)
      const { data: tokenData } = await installation.rest.apps.createInstallationAccessToken({
        installation_id: installationId
      })

      const newTokenData: GitHubTokenData = {
        accessToken: tokenData.token,
        expiresAt: new Date(tokenData.expires_at),
        tokenType: GitHubTokenType.APP_INSTALLATION,
        metadata: {
          installationId,
          permissions: tokenData.permissions
        }
      }

      await this.storeCompanyTokens(companyId, newTokenData)

      this.logger.info('GitHub App installation token refreshed', { companyId, installationId })
      return newTokenData
    } catch (error) {
      this.logger.error('Failed to refresh GitHub App installation token', error, {
        companyId,
        installationId
      })
      return null
    }
  }

  /**
   * Refresh employee OAuth tokens
   */
  async refreshEmployeeToken(employeeId: string): Promise<GitHubTokenData | null> {
    // Similar implementation to refreshCompanyToken but for employees
    // Implementation details similar to above...
    return null // Placeholder
  }

  /**
   * Revoke and deactivate company GitHub integration
   */
  async deactivateCompanyIntegration(
    companyId: string,
    tokenType: GitHubTokenType
  ): Promise<void> {
    try {
      await db.gitHubIntegration.update({
        where: {
          companyId_tokenType: {
            companyId,
            tokenType
          }
        },
        data: {
          isActive: false,
          deactivatedAt: new Date()
        }
      })

      this.logger.info('Company GitHub integration deactivated', { companyId, tokenType })
    } catch (error) {
      this.logger.error('Failed to deactivate company GitHub integration', error, { companyId })
    }
  }

  /**
   * Revoke and deactivate employee GitHub connection
   */
  async deactivateEmployeeConnection(employeeId: string): Promise<void> {
    try {
      await db.gitHubConnection.update({
        where: { employeeId },
        data: {
          isActive: false,
          disconnectedAt: new Date()
        }
      })

      this.logger.info('Employee GitHub connection deactivated', { employeeId })
    } catch (error) {
      this.logger.error('Failed to deactivate employee GitHub connection', error, { employeeId })
    }
  }

  /**
   * Get all active company integrations
   */
  async getActiveCompanyIntegrations(companyId: string) {
    return await db.gitHubIntegration.findMany({
      where: {
        companyId,
        isActive: true
      }
    })
  }

  /**
   * Check token health and validity
   */
  async validateTokenHealth(
    companyId: string,
    tokenType: GitHubTokenType
  ): Promise<boolean> {
    try {
      const tokenData = await this.getCompanyTokens(companyId, tokenType)

      if (!tokenData) {
        return false
      }

      // Test token by making a simple API call
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      const isValid = response.ok

      this.logger.info('Token health check completed', {
        companyId,
        tokenType,
        isValid,
        status: response.status
      })

      return isValid
    } catch (error) {
      this.logger.error('Token health check failed', error, { companyId, tokenType })
      return false
    }
  }
}

// Singleton instance
export const githubTokenManager = new GitHubTokenManager()