-- DDR Genius Reports Table Schema for Supabase
-- Run this in Supabase SQL Editor: https://fplwjefotfbsnoykqdal.supabase.co

-- Create reports table
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
