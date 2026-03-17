import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    process.env.TWITTER_CLIENT_ID = 'tw_id';
    process.env.TWITTER_CLIENT_SECRET = 'tw_secret';
    process.env.LINKEDIN_CLIENT_ID = 'li_id';
    process.env.LINKEDIN_CLIENT_SECRET = 'li_secret';
    process.env.TIKTOK_CLIENT_KEY = 'tk_key';
    process.env.TIKTOK_CLIENT_SECRET = 'tk_secret';
  });

  it('refreshes Twitter token using refresh_token', async () => {
    const axios = (await import('axios')).default;
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: 'new_twitter_token', refresh_token: 'new_refresh' },
    });

    const { refreshAccessToken } = await import('../token-refresh');
    const result = await refreshAccessToken('twitter', 'old_refresh_token');

    expect(result).toEqual({
      accessToken: 'new_twitter_token',
      refreshToken: 'new_refresh',
    });
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.twitter.com/2/oauth2/token',
      expect.any(String),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('refreshes LinkedIn token using refresh_token', async () => {
    const axios = (await import('axios')).default;
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: 'new_li_token', refresh_token: 'new_li_refresh' },
    });

    const { refreshAccessToken } = await import('../token-refresh');
    const result = await refreshAccessToken('linkedin', 'old_refresh');

    expect(result).toEqual({
      accessToken: 'new_li_token',
      refreshToken: 'new_li_refresh',
    });
  });

  it('refreshes TikTok token using refresh_token', async () => {
    const axios = (await import('axios')).default;
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: 'new_tk_token', refresh_token: 'new_tk_refresh' },
    });

    const { refreshAccessToken } = await import('../token-refresh');
    const result = await refreshAccessToken('tiktok', 'old_refresh');

    expect(result).toEqual({
      accessToken: 'new_tk_token',
      refreshToken: 'new_tk_refresh',
    });
  });

  it('returns null for facebook (no refresh flow)', async () => {
    const { refreshAccessToken } = await import('../token-refresh');
    const result = await refreshAccessToken('facebook', 'some_token');
    expect(result).toBeNull();
  });

  it('returns null for instagram (no refresh flow)', async () => {
    const { refreshAccessToken } = await import('../token-refresh');
    const result = await refreshAccessToken('instagram', 'some_token');
    expect(result).toBeNull();
  });

  it('returns null when refresh fails', async () => {
    const axios = (await import('axios')).default;
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('refresh failed'));

    const { refreshAccessToken } = await import('../token-refresh');
    const result = await refreshAccessToken('twitter', 'bad_token');
    expect(result).toBeNull();
  });

  it('returns null when no refresh_token provided', async () => {
    const { refreshAccessToken } = await import('../token-refresh');
    const result = await refreshAccessToken('twitter', '');
    expect(result).toBeNull();
  });
});
