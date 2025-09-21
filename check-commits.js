const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCommits() {
  try {
    // Count repositories
    const repoCount = await prisma.repository.count()
    console.log(`Total repositories: ${repoCount}`)

    // Count commits
    const commitCount = await prisma.commit.count()
    console.log(`Total commits: ${commitCount}`)

    // Get first 5 commits
    const commits = await prisma.commit.findMany({
      take: 5,
      include: {
        repository: true
      },
      orderBy: {
        authorDate: 'desc'
      }
    })

    if (commits.length > 0) {
      console.log('\nSample commits:')
      commits.forEach(commit => {
        console.log(`- ${commit.sha.substring(0, 7)}: ${commit.message.split('\n')[0]} (${commit.repository.name})`)
      })
    }

    // Check repositories with commit counts
    const reposWithCommits = await prisma.repository.findMany({
      include: {
        _count: {
          select: { commits: true }
        }
      },
      take: 10
    })

    console.log('\nRepositories with commit counts:')
    reposWithCommits.forEach(repo => {
      console.log(`- ${repo.name}: ${repo._count.commits} commits`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCommits()