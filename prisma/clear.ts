import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting database cleanup...')
  console.log('⚠️  This will delete ALL data from the database!')

  try {
    // Delete data in order of dependencies (child tables first)
    console.log('\n📦 Clearing GitHub token audit records...')
    await prisma.gitHubTokenAudit.deleteMany()

    console.log('📦 Clearing GitHub webhooks...')
    await prisma.gitHubWebhook.deleteMany()

    console.log('📦 Clearing GitHub organization members...')
    await prisma.gitHubOrganizationMember.deleteMany()

    console.log('📦 Clearing GitHub installations...')
    await prisma.gitHubInstallation.deleteMany()

    console.log('📦 Clearing GitHub integrations...')
    await prisma.gitHubIntegration.deleteMany()

    console.log('📦 Clearing commits...')
    await prisma.commit.deleteMany()

    console.log('📦 Clearing repository activities...')
    await prisma.repositoryActivity.deleteMany()

    console.log('📦 Clearing employee repository relationships...')
    await prisma.employeeRepository.deleteMany()

    console.log('📦 Clearing repositories...')
    await prisma.repository.deleteMany()

    console.log('📦 Clearing GitHub connections...')
    await prisma.gitHubConnection.deleteMany()

    console.log('📦 Clearing GitHub activities...')
    await prisma.gitHubActivity.deleteMany()

    console.log('📦 Clearing skill evolutions...')
    await prisma.skillEvolution.deleteMany()

    console.log('📦 Clearing skill records...')
    await prisma.skillRecord.deleteMany()

    console.log('📦 Clearing certificate files...')
    await prisma.certificateFile.deleteMany()

    console.log('📦 Clearing certificates...')
    await prisma.certificate.deleteMany()

    console.log('📦 Clearing job queue...')
    await prisma.jobQueue.deleteMany()

    console.log('📦 Clearing invitations...')
    await prisma.invitation.deleteMany()

    console.log('📦 Clearing sessions...')
    await prisma.session.deleteMany()

    console.log('📦 Clearing users...')
    await prisma.user.deleteMany()

    console.log('📦 Clearing audit logs...')
    await prisma.auditLog.deleteMany()

    console.log('📦 Clearing integrations...')
    await prisma.integration.deleteMany()

    console.log('📦 Clearing employees...')
    await prisma.employee.deleteMany()

    console.log('📦 Clearing company settings...')
    await prisma.companySettings.deleteMany()

    console.log('📦 Clearing companies...')
    await prisma.company.deleteMany()

    console.log('📦 Clearing skills...')
    await prisma.skill.deleteMany()

    console.log('\n✅ Database cleared successfully!')
    console.log('💡 Run "npm run db:seed" to repopulate with sample data')
  } catch (error) {
    console.error('\n❌ Error clearing database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
