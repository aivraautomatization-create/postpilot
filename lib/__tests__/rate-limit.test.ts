import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  it('allows requests within limit', async () => {
    const { checkRateLimit } = await import('../rate-limit');
    const result = checkRateLimit('user:1', 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it('blocks requests exceeding limit', async () => {
    const { checkRateLimit } = await import('../rate-limit');
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user:2', 5, 60000);
    }
    const result = checkRateLimit('user:2', 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('resets after window expires', async () => {
    const { checkRateLimit } = await import('../rate-limit');
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user:3', 5, 60000);
    }
    expect(checkRateLimit('user:3', 5, 60000).allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(61000);

    expect(checkRateLimit('user:3', 5, 60000).allowed).toBe(true);
  });

  it('tracks different keys independently', async () => {
    const { checkRateLimit } = await import('../rate-limit');
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user:4', 5, 60000);
    }
    expect(checkRateLimit('user:4', 5, 60000).allowed).toBe(false);
    expect(checkRateLimit('user:5', 5, 60000).allowed).toBe(true);
  });

  it('cleanup removes old entries', async () => {
    const { checkRateLimit, _getStoreSize } = await import('../rate-limit');
    checkRateLimit('user:6', 5, 60000);
    expect(_getStoreSize()).toBe(1);

    // Advance past cleanup interval (5 min max age + 1 min interval)
    vi.advanceTimersByTime(6 * 60 * 1000);

    expect(_getStoreSize()).toBe(0);
  });
});
