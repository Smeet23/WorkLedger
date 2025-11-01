# 🚀 Deployment Guide - Vercel + Supabase

This guide will walk you through deploying WorkLedger to Vercel with a Supabase database.

## Prerequisites

- ✅ Supabase project created
- ✅ Database URL added to local `.env` file
- ✅ GitHub account (for Vercel integration)
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
# Navigate to your project
cd workledger-app

# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"

# Push to GitHub (if not already done)
git push origin main
```

## Step 2: Generate Required Secrets

You'll need secure secrets for production. Here are the ones generated for you:

### Required Environment Variables:

```env
# Database (from Supabase)
# ⚠️ IMPORTANT: For Vercel, use Connection Pooler (port 6543), NOT direct connection (5432)
# Get this from Supabase Dashboard → Settings → Database → Connection Pooling → Transaction mode
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true"

# Alternative format (if using pooler hostname):
# DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Authentication Secrets (generate secure random strings)
NEXTAUTH_SECRET="4cuVIXXqO8S3UIk8U5csoycDzc5hRB8qZERE1GGnfio="
ENCRYPTION_SECRET="8FHTv1O07SmiBum3AovL2mIt04m80vUV+PiFEkz2Bsw="

# App Configuration
NODE_ENV="production"
APP_URL="https://your-app.vercel.app"  # Will be set automatically
NEXTAUTH_URL="https://your-app.vercel.app"  # Will be set automatically

# GitHub Integration (required by your app config)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_APP_ID="your-github-app-id"
GITHUB_PRIVATE_KEY="your-github-private-key"
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for first time)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository:
   - If you haven't connected GitHub, click "Connect GitHub" and authorize
   - Select your `WorkLedger` repository
   - Click **"Import"**
4. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `workledger-app` (if your repo is at root, leave empty)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
5. **Add Environment Variables**:
   - Click **"Environment Variables"** section
   - Add each variable from Step 2:
     - Click **"Add"** for each variable
     - **Name**: Variable name (e.g., `DATABASE_URL`)
     - **Value**: Variable value
     - **Environment**: Select all (Production, Preview, Development)
   - **Required variables** (minimum to get started):
     ```
     DATABASE_URL
     NEXTAUTH_SECRET
     ENCRYPTION_SECRET
     GITHUB_CLIENT_ID
     GITHUB_CLIENT_SECRET
     GITHUB_APP_ID
     GITHUB_PRIVATE_KEY
     NODE_ENV=production
     ```
6. Click **"Deploy"**
7. Wait for build to complete (2-5 minutes)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your app directory
cd workledger-app

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? workledger (or your choice)
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add ENCRYPTION_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add GITHUB_APP_ID
vercel env add GITHUB_PRIVATE_KEY

# Deploy to production
vercel --prod
```

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations on your Supabase database:

```bash
# Option 1: Run migrations locally (pointing to Supabase)
cd workledger-app
DATABASE_URL="your-supabase-db-url" npx prisma migrate deploy

# Option 2: Use Vercel CLI to run in production
vercel env pull .env.production  # Get production env vars
npx prisma migrate deploy
```

Or create a one-time migration script:

```bash
# Create a temporary script
cat > migrate-prod.js << 'EOF'
require('dotenv').config({ path: '.env.production' });
const { execSync } = require('child_process');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
EOF

# Run it
node migrate-prod.js
```

## Step 5: Seed Database (Optional)

If you want to seed your production database with initial data:

```bash
# Only run once, be careful!
DATABASE_URL="your-supabase-db-url" npm run db:seed
```

## Step 6: Update APP_URL and NEXTAUTH_URL (After First Deployment)

**Important:** When you first deploy, `APP_URL` and `NEXTAUTH_URL` should be set to your Vercel deployment URL. 

**Option 1: Set them now (before first deploy)**
- Use a placeholder: `https://your-project-name.vercel.app` (replace with your actual project name)
- Or leave them empty and Vercel will set them automatically

**Option 2: Update after first deployment (recommended)**
1. After clicking "Deploy", wait for the build to complete
2. Vercel will give you a URL like `https://workledger-xxx.vercel.app`
3. Go to **Settings** → **Environment Variables**
4. Update:
   - `APP_URL` = `https://workledger-xxx.vercel.app` (your actual URL)
   - `NEXTAUTH_URL` = `https://workledger-xxx.vercel.app` (same URL)
5. Click **Redeploy** or wait for next git push

