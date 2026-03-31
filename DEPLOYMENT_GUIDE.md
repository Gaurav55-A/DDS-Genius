# 🚀 DDR Genius - Production Deployment Guide

## ✅ Pre-Deployment Checklist - ALL COMPLETE!

- ✅ **Database:** Supabase configured and verified
- ✅ **AI API:** Emergent Universal Key configured
- ✅ **PDF Engine:** Puppeteer with chromium installed
- ✅ **Environment Variables:** All set in `.env`
- ✅ **GitHub:** Code pushed to main branch
- ✅ **Deployment Checks:** All passed (no blockers)
- ✅ **Dependencies:** All installed and tested

---

## 🎯 Deployment Options

### Option 1: Deploy on Emergent Platform (Recommended) ⚡

If you're using Emergent platform for deployment:

**Steps:**
1. Click the **"Deploy"** button in Emergent dashboard
2. Wait for build to complete (~3-5 minutes)
3. Get your production URL
4. Test the deployed app

**That's it!** Emergent will:
- Build your Next.js app
- Set up environment variables
- Configure services
- Provide a production URL

---

### Option 2: Deploy on Vercel 🔺

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd /app
   vercel --prod
   ```

4. **Set Environment Variables:**
   Go to Vercel Dashboard → Your Project → Settings → Environment Variables

   Add these:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fplwjefotfbsnoykqdal.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A
   ANTHROPIC_API_KEY=sk-emergent-80c2fDc2e6e91D7778
   EMERGENT_LLM_KEY=sk-emergent-80c2fDc2e6e91D7778
   ```

5. **Redeploy** after adding env vars

**Note:** Puppeteer may need additional configuration on Vercel. See: https://vercel.com/guides/puppeteer-on-vercel

---

### Option 3: Deploy on Netlify 🌐

**Steps:**

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   cd /app
   netlify deploy --prod
   ```

4. **Set Environment Variables:**
   ```bash
   netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://fplwjefotfbsnoykqdal.supabase.co"
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A"
   netlify env:set ANTHROPIC_API_KEY "sk-emergent-80c2fDc2e6e91D7778"
   netlify env:set EMERGENT_LLM_KEY "sk-emergent-80c2fDc2e6e91D7778"
   ```

---

### Option 4: Deploy on Railway 🚂

**Steps:**

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect: https://github.com/Gaurav55-A/DDR-Analytics.git
4. Add Environment Variables in Railway dashboard
5. Deploy!

---

### Option 5: Self-Hosted (VPS/Cloud) ☁️

**Requirements:**
- Node.js 18+
- PM2 or systemd for process management
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt)

**Steps:**

1. **Clone Repository:**
   ```bash
   git clone https://github.com/Gaurav55-A/DDR-Analytics.git
   cd DDR-Analytics
   ```

2. **Install Dependencies:**
   ```bash
   yarn install
   ```

3. **Set Environment Variables:**
   ```bash
   cp .env.example .env
   nano .env
   # Add your production values
   ```

4. **Build:**
   ```bash
   yarn build
   ```

5. **Start with PM2:**
   ```bash
   npm i -g pm2
   pm2 start yarn --name "ddr-genius" -- start
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **SSL with Certbot:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🧪 Post-Deployment Testing

Once deployed, test these flows:

### 1. Homepage Load
```bash
curl https://your-app-url.com
```
**Expected:** HTML with "DDR Genius" title

### 2. API Health Check
```bash
curl https://your-app-url.com/api/root
```
**Expected:**
```json
{
  "message": "DDR Genius API",
  "version": "1.0.0",
  "database": "Supabase"
}
```

### 3. Upload & Process Flow
1. Go to your-app-url.com
2. Upload sample PDFs
3. Generate report
4. Verify in Supabase: https://fplwjefotfbsnoykqdal.supabase.co/project/_/editor
5. Export PDF
6. Download and verify images render

### 4. Conflict Detection
- Upload PDFs with conflicts (Visual "dry" + Thermal < 22°C)
- Verify Rose-colored alerts appear
- Check dataConflicts array in database

---

## 📊 Monitoring

### Check Application Health

**Supabase Dashboard:**
- https://fplwjefotfbsnoykqdal.supabase.co/project/_/reports
- Monitor query performance
- Check table row count

**Application Logs:**
- Deployment platform logs
- Look for errors in PDF generation
- Check AI API call success rate

**GitHub:**
- https://github.com/Gaurav55-A/DDR-Analytics
- Monitor commits and deployments

---

## 🔧 Troubleshooting

### Issue 1: "Table not found" error
**Solution:** 
- Verify Supabase table exists
- Check environment variables are set
- See `/app/SUPABASE_SETUP_GUIDE.md`

### Issue 2: PDF export fails
**Solution:**
- Check Puppeteer/Chromium is installed
- Verify file:// paths work on platform
- Check logs for specific error

### Issue 3: AI matching timeout
**Solution:**
- Verify ANTHROPIC_API_KEY is correct
- Check Emergent balance has credits
- Review Claude API rate limits

### Issue 4: Images not rendering in PDF
**Solution:**
- Check /public/uploads directory is writable
- Verify image extraction logs
- See `/app/AI_MATCHER_REFACTOR.md`

---

## 🎯 Production Checklist

Before going live:

- [ ] Test full upload → process → export flow
- [ ] Verify conflict detection with test data
- [ ] Check Supabase table is receiving data
- [ ] Test PDF download works
- [ ] Verify images render in exported PDF
- [ ] Check "Made by Gaurav Agrawal" footer
- [ ] Test analytics dashboard
- [ ] Monitor first 10 production reports
- [ ] Set up error tracking (optional)
- [ ] Configure backups (Supabase auto-backups)

---

## 🚀 Quick Deploy Commands

**If using Emergent Platform:**
```
Just click "Deploy" button! ✅
```

**If using Vercel:**
```bash
vercel --prod
```

**If using Netlify:**
```bash
netlify deploy --prod
```

**If using Railway:**
```
Connect GitHub repo in dashboard
```

**If self-hosting:**
```bash
yarn build && pm2 start yarn --name ddr-genius -- start
```

---

## 📞 Support

**Repository:** https://github.com/Gaurav55-A/DDR-Analytics.git

**Documentation:**
- `/app/FINAL_IMPLEMENTATION_REPORT.md` - Complete overview
- `/app/AI_MATCHER_REFACTOR.md` - AI implementation
- `/app/SUPABASE_SETUP_GUIDE.md` - Database setup
- `/app/P0_FIXES_SUMMARY.md` - Bug fixes

**Supabase Dashboard:** https://fplwjefotfbsnoykqdal.supabase.co

---

## 🎉 You're Ready to Deploy!

All systems are go! Choose your deployment platform and launch! 🚀

**Made by Gaurav Agrawal** ✨
