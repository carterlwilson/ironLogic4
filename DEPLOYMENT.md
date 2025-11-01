# IronLogic4 Deployment Guide

This guide covers deploying the IronLogic4 monorepo to preprod using the recommended cloud stack.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                        │
│                  (Shared Database)                       │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                  ┌────────┼────────┐
                  │        │        │
         ┌────────▼──┐  ┌──▼─────┐  ┌─▼────────┐
         │  Railway  │  │ Vercel │  │  Vercel  │
         │  (Server) │  │(Client)│  │ (Mobile) │
         └───────────┘  └────────┘  └──────────┘
```

## Services Used

- **Database**: MongoDB Atlas (M0 Free Tier)
- **Backend**: Railway
- **Client**: Vercel
- **Mobile**: Vercel

## Prerequisites

1. GitHub account with this repository
2. MongoDB Atlas account
3. Railway account
4. Vercel account

---

## Step 1: MongoDB Atlas Setup

### Create Database Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **"Build a Database"**
4. Select **"M0 Free"** tier
5. Choose your preferred cloud provider and region
6. Name your cluster (e.g., `ironlogic-cluster`)
7. Click **"Create"**

### Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `ironlogic_user` (or your choice)
5. Password: Generate a secure password (save this!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For preprod, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Note: For production, use Railway's specific IPs
4. Click **"Confirm"**

### Get Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **"Node.js"**, Version: **"5.5 or later"**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your database username
7. Replace `<password>` with your database password
8. Add database name after `.net/`: `ironlogic_preprod`
9. Final string should look like:
   ```
   mongodb+srv://ironlogic_user:YOUR_PASSWORD@cluster.mongodb.net/ironlogic_preprod?retryWrites=true&w=majority
   ```

### Create Database

The database will be created automatically when your server first connects. No manual creation needed.

---

## Step 2: Railway Deployment (Server)

### Create Project

1. Go to [Railway](https://railway.app)
2. Sign up or log in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose the `ironlogic4` repository
6. Railway will detect the `railway.toml` config

### Configure Environment Variables

1. In your Railway project, click on the service
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add the following variables:

```bash
PORT=3001
NODE_ENV=preprod
MONGODB_URI=mongodb+srv://ironlogic_user:YOUR_PASSWORD@cluster.mongodb.net/ironlogic_preprod?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-string-here
JWT_EXPIRES_IN=30d
```

**To generate a secure JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Deploy

1. Railway will automatically deploy after you add variables
2. Wait for deployment to complete (check the **"Deployments"** tab)
3. Once deployed, click **"Settings"** → **"Networking"**
4. Click **"Generate Domain"** to get a public URL
5. Copy this URL (e.g., `https://ironlogic-server.railway.app`)

### Verify Deployment

1. Visit `https://your-server.railway.app/health` (if you have a health endpoint)
2. Check the **"Deployments"** tab for any errors
3. View logs in the **"Observability"** tab

---

## Step 3: Vercel Deployment (Client)

### Create Project

