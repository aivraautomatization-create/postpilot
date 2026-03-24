CREATE TABLE IF NOT EXISTS video_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_name TEXT UNIQUE NOT NULL,
  platform TEXT,
  prompt TEXT,
  status TEXT DEFAULT 'pending',
  video_uri TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_video_ops_user ON video_operations(user_id);
ALTER TABLE video_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own video_operations"
  ON video_operations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
