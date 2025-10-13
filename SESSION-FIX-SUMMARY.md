# Session Persistence & OAuth Redirect Fixes

## Problems Solved

### 1. **Session Lost When Opening New Tabs**
**Issue**: Users were being logged out when opening a new tab or refreshing the page, losing all their integrations (GitHub, etc.)

**Root Cause**: No NextAuth middleware to maintain and validate sessions across routes

**Solution**: Created `/src/middleware.ts` with NextAuth middleware that:
- Automatically validates sessions on every request
- Protects all routes except public pages and API routes
- Redirects unauthenticated users to sign-in with proper callback URLs
- Redirects authenticated users away from auth pages to their dashboard

### 2. **GitHub OAuth Redirects to Wrong Page**
**Issue**: After connecting GitHub, users were redirected to `/employee/github` instead of the page they came from (e.g., dashboard)

**Root Cause**: No return URL tracking in the OAuth flow

**Solution**: Implemented complete return URL tracking:
- OAuth connect routes now accept a `returnUrl` query parameter
- Store the return URL in a secure cookie during OAuth initiation
- Redirect back to the stored URL after successful OAuth callback
- Clear the cookie after use

## Files Modified

### 1. **Created `/src/middleware.ts`** (NEW)
- Implements NextAuth middleware for session persistence
- Protects all routes automatically
- Handles authentication redirects with proper callback URLs

### 2. **Updated `/src/lib/auth.ts`**
- Added explicit cookie domain configuration
- Added `useSecureCookies` flag for production

### 3. **Updated OAuth Connect Routes**
   - `/src/app/api/github/connect/route.ts`
   - `/src/app/api/github/oauth/connect/route.ts`

   Both now:
   - Accept `returnUrl` query parameter
   - Store return URL in cookie for callback
   - Redirect to return URL if already connected

### 4. **Updated OAuth Callback Route**
   - `/src/app/api/github/callback/route.ts`

   Changes:
   - Retrieve return URL from cookie
   - Redirect to return URL instead of hardcoded `/employee/github`
   - Use return URL for error redirects too
   - Clean up return URL cookie

### 5. **Updated UI Components to Pass Return URLs**
   - `/src/app/employee/dashboard/page.tsx` - Pass `/employee/dashboard` as returnUrl
   - `/src/app/employee/github/page.tsx` - Pass `/employee/github` as returnUrl
   - `/src/components/forms/accept-invitation-form.tsx` - Pass `/employee/onboarding/complete` as returnUrl
   - `/src/components/github/github-integration-card.tsx` - Pass current path as returnUrl

## How It Works Now

### Session Persistence Flow
```
1. User logs in → Session cookie created
2. User opens new tab → Middleware validates session automatically
3. User navigates to any page → Middleware checks authentication
4. Session is maintained across all tabs and page loads
```

### GitHub OAuth Flow
```
1. User clicks "Connect GitHub" from Dashboard
   → Redirects to /api/github/connect?returnUrl=/employee/dashboard

2. Connect route stores returnUrl in cookie
   → Redirects to GitHub OAuth

3. User authorizes on GitHub
   → GitHub redirects back to /api/github/callback

4. Callback retrieves returnUrl from cookie
   → Syncs GitHub data
   → Redirects to /employee/dashboard (the original page)
```

## Testing Checklist

- [ ] Login and open a new tab - session should persist
- [ ] Connect GitHub from dashboard - should return to dashboard
- [ ] Connect GitHub from /employee/github page - should return to /employee/github
- [ ] Connect GitHub from onboarding - should return to onboarding/complete
- [ ] Refresh page while logged in - should stay logged in
- [ ] Try to access protected route while logged out - should redirect to sign-in with callback
- [ ] Sign in with callback URL - should redirect back to original page
- [ ] GitHub integration status should persist across tabs/refreshes

## Environment Variables Required

Ensure these are set in `.env`:
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<your-secret>"
```

## Next Steps

1. Test the session persistence by:
   - Logging in
   - Opening multiple tabs
   - Refreshing pages
   - Connecting GitHub from different pages

2. Monitor for any issues with:
   - Session cookies not persisting
   - OAuth redirects going to wrong pages
   - Users being logged out unexpectedly

3. Consider additional improvements:
   - Add session refresh mechanism for long-lived sessions
   - Implement "Remember Me" functionality
   - Add session activity logging for security
