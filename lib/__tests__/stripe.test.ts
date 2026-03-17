import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Stripe as a class constructor
vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      _key: string;
      constructor(key: string) {
        this._key = key;
      }
    },
  };
});

describe('getStripe', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripe } = await import('../stripe');
    expect(() => getStripe()).toThrow('STRIPE_SECRET_KEY is required');
  });

  it('returns Stripe instance when key is set', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
    const { getStripe } = await import('../stripe');
    const stripe = getStripe();
    expect(stripe).not.toBeNull();
  });

  it('cleans up pasted key with prefix', async () => {
    process.env.STRIPE_SECRET_KEY = 'some_prefix_sk_test_abc123';
    const { getStripe } = await import('../stripe');
    const stripe = getStripe();
    expect(stripe).not.toBeNull();
    expect((stripe as any)._key).toBe('sk_test_abc123');
  });
});
