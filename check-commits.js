#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentCommits() {
  console.log('🔍 Checking recent commits in database...\n');

  try {
    const recentCommits = await prisma.commit.findMany({
      orderBy: { authorDate: 'desc' },
      take: 10,
      include: {
        repository: {
          select: {
            fullName: true,
            name: true
          }
        }
      }
    });

    if (recentCommits.length === 0) {
      console.log('❌ No commits found in database');
      return;
    }

    console.log(`✅ Found ${recentCommits.length} recent commits:\n`);
    console.log('═'.repeat(100));

    recentCommits.forEach((commit, index) => {
      const shortSha = commit.sha.substring(0, 7);
      const message = commit.message.split('\n')[0].substring(0, 60);
      console.log(`\n${index + 1}. [${shortSha}] ${message}`);
      console.log(`   Repository: ${commit.repository.fullName}`);
      console.log(`   Author: ${commit.authorName} <${commit.authorEmail}>`);
      console.log(`   Date: ${new Date(commit.authorDate).toLocaleString()}`);
      if (commit.additions || commit.deletions) {
        console.log(`   Changes: +${commit.additions || 0} -${commit.deletions || 0}`);
      }
    });

    console.log('\n' + '═'.repeat(100));

    // Get stats
    const [totalCommits, totalRepos] = await Promise.all([
      prisma.commit.count(),
      prisma.repository.count()
    ]);

    console.log(`\n📊 Database Statistics:`);
    console.log(`   Total Commits: ${totalCommits}`);
    console.log(`   Total Repositories: ${totalRepos}`);

    // Check for commits from the last hour (webhooks)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentWebhookCommits = await prisma.commit.count({
      where: {
        authorDate: {
          gte: oneHourAgo
        }
      }
    });

    console.log(`   Commits from last hour: ${recentWebhookCommits} ${recentWebhookCommits > 0 ? '✅ (Webhooks working!)' : ''}`);

  } catch (error) {
    console.error('❌ Error checking commits:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentCommits();
