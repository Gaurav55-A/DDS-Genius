-- Run this in your Supabase SQL Editor to add PDF URL columns
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste & Run

ALTER TABLE reports ADD COLUMN IF NOT EXISTS visualpdfurl TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS thermalpdfurl TEXT;
