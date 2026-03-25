-- Add columns that the codebase references but are missing from the profiles table
-- These were likely added via Supabase Dashboard SQL Editor and not tracked in migrations

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latest_strategy JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_posts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_pillars JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_status TEXT;

-- Ensure user_streaks table exists (referenced by dashboard layout)
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_post_date DATE,
  total_posts_all_time INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Idempotent policies (drop + create to avoid conflicts)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own streaks" ON user_streaks;
  DROP POLICY IF EXISTS "Users can upsert own streaks" ON user_streaks;

  CREATE POLICY "Users can read own streaks"
    ON user_streaks FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can upsert own streaks"
    ON user_streaks FOR ALL
    USING (auth.uid() = user_id);
END $$;

-- Add scheduled_for column to posts if missing (used by calendar/scheduling features)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
