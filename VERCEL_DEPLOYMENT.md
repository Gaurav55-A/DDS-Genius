# 🔺 Vercel Deployment Guide - DDR Genius

## Quick Start (5 minutes)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
cd /app
vercel --prod
```

**That's it for the first deploy!** But you need to add environment variables next.

---

## Step 4: Add Environment Variables

### Option A: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project (DDR-Analytics or similar)
3. Click **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fplwjefotfbsnoykqdal.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A` | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | `sk-emergent-80c2fDc2e6e91D7778` | Production, Preview, Development |
| `EMERGENT_LLM_KEY` | `sk-emergent-80c2fDc2e6e91D7778` | Production, Preview, Development |

5. Click **Save**

### Option B: Via Vercel CLI

```bash
# Navigate to your project
cd /app

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://fplwjefotfbsnoykqdal.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A

vercel env add ANTHROPIC_API_KEY production
# Paste: sk-emergent-80c2fDc2e6e91D7778

vercel env add EMERGENT_LLM_KEY production
# Paste: sk-emergent-80c2fDc2e6e91D7778
```

---

## Step 5: Redeploy

After adding environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or just push to GitHub (if you have Git integration enabled).

---

## Step 6: Test Your Deployment

Once deployed, Vercel will give you a URL like: `https://ddr-analytics.vercel.app`

### Test the deployment:

1. **Homepage:**
   ```bash
   curl https://your-app.vercel.app
   ```

2. **API Health:**
   ```bash
   curl https://your-app.vercel.app/api/root
   ```
   
   Expected response:
   ```json
   {
     "message": "DDR Genius API",
     "version": "1.0.0",
     "database": "Supabase"
   }
   ```

3. **Upload PDFs:**
   - Visit your Vercel URL
   - Upload sample report and thermal images
   - Generate DDR report
   - Export PDF

---

## ⚠️ Puppeteer Configuration for Vercel

Vercel has specific requirements for Puppeteer. If PDF generation fails:

### Add to `package.json`:

```json
{
  "scripts": {
    "postinstall": "node -e \"try { require('puppeteer').launch({ args: ['--no-sandbox'] }) } catch (e) {}\""
  }
}
```

### Or use `@sparticuz/chromium` (Vercel-optimized):

```bash
yarn add @sparticuz/chromium puppeteer-core
```

Then update `lib/pdf-generator-puppeteer.js`:

```javascript
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

---

## 📊 Monitor Your Deployment

### Vercel Dashboard

- **Deployments:** https://vercel.com/dashboard/deployments
- **Logs:** Click your deployment → **Functions** tab → View logs
- **Analytics:** Enable in Settings for traffic insights

### Supabase Dashboard

- **Data:** https://fplwjefotfbsnoykqdal.supabase.co/project/_/editor
- **API Logs:** See request activity
- **Performance:** Monitor query performance

---

## 🔧 Troubleshooting

### Issue 1: "Table not found" error

**Problem:** Supabase environment variables not set correctly

**Solution:**
```bash
# Verify env vars are set
vercel env ls

# If missing, add them via dashboard or CLI
```

### Issue 2: PDF generation timeout

**Problem:** Puppeteer/Chromium not compatible with Vercel

**Solution:** Use `@sparticuz/chromium` (see above)

### Issue 3: Build fails

**Problem:** Missing dependencies or build errors

**Solution:**
```bash
# Check build logs in Vercel dashboard
# Usually need to:
yarn install
yarn build
# Locally first to catch errors
```

### Issue 4: AI API calls fail

**Problem:** API key not set or invalid

**Solution:** Verify `ANTHROPIC_API_KEY` is set correctly in Vercel environment variables

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables added in Vercel
- [ ] Successful deployment (no errors)
- [ ] API health check passes
- [ ] Test upload flow works
- [ ] PDF export generates correctly
- [ ] Supabase receives data
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled (optional)

---

## 🚀 Connect to GitHub (Optional)

For automatic deployments on every push:

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Git**
3. Connect to: https://github.com/Gaurav55-A/DDR-Analytics.git
4. Enable automatic deployments
5. Every push to `main` will auto-deploy!

---

## 🎉 You're Live!

Once deployed, your DDR Genius platform will be available at:
```
https://your-project-name.vercel.app
```

Share the URL and start processing inspection reports! 🚀

**Made by Gaurav Agrawal** ✨
