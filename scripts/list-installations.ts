import { App } from '@octokit/app'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

async function listInstallations() {
  try {
    const app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })

    console.log('Fetching GitHub App installations...\n')

    // Get all installations for this app
    const installations = []
    for await (const { installation } of app.eachInstallation.iterator()) {
      installations.push(installation)
    }

    if (installations.length === 0) {
      console.log('No installations found for this GitHub App.')
      console.log('\nPlease complete the installation by visiting:')
      console.log(`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`)
      return
    }

    console.log(`Found ${installations.length} installation(s):\n`)

    for (const installation of installations) {
      console.log('─────────────────────────────────────')
      console.log(`Installation ID: ${installation.id}`)
      console.log(`Account: ${installation.account?.login || 'Unknown'}`)
      console.log(`Account Type: ${installation.account?.type || 'Unknown'}`)
      console.log(`Repository Selection: ${installation.repository_selection}`)
      console.log(`Installed At: ${installation.created_at}`)
      console.log(`\nCallback URL to complete setup:`)
      console.log(`${process.env.NEXTAUTH_URL}/api/github/app/install?installation_id=${installation.id}&setup_action=install`)
      console.log('─────────────────────────────────────\n')
    }

  } catch (error) {
    console.error('Error listing installations:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
  }
}

listInstallations()
