-- Migration: AI Brain tables and columns
-- Adds brand memory, strategy reports, and post variants for the AI learning system.

-- ============================================================
-- 1. New columns on profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;

-- ============================================================
-- 2. New columns on posts
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_feedback JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS journey_stage TEXT;

-- ============================================================
-- 3. brand_memory table
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (
    memory_type IN (
      'winning_hook',
      'cta_pattern',
      'audience_reaction',
      'posting_time',
      'format_preference'
    )
  ),
  content JSONB NOT NULL,
  source_post_id UUID REFERENCES posts(id),
  performance_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_memory_user_id ON brand_memory(user_id);

ALTER TABLE brand_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brand_memory"
  ON brand_memory FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own brand_memory"
  ON brand_memory FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own brand_memory"
  ON brand_memory FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own brand_memory"
  ON brand_memory FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 4. strategy_reports table
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_reports_user_id ON strategy_reports(user_id);

ALTER TABLE strategy_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategy_reports"
  ON strategy_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own strategy_reports"
  ON strategy_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own strategy_reports"
  ON strategy_reports FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own strategy_reports"
  ON strategy_reports FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 5. post_variants table
-- ============================================================
CREATE TABLE IF NOT EXISTS post_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL,
  content TEXT NOT NULL,
  hook TEXT,
  cta TEXT,
  selected BOOLEAN DEFAULT FALSE,
  performance_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_variants ENABLE ROW LEVEL SECURITY;

-- post_variants RLS needs a join to posts to resolve ownership
CREATE POLICY "Users can view their own post_variants"
  ON post_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_variants.post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own post_variants"
  ON post_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_variants.post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own post_variants"
  ON post_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_variants.post_id AND posts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_variants.post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own post_variants"
  ON post_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_variants.post_id AND posts.user_id = auth.uid()
    )
  );
