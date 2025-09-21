const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testSync() {
  try {
    // Get GitHub connection
    const connection = await prisma.gitHubConnection.findFirst({
      where: { isActive: true }
    })

    if (connection) {
      console.log('GitHub Connection Found:')
      console.log('- Username:', connection.githubUsername)
      console.log('- Last Sync:', connection.lastSync)
    }

    // Count repositories
    const repoCount = await prisma.repository.count()
    console.log(`\nTotal repositories: ${repoCount}`)

    // Count commits
    const commitCount = await prisma.commit.count()
    console.log(`Total commits: ${commitCount}`)

    // Get repositories with commit counts
    const reposWithCommits = await prisma.repository.findMany({
      include: {
        _count: {
          select: { commits: true }
        }
      },
      take: 5,
      orderBy: {
        totalCommits: 'desc'
      }
    })

    console.log('\nTop 5 repositories by commit count:')
    reposWithCommits.forEach(repo => {
      console.log(`- ${repo.name}: ${repo._count.commits} commits (stored: ${repo.totalCommits})`)
    })

    // Check for repositories without commits
    const reposNoCommits = await prisma.repository.findMany({
      where: {
        commits: {
          none: {}
        }
      },
      select: {
        name: true,
        isPrivate: true
      }
    })

    if (reposNoCommits.length > 0) {
      console.log(`\nRepositories without commits (${reposNoCommits.length}):`)
      reposNoCommits.slice(0, 10).forEach(repo => {
        console.log(`- ${repo.name}${repo.isPrivate ? ' (private)' : ''}`)
      })
    }

    // Get latest commits
    const latestCommits = await prisma.commit.findMany({
      take: 5,
      orderBy: {
        authorDate: 'desc'
      },
      include: {
        repository: {
          select: {
            name: true
          }
        }
      }
    })

    console.log('\nLatest 5 commits:')
    latestCommits.forEach(commit => {
      const message = commit.message.split('\n')[0].substring(0, 60)
      console.log(`- [${commit.repository.name}] ${message}...`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

console.log('Testing GitHub Sync Data...')
console.log('=' .repeat(50))
testSync();