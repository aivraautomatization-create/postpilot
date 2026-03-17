import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ mock: true }),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn().mockReturnValue({ mock: true }),
}));

describe('getSupabase', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns null when SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    const { getSupabase } = await import('../supabase');
    expect(getSupabase()).toBeNull();
  });

  it('returns client when env vars are set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    const { getSupabase } = await import('../supabase');
    expect(getSupabase()).not.toBeNull();
  });
});

describe('getSupabaseAdmin', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns null when SERVICE_ROLE_KEY is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { getSupabaseAdmin } = await import('../supabase');
    expect(getSupabaseAdmin()).toBeNull();
  });

  it('returns admin client when env vars are set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    const { getSupabaseAdmin } = await import('../supabase');
    expect(getSupabaseAdmin()).not.toBeNull();
  });

  it('cleans up URL with prefix', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'prefix_https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    const { createClient } = await import('@supabase/supabase-js');
    const { getSupabaseAdmin } = await import('../supabase');
    getSupabaseAdmin();
    expect(vi.mocked(createClient)).toHaveBeenCalledWith(
      'https://test.supabase.co',
      expect.any(String)
    );
  });
});
