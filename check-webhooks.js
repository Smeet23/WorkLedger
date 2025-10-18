#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentWebhooks() {
  console.log('🔍 Checking recent webhooks...\n');

  try {
    const recentWebhooks = await prisma.gitHubWebhook.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        action: true,
        githubDeliveryId: true,
        processed: true,
        errorMessage: true,
        receivedAt: true,
        processedAt: true
      }
    });

    if (recentWebhooks.length === 0) {
      console.log('❌ No webhooks found in database');
      console.log('\nPossible reasons:');
      console.log('1. Webhook URL not configured in GitHub App settings');
      console.log('2. Webhook secret mismatch');
      console.log('3. Network/firewall blocking webhook delivery');
      console.log('4. GitHub App not installed on the repository');
      return;
    }

    console.log(`✅ Found ${recentWebhooks.length} recent webhooks:\n`);
    console.log('═'.repeat(80));

    recentWebhooks.forEach((webhook, index) => {
      console.log(`\n${index + 1}. Event: ${webhook.eventType}${webhook.action ? ` (${webhook.action})` : ''}`);
      console.log(`   Delivery ID: ${webhook.githubDeliveryId}`);
      console.log(`   Processed: ${webhook.processed ? '✅ Yes' : '❌ No'}`);
      console.log(`   Received: ${webhook.receivedAt.toLocaleString()}`);
      if (webhook.processedAt) {
        console.log(`   Processed At: ${webhook.processedAt.toLocaleString()}`);
      }
      if (webhook.errorMessage) {
        console.log(`   ⚠️  Error: ${webhook.errorMessage}`);
      }
    });

    console.log('\n' + '═'.repeat(80));

    // Check for push events specifically
    const pushEvents = recentWebhooks.filter(w => w.eventType === 'push');
    if (pushEvents.length > 0) {
      console.log(`\n🎯 Found ${pushEvents.length} push event(s) - Your test was successful!`);
    } else {
      console.log('\n⚠️  No push events found yet. Wait a few seconds and try again.');
    }

  } catch (error) {
    console.error('❌ Error checking webhooks:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentWebhooks();
