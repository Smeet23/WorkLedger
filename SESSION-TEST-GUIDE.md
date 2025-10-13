# Session Persistence Test Guide

## ⚠️ IMPORTANT: Sessions Are Domain-Specific

**Cookies only work for the domain they're set on!**

- Cookies for `localhost:3000` will NOT transfer to `google.com`
- Opening a new tab to Google.com = different domain = different cookies
- This is normal browser security behavior

## How to Properly Test Session Persistence

### ✅ Test 1: New Tab to Same App
1. **Tab 1**: Login at `http://localhost:3000/auth/signin`
2. **Tab 1**: You're now at `/dashboard` (company admin) or `/employee/dashboard` (employee)
3. **Tab 2**: Open new tab
4. **Tab 2**: Manually go to `http://localhost:3000/employee/dashboard`
5. **✅ Expected**: You should stay logged in on Tab 2

### ✅ Test 2: Direct URL in New Tab
1. **Tab 1**: Logged in at `http://localhost:3000/dashboard`
2. **Tab 2**: Copy URL `http://localhost:3000/employee/repositories`
3. **Tab 2**: Paste and visit
4. **✅ Expected**: You should stay logged in and see repositories

### ✅ Test 3: Refresh Page
1. **Tab 1**: Logged in at any page
2. Press **F5** or **Ctrl+R** to refresh
3. **✅ Expected**: You stay logged in after refresh

### ✅ Test 4: Close and Reopen Tab
1. **Tab 1**: Logged in at `/dashboard`
2. Copy the URL
3. **Close Tab 1**
4. **Open new tab** and paste the URL
5. **✅ Expected**: You stay logged in (session cookie persists)

### ✅ Test 5: Multiple Tabs Same App
1. **Tab 1**: `http://localhost:3000/dashboard`
2. **Tab 2**: `http://localhost:3000/employee/dashboard`
3. **Tab 3**: `http://localhost:3000/employee/repositories`
4. **✅ Expected**: All 3 tabs show you as logged in

## ❌ What WON'T Work

### ❌ Test: New Tab to Different Domain
1. **Tab 1**: Logged in at `http://localhost:3000/dashboard`
2. **Tab 2**: Open new tab, shows `google.com`
3. **❌ Expected**: Tab 2 shows Google, NOT your app
4. **This is normal!** Google.com can't access localhost:3000 cookies

### ❌ Test: Typing Wrong URL
1. **Tab 1**: Logged in at `http://localhost:3000/dashboard`
2. **Tab 2**: Type `localhost:3000` (missing `http://`)
3. Browser searches Google for "localhost:3000"
4. **❌ Result**: Google search results, not your app

## How to Open Your App in New Tab (Correctly)

### Method 1: Type Full URL
```
http://localhost:3000
```
**Note**: Must include `http://` prefix!

### Method 2: Middle-Click Link
1. On your dashboard, find any internal link
2. **Middle-click** (mouse wheel click) on the link
3. Opens in new tab, session persists

### Method 3: Right-Click → Open in New Tab
1. Right-click any internal link
2. Select "Open link in new tab"
3. New tab opens with session intact

### Method 4: Ctrl+Click
1. Hold **Ctrl** (Windows/Linux) or **Cmd** (Mac)
2. Click any internal link
3. Opens in new tab

### Method 5: Duplicate Tab
1. Right-click on current tab
2. Select "Duplicate"
3. Creates exact copy with session

## Verify Session Cookies

### Check Cookies in DevTools:
1. Press **F12** → **Application** tab
2. Expand **Cookies** → `http://localhost:3000`
3. Should see:
   - `next-auth.session-token` (your session)
   - `next-auth.csrf-token` (security)
   - `next-auth.callback-url` (optional)

### Session Token Details:
- **Name**: `next-auth.session-token`
- **Domain**: `localhost` or `127.0.0.1`
- **Path**: `/`
- **HttpOnly**: `✓` (Yes)
- **Secure**: `✗` (No, in development)
- **SameSite**: `Lax`

## Troubleshooting

### "I open new tab and I'm logged out"

**Check**:
- Did you navigate to `http://localhost:3000` in the new tab?
- Or did the new tab default to Google/other site?

**Solution**: Manually type `http://localhost:3000` in new tab

### "Cookies disappear in new tab"

**Check**:
- DevTools → Application → Cookies → `http://localhost:3000`
- Are you looking at cookies for the right domain?
- Google.com won't have localhost:3000 cookies!

**Solution**: Make sure you're on localhost:3000 in new tab

### "Session expires too quickly"

**Check**: `/src/lib/auth.ts` → `maxAge: 30 * 24 * 60 * 60` (30 days)

**Current setting**: Session lasts 30 days

### "Refresh logs me out"

**This is a bug**. Session should persist on refresh.

**Debug**:
```bash
# Check server logs when you refresh
# Should see:
GET /api/auth/session 200 in Xms

# Should NOT see:
JWT_SESSION_ERROR
```

## Real-World Usage

### Opening Your App from Scratch:
1. Open browser
2. New tab
3. Type: `http://localhost:3000`
4. If logged in recently (within 30 days), you'll be logged in
5. If not, you'll see the login page

### Working Across Multiple Tabs:
1. **Tab 1**: Company dashboard
2. **Tab 2**: Team members
3. **Tab 3**: Integrations
4. **All tabs**: Same session, same user, all logged in

### After Restarting Browser:
1. Close all browser windows
2. Open browser again
3. Navigate to `http://localhost:3000`
4. **If within 30 days**: Still logged in
5. **If > 30 days**: Need to login again

## Summary

**✅ Sessions persist across:**
- Multiple tabs (same domain)
- Page refreshes
- Browser restarts (if within 30 days)
- Direct URL navigation within app

**❌ Sessions DON'T persist across:**
- Different domains (localhost vs google.com)
- Different browsers
- Incognito/private windows
- After clearing cookies
- After 30 days of inactivity

**The key**: Always make sure you're navigating to `http://localhost:3000` in new tabs, not just opening a blank new tab!
