const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function showCommits() {
  try {
    console.log('='.repeat(80))
    console.log('DATABASE COMMIT ANALYSIS')
    console.log('='.repeat(80))

    // 1. Total commits in database
    const totalCommits = await prisma.commit.count()
    console.log(`\n📊 TOTAL COMMITS IN DATABASE: ${totalCommits}`)

    // 2. Show sample commits with details
    const sampleCommits = await prisma.commit.findMany({
      take: 10,
      orderBy: { authorDate: 'desc' },
      include: {
        repository: {
          select: {
            name: true,
            fullName: true
          }
        }
      }
    })

    console.log('\n📝 LATEST 10 COMMITS:')
    console.log('-'.repeat(80))
    sampleCommits.forEach((commit, index) => {
      console.log(`\n${index + 1}. Repository: ${commit.repository.name}`)
      console.log(`   SHA: ${commit.sha}`)
      console.log(`   Message: ${commit.message.split('\n')[0].substring(0, 60)}...`)
      console.log(`   Author: ${commit.authorName} (${commit.authorEmail})`)
      console.log(`   Date: ${commit.authorDate.toISOString()}`)
      console.log(`   Changes: +${commit.additions} -${commit.deletions} (${commit.filesChanged} files)`)
      if (commit.htmlUrl) {
        console.log(`   URL: ${commit.htmlUrl}`)
      }
    })

    // 3. Commits per repository
    const reposWithCommits = await prisma.repository.findMany({
      include: {
        _count: {
          select: { commits: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('\n📁 COMMITS PER REPOSITORY:')
    console.log('-'.repeat(80))
    let totalRepoCommits = 0
    reposWithCommits.forEach(repo => {
      if (repo._count.commits > 0) {
        console.log(`${repo.name.padEnd(30)} : ${repo._count.commits} commits`)
        totalRepoCommits += repo._count.commits
      }
    })

    console.log('-'.repeat(80))
    console.log(`TOTAL: ${totalRepoCommits} commits across ${reposWithCommits.filter(r => r._count.commits > 0).length} repositories`)

    // 4. Repositories without commits
    const reposWithoutCommits = reposWithCommits.filter(r => r._count.commits === 0)
    if (reposWithoutCommits.length > 0) {
      console.log('\n⚠️  REPOSITORIES WITHOUT COMMITS:')
      console.log('-'.repeat(80))
      reposWithoutCommits.forEach(repo => {
        console.log(`- ${repo.name}${repo.isPrivate ? ' (private)' : ''}`)
      })
      console.log(`\nTotal: ${reposWithoutCommits.length} repositories need syncing`)
    }

    // 5. Database table info
    console.log('\n💾 DATABASE LOCATION:')
    console.log('-'.repeat(80))
    console.log('Database: PostgreSQL (workledger_db)')
    console.log('Table: "Commit"')
    console.log('Schema location: prisma/schema.prisma (lines 591-623)')
    console.log('\nTo view in Prisma Studio: npx prisma studio')
    console.log('Then navigate to: http://localhost:5555 → Commit table')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showCommits()