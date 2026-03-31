# 🗄️ Supabase Manual Setup Guide

## Before Deployment Checklist

### ✅ Step 1: Create the Reports Table

**Go to:** https://fplwjefotfbsnoykqdal.supabase.co/project/_/sql

**Click:** "SQL Editor" in the left sidebar

**Copy and paste this SQL:**

```sql
-- Create reports table for DDR Genius
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  reportId TEXT UNIQUE NOT NULL,
  propertyInfo JSONB,
  visualObservations JSONB,
  thermalReadings JSONB,
  sampleImages JSONB,
  thermalImages JSONB,
  mergedData JSONB,
  analytics JSONB,
  status TEXT DEFAULT 'completed',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_reportId ON reports(reportId);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_createdAt ON reports(createdAt DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for demo)
CREATE POLICY "Allow public read access" ON reports
  FOR SELECT
  USING (true);

-- Create policy to allow public insert access (for demo)
CREATE POLICY "Allow public insert access" ON reports
  FOR INSERT
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE
    ON reports FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Click:** "Run" (or press Ctrl+Enter)

**Expected Result:** ✅ "Success. No rows returned"

---

### ✅ Step 2: Verify Table Creation

**Go to:** Table Editor (left sidebar)

**Check:** You should see `reports` table listed

**Click on it** and verify these columns exist:
- ✅ id (bigint)
- ✅ reportId (text)
- ✅ propertyInfo (jsonb)
- ✅ visualObservations (jsonb)
- ✅ thermalReadings (jsonb)
- ✅ sampleImages (jsonb)
- ✅ thermalImages (jsonb)
- ✅ mergedData (jsonb)
- ✅ analytics (jsonb)
- ✅ status (text)
- ✅ createdAt (timestamp)
- ✅ updatedAt (timestamp)

---

### ✅ Step 3: Verify Row Level Security (RLS)

**Go to:** Authentication → Policies

**Check:** You should see two policies for `reports` table:
1. ✅ "Allow public read access"
2. ✅ "Allow public insert access"

**If not visible:**
- Go to Table Editor → reports → click "Enable RLS" button
- Then go to Policies and add the two policies manually

---

### ✅ Step 4: Test the Connection (Optional but Recommended)

**Go to:** API (left sidebar) → API Docs

**Find:** "reports" in the list

**Try a test query:**
```bash
curl 'https://fplwjefotfbsnoykqdal.supabase.co/rest/v1/reports?select=*' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A"
```

**Expected:** Empty array `[]` (table is empty but accessible)

---

### ⚠️ Important Notes

#### For Production Deployment:

1. **Update RLS Policies** (Current policies allow public access - fine for demo):
   ```sql
   -- For production, restrict to authenticated users:
   DROP POLICY "Allow public read access" ON reports;
   DROP POLICY "Allow public insert access" ON reports;
   
   -- Add authenticated-only policies
   CREATE POLICY "Authenticated users can read" ON reports
     FOR SELECT
     USING (auth.role() = 'authenticated');
   
   CREATE POLICY "Authenticated users can insert" ON reports
     FOR INSERT
     WITH CHECK (auth.role() = 'authenticated');
   ```

2. **Set up Authentication** (if needed):
   - Go to Authentication → Settings
   - Enable your preferred auth method (Email, Google, etc.)
   - Update frontend to use Supabase Auth

3. **Enable Realtime** (optional):
   - Go to Database → Replication
   - Enable replication for `reports` table
   - Useful for live dashboard updates

4. **Backup Policy**:
   - Go to Settings → Database
   - Enable Point-in-Time Recovery (PITR)
   - Set backup retention period

---

### 🧪 Quick Verification Script

Run this from your terminal to verify setup:

```bash
curl -X POST 'https://fplwjefotfbsnoykqdal.supabase.co/rest/v1/reports' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "reportId": "test-123",
    "status": "test",
    "propertyInfo": {"type": "Flat"},
    "mergedData": {"test": true}
  }'
```

**Expected:** Returns the inserted row with an `id`

**Then delete the test row:**
```bash
curl -X DELETE 'https://fplwjefotfbsnoykqdal.supabase.co/rest/v1/reports?reportId=eq.test-123' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbHdqZWZvdGZic25veWtxZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTg0MjgsImV4cCI6MjA5MDUzNDQyOH0.MxAfPxkYU4hIKQxYaKIAcnvcLtluTya0zmsoAAc6T_A"
```

---

### ✅ Checklist Summary

Before deploying, make sure:

- [ ] SQL migration executed successfully
- [ ] `reports` table visible in Table Editor
- [ ] All 12 columns present
- [ ] Indexes created (check in Database → Indexes)
- [ ] RLS policies active
- [ ] Test insert/read works (optional)

---

### 🚨 Common Issues & Solutions

#### Issue 1: "relation 'reports' does not exist"
**Solution:** Run the SQL migration in SQL Editor again

#### Issue 2: "permission denied for table reports"
**Solution:** Check RLS policies are created and enabled

#### Issue 3: "could not connect to database"
**Solution:** Verify your Supabase project is active (not paused)

#### Issue 4: Slow queries
**Solution:** Indexes should auto-create. Check Database → Indexes

---

### 📞 Need Help?

**Supabase Dashboard:** https://fplwjefotfbsnoykqdal.supabase.co

**Documentation:** https://supabase.com/docs

**Support:** support@supabase.com

---

**Made by Gaurav Agrawal** 🚀