## Step 7: Configure GitHub OAuth (Important!)

Your app requires GitHub integration. Update your GitHub OAuth App:

1. Go to **GitHub** → **Settings** → **Developer settings** → **OAuth Apps**
2. Find your app and click **Edit**
3. Update **Authorization callback URL** to:
   ```
   https://your-app.vercel.app/api/github/callback
   ```
4. Update **Homepage URL** to:
   ```
   https://your-app.vercel.app
   ```
5. Save changes

## Troubleshooting

### Build Fails

- Check Vercel build logs for specific errors
- Ensure all environment variables are set
- Make sure `NODE_ENV=production` is set

### Database Connection Errors

**⚠️ IMPORTANT: For Vercel (serverless), you MUST use Supabase Connection Pooler**

The error `Can't reach database server at db.xxx.supabase.co:5432` means you're using the direct connection. Serverless functions need the pooler.

**Fix:**

1. Go to your **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **Connection Pooling** section
3. Copy the **Connection string** under **"Transaction mode"** (port 6543)
   - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
   
4. **OR** manually convert your direct connection:
   - If your direct URL is: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`
   - Change it to: `postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1`
   - **Replace port 5432 → 6543**
   - **Add query parameters:** `?pgbouncer=true&connection_limit=1`

5. Update `DATABASE_URL` in Vercel:
   - Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
   - Find `DATABASE_URL` and **edit** it
   - Replace with the pooler connection string (port 6543)
   - Make sure it's set for **Production**, **Preview**, and **Development**
   - Click **Save**

6. **Redeploy** your application:
   - Vercel Dashboard → **Deployments** → Click **⋯** on latest → **Redeploy**

**Note:** The direct connection (5432) works locally but NOT in serverless environments like Vercel.

### Prisma Errors

- Make sure `postinstall` script runs: `prisma generate`
- Run migrations: `npx prisma migrate deploy`

#### Prepared Statement "Already Exists" Error

**Error:** `prepared statement "s1" already exists` (PostgreSQL error code: 42P05)

**Cause:** This error occurs when Prisma tries to use prepared statements with connection poolers (pgBouncer) in serverless environments. pgBouncer in transaction mode doesn't support prepared statements, causing conflicts.

**CRITICAL FIX - Port Configuration:**

⚠️ **MOST IMPORTANT:** Your `DATABASE_URL` MUST use port **6543** (connection pooler), NOT port **5432** (direct connection).

1. **Go to Vercel Dashboard → Your Project → Settings → Environment Variables**
2. **Find `DATABASE_URL` and verify the port:**
   - ❌ **WRONG:** `postgresql://...@[host]:5432/...` (direct connection)
   - ✅ **CORRECT:** `postgresql://...@[host]:6543/...` (connection pooler)

3. **If using Supabase, get the pooler connection string:**
   - Go to **Supabase Dashboard** → **Settings** → **Database**
   - Scroll to **Connection Pooling** section
   - Copy the **Connection string** under **"Transaction mode"** (port 6543)
   - It should look like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

4. **The code will automatically add required parameters:**
   - `pgbouncer=true` - Tells Prisma to disable prepared statements
   - `connection_limit=1` - Limits connections per serverless function
   - Connection timeout parameters

5. **After updating the port, redeploy:**
   - Vercel Dashboard → **Deployments** → Click **⋯** on latest → **Redeploy**

**Why This Matters:**
- Port 5432 = Direct PostgreSQL connection (prepared statements enabled) → ❌ Causes errors
- Port 6543 = pgBouncer connection pooler (transaction mode) → ✅ Works with serverless

**Note:** The code in `src/lib/db.ts` automatically adds `pgbouncer=true` and other parameters, but **you must use port 6543**. If you use port 5432, the code will still try to add parameters, but pgBouncer won't be involved, and prepared statement conflicts will persist.

### Authentication Not Working

- Verify `NEXTAUTH_URL` matches your Vercel domain exactly
- Check `NEXTAUTH_SECRET` is set and consistent
- Ensure GitHub OAuth callback URL is updated

## Next Steps

1. ✅ Set up custom domain (optional) in Vercel settings
2. ✅ Configure GitHub webhooks for automatic deployments
3. ✅ Set up monitoring and error tracking
4. ✅ Enable database backups in Supabase

## Useful Commands

```bash
# View Vercel deployments
vercel ls

# View logs
vercel logs

# Open project in browser
vercel open

# Pull environment variables
vercel env pull .env.production
```

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs

