-- Add brand fingerprint tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_fingerprint_analyzed_at TIMESTAMPTZ;
