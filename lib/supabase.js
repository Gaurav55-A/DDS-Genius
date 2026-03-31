import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to initialize reports table
export async function initializeReportsTable() {
  // Check if table exists by attempting a simple query
  const { error } = await supabase
    .from('reports')
    .select('reportId')
    .limit(1);
  
  if (error && error.message.includes('relation "reports" does not exist')) {
    console.log('Reports table needs to be created in Supabase dashboard');
    return false;
  }
  
  return true;
}

/**
 * Supabase Table Schema for 'reports':
 * 
 * CREATE TABLE reports (
 *   id BIGSERIAL PRIMARY KEY,
 *   reportId TEXT UNIQUE NOT NULL,
 *   propertyInfo JSONB,
 *   visualObservations JSONB,
 *   thermalReadings JSONB,
 *   sampleImages JSONB,
 *   thermalImages JSONB,
 *   mergedData JSONB,
 *   analytics JSONB,
 *   status TEXT DEFAULT 'completed',
 *   createdAt TIMESTAMP DEFAULT NOW(),
 *   updatedAt TIMESTAMP DEFAULT NOW()
 * );
 * 
 * CREATE INDEX idx_reports_reportId ON reports(reportId);
 * CREATE INDEX idx_reports_status ON reports(status);
 * CREATE INDEX idx_reports_createdAt ON reports(createdAt DESC);
 */
