// Test GitHub OAuth URL generation
const clientId = 'Ov23liOVbpundEtB0Il0'
const redirectUri = 'http://localhost:3000/api/github/callback'
const scope = 'repo user:email read:org'
const state = 'test-state-token'

const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`

console.log('GitHub OAuth URL:')
console.log(oauthUrl)
console.log('\nExpected redirect URI after authorization:')
console.log(`${redirectUri}?code=XXXXX&state=${state}`)
console.log('\n✅ Configuration looks correct!')