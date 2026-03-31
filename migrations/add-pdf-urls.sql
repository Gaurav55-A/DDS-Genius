-- ============================================
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- Go to: Dashboard > SQL Editor > New Query
-- Paste everything below and click "Run"
-- ============================================

-- 1. Add the PDF URL columns to the reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS visualpdfurl TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS thermalpdfurl TEXT;

-- 2. Allow anyone to upload files to the report-images bucket (needed for your API)
CREATE POLICY "Allow public uploads to report-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'report-images');

-- 3. Allow anyone to read/download files from the report-images bucket
CREATE POLICY "Allow public reads from report-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'report-images');

-- 4. Allow updates (upsert) to existing files
CREATE POLICY "Allow public updates to report-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'report-images');
