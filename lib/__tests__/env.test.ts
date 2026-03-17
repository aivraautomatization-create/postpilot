import { describe, it, expect, beforeEach } from 'vitest';

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('getGeminiKey throws when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const { getGeminiKey } = await import('../env');
    expect(() => getGeminiKey()).toThrow('GEMINI_API_KEY is required');
  });

  it('getGeminiKey returns key when set', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const { getGeminiKey } = await import('../env');
    expect(getGeminiKey()).toBe('test-key');
  });

  it('getStripeProducts throws when products are missing', async () => {
    delete process.env.STRIPE_PRODUCT_ENTRY;
    const { getStripeProducts } = await import('../env');
    expect(() => getStripeProducts()).toThrow();
  });

  it('getAppUrl falls back to localhost', async () => {
    delete process.env.APP_URL;
    const { getAppUrl } = await import('../env');
    expect(getAppUrl()).toBe('http://localhost:3000');
  });

  it('getPerplexityKey returns null when not set', async () => {
    delete process.env.PERPLEXITY_API_KEY;
    const { getPerplexityKey } = await import('../env');
    expect(getPerplexityKey()).toBeNull();
  });
});
