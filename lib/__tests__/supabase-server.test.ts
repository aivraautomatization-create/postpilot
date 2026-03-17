import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

describe('getSupabaseServer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns null when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { getSupabaseServer } = await import('../supabase-server');
    const result = await getSupabaseServer();
    expect(result).toBeNull();
  });

  it('setAll does not throw when cookies are read-only (Server Component context)', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn().mockImplementation(() => {
        throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
      }),
    };

    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    // Capture the cookie config passed to createServerClient
    let capturedCookieConfig: any;
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      capturedCookieConfig = options?.cookies;
      return {} as any;
    });

    const { getSupabaseServer } = await import('../supabase-server');
    await getSupabaseServer();

    // setAll should NOT throw even when cookieStore.set throws
    expect(() => {
      capturedCookieConfig.setAll([
        { name: 'sb-token', value: 'abc123', options: {} },
      ]);
    }).not.toThrow();
  });

  it('setAll successfully sets cookies when in Route Handler context', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(), // doesn't throw in Route Handlers
    };

    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    let capturedCookieConfig: any;
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      capturedCookieConfig = options?.cookies;
      return {} as any;
    });

    const { getSupabaseServer } = await import('../supabase-server');
    await getSupabaseServer();

    capturedCookieConfig.setAll([
      { name: 'sb-token', value: 'abc123', options: {} },
    ]);

    expect(mockCookieStore.set).toHaveBeenCalledWith('sb-token', 'abc123', {});
  });
});
