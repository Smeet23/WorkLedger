#!/usr/bin/env node

const crypto = require('crypto');
const https = require('https');

// Configuration
const WEBHOOK_URL = 'https://3fe827bb2b12.ngrok-free.app/api/github/webhooks';
const WEBHOOK_SECRET = '83debc469d122d19ba6513b24c7934fa66398813a5e6d77dc7dfa388ef31382c';

// Test payload - Push event
const pushPayload = {
  ref: 'refs/heads/main',
  before: '0000000000000000000000000000000000000000',
  after: 'abc123def456',
  repository: {
    id: 123456789,
    name: 'test-repo',
    full_name: 'test-org/test-repo',
    private: false
  },
  pusher: {
    name: 'testuser',
    email: 'testuser@example.com'
  },
  commits: [
    {
      id: 'abc123def456',
      message: 'Test commit from webhook test',
      timestamp: new Date().toISOString(),
      author: {
        name: 'Test User',
        email: 'testuser@example.com'
      }
    }
  ],
  installation: {
    id: 12345
  }
};

// Installation event payload
const installationPayload = {
  action: 'created',
  installation: {
    id: 12345,
    account: {
      login: 'test-org',
      type: 'Organization'
    }
  },
  repositories: [
    {
      id: 123456789,
      name: 'test-repo',
      full_name: 'test-org/test-repo'
    }
  ]
};

// Pull Request event payload
const pullRequestPayload = {
  action: 'opened',
  number: 1,
  pull_request: {
    number: 1,
    title: 'Test PR from webhook',
    user: {
      login: 'testuser'
    },
    state: 'open',
    merged: false
  },
  repository: {
    id: 123456789,
    name: 'test-repo',
    full_name: 'test-org/test-repo'
  },
  installation: {
    id: 12345
  }
};

function signPayload(payload) {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

function sendWebhook(eventType, payload) {
  const payloadString = JSON.stringify(payload, null, 2);
  const signature = signPayload(payloadString);
  const deliveryId = crypto.randomUUID();

  console.log(`\n🚀 Sending ${eventType} webhook...`);
  console.log(`Delivery ID: ${deliveryId}`);
  console.log(`Signature: ${signature}`);
  console.log(`Payload:\n${payloadString}\n`);

  const url = new URL(WEBHOOK_URL);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString),
      'X-GitHub-Event': eventType,
      'X-GitHub-Delivery': deliveryId,
      'X-Hub-Signature-256': signature,
      'User-Agent': 'GitHub-Hookshot/webhook-test'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`\n✅ Response Status: ${res.statusCode}`);
      console.log(`Response Headers:`, res.headers);
      console.log(`Response Body:`, data);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`\n✅ Webhook test PASSED for ${eventType}`);
      } else {
        console.log(`\n❌ Webhook test FAILED for ${eventType}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`\n❌ Error sending webhook:`, error);
  });

  req.write(payloadString);
  req.end();
}

// Main
const eventType = process.argv[2] || 'push';

console.log('='.repeat(60));
console.log('GitHub Webhook Test Script');
console.log('='.repeat(60));

switch (eventType) {
  case 'push':
    sendWebhook('push', pushPayload);
    break;
  case 'installation':
    sendWebhook('installation', installationPayload);
    break;
  case 'pull_request':
    sendWebhook('pull_request', pullRequestPayload);
    break;
  default:
    console.log(`\nUsage: node test-webhook.js [push|installation|pull_request]\n`);
    console.log('Available event types:');
    console.log('  - push          : Test push event (commits)');
    console.log('  - installation  : Test installation event');
    console.log('  - pull_request  : Test pull request event');
    console.log('\nExample: node test-webhook.js push');
    process.exit(1);
}