1. Go to [Vercel](https://vercel.com)
2. Sign up or log in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import the `ironlogic4` repository
5. Click **"Import"**

### Configure Project Settings

1. **Framework Preset**: Vite
2. **Root Directory**: Click **"Edit"** → Select `packages/client`
3. **Build Command**: `npm run build` (should be auto-detected)
4. **Output Directory**: `dist` (should be auto-detected)
5. **Install Command**: Will use the one from `vercel.json`

### Configure Environment Variables

1. Before clicking **"Deploy"**, scroll down to **"Environment Variables"**
2. Add the following:

```bash
VITE_API_URL=https://your-server.railway.app
```

Replace `your-server.railway.app` with your actual Railway domain from Step 2.

### Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Once deployed, you'll get a URL like `https://ironlogic-client.vercel.app`
4. Click **"Visit"** to view your deployed client

### Configure Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

---

## Step 4: Vercel Deployment (Mobile)

### Create Project

1. In Vercel, click **"Add New..."** → **"Project"**
2. Import the `ironlogic4` repository again (yes, again!)
3. Click **"Import"**

### Configure Project Settings

1. **Framework Preset**: Vite
2. **Root Directory**: Click **"Edit"** → Select `packages/mobile`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: Will use the one from `vercel.json`

### Configure Environment Variables

1. Add the following environment variable:

```bash
VITE_API_URL=https://your-server.railway.app
```

### Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Once deployed, you'll get a URL like `https://ironlogic-mobile.vercel.app`

### Update Railway CORS (Important!)

Now that you have both Vercel URLs, go back to Railway:

1. Open your Railway project
2. Go to **"Variables"**
3. Add or update the `CORS_ORIGIN` variable:

```bash
CORS_ORIGIN=https://ironlogic-client.vercel.app,https://ironlogic-mobile.vercel.app
```

Replace with your actual Vercel URLs. Separate multiple URLs with commas.

4. Railway will automatically redeploy with the new variable

---

## Step 5: Verify Full Stack

### Test the Client

1. Visit your client URL: `https://ironlogic-client.vercel.app`
2. Try to log in
3. Check browser console for any errors
4. Verify API calls are going to Railway server

### Test the Mobile PWA

1. Visit your mobile URL: `https://ironlogic-mobile.vercel.app`
2. Try to log in
3. Test schedule features
4. Test offline functionality (disconnect wifi and reload)

### Seed Preprod Database (Optional)

If you want to add test data to preprod:

1. Update your local `.env` to point to preprod MongoDB:
   ```bash
   MONGODB_URI=mongodb+srv://...ironlogic_preprod...
   ```
2. Run seed script locally:
   ```bash
   npm run seed -w packages/server
   ```
3. Revert your local `.env` back to local MongoDB

**⚠️ Warning**: Only do this for preprod, never for production!

---

## Deployment Workflows

### Deploy Server Only

When you make changes to `packages/server`:

1. Commit and push to GitHub
2. Railway automatically detects changes and redeploys
3. Client and Mobile are **not affected**

### Deploy Client Only

When you make changes to `packages/client`:

1. Commit and push to GitHub
2. Vercel (client) automatically detects changes and redeploys
3. Server and Mobile are **not affected**

### Deploy Mobile Only

When you make changes to `packages/mobile`:

1. Commit and push to GitHub
2. Vercel (mobile) automatically detects changes and redeploys
3. Server and Client are **not affected**

### Deploy After Shared Package Changes

When you make changes to `packages/shared`:

1. Commit and push to GitHub
2. All services will rebuild (Railway, Vercel Client, Vercel Mobile)
3. This is expected since shared code affects all packages

### Manual Redeploy

If you need to manually trigger a redeploy:

**Railway:**
1. Go to **"Deployments"** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**

**Vercel:**
1. Go to **"Deployments"** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**

---

## Environment Management

### Local Development

Use these `.env` files:
- `packages/server/.env` (from `.env.example`)
- `packages/client/.env` (from `.env.example`)
- `packages/mobile/.env` (from `.env.example`)

### Preprod

Environment variables are set in:
- Railway: Project **"Variables"** tab
- Vercel Client: Project **"Settings"** → **"Environment Variables"**
- Vercel Mobile: Project **"Settings"** → **"Environment Variables"**

### Updating Environment Variables

**Railway:**
1. Go to **"Variables"** tab
2. Edit or add variables
3. Service automatically redeploys

**Vercel:**
1. Go to **"Settings"** → **"Environment Variables"**
2. Edit or add variables
3. Click **"Redeploy"** from **"Deployments"** tab to apply changes

---

## Monitoring and Logs

### Railway (Server)

- **Logs**: Go to **"Observability"** tab
- **Metrics**: CPU, Memory, Network usage available
- **Alerts**: Can set up in **"Settings"**

### Vercel (Client & Mobile)

- **Logs**: Go to **"Deployments"** → Click deployment → **"Logs"**
- **Analytics**: Available in **"Analytics"** tab (Pro plan)
- **Real User Monitoring**: Available with Vercel Analytics

### MongoDB Atlas

- **Metrics**: Go to **"Metrics"** tab on your cluster
- **Real-time Performance**: Available in **"Performance Advisor"**
- **Alerts**: Set up in **"Alerts"**

---

## Troubleshooting

### "Cannot connect to database"

1. Check Railway logs for connection errors
2. Verify `MONGODB_URI` in Railway variables
3. Check MongoDB Atlas **"Network Access"** allows Railway IPs
4. Verify database user credentials

### "CORS error" in browser

1. Verify `CORS_ORIGIN` in Railway includes both Vercel URLs
2. Check that URLs in `CORS_ORIGIN` match exactly (no trailing slashes)
3. Verify Railway redeployed after adding `CORS_ORIGIN`

### "API calls failing"

1. Verify `VITE_API_URL` in Vercel matches Railway domain
2. Check Railway server is running (view **"Deployments"**)
3. Check browser console for specific error messages
4. Verify Railway domain is accessible: `curl https://your-server.railway.app`

### Build failures

**Railway:**
1. Check **"Deployments"** → **"Build Logs"**
2. Verify `railway.toml` build commands are correct
3. Ensure `packages/shared` builds successfully first

**Vercel:**
1. Check deployment logs
2. Verify `vercel.json` install command includes shared package build
3. Check that `packages/shared` has no TypeScript errors

### "Service worker not updating"

1. Clear browser cache
2. In DevTools, go to **"Application"** → **"Service Workers"** → **"Unregister"**
3. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
4. Check Vercel headers for service worker are correct

---

## Cost Breakdown (Preprod)

| Service | Tier | Cost |
|---------|------|------|
| MongoDB Atlas | M0 Free | $0/month |
| Railway | $5 credit/month | ~$0-5/month |
| Vercel (Client) | Hobby | $0/month |
| Vercel (Mobile) | Hobby | $0/month |
| **Total** | | **~$0-5/month** |

---

## Scaling to Production

When you're ready for production:

1. **MongoDB Atlas**: Upgrade to M10 or higher (~$60/month)
2. **Railway**: Monitor usage, costs scale with resources
3. **Vercel**: May need Pro plan for team features ($20/month)
4. **Add monitoring**: Consider Sentry, LogRocket, or similar
5. **Add CI/CD**: GitHub Actions for automated testing before deploy
6. **Custom domains**: Set up production domains
7. **SSL/TLS**: Automatically handled by all services
8. **Backups**: Enable automated backups in MongoDB Atlas

---

## Security Checklist

- [ ] MongoDB Atlas network access restricted (not 0.0.0.0/0 for production)
- [ ] JWT_SECRET is a strong random string (not the example)
- [ ] Environment variables never committed to Git
- [ ] CORS_ORIGIN only includes your actual domains
- [ ] MongoDB user has minimum required permissions
- [ ] Railway and Vercel webhooks are secured (if using)
- [ ] All services use HTTPS (automatic with Railway/Vercel)

---

## Support and Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **This Project**: Check `CLAUDE.md` for development setup

---

## Quick Reference

### Railway CLI (Optional)

Install:
```bash
npm i -g @railway/cli
```

Deploy:
```bash
railway up
```

Logs:
```bash
railway logs
```

### Vercel CLI (Optional)

Install:
```bash
npm i -g vercel
```

Deploy client:
```bash
cd packages/client
vercel --prod
```

Deploy mobile:
```bash
cd packages/mobile
vercel --prod
```

### Useful Commands

Generate JWT secret:
```bash
openssl rand -base64 32
```

Check if server is running:
```bash
curl https://your-server.railway.app
```

Test MongoDB connection locally:
```bash
mongosh "mongodb+srv://username:password@cluster.mongodb.net/ironlogic_preprod"
```

---

## Next Steps

After successful preprod deployment:

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Create a production deployment plan
4. Set up automated backups
5. Configure custom domains
6. Set up CI/CD pipeline
7. Create runbooks for common issues
