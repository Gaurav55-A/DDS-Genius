# 🎯 Supabase Setup - Quick Reference

## 📋 MANDATORY Steps Before Deployment

### Step 1: Run SQL Migration ⚡ (5 minutes)

**URL:** https://fplwjefotfbsnoykqdal.supabase.co/project/_/sql

**Action:** Copy SQL from `/app/supabase_migration.sql` → Paste → Run

**Result:** ✅ "Success. No rows returned"

---

### Step 2: Verify Table Created ✅ (1 minute)

**URL:** https://fplwjefotfbsnoykqdal.supabase.co/project/_/editor

**Check:** See `reports` table with 12 columns

---

### Step 3: Check Policies 🔐 (1 minute)

**URL:** https://fplwjefotfbsnoykqdal.supabase.co/project/_/auth/policies

**Check:** Two policies exist:
1. "Allow public read access"
2. "Allow public insert access"

---

## 🧪 Quick Test (Optional)

### Test from your app:

```bash
curl http://localhost:3000/api/root
```

**Expected:**
```json
{
  "message": "DDR Genius API",
  "database": "Supabase"
}
```

---

## ⚠️ What if I skip this?

**App will crash with:**
```
Error: Could not find the table 'public.reports' in the schema cache
```

**Fix:** Go back and run Step 1

---

## 🎉 That's It!

Once SQL is executed, your app is ready to:
- ✅ Upload PDFs
- ✅ Save reports to Supabase
- ✅ Generate DDR with AI
- ✅ Export professional PDFs

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| SQL Editor | https://fplwjefotfbsnoykqdal.supabase.co/project/_/sql |
| Table Editor | https://fplwjefotfbsnoykqdal.supabase.co/project/_/editor |
| API Docs | https://fplwjefotfbsnoykqdal.supabase.co/project/_/api |
| Settings | https://fplwjefotfbsnoykqdal.supabase.co/project/_/settings |

---

**Made by Gaurav Agrawal** ⚡
