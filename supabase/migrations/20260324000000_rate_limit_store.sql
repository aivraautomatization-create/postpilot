-- Serverless-safe rate limiting table + atomic check function
-- Replaces in-memory Map that resets on every cold start

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);

-- Atomic rate limit check: increment-or-reset in one DB round-trip
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_now BIGINT;
  v_entry RECORD;
  v_result JSON;
BEGIN
  v_now := EXTRACT(EPOCH FROM NOW()) * 1000;

  -- Try to get existing entry
  SELECT count, window_start INTO v_entry
  FROM rate_limits
  WHERE key = p_key;

  IF NOT FOUND OR (v_now - v_entry.window_start) > p_window_ms THEN
    -- New window: upsert with count=1
    INSERT INTO rate_limits (key, count, window_start, updated_at)
    VALUES (p_key, 1, v_now, NOW())
    ON CONFLICT (key)
    DO UPDATE SET count = 1, window_start = v_now, updated_at = NOW();

    v_result := json_build_object('allowed', true, 'retry_after', 0);
  ELSIF v_entry.count >= p_limit THEN
    -- Over limit
    v_result := json_build_object(
      'allowed', false,
      'retry_after', CEIL((v_entry.window_start + p_window_ms - v_now) / 1000.0)
    );
  ELSE
    -- Increment
    UPDATE rate_limits
    SET count = count + 1, updated_at = NOW()
    WHERE key = p_key;

    v_result := json_build_object('allowed', true, 'retry_after', 0);
  END IF;

  RETURN v_result;
END;
$$;

-- Cleanup function: remove entries older than 10 minutes
-- Call this on a cron (e.g. Supabase pg_cron or Inngest)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE (EXTRACT(EPOCH FROM NOW()) * 1000 - window_start) > 600000;
END;
$$;
