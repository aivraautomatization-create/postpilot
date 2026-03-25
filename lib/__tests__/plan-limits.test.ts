import { describe, it, expect } from 'vitest';
import { isSubscriptionActive, getUsageLimit, getPlanName, PLAN_LIMITS } from '../plan-limits';

describe('getUsageLimit', () => {
  it('returns starter limit for null tier', () => {
    expect(getUsageLimit(null)).toBe(15);
  });

  it('returns correct limit for known tier', () => {
    expect(getUsageLimit('tier-pro')).toBe(60);
    expect(getUsageLimit('tier-business')).toBe(999);
  });

  it('falls back to starter for unknown tier', () => {
    expect(getUsageLimit('tier-unknown')).toBe(15);
  });

  it('adds bonus posts to base limit', () => {
    expect(getUsageLimit('tier-entry', 10)).toBe(25);
    expect(getUsageLimit('tier-pro', 20)).toBe(80);
  });

  it('handles zero bonus posts', () => {
    expect(getUsageLimit('tier-entry', 0)).toBe(15);
  });
});

describe('getPlanName', () => {
  it('returns Starter for null tier', () => {
    expect(getPlanName(null)).toBe('Starter');
  });

  it('returns correct name for known tier', () => {
    expect(getPlanName('tier-pro')).toBe('Creator');
  });
});

describe('isSubscriptionActive', () => {
  it('returns false for null profile', () => {
    expect(isSubscriptionActive(null as any)).toBe(false);
  });

  it('returns false for empty profile', () => {
    expect(isSubscriptionActive({})).toBe(false);
  });

  it('returns true for active paid subscriber', () => {
    expect(isSubscriptionActive({
      subscription_status: 'active',
      stripe_customer_id: 'cus_123',
    })).toBe(true);
  });

  it('returns true for active admin/test account without stripe', () => {
    expect(isSubscriptionActive({
      subscription_status: 'active',
    })).toBe(true);
  });

  it('returns true for valid trial', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(isSubscriptionActive({
      subscription_status: 'trialing',
      trial_ends_at: futureDate,
    })).toBe(true);
  });

  it('returns false for expired trial', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isSubscriptionActive({
      subscription_status: 'trialing',
      trial_ends_at: pastDate,
    })).toBe(false);
  });

  it('returns false for trialing without trial_ends_at', () => {
    expect(isSubscriptionActive({
      subscription_status: 'trialing',
    })).toBe(false);
  });

  it('returns false for canceled subscription', () => {
    expect(isSubscriptionActive({
      subscription_status: 'canceled',
      stripe_customer_id: 'cus_123',
    })).toBe(false);
  });

  it('returns false for past_due subscription', () => {
    expect(isSubscriptionActive({
      subscription_status: 'past_due',
      stripe_customer_id: 'cus_123',
    })).toBe(false);
  });
});
